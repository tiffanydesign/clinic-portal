import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { addDays, endOfWeek, format, isSameDay, startOfWeek, subDays } from "date-fns";
import { useAppContext } from "../../../context/AppContext";
import { AppointmentDrawer, DrawerHandlers } from "../dashboard/AppointmentDrawer";
import { ScheduleToolbar, View, Mode, Grouping } from "./ScheduleToolbar";
import { DayGrid, GridColumn, PlacedAppt, PlacedBlock } from "./DayGrid";
import { WeekGrid } from "./WeekGrid";
import { ListView } from "./ListView";
import { NewAppointmentModal, BlockTimeModal } from "./CreateModals";
import { EditAppointmentModal, ReassignModal, RescheduleModal, CancelModal, ConfirmDialog } from "./EditModals";
import { MyScheduleView } from "./MyScheduleView";
import {
  APPTS, Appt, ApptOverride, TimeBlock, CLINICIANS, useSchedulableRooms, CLINICIAN_SELF_ID,
  NURSE_SELF_NAME, ANCHOR_DATE, applyOverride, buildWeek, minToClock,
} from "./scheduleData";
import { EmptySlotPopover, type EmptySlotTarget } from "./EmptySlotPopover";
import { useAppointments, addAppointment } from "../dashboard/appointmentsStore";
import { useAvailabilityStore } from "../availability/availabilityStore";
import { DAYS, timeToMinutes } from "../availability/availabilityData";
import { useRoomBlocks } from "../clinic-settings/roomBlocksStore";
import { roomBlocksOnDate, blockRangeOnDate, blockReasonAbbrev } from "../clinic-settings/roomBlocksData";

type ModalState =
  | { kind: "none" }
  | { kind: "new"; defaults?: { doctorId?: string; room?: string; startMin?: number } }
  | { kind: "block" }
  | { kind: "edit"; appt: Appt }
  | { kind: "reassign"; appt: Appt }
  | { kind: "reschedule"; appt: Appt }
  | { kind: "cancel"; appt: Appt }
  | { kind: "confirm"; title: string; message: string; confirmLabel: string; onConfirm: () => void };

const BASE = "/calendar/schedule";

