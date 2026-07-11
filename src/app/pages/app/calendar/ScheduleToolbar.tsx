import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Check, Info, SlidersHorizontal } from "lucide-react";
import type { Role } from "../../../context/AppContext";
import { CLINICIANS, ROOMS, APPT_TYPES } from "./scheduleData";
import { FilterSelect } from "../../../components/FilterSelect";

export type View = "day" | "week";
export type Mode = "calendar" | "list";
export type Grouping = "staff" | "room";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${value === o.v ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{o.label}</button>
      ))}
    </div>
  );
}

const LEGEND: { label: string; cls: string }[] = [
  { label: "Booked", cls: "bg-blue-500" },
  { label: "Arrived", cls: "bg-amber-500" },
  { label: "Checked In", cls: "bg-emerald-500" },
  { label: "In Clinic", cls: "bg-orange-500" },
  { label: "Completed", cls: "bg-gray-400" },
  { label: "No Show", cls: "border-2 border-dashed border-red-400 bg-transparent" },
  { label: "Cancelled", cls: "bg-gray-300" },
];

// iPad has no reliable hover, so the legend lives behind a tap target (ⓘ)
// rather than sitting permanently on the toolbar as a row of loose squares.
function LegendPopover() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${open ? "bg-slate-100 border-slate-300 text-slate-700" : "border-gray-300 text-gray-500 bg-white hover:bg-gray-50"}`}
        title="Status legend"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-48">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Status legend</div>
            <div className="space-y-1.5">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2 px-1 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.cls}`} /> {l.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ClinicianMultiSelect({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = selected.size === 0 || selected.size === CLINICIANS.length ? "All clinicians" : `${selected.size} clinician${selected.size === 1 ? "" : "s"}`;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white shadow-sm outline-none transition-colors hover:border-gray-400">
        {label} <span className="text-gray-400 text-[10px]">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52">
            {CLINICIANS.map((c) => {
              const on = selected.size === 0 || selected.has(c.id);
              return (
                <button key={c.id} onClick={() => onToggle(c.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-slate-600 border-slate-600" : "border-gray-300"}`}>{on && <Check className="w-3 h-3 text-white" />}</span>
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

export function ScheduleToolbar({
  role, dateLabel, view, setView, mode, setMode, grouping, setGrouping,
  clinicianFilter, toggleClinician, room, setRoom, type, setType,
  overlay, setOverlay, onNew, onBlock,
}: {
  role: Role;
  dateLabel: string;
  view: View; setView: (v: View) => void;
  mode: Mode; setMode: (m: Mode) => void;
  grouping: Grouping; setGrouping: (g: Grouping) => void;
  clinicianFilter: Set<string>; toggleClinician: (id: string) => void;
  room: string; setRoom: (r: string) => void;
  type: string; setType: (t: string) => void;
  overlay: boolean; setOverlay: (v: boolean) => void;
  onNew: () => void; onBlock: () => void;
}) {
  const hasWeek = role === "Admin" || role === "Clinician";
  const hasListToggle = role === "Admin" || role === "Reception";
  const isList = mode === "list";
  const filtersActive = clinicianFilter.size > 0 || room !== "" || type !== "";

  return (
    <div className="relative z-30 shrink-0 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {/* row 1 */}
      <div className="px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* unified date navigator — one bordered cluster instead of four loose buttons */}
          <div className="flex items-stretch bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <button className="px-2 text-gray-500 hover:bg-gray-100 border-r border-gray-200"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-bold text-gray-800 min-w-[150px] flex items-center justify-center px-2 tabular-nums">{dateLabel}</span>
            <button className="px-2 text-gray-500 hover:bg-gray-100 border-l border-gray-200"><ChevronRight className="w-4 h-4" /></button>
            <button title="Jump to date" className="px-2.5 text-gray-500 hover:bg-gray-100 border-l border-gray-200"><CalendarDays className="w-4 h-4" /></button>
          </div>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-sm">Today</button>
        </div>

        <div className="flex items-center gap-3">
          {!isList && hasWeek && <Segmented value={view} options={[{ v: "day", label: "Day" }, { v: "week", label: "Week" }]} onChange={setView} />}
          {hasListToggle && <Segmented value={mode} options={[{ v: "calendar", label: "Calendar" }, { v: "list", label: "List" }]} onChange={setMode} />}
        </div>

        <div className="flex items-center gap-2">
          {role === "Admin" && !isList && view === "day" && (
            <Segmented value={grouping} options={[{ v: "staff", label: "By Staff" }, { v: "room", label: "By Room" }]} onChange={setGrouping} />
          )}
          {role === "Clinician" && !isList && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none mr-1">
              <button onClick={() => setOverlay(!overlay)} className={`w-9 h-5 rounded-full relative transition-colors ${overlay ? "bg-slate-600" : "bg-gray-300"}`}>
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${overlay ? "left-[19px]" : "left-[3px]"}`} />
              </button>
              Show clinic overlay
            </label>
          )}
          <LegendPopover />
          {(role === "Admin" || role === "Reception") && (
            <button onClick={onNew} className="px-3.5 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition-colors"><Plus className="w-3.5 h-3.5" /> New Appointment</button>
          )}
          {role === "Clinician" && (
            <button onClick={onBlock} className="px-3.5 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition-colors"><Plus className="w-3.5 h-3.5" /> Block Time</button>
          )}
        </div>
      </div>

      {/* row 2: admin filters, grouped into one cluster instead of scattered selects */}
      {role === "Admin" && (
        <div className="px-6 py-2 flex items-center gap-2 border-t border-gray-100 bg-gray-50/60">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            <SlidersHorizontal className="w-3 h-3" /> Filters
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
          </span>
          <div className="flex items-center gap-2">
            <ClinicianMultiSelect selected={clinicianFilter} onToggle={toggleClinician} />
            <FilterSelect
              value={room}
              onChange={setRoom}
              className="text-xs py-1.5"
              options={[{ value: "", label: "All rooms" }, ...ROOMS.map((r) => ({ value: r.id, label: r.label }))]}
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
