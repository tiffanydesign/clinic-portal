import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarPlus, Plus, Check, SlidersHorizontal } from "lucide-react";
import { addDays, addMonths, format, isSameDay, startOfMonth, startOfWeek, subMonths } from "date-fns";
import type { Role } from "../../../context/AppContext";
import { CLINICIANS, useSchedulableRooms, APPT_TYPES, ANCHOR_DATE } from "./scheduleData";
import { FilterSelect } from "../../../components/FilterSelect";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";

export type Mode = "calendar" | "list";
export type Grouping = "staff" | "room";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`px-3 py-1.5 text-xs font-bold rounded-control transition-all ${value === o.v ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}>{o.label}</button>
      ))}
    </div>
  );
}

function ClinicianMultiSelect({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = selected.size === 0 || selected.size === CLINICIANS.length ? "All clinicians" : `${selected.size} clinician${selected.size === 1 ? "" : "s"}`;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center justify-between gap-2 px-3 py-1.5 border border-divider rounded-control text-xs font-medium text-ink-soft bg-surface shadow-sm outline-none transition-colors hover:border-border-strong">
        {label} <span className="text-ink-muted text-label">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 bg-surface border border-divider rounded-card shadow-lg py-1 w-52">
            {CLINICIANS.map((c) => {
              const on = selected.size === 0 || selected.has(c.id);
              return (
                <button key={c.id} onClick={() => onToggle(c.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-hover text-left">
                  <span className={`w-4 h-4 rounded-control border flex items-center justify-center shrink-0 ${on ? "bg-surface-sunken border-border-strong" : "border-divider"}`}>{on && <Check className="w-3 h-3 text-white" />}</span>
                  <span className="truncate">{c.short}{c.onLeave ? " (leave)" : ""}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Single-month jump-to-date popover — a lighter-weight sibling of
// RangeDatePicker (which is built for two-month range selection and doesn't
// fit a single "pick one day" control). Highlights the demo's anchor day
// with a dot, same visual language as RangeDatePicker's "today" marker.
// Renders via FloatingPopover (portal + position:fixed) rather than a plain
// absolute child — the date navigator cluster around it has overflow-hidden
// (to keep its own rounded-control corners clean), which would otherwise clip the
// dropdown to invisible, per the project's own "dropdown in overflow-hidden
// container" pitfall.
function DatePickerPopover({ selectedDate, onPick }: { selectedDate: Date; onPick: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open) setViewMonth(startOfMonth(selectedDate));
    setOpen((o) => !o);
  };

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        title="Jump to date"
        className={`px-2.5 text-ink-muted hover:bg-surface-hover border-l border-divider h-full flex items-center ${open ? "bg-surface-hover" : ""}`}
      >
        <CalendarDays className="w-4 h-4" />
      </button>
      {open && (
        <FloatingPopover anchorRef={buttonRef} onClose={() => setOpen(false)} align="left">
          <div className="bg-surface border border-divider rounded-card shadow-lg p-3 w-64" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => setViewMonth((m) => subMonths(m, 1))} className="p-1 hover:bg-surface-hover rounded-control text-ink-muted"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-bold text-ink">{format(viewMonth, "MMMM yyyy")}</span>
              <button onClick={() => setViewMonth((m) => addMonths(m, 1))} className="p-1 hover:bg-surface-hover rounded-control text-ink-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-label font-bold text-ink-muted">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {days.map((day) => {
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const isAnchor = isSameDay(day, ANCHOR_DATE);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { onPick(day); setOpen(false); }}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-semibold transition-colors relative ${
                      isSelected ? "bg-ink text-white" : inMonth ? "text-ink-soft hover:bg-surface-hover" : "text-ink-muted hover:bg-surface-hover"
                    }`}
                  >
                    {day.getDate()}
                    {isAnchor && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 bg-surface-sunken rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
        </FloatingPopover>
      )}
    </>
  );
}

