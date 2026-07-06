import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Check } from "lucide-react";
import type { Role } from "../../../context/AppContext";
import { CLINICIANS, ROOMS, APPT_TYPES } from "./scheduleData";

export type View = "day" | "week";
export type Mode = "calendar" | "list";
export type Grouping = "staff" | "room";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded p-0.5 border border-gray-200">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${value === o.v ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{o.label}</button>
      ))}
    </div>
  );
}

const LEGEND: { label: string; cls: string }[] = [
  { label: "Booked", cls: "bg-blue-400" },
  { label: "Checked In", cls: "bg-emerald-500" },
  { label: "In Clinic", cls: "bg-orange-500" },
  { label: "Completed", cls: "bg-gray-300" },
  { label: "No Show", cls: "border-2 border-dashed border-red-400" },
  { label: "Cancelled", cls: "bg-gray-300 line-through" },
];

function ClinicianMultiSelect({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = selected.size === 0 || selected.size === CLINICIANS.length ? "All clinicians" : `${selected.size} clinician${selected.size === 1 ? "" : "s"}`;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">{label} ▾</button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded shadow-lg py-1 w-52">
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

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      {/* row 1 */}
      <div className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-bold text-gray-800 min-w-[150px] text-center">{dateLabel}</span>
          <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
          <button className="ml-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50">Today</button>
          <button title="Jump to date" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded border border-gray-300"><CalendarDays className="w-4 h-4" /></button>
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
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
              <button onClick={() => setOverlay(!overlay)} className={`w-9 h-5 rounded-full relative transition-colors ${overlay ? "bg-slate-600" : "bg-gray-300"}`}>
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${overlay ? "left-[19px]" : "left-[3px]"}`} />
              </button>
              Show clinic overlay
            </label>
          )}
          {(role === "Admin" || role === "Reception") && (
            <button onClick={onNew} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Appointment</button>
          )}
          {role === "Clinician" && (
            <button onClick={onBlock} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Block Time</button>
          )}
        </div>
      </div>

      {/* row 2: legend + admin filters */}
      <div className="px-6 py-2 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className={`w-3 h-3 rounded-sm ${l.cls}`} /> {l.label}
            </span>
          ))}
        </div>
        {role === "Admin" && (
          <div className="flex items-center gap-2">
            <ClinicianMultiSelect selected={clinicianFilter} onToggle={toggleClinician} />
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 bg-white outline-none focus:border-slate-500">
              <option value="">All rooms</option>
              {ROOMS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 bg-white outline-none focus:border-slate-500">
              <option value="">All types</option>
              {APPT_TYPES.map((t) => <option key={t} value={t}>{t.replace(" (in-person)", "").replace(" (video)", "")}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
