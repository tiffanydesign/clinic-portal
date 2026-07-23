import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { AvailabilityGrid } from "./availability-grid/AvailabilityGrid";
import { AvailabilityFilter, FilterGroup } from "./availability-grid/AvailabilityFilter";
import { ALL_STAFF, buildPeopleRows, StaffMember } from "./availability-grid/peopleAvailabilityData";
import { PeopleDayPopover } from "./availability-grid/PeopleDayPopover";
import { buildRoomRows } from "./availability-grid/roomAvailabilityRows";
import { useSchedulableRooms } from "./clinic-settings/roomsStore";
import { APPTS } from "./dashboard/dashboardData";
import type { GridDay } from "./availability-grid/types";

type Tab = "people" | "rooms";

// Only the anchor week has real mock data (see scheduleData.ts's ANCHOR_DATE
// convention) — the navigator's ‹ › are visual-only for now, matching the
// rest of the app's single-real-week mock scope.
const WEEK_DAYS = [
  { label: "Mon 30", full: "Mon, 30 Jun 2026" },
  { label: "Tue 1", full: "Tue, 1 Jul 2026" },
  { label: "Wed 2", full: "Wed, 2 Jul 2026" },
  { label: "Thu 3", full: "Thu, 3 Jul 2026" },
  { label: "Fri 4", full: "Fri, 4 Jul 2026" },
  { label: "Sat 5", full: "Sat, 5 Jul 2026" },
  { label: "Sun 6", full: "Sun, 6 Jul 2026" },
];
const TODAY_INDEX = 3;
const DAYS: GridDay[] = WEEK_DAYS.map((d, i) => ({ key: d.full, label: d.label, isToday: i === TODAY_INDEX }));

export function AvailabilityPage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canSeeRooms = role === "Admin" || role === "Reception";

  const [tab, setTab] = useState<Tab>(canSeeRooms && searchParams.get("tab") === "rooms" ? "rooms" : "people");
  const [filterValues, setFilterValues] = useState<Set<string>>(new Set());
  const [dayPopover, setDayPopover] = useState<{ staff: StaffMember; dayIndex: number; x: number; y: number } | null>(null);

  const rooms = useSchedulableRooms();

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

  const roomRows = buildRoomRows(visibleRooms, APPTS, DAYS.length, (room, dayIndex) => {
    navigate(`/calendar/schedule?grouping=room&room=${room.id}`);
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

      {/* Grid */}
      {tab === "people" || !canSeeRooms ? (
        <AvailabilityGrid days={DAYS} rows={peopleRows} showColumnSummary />
      ) : (
        <AvailabilityGrid days={DAYS} rows={roomRows} />
      )}

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
    </div>
  );
}