export function ScheduleToolbar({
  role, dateLabel, selectedDate, onPrev, onNext, onToday, onPickDate, disableCreate,
  mode, setMode, grouping, setGrouping,
  clinicianFilter, toggleClinician, room, setRoom, type, setType,
  overlay, setOverlay, onNew, onBlock,
}: {
  role: Role;
  dateLabel: string;
  selectedDate: Date;
  onPrev: () => void; onNext: () => void; onToday: () => void; onPickDate: (d: Date) => void;
  disableCreate?: boolean;
  mode: Mode; setMode: (m: Mode) => void;
  grouping: Grouping; setGrouping: (g: Grouping) => void;
  clinicianFilter: Set<string>; toggleClinician: (id: string) => void;
  room: string; setRoom: (r: string) => void;
  type: string; setType: (t: string) => void;
  overlay: boolean; setOverlay: (v: boolean) => void;
  onNew: () => void; onBlock: () => void;
}) {
  const rooms = useSchedulableRooms();
  const hasListToggle = role === "Admin" || role === "Reception";
  const isList = mode === "list";
  const filtersActive = clinicianFilter.size > 0 || room !== "" || type !== "";
  const isToday = isSameDay(selectedDate, ANCHOR_DATE);

  return (
    <div className="relative z-30 shrink-0 border-b border-divider bg-surface/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {/* row 1 */}
      <div className="px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: date navigation + the view-control cluster. The cluster is
            LEFT-ANCHORED and ordered primary → contextual, so the primary
            Mode toggle (Calendar/List) never moves; only the trailing
            contextual controls (Day/Week, grouping) appear or disappear when
            the mode/view changes. This kills the old justify-between reflow
            where remaining toggles jumped to new positions on every switch. */}
        <div className="flex items-center gap-3 min-w-0">
          {/* unified date navigator — one bordered cluster instead of four loose buttons */}
          <div className="flex items-stretch bg-surface border border-divider rounded-card shadow-sm overflow-hidden shrink-0">
            <button onClick={onPrev} className="px-2 text-ink-muted hover:bg-surface-hover border-r border-divider"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-bold text-ink min-w-[150px] flex items-center justify-center px-2 tabular-nums">{dateLabel}</span>
            <button onClick={onNext} className="px-2 text-ink-muted hover:bg-surface-hover border-l border-divider"><ChevronRight className="w-4 h-4" /></button>
            <DatePickerPopover selectedDate={selectedDate} onPick={onPickDate} />
          </div>
          <button
            onClick={onToday}
            disabled={isToday}
            className={`px-3 py-2 border rounded-control text-xs font-bold shadow-sm transition-colors shrink-0 ${
              isToday ? "border-divider text-ink-muted bg-surface-page cursor-not-allowed" : "border-divider text-ink-soft bg-surface hover:bg-surface-hover"
            }`}
          >
            Today
          </button>

          {/* view-control cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* primary axis — stable anchor, always present for roles that have it */}
            {hasListToggle && (
              <Segmented value={mode} options={[{ v: "calendar", label: "Calendar" }, { v: "list", label: "List" }]} onChange={setMode} />
            )}
            {/* Admin's By Staff / By Room grouping — trails the primary toggle,
                separated by a divider that reads "primary | contextual" */}
            {!isList && role === "Admin" && (
              <>
                {hasListToggle && <span className="h-6 w-px bg-surface-sunken mx-0.5" aria-hidden />}
                <Segmented value={grouping} options={[{ v: "staff", label: "By Staff" }, { v: "room", label: "By Room" }]} onChange={setGrouping} />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {role === "Clinician" && !isList && (
            <label className="flex items-center gap-2 text-xs font-medium text-ink-soft cursor-pointer select-none mr-1">
              <button onClick={() => setOverlay(!overlay)} className={`w-9 h-5 rounded-full relative transition-colors ${overlay ? "bg-surface-sunken" : "bg-surface-sunken"}`}>
                <span className={`w-3.5 h-3.5 bg-surface rounded-full absolute top-[3px] transition-all shadow-sm ${overlay ? "left-[19px]" : "left-[3px]"}`} />
              </button>
              Show clinic overlay
            </label>
          )}
          {/* Admin + Reception only — Nurse/Clinician get no booking entry anywhere. */}
          {(role === "Admin" || role === "Reception") && (
            <button
              onClick={onNew}
              disabled={disableCreate}
              title={disableCreate ? "Only the demo day (Fri, 3 Jul 2026) has bookable data" : undefined}
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-control text-sm font-bold transition-colors ${
                disableCreate ? "bg-surface-hover text-ink-muted cursor-not-allowed" : "btn-primary"
              }`}
            >
              <CalendarPlus className="w-4 h-4" /> New Booking
            </button>
          )}
          {role === "Clinician" && (
            <button
              onClick={onBlock}
              disabled={disableCreate}
              title={disableCreate ? "Only the demo day (Fri, 3 Jul 2026) has bookable data" : undefined}
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-control text-sm font-bold transition-colors ${
                disableCreate ? "bg-surface-hover text-ink-muted cursor-not-allowed" : "btn-primary"
              }`}
            >
              <Plus className="w-4 h-4" /> Block Time
            </button>
          )}
        </div>
      </div>

      {/* row 2: admin filters, grouped into one cluster instead of scattered selects */}
      {role === "Admin" && (
        <div className="px-6 py-2 flex items-center gap-2 border-t border-divider bg-surface-page/60">
          <span className="flex items-center gap-1.5 text-label font-bold text-ink-muted uppercase tracking-wider mr-1">
            <SlidersHorizontal className="w-3 h-3" /> Filters
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-info" />}
          </span>
          <div className="flex items-center gap-2">
            <ClinicianMultiSelect selected={clinicianFilter} onToggle={toggleClinician} />
            <FilterSelect
              value={room}
              onChange={setRoom}
              className="text-xs py-1.5"
              options={[{ value: "", label: "All rooms" }, ...rooms.map((r) => ({ value: r.id, label: r.name }))]}
            />
            <FilterSelect
              value={type}
              onChange={setType}
              className="text-xs py-1.5"
              options={[
                { value: "", label: "All types" },
                ...APPT_TYPES.map((t) => ({ value: t, label: t.replace(" (in-person)", "").replace(" (video)", "") })),
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
