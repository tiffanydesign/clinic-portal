import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { AvailabilityGrid } from "./availability-grid/AvailabilityGrid";
import { AvailabilityFilter, FilterGroup } from "./availability-grid/AvailabilityFilter";
import { ALL_STAFF, buildPeopleRows, StaffMember } from "./availability-grid/peopleAvailabilityData";
import { PeopleDayPopover } from "./availability-grid/PeopleDayPopover";
import { RoomDayPopover } from "./availability-grid/RoomDayPopover";
import { buildRoomRows } from "./availability-grid/roomAvailabilityRows";
import type { Room } from "./clinic-settings/roomsData";
import { useSchedulableRooms } from "./clinic-settings/roomsStore";
import { useRoomBlocks, addRoomBlock } from "./clinic-settings/roomBlocksStore";
import { RoomBlockDrawer, RoomBlockDraft } from "./clinic-settings/RoomBlockDrawer";
import { TODAY_ISO } from "./clinic-settings/roomBlocksData";
import { roomBlockConflicts, roomBlockConflictLabel } from "./clinic-settings/roomBlockConflicts";
import { ConflictModal } from "./availability/ConflictModal";
import { APPTS } from "./dashboard/dashboardData";
import { useAppointments } from "./dashboard/appointmentsStore";
import type { Appt } from "./dashboard/dashboardData";
import type { GridDay } from "./availability-grid/types";

type Tab = "people" | "rooms";

// Only the anchor week has real mock data (see scheduleData.ts's ANCHOR_DATE
// convention) — the navigator's ‹ › are visual-only for now, matching the
// rest of the app's single-real-week mock scope. `iso` is what Room Block
// matches grid columns against (roomBlocksData.ts's date convention).
const WEEK_DAYS = [
  { label: "Mon 30", full: "Mon, 30 Jun 2026", iso: "2026-06-30" },
  { label: "Tue 1", full: "Tue, 1 Jul 2026", iso: "2026-07-01" },
  { label: "Wed 2", full: "Wed, 2 Jul 2026", iso: "2026-07-02" },
  { label: "Thu 3", full: "Thu, 3 Jul 2026", iso: "2026-07-03" },
  { label: "Fri 4", full: "Fri, 4 Jul 2026", iso: "2026-07-04" },
  { label: "Sat 5", full: "Sat, 5 Jul 2026", iso: "2026-07-05" },
  { label: "Sun 6", full: "Sun, 6 Jul 2026", iso: "2026-07-06" },
];
const TODAY_INDEX = 3;
const DAYS: GridDay[] = WEEK_DAYS.map((d, i) => ({ key: d.full, label: d.label, isToday: i === TODAY_INDEX }));

