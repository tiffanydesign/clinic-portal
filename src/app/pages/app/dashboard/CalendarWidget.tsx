import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight } from "lucide-react";
import { ROOMS, CLINICIANS } from "../calendar/scheduleData";
import {
  APPTS, Appt, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX,
  NOW_MINUTES, TODAY_SHORT, apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./dashboardData";

type Column = { key: string; label: string; sub?: string; appts: Appt[] };
type ViewMode = "room" | "clinician";

// "Dr. Claudia Reis" → "Dr. Reis" — enough to tell three clinicians apart in
// a compact block without repeating the full name every room shows her in.
function doctorShort(doctor: string): string {
  const parts = doctor.split(" ");
  return `Dr. ${parts[parts.length - 1]}`;
}

// Room view: a room is only ever booked by one patient at a time (~2h
// turnover), so this maps directly onto the clinic's physical layout.
// Video consultations occupy no physical room and simply don't appear here.
function buildRoomColumns(): Column[] {
  return ROOMS.map((r) => ({ key: r.id, label: r.label, sub: r.kind, appts: APPTS.filter((a) => a.room === r.id) }));
}

// Clinician view: one column per doctor, every appointment they're running
// today regardless of room — including video, since those are still theirs.
// The mock data was hand-verified this session to never double-book a
// clinician, so (like room view) each column only ever holds one patient at
// a time and blocks never need lane-splitting.
function buildClinicianColumns(): Column[] {
  return CLINICIANS.filter((c) => !c.onLeave).map((c) => ({
    key: c.id, label: c.short, appts: APPTS.filter((a) => a.doctorId === c.id),
  }));
}

// Every column here (room or clinician) only ever holds one patient at a
// time, so blocks render at full column width — no lane-splitting needed.
// `gapMin` still caps a block's height against whatever comes right after it
// in the same column, so a short visit never visually bleeds into the next.
// `secondary` is the block's second detail line — whichever fact isn't
// already implied by the column itself (the doctor's name in room view, the
// room/format in clinician view).
function ApptBlock({ appt, gapMin, secondary }: { appt: Appt; gapMin?: number; secondary: string }) {
  const navigate = useNavigate();
  const top = ((appt.startMin - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const height = blockHeightPx(appt.durationMin, gapMin);
  const showDetail = height >= 38;

  return (
    <button
      onClick={() => navigate(`/dashboard/appointment/${appt.id}`)}
      style={{ top, height }}
      className={`absolute left-0.5 right-0.5 px-2 py-1 text-left overflow-hidden hover:shadow-md hover:z-10 transition-shadow ${apptBlockClass(appt.status)}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
        {appt.isVideo && <Video className="w-3 h-3 text-slate-500 shrink-0" />}
        <span className="text-[11px] font-bold text-gray-800 truncate">{appt.patient.name}</span>
      </div>
      {showDetail && (
        <div className="text-[10px] text-gray-500 truncate mt-0.5 pl-3">
          {appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {secondary}
        </div>
      )}
    </button>
  );
}

function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
      {(["room", "clinician"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${mode === m ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {m === "room" ? "By Room" : "By Clinician"}
        </button>
      ))}
    </div>
  );
}

export function CalendarWidget() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>("room");
  const columns = mode === "room" ? buildRoomColumns() : buildClinicianColumns();
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - DAY_START_HOUR * 60) / 60) * HOUR_PX;

  // Glanceable progress line: so Admin/Reception don't have to count blocks
  // one by one to know how today's clinic is moving. "In progress" folds
  // together every stage between arrival and completion (Arrived/Checked
  // In/In Clinic) since those sub-states are already distinguishable by
  // color on the blocks themselves below.
  const scoped = columns.flatMap((c) => c.appts);
  const summary = {
    total: scoped.length,
    completed: scoped.filter((a) => a.status === "Completed").length,
    inProgress: scoped.filter((a) => a.status === "Arrived" || a.status === "Checked In" || a.status === "In Clinic").length,
    upcoming: scoped.filter((a) => a.status === "Booked").length,
    noShow: scoped.filter((a) => a.status === "No Show").length,
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-md bg-white flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 bg-gray-50/70 px-4 flex items-center justify-between shrink-0 gap-3">
        <h3 className="font-bold text-gray-800 text-sm shrink-0">
          Today's Schedule <span className="text-gray-400 font-medium ml-1">{TODAY_SHORT}</span>
        </h3>
        <div className="flex items-center gap-3">
          <ViewModeToggle mode={mode} onChange={setMode} />
          <button
            onClick={() => navigate("/calendar/schedule")}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors shrink-0"
          >
            Open Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress summary */}
      <div className="px-4 py-2 bg-white flex items-center gap-2 text-xs shrink-0 overflow-x-auto">
        <span className="font-bold text-gray-700 whitespace-nowrap">{summary.total} appointments</span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-gray-500 whitespace-nowrap">{summary.completed} completed</span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-amber-600 whitespace-nowrap">{summary.inProgress} in progress</span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-blue-600 whitespace-nowrap">{summary.upcoming} upcoming</span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-red-600 whitespace-nowrap">{summary.noShow} no-show</span>
      </div>
      {/* A soft tint of each status color, in the same left-to-right order as
          the counts above, replaces a plain gray rule — ties the divider
          back to what it's separating without shouting. */}
      <div className="h-[3px] shrink-0 bg-gradient-to-r from-gray-200 via-amber-200 via-30% via-blue-200 via-70% to-red-200" />

      {/* Column headers — room or clinician, per the toggle above */}
      {columns.length > 1 && (
        <div className="flex border-b border-gray-200 bg-gradient-to-b from-gray-50 to-gray-50/50 shrink-0 pl-14">
          {columns.map((c) => (
            <div key={c.key} className="flex-1 px-1.5 py-2 text-center border-l border-gray-200 min-w-0">
              <div className="text-xs font-bold text-gray-700 truncate">{c.label}</div>
              {c.sub && <div className="text-[9px] text-gray-400 truncate mt-0.5">{c.sub}</div>}
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-[9px] font-bold text-gray-500 tabular-nums">
                {c.appts.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* Hour gutter */}
          <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/30">
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-100/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 text-[10px] font-semibold text-gray-500 text-right pr-2 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
            <span className="absolute right-1.5 z-20 text-[9px] font-bold text-white bg-red-500 rounded px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
              {minToClock(NOW_MINUTES)}
            </span>
          </div>

          {/* Columns */}
          <div className="flex-1 relative">
            {/* alternating hour bands */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-50/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {/* Hour gridlines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: i * HOUR_PX }} />
            ))}

            {/* Now line */}
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
              <div className="relative border-t-2 border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]">
                <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </div>
            </div>

            {/* Appointment columns */}
            <div className="flex h-full">
              {columns.map((c) => {
                const sorted = [...c.appts].sort((a, b) => a.startMin - b.startMin);
                return (
                  <div key={c.key} className="flex-1 relative border-l border-gray-200">
                    {sorted.map((appt) => (
                      <ApptBlock
                        key={appt.id}
                        appt={appt}
                        gapMin={gapToNext(sorted, appt.startMin)}
                        secondary={mode === "room" ? doctorShort(appt.doctor) : (appt.isVideo ? "Video" : appt.room)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
