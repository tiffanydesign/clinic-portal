import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight, Plus } from "lucide-react";
import { useSchedulableRooms, roomName, CLINICIANS } from "../calendar/scheduleData";
import {
  APPTS, Appt, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX,
  NOW_MINUTES, TODAY_SHORT, apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./dashboardData";

type Column = { key: string; label: string; sub?: string; appts: Appt[] };
type ViewMode = "room" | "clinician";

// "Dr. Ebru Reis" → "Dr. Reis" — enough to tell three clinicians apart in
// a compact block without repeating the full name every room shows her in.
function doctorShort(doctor: string): string {
  const parts = doctor.split(" ");
  return `Dr. ${parts[parts.length - 1]}`;
}

// Room view: a room is only ever booked by one patient at a time (~2h
// turnover), so this maps directly onto the clinic's physical layout.
// Video consultations occupy no physical room and simply don't appear here.
function buildRoomColumns(rooms: { id: string; name: string; type: string }[]): Column[] {
  return rooms.map((r) => ({ key: r.id, label: r.name, sub: r.type, appts: APPTS.filter((a) => a.room === r.id) }));
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
        {appt.isVideo && <Video className="w-3 h-3 text-ink-muted shrink-0" />}
        <span className="text-label font-bold text-ink truncate">{appt.patient.name}</span>
      </div>
      {showDetail && (
        <div className="text-label text-ink-muted truncate mt-0.5 pl-3">
          {appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {secondary}
        </div>
      )}
    </button>
  );
}

function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex bg-surface-hover p-0.5 rounded-card border border-divider shrink-0">
      {(["room", "clinician"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 text-label font-bold rounded-control transition-all ${mode === m ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
        >
          {m === "room" ? "By Room" : "By Clinician"}
        </button>
      ))}
    </div>
  );
}

export function CalendarWidget({ onAdd }: { onAdd?: () => void } = {}) {
  const navigate = useNavigate();
  const activeRooms = useSchedulableRooms();
  const [mode, setMode] = useState<ViewMode>("room");
  const columns = mode === "room" ? buildRoomColumns(activeRooms) : buildClinicianColumns();
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
    <div className="rounded-card bg-surface flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="h-12 border-b border-divider bg-surface-page/70 px-4 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h3 className="font-bold text-ink text-sm">
            Today's Schedule <span className="text-ink-muted font-medium ml-1">{TODAY_SHORT}</span>
          </h3>
          {onAdd && (
            <button
              onClick={onAdd}
              title="New booking"
              aria-label="New booking"
              className="w-8 h-8 flex items-center justify-center rounded-card border border-divider text-ink-soft hover:bg-surface-hover hover:border-border-strong hover:text-ink-soft transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => navigate("/calendar/schedule")}
          className="text-xs font-bold text-ink-soft hover:text-ink flex items-center gap-1 transition-colors shrink-0"
        >
          Open Calendar <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress summary + room/clinician toggle. On the narrow dashboard
          column this row wraps: the counts wrap cleanly — separated by gap +
          status colour rather than standalone "·" spans that dangle at line
          ends — and the toggle drops to its own line instead of fighting the
          counts for width. */}
      <div className="px-4 py-2 bg-surface flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 shrink-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label min-w-0">
          <span className="font-bold text-ink-soft whitespace-nowrap">{summary.total} appointments</span>
          <span className="font-semibold text-ink-muted whitespace-nowrap">{summary.completed} completed</span>
          <span className="font-semibold text-warning-ink whitespace-nowrap">{summary.inProgress} in progress</span>
          <span className="font-semibold text-info-ink whitespace-nowrap">{summary.upcoming} upcoming</span>
          <span className="font-semibold text-danger-ink whitespace-nowrap">{summary.noShow} no-show</span>
        </div>
        <ViewModeToggle mode={mode} onChange={setMode} />
      </div>
      {/* Plain solid divider under the summary/toggle row — no gradient. */}
      <div className="h-px shrink-0 bg-divider" />

      {/* Full timeline, no internal scroll — the whole 08:00-19:00 day
          always renders in full; the page itself is the only scroll
          surface (see DashboardPage.tsx). Column headers live in the same
          flex column as the grid below purely for layout consistency —
          `sticky` no longer has a scrolling ancestor to pin against here,
          but is harmless to leave since it degrades to normal flow. */}
      <div className="flex-1">
        {columns.length > 1 && (
          <div className="sticky top-0 z-30 flex border-b border-divider bg-gradient-to-b from-surface-page to-surface-page/50 pl-14">
            {columns.map((c) => (
              <div key={c.key} className="flex-1 px-1.5 py-2 text-center border-l border-grid-line min-w-0">
                <div className="text-xs font-bold text-ink-soft truncate">{c.label}</div>
                {c.sub && <div className="text-label text-ink-muted truncate mt-0.5">{c.sub}</div>}
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-surface-hover text-label font-bold text-ink-muted tabular-nums">
                  {c.appts.length}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex" style={{ height: gridHeight }}>
          {/* Hour gutter */}
          <div className="w-14 shrink-0 relative border-r border-divider bg-surface-page/30">
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-hover/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 text-label font-semibold text-ink-muted text-right pr-2 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
            <span className="absolute right-1.5 z-20 text-label font-bold text-white bg-danger-ink rounded-control px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
              {minToClock(NOW_MINUTES)}
            </span>
          </div>

          {/* Columns */}
          <div className="flex-1 relative">
            {/* alternating hour bands */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-page/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {/* Hour gridlines — fainter than section dividers so the blocks
                read first (see --grid-line). */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-grid-line" style={{ top: i * HOUR_PX }} />
            ))}

            {/* Now line */}
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
              <div className="relative border-t-2 border-danger shadow-[0_0_6px_rgba(239,68,68,0.35)]">
                <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-danger-ink ring-2 ring-white" />
              </div>
            </div>

            {/* Appointment columns */}
            <div className="flex h-full">
              {columns.map((c) => {
                const sorted = [...c.appts].sort((a, b) => a.startMin - b.startMin);
                return (
                  <div key={c.key} className="flex-1 relative border-l border-grid-line">
                    {sorted.map((appt) => (
                      <ApptBlock
                        key={appt.id}
                        appt={appt}
                        gapMin={gapToNext(sorted, appt.startMin)}
                        secondary={mode === "room" ? doctorShort(appt.doctor) : (appt.isVideo ? "Video" : roomName(appt.room))}
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