export function AvailabilityPage() {
  const { role } = useAppContext();
  const [searchParams] = useSearchParams();
  const canSeeRooms = role === "Admin" || role === "Reception";
  const canBlockRooms = role === "Admin";

  const [tab, setTab] = useState<Tab>(canSeeRooms && searchParams.get("tab") === "rooms" ? "rooms" : "people");
  const [filterValues, setFilterValues] = useState<Set<string>>(new Set());
  const [dayPopover, setDayPopover] = useState<{ staff: StaffMember; dayIndex: number; x: number; y: number } | null>(null);
  const [roomPopover, setRoomPopover] = useState<{ room: Room; dayIndex: number; x: number; y: number } | null>(null);
  const [blockDrawer, setBlockDrawer] = useState<{ room: Room; dateISO: string } | null>(null);
  const [conflictState, setConflictState] = useState<{ draft: RoomBlockDraft; conflicts: Appt[] } | null>(null);

  const rooms = useSchedulableRooms();
  const roomBlocks = useRoomBlocks();
  const liveAppts = useAppointments();

  const trySaveRoomBlock = (draft: RoomBlockDraft) => {
    const conflicts = roomBlockConflicts(draft.roomId, draft, liveAppts);
    if (conflicts.length > 0) {
      setConflictState({ draft, conflicts });
      return;
    }
    addRoomBlock(draft);
    toast.success("Room blocked.");
    setBlockDrawer(null);
    setRoomPopover(null);
  };

  const confirmRoomBlockConflict = () => {
    if (!conflictState) return;
    addRoomBlock(conflictState.draft);
    toast.success("Room blocked.");
    setConflictState(null);
    setBlockDrawer(null);
    setRoomPopover(null);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setFilterValues(new Set());
  };

  const toggleFilter = (v: string) =>
    setFilterValues((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const peopleFilterGroups: FilterGroup[] = [
    { label: "Clinicians", options: ALL_STAFF.filter((s) => s.role === "Clinician").map((s) => ({ value: s.id, label: s.name })) },
    { label: "Nurses", options: ALL_STAFF.filter((s) => s.role === "Nurse").map((s) => ({ value: s.id, label: s.name })) },
  ];
  const roomTypes = Array.from(new Set(rooms.map((r) => r.type)));
  const roomFilterGroups: FilterGroup[] = roomTypes.map((type) => ({
    label: type,
    options: rooms.filter((r) => r.type === type).map((r) => ({ value: r.id, label: r.name })),
  }));

  const visibleStaff = filterValues.size === 0 ? ALL_STAFF : ALL_STAFF.filter((s) => filterValues.has(s.id));
  const visibleRooms = filterValues.size === 0 ? rooms : rooms.filter((r) => filterValues.has(r.id));

  const peopleRows = buildPeopleRows(visibleStaff, (staff, dayIndex, e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDayPopover({ staff, dayIndex, x: rect.left + rect.width / 2, y: rect.bottom });
  });

  const roomRows = buildRoomRows(visibleRooms, APPTS, roomBlocks, WEEK_DAYS.map((d) => d.iso), (room, dayIndex, e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRoomPopover({ room, dayIndex, x: rect.left + rect.width / 2, y: rect.bottom });
  });

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* Toolbar */}
      <div className="px-6 py-3.5 border-b border-divider flex items-center justify-between gap-4 shrink-0 bg-surface flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface border border-divider rounded-full shadow-sm">
            <button className="pl-3 pr-2 py-2 hover:bg-surface-hover rounded-l-full text-ink-muted hover:text-ink-soft transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-ink whitespace-nowrap tabular-nums">30 Jun – 6 Jul 2026</span>
            <button className="pl-2 pr-3 py-2 hover:bg-surface-hover rounded-r-full text-ink-muted hover:text-ink-soft transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button className="px-4 py-2 text-sm font-bold text-ink-soft border border-divider bg-surface rounded-full shadow-sm hover:bg-surface-hover transition-colors">
            Today
          </button>

          {canSeeRooms && (
            <div className="inline-flex bg-surface-hover p-0.5 rounded-card border border-divider ml-2">
              <button
                onClick={() => switchTab("people")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-control transition-all ${tab === "people" ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
              >
                People
              </button>
              <button
                onClick={() => switchTab("rooms")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-control transition-all ${tab === "rooms" ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
              >
                Rooms
              </button>
            </div>
          )}
        </div>

        <AvailabilityFilter
          groups={tab === "people" ? peopleFilterGroups : roomFilterGroups}
          selected={filterValues}
          onToggle={toggleFilter}
          onClear={() => setFilterValues(new Set())}
        />
      </div>

      {/* Grid — px-6 pb-6 matches the standard page gutter used everywhere
          else (Schedule's calendar grid, Billing/Patients/Staff's tables);
          this was previously edge-to-edge with no page padding at all. */}
      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col">
        {tab === "people" || !canSeeRooms ? (
          <AvailabilityGrid days={DAYS} rows={peopleRows} showColumnSummary />
        ) : (
          <AvailabilityGrid days={DAYS} rows={roomRows} showColumnSummary />
        )}
      </div>

      {dayPopover && (
        <PeopleDayPopover
          staff={dayPopover.staff}
          dayLabel={WEEK_DAYS[dayPopover.dayIndex].full}
          day={dayPopover.staff.schedules[dayPopover.dayIndex]}
          currentUserRole={role}
          x={dayPopover.x}
          y={dayPopover.y}
          onClose={() => setDayPopover(null)}
        />
      )}

      {roomPopover && (
        <RoomDayPopover
          room={roomPopover.room}
          dateLabel={WEEK_DAYS[roomPopover.dayIndex].full}
          appts={liveAppts.filter((a) => a.room === roomPopover.room.id && WEEK_DAYS[roomPopover.dayIndex].iso === TODAY_ISO)}
          canBlock={canBlockRooms && WEEK_DAYS[roomPopover.dayIndex].iso >= TODAY_ISO}
          x={roomPopover.x}
          y={roomPopover.y}
          onClose={() => setRoomPopover(null)}
          onBlockTime={() => {
            setBlockDrawer({ room: roomPopover.room, dateISO: WEEK_DAYS[roomPopover.dayIndex].iso });
            setRoomPopover(null);
          }}
        />
      )}

      {blockDrawer && (
        <RoomBlockDrawer
          room={blockDrawer.room}
          initialDate={blockDrawer.dateISO}
          onClose={() => setBlockDrawer(null)}
          onApply={trySaveRoomBlock}
        />
      )}

      {conflictState && (
        <ConflictModal
          bookings={conflictState.conflicts.map((a) => ({ label: roomBlockConflictLabel(a) }))}
          context="blocked-time"
          onCancel={() => setConflictState(null)}
          onConfirm={confirmRoomBlockConflict}
        />
      )}
    </div>
  );
}