export function SchedulePage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const { apptId } = useParams();
  const activeRooms = useSchedulableRooms();
  // Deep-link support (see the Availability page's Rooms tab, and the Admin
  // Dashboard's Utilisation KPI card): ?grouping=room&room=<id> pre-selects
  // the By Room view for a specific room, same as picking it from the
  // toolbar. Only affects the initial state — the toolbar remains the
  // source of truth for changes after that.
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<View>("day");
  const [mode, setMode] = useState<Mode>("calendar");
  const [grouping, setGrouping] = useState<Grouping>(searchParams.get("grouping") === "room" ? "room" : "staff");
  // ?clinician=<doctorId> (see the Staff Overview page's "Upcoming 7 Days"
  // stat tile) pre-selects that one clinician, same shape as the room param above.
  const [clinicianFilter, setClinicianFilter] = useState<Set<string>>(
    searchParams.get("clinician") ? new Set([searchParams.get("clinician")!]) : new Set()
  );
  const [room, setRoom] = useState(searchParams.get("room") ?? "");
  const [type, setType] = useState("");
  const [overlay, setOverlay] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(ANCHOR_DATE);

  // Only the anchor day (and its containing week) has real mock appointments
  // — any other date is a genuinely empty schedule, not fabricated data.
  const isAnchorDay = isSameDay(selectedDate, ANCHOR_DATE);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const isAnchorWeek = isSameDay(weekStart, startOfWeek(ANCHOR_DATE, { weekStartsOn: 1 }));

  const goPrev = () => setSelectedDate((d) => (view === "week" ? subDays(d, 7) : subDays(d, 1)));
  const goNext = () => setSelectedDate((d) => (view === "week" ? addDays(d, 7) : addDays(d, 1)));
  const goToday = () => setSelectedDate(ANCHOR_DATE);

  const [overrides, setOverrides] = useState<Record<string, ApptOverride>>({});
  const storeAppts = useAppointments();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const setOverride = (id: string, ov: ApptOverride) => setOverrides((p) => ({ ...p, [id]: { ...p[id], ...ov } }));

  // Effective appointment set, with overrides applied. Sourced from the shared
  // appointmentsStore rather than the static APPTS array so a booking created
  // here (or by Reception) renders immediately and reaches the Front Desk
  // Queue, which reads the same store.
  const allEffective = useMemo(
    () => storeAppts.map((a) => applyOverride(a, overrides[a.id])),
    [storeAppts, overrides]
  );

  // role scoping
  const scoped = useMemo(() => {
    if (!isAnchorDay) return [];
    let s = allEffective;
    if (role === "Nurse") s = s.filter((a) => a.nurse === NURSE_SELF_NAME);
    else if (role === "Clinician") s = overlay ? s : s.filter((a) => a.doctorId === CLINICIAN_SELF_ID);
    if (role === "Admin") {
      if (clinicianFilter.size > 0) s = s.filter((a) => clinicianFilter.has(a.doctorId));
      if (room) s = s.filter((a) => a.room === room);
      if (type) s = s.filter((a) => a.type === type);
    }
    return s;
  }, [allEffective, role, overlay, clinicianFilter, room, type, isAnchorDay]);

  // columns + column-of-appointment
  const byRoom = role === "Admin" && grouping === "room";
  const columns: GridColumn[] = useMemo(() => {
    if (role === "Nurse") return [{ key: "me", title: "My Patients" }];
    if (role === "Clinician") {
      if (!overlay) { const c = CLINICIANS.find((x) => x.id === CLINICIAN_SELF_ID)!; return [{ key: c.id, title: "My Schedule", avatar: c.avatar }]; }
      return CLINICIANS.map((c) => ({ key: c.id, title: c.short, avatar: c.avatar, muted: c.id !== CLINICIAN_SELF_ID, count: scoped.filter((a) => a.doctorId === c.id).length }));
    }
    if (role === "Reception") return CLINICIANS.filter((c) => scoped.some((a) => a.doctorId === c.id)).map((c) => ({ key: c.id, title: c.short, avatar: c.avatar, count: scoped.filter((a) => a.doctorId === c.id).length }));
    // Admin
    if (byRoom) return activeRooms.filter((r) => !room || r.id === room).map((r) => ({ key: r.id, title: r.name, sub: r.type }));
    return CLINICIANS.filter((c) => clinicianFilter.size === 0 || clinicianFilter.has(c.id)).map((c) => ({ key: c.id, title: c.short, avatar: c.avatar, muted: c.onLeave, count: scoped.filter((a) => a.doctorId === c.id).length }));
  }, [role, overlay, byRoom, room, clinicianFilter, scoped, activeRooms]);

  const colOf = (a: Appt) => (role === "Nurse" ? "me" : byRoom ? a.room : a.doctorId);

  const placed: PlacedAppt[] = useMemo(() => {
    const keys = new Set(columns.map((c) => c.key));
    return scoped
      .filter((a) => a.status !== "Cancelled" || true)
      .map((a) => ({ appt: a, colKey: colOf(a), overlay: role === "Clinician" && a.doctorId !== CLINICIAN_SELF_ID }))
      .filter((p) => keys.has(p.colKey));
  }, [scoped, columns, role, byRoom]);

  // By Room shows room blocks (maintenance/cleaning/etc.), never staff
  // Blocked Time — the two are different columns' concepts and don't mix.
  const selectedDateISO = format(selectedDate, "yyyy-MM-dd");
  const roomBlocks = useRoomBlocks();
  const placedBlocks: PlacedBlock[] = useMemo(() => {
    const keys = new Set(columns.map((c) => c.key));
    if (byRoom) {
      return activeRooms
        .filter((r) => keys.has(r.id))
        .flatMap((r) =>
          roomBlocksOnDate(roomBlocks, r.id, selectedDateISO).map((b) => {
            const range = blockRangeOnDate(b, selectedDateISO)!;
            const block: TimeBlock = {
              id: b.id, kind: "room", roomId: r.id,
              startMin: range[0], durationMin: range[1] - range[0],
              reason: blockReasonAbbrev(b.reason),
            };
            return { block, colKey: r.id };
          })
        );
    }
    return blocks.map((b) => ({ block: b, colKey: b.doctorId! })).filter((p) => keys.has(p.colKey));
  }, [blocks, columns, byRoom, activeRooms, roomBlocks, selectedDateISO]);

  const [slotTarget, setSlotTarget] = useState<EmptySlotTarget | null>(null);
  const availability = useAvailabilityStore();

  // role capabilities
  const editable = role === "Admin" || role === "Reception" || role === "Clinician";
  const allowReassign = role === "Admin";
  const allowResize = role === "Admin" || role === "Clinician";

  // interactions
  const openAppt = (a: Appt) => navigate(`${BASE}/appointment/${a.id}`);

  // Empty slot -> lightweight confirm popover -> booking modal (prefilled).
  // The grid only ever mounts for Admin/Reception (Nurse/Clinician return
  // MyScheduleView above), so there's no unprivileged path in here.
  const onEmptyClick = (colKey: string, startMin: number, at: { x: number; y: number }) => {
    if (!isAnchorDay) return; // no booking against a date the mock data doesn't model
    // Hard block: the signed-in clinician's Blocked Time is off-limits for new
    // bookings (upgrades the old soft "outside hours" signal, per v2).
    if (!byRoom && colKey === CLINICIAN_SELF_ID) {
      const dateStr = format(selectedDate, "d MMM yyyy");
      const onBlocked = availability.blockedTime.some((b) => b.date === dateStr && startMin >= b.startMin && startMin < b.startMin + b.durationMin);
      if (onBlocked) { toast.error("This time is blocked — no bookings can be made here."); return; }
    }
    const colLabel = byRoom
      ? (activeRooms.find((r) => r.id === colKey)?.name ?? colKey)
      : (CLINICIANS.find((c) => c.id === colKey)?.name ?? colKey);
    setSlotTarget({
      colKey, startMin, x: at.x, y: at.y, colLabel, byRoom,
      outsideHours: isOutsideWorkingHours(colKey, startMin),
    });
  };

  // Soft signal only — booking outside hours stays allowed, same as everywhere
  // else in the app.
  //
  // Checked against the real availability source (availabilityStore: the
  // clinician's saved weekly hours + their Blocked Time), NOT the grid's own
  // 08:00–19:00 render window — DayGrid clamps every click into that window,
  // so a bounds check there could never fire.
  //
  // availabilityStore only models the signed-in clinician (Dr. Ebru Reis), and
  // a room column has no clinician behind it at all, so everything else is
  // reported as available rather than guessed at.
  const isOutsideWorkingHours = (colKey: string, startMin: number): boolean => {
    if (byRoom || colKey !== CLINICIAN_SELF_ID) return false;

    const dateStr = format(selectedDate, "d MMM yyyy");
    const onBlockedTime = availability.blockedTime.some(
      (b) => b.date === dateStr && startMin >= b.startMin && startMin < b.startMin + b.durationMin
    );
    if (onBlockedTime) return true;

    const day = availability.savedSchedule[DAYS[selectedDate.getDay()]];
    if (!day?.active) return true;
    return !day.slots.some((s) => startMin >= timeToMinutes(s.start) && startMin < timeToMinutes(s.end));
  };

  const confirmSlot = () => {
    if (!slotTarget) return;
    const defaults = slotTarget.byRoom
      ? { room: slotTarget.colKey, startMin: slotTarget.startMin }
      : { doctorId: slotTarget.colKey, startMin: slotTarget.startMin };
    setSlotTarget(null);
    setModal({ kind: "new", defaults });
  };

  const onDragEnd = (appt: Appt, newColKey: string, newStartMin: number) => {
    const timeChanged = newStartMin !== appt.startMin;
    const colChanged = allowReassign && newColKey !== colOf(appt);
    if (!timeChanged && !colChanged) return;
    if (colChanged && byRoom) {
      setModal({ kind: "confirm", title: "Reassign room", message: `Move ${appt.patient.name} to ${newColKey} at ${minToClock(newStartMin)}?`, confirmLabel: "Reassign", onConfirm: () => setOverride(appt.id, { room: newColKey, startMin: newStartMin }) });
    } else if (colChanged) {
      const doc = CLINICIANS.find((c) => c.id === newColKey);
      setModal({ kind: "confirm", title: "Reassign clinician", message: `Reassign ${appt.patient.name} to ${doc?.name} at ${minToClock(newStartMin)}?`, confirmLabel: "Reassign", onConfirm: () => setOverride(appt.id, { doctorId: newColKey, doctor: doc?.name ?? appt.doctor, startMin: newStartMin }) });
    } else {
      setModal({ kind: "confirm", title: "Reschedule", message: `Reschedule ${appt.patient.name} to ${minToClock(newStartMin)}?`, confirmLabel: "Reschedule", onConfirm: () => setOverride(appt.id, { startMin: newStartMin }) });
    }
  };

  const onResizeEnd = (appt: Appt, newDuration: number) => {
    setModal({ kind: "confirm", title: "Change duration", message: `Change ${appt.patient.name}'s appointment to ${newDuration} minutes?`, confirmLabel: "Update", onConfirm: () => setOverride(appt.id, { durationMin: newDuration }) });
  };

  // drawer + handlers
  const selected = apptId ? allEffective.find((a) => a.id === apptId) ?? null : null;
  const isOverlayAppt = role === "Clinician" && selected ? selected.doctorId !== CLINICIAN_SELF_ID : false;

  const handlers: DrawerHandlers = useMemo(() => {
    if (!selected || isOverlayAppt) return {};
    const h: DrawerHandlers = {};
    if (role === "Admin") {
      h.onEdit = () => setModal({ kind: "edit", appt: selected });
      h.onReassign = () => setModal({ kind: "reassign", appt: selected });
      h.onReschedule = () => setModal({ kind: "reschedule", appt: selected });
      h.onCancel = () => setModal({ kind: "cancel", appt: selected });
    } else if (role === "Reception") {
      h.onEdit = () => setModal({ kind: "edit", appt: selected });
      h.onReschedule = () => setModal({ kind: "reschedule", appt: selected });
      h.onCancel = () => setModal({ kind: "cancel", appt: selected });
    } else if (role === "Clinician") {
      h.onReschedule = () => setModal({ kind: "reschedule", appt: selected });
    }
    return h;
  }, [selected, isOverlayAppt, role]);

  // Clinician & Nurse get the dedicated sidebar + calendar surface (left rail,
  // week/day grid, collision layout, layers). Admin & Reception keep the
  // existing clinician/room column grid below, untouched.
  if (role === "Nurse" || role === "Clinician") {
    return (
      <div className="h-full flex flex-col bg-surface-page min-h-0">
        <MyScheduleView role={role} onOpenAppt={(id) => navigate(`${BASE}/appointment/${id}`)} />
        {selected && (
          <AppointmentDrawer appt={selected} role={role} basePath={BASE} readOnlyOverlay={isOverlayAppt} handlers={handlers} />
        )}
      </div>
    );
  }

  const dateLabel = view === "week"
    ? `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`
    : format(selectedDate, "EEE, d MMM yyyy");
  // Nurse/Clinician already returned above (MyScheduleView), so only Admin and
  // Reception reach this point — Reception is day-only, Admin keeps its choice.
  const effView: View = role === "Reception" ? "day" : view;
  const isList = (role === "Admin" || role === "Reception") && mode === "list";

  return (
    <div className="h-full flex flex-col bg-surface-page">
      <ScheduleToolbar
        role={role}
        dateLabel={dateLabel}
        selectedDate={selectedDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onPickDate={setSelectedDate}
        disableCreate={!isAnchorDay}
        view={effView} setView={setView}
        mode={mode} setMode={setMode}
        grouping={grouping} setGrouping={setGrouping}
        clinicianFilter={clinicianFilter}
        toggleClinician={(id) => setClinicianFilter((prev) => {
          const full = new Set(CLINICIANS.map((c) => c.id));
          const cur = prev.size === 0 ? full : new Set(prev);
          if (cur.has(id)) cur.delete(id); else cur.add(id);
          return cur.size === CLINICIANS.length ? new Set() : cur;
        })}
        room={room} setRoom={setRoom}
        type={type} setType={setType}
        overlay={overlay} setOverlay={setOverlay}
        onNew={() => setModal({ kind: "new" })}
        onBlock={() => setModal({ kind: "block" })}
      />

      <div className="flex-1 min-h-0 px-6 py-4 bg-surface-page/80">
        {isList ? (
          <ListView appts={scoped} onRowClick={openAppt} selectedDate={selectedDate} />
        ) : effView === "week" ? (
          // Clinician returned above (MyScheduleView), so this grid is only
          // ever Admin's — buildWeek is never self-scoped here.
          <WeekGrid
            weekStart={weekStart}
            weekAppts={isAnchorWeek ? buildWeek(null) : []}
            onApptClick={openAppt}
          />
        ) : (
          <DayGrid
            columns={columns}
            placed={placed}
            blocks={placedBlocks}
            editable={editable}
            allowReassign={allowReassign}
            allowResize={allowResize}
            showNow={isAnchorDay}
            onApptClick={(a) => openAppt(a)}
            onEmptyClick={isAnchorDay ? onEmptyClick : undefined}
            onDragEnd={onDragEnd}
            onResizeEnd={onResizeEnd}
          />
        )}
      </div>

      {/* Deep-linked drawer (reused from the Dashboard) */}
      {selected && (
        <AppointmentDrawer appt={selected} role={role} basePath={BASE} readOnlyOverlay={isOverlayAppt} handlers={handlers} />
      )}

      {/* Modals */}
      {modal.kind === "new" && (
        <NewAppointmentModal onClose={() => setModal({ kind: "none" })} currentAppts={allEffective} defaults={modal.defaults} onCreate={addAppointment} />
      )}

      {slotTarget && (
        <EmptySlotPopover
          target={slotTarget}
          date={selectedDate}
          onCancel={() => setSlotTarget(null)}
          onConfirm={confirmSlot}
        />
      )}
      {modal.kind === "block" && (
        <BlockTimeModal onClose={() => setModal({ kind: "none" })} doctorId={CLINICIAN_SELF_ID} onCreate={(b) => setBlocks((p) => [...p, b])} />
      )}
      {modal.kind === "edit" && (
        <EditAppointmentModal appt={modal.appt} onClose={() => setModal({ kind: "none" })} onApply={(ov) => setOverride(modal.appt.id, ov)} />
      )}
      {modal.kind === "reassign" && (
        <ReassignModal appt={modal.appt} onClose={() => setModal({ kind: "none" })} onApply={(ov) => setOverride(modal.appt.id, ov)} />
      )}
      {modal.kind === "reschedule" && (
        <RescheduleModal appt={modal.appt} onClose={() => setModal({ kind: "none" })} onApply={(ov) => setOverride(modal.appt.id, ov)} />
      )}
      {modal.kind === "cancel" && (
        <CancelModal appt={modal.appt} onClose={() => setModal({ kind: "none" })} onConfirm={() => { setOverride(modal.appt.id, { status: "Cancelled" }); navigate(BASE); }} />
      )}
      {modal.kind === "confirm" && (
        <ConfirmDialog title={modal.title} message={modal.message} confirmLabel={modal.confirmLabel} onClose={() => setModal({ kind: "none" })} onConfirm={modal.onConfirm} />
      )}
    </div>
  );
}
