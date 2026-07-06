import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { AppointmentDrawer, DrawerHandlers } from "../dashboard/AppointmentDrawer";
import { ScheduleToolbar, View, Mode, Grouping } from "./ScheduleToolbar";
import { DayGrid, GridColumn, PlacedAppt, PlacedBlock } from "./DayGrid";
import { WeekGrid } from "./WeekGrid";
import { ListView } from "./ListView";
import { NewAppointmentModal, BlockTimeModal } from "./CreateModals";
import { EditAppointmentModal, ReassignModal, RescheduleModal, CancelModal, ConfirmDialog } from "./EditModals";
import {
  APPTS, Appt, ApptOverride, TimeBlock, CLINICIANS, ROOMS, CLINICIAN_SELF_ID,
  NURSE_SELF_NAME, applyOverride, buildWeek, minToClock,
} from "./scheduleData";

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

  const [view, setView] = useState<View>("day");
  const [mode, setMode] = useState<Mode>("calendar");
  const [grouping, setGrouping] = useState<Grouping>("staff");
  const [clinicianFilter, setClinicianFilter] = useState<Set<string>>(new Set());
  const [room, setRoom] = useState("");
  const [type, setType] = useState("");
  const [overlay, setOverlay] = useState(false);

  const [overrides, setOverrides] = useState<Record<string, ApptOverride>>({});
  const [created, setCreated] = useState<Appt[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const setOverride = (id: string, ov: ApptOverride) => setOverrides((p) => ({ ...p, [id]: { ...p[id], ...ov } }));

  // effective appointment set (base + created, with overrides applied)
  const allEffective = useMemo(
    () => [...APPTS, ...created].map((a) => applyOverride(a, overrides[a.id])),
    [created, overrides]
  );

  // role scoping
  const scoped = useMemo(() => {
    let s = allEffective;
    if (role === "Nurse") s = s.filter((a) => a.nurse === NURSE_SELF_NAME);
    else if (role === "Clinician") s = overlay ? s : s.filter((a) => a.doctorId === CLINICIAN_SELF_ID);
    if (role === "Admin") {
      if (clinicianFilter.size > 0) s = s.filter((a) => clinicianFilter.has(a.doctorId));
      if (room) s = s.filter((a) => a.room === room);
      if (type) s = s.filter((a) => a.type === type);
    }
    return s;
  }, [allEffective, role, overlay, clinicianFilter, room, type]);

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
    if (byRoom) return ROOMS.filter((r) => !room || r.id === room).map((r) => ({ key: r.id, title: r.label, sub: r.kind }));
    return CLINICIANS.filter((c) => clinicianFilter.size === 0 || clinicianFilter.has(c.id)).map((c) => ({ key: c.id, title: c.short, avatar: c.avatar, muted: c.onLeave, count: scoped.filter((a) => a.doctorId === c.id).length }));
  }, [role, overlay, byRoom, room, clinicianFilter, scoped]);

  const colOf = (a: Appt) => (role === "Nurse" ? "me" : byRoom ? a.room : a.doctorId);

  const placed: PlacedAppt[] = useMemo(() => {
    const keys = new Set(columns.map((c) => c.key));
    return scoped
      .filter((a) => a.status !== "Cancelled" || true)
      .map((a) => ({ appt: a, colKey: colOf(a), overlay: role === "Clinician" && a.doctorId !== CLINICIAN_SELF_ID }))
      .filter((p) => keys.has(p.colKey));
  }, [scoped, columns, role, byRoom]);

  const placedBlocks: PlacedBlock[] = useMemo(() => {
    const keys = new Set(columns.map((c) => c.key));
    return blocks.map((b) => ({ block: b, colKey: b.doctorId })).filter((p) => keys.has(p.colKey));
  }, [blocks, columns]);

  // role capabilities
  const editable = role === "Admin" || role === "Reception" || role === "Clinician";
  const allowReassign = role === "Admin";
  const allowResize = role === "Admin" || role === "Clinician";

  // interactions
  const openAppt = (a: Appt) => navigate(`${BASE}/appointment/${a.id}`);

  const onEmptyClick = (colKey: string, startMin: number) => {
    if (role === "Clinician") { setModal({ kind: "block" }); return; }
    const defaults = byRoom ? { room: colKey, startMin } : { doctorId: colKey, startMin };
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

  const dateLabel = view === "week" ? "30 Jun – 6 Jul 2026" : "Fri, 3 Jul 2026";
  const effView: View = role === "Reception" || role === "Nurse" ? "day" : view;
  const isList = (role === "Admin" || role === "Reception") && mode === "list";

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ScheduleToolbar
        role={role}
        dateLabel={dateLabel}
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

      <div className="flex-1 min-h-0 p-4">
        {isList ? (
          <ListView appts={scoped} onRowClick={openAppt} />
        ) : effView === "week" ? (
          <WeekGrid weekAppts={buildWeek(role === "Clinician" ? CLINICIAN_SELF_ID : null)} onApptClick={openAppt} />
        ) : (
          <DayGrid
            columns={columns}
            placed={placed}
            blocks={placedBlocks}
            editable={editable}
            allowReassign={allowReassign}
            allowResize={allowResize}
            onApptClick={(a) => openAppt(a)}
            onEmptyClick={onEmptyClick}
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
        <NewAppointmentModal onClose={() => setModal({ kind: "none" })} currentAppts={allEffective} defaults={modal.defaults} onCreate={(a) => setCreated((p) => [...p, a])} />
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
