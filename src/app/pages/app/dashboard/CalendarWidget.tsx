import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight } from "lucide-react";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";
import { useSchedulableRooms, roomName, CLINICIANS } from "../calendar/scheduleData";
import {
  APPTS, Appt, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX as BASE_HOUR_PX,
  NOW_MINUTES, TODAY_SHORT, apptBlockClass, apptMicroPillClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
  clusterColumnByHour, equalDivisionTop, equalDivisionHeight,
} from "./dashboardData";

type Column = { key: string; label: string; sub?: string; appts: Appt[] };
type ViewMode = "room" | "clinician";

// 1.5x the base hour height (90px -> 135px) — an iPad-first surface needs
// enough room per hour to show up to MAX_VISIBLE_PER_HOUR real blocks at a
// comfortably tappable size, not just the dashboard's original compact scale.
const HOUR_PX = BASE_HOUR_PX * 1.5;

// A column's own appointments render individually up to this many per clock
// hour before folding into the micro-pill stack — 6 covers every real
// Scan/Sample room hour in the mock data, so the pill stack below is a
// defensive fallback (a 7th+ item hour), never the everyday path.
const MAX_VISIBLE_PER_HOUR = 6;
// Inside a dense hour's micro-pill stack, show at most this many pills
// before folding the rest into a "+N" line.
const MAX_PILLS_PER_HOUR = 3;
const PILL_HEIGHT = 18;
const PILL_GAP = 2;

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
function ApptBlock({ appt, top, height, secondary }: { appt: Appt; top: number; height: number; secondary: string }) {
  const navigate = useNavigate();
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

// Micro-pill (Apple Calendar-style): status dot + name only, tonal
// background (apptMicroPillClass — same bg-{status}/10 tint the full block
// uses, no border). Text never wraps and clips hard at narrow widths.
function MicroPill({ appt }: { appt: Appt }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/dashboard/appointment/${appt.id}`)}
      style={{ height: PILL_HEIGHT }}
      className={`w-full shrink-0 flex items-center gap-1 px-1.5 rounded-full overflow-hidden whitespace-nowrap text-left hover:brightness-95 transition-[filter] ${apptMicroPillClass(appt.status)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
      <span className="text-micro text-ink truncate">{appt.patient.name}</span>
    </button>
  );
}

const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  room: "By Room",
  clinician: "By Clinician",
};

function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex bg-surface-hover p-0.5 rounded-card border border-divider shrink-0">
      {(["room", "clinician"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-2.5 py-1 text-label font-bold rounded-control transition-all ${mode === m ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
        >
          {VIEW_MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

export function CalendarWidget() {
  const navigate = useNavigate();
  const activeRooms = useSchedulableRooms();
  const [mode, setMode] = useState<ViewMode>("room");
  // Micro-pill-stack overflow popover — one open at a time, identified by column + hour.
  const [openOverflow, setOpenOverflow] = useState<{ colKey: string; hourStartMin: number } | null>(null);
  const overflowAnchorRef = useRef<HTMLButtonElement>(null);
  const columns = mode === "room" ? buildRoomColumns(activeRooms) : buildClinicianColumns();
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - DAY_START_HOUR * 60) / 60) * HOUR_PX;

  return (
    <div className="rounded-card bg-surface shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header — title, view-mode toggle, and the Open Calendar jump link
          share the one row, in that left-to-right order. White background
          throughout, matching the card body below it. */}
      <div className="h-12 border-b border-divider bg-surface px-4 flex items-center justify-between shrink-0 gap-3">
        <h3 className="font-bold text-ink text-sm shrink-0">
          Today's Schedule <span className="text-ink-muted font-medium ml-1">{TODAY_SHORT}</span>
        </h3>
        <div className="flex items-center gap-3 shrink-0">
          <ViewModeToggle mode={mode} onChange={setMode} />
          <button
            onClick={() => navigate("/calendar/schedule")}
            className="text-xs font-bold text-ink-soft hover:text-ink flex items-center gap-1 transition-colors shrink-0"
          >
            Open Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
                <div className="flex items-center justify-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-ink-soft truncate">{c.label}</span>
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[color:var(--phenome-blue-500)]/10 text-[color:var(--phenome-blue-500)] text-label font-bold tabular-nums">
                    {c.appts.length}
                  </span>
                </div>
                {c.sub && <div className="text-label text-ink-muted truncate mt-0.5">{c.sub}</div>}
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

            {/* Appointment columns — capped to MAX_VISIBLE_PER_HOUR full
                blocks per clock hour; crossing that renders the whole hour
                as a micro-pill stack instead (see clusterColumnByHour). */}
            <div className="flex h-full">
              {columns.map((c) => {
                const { visible, overflow } = clusterColumnByHour(c.appts, (a) => a.startMin, MAX_VISIBLE_PER_HOUR);
                const timeline = [
                  ...visible.map((v) => ({ startMin: v.item.startMin })),
                  ...overflow.map((g) => ({ startMin: g.hourStartMin + 60 })),
                ];
                return (
                  <div key={c.key} className="flex-1 relative border-l border-grid-line">
                    {visible.map((v) => {
                      const appt = v.item;
                      const dense = v.bucketSize > 1;
                      const top = dense
                        ? equalDivisionTop(v.hourStartMin, v.bucketIndex, v.bucketSize, HOUR_PX)
                        : ((appt.startMin - DAY_START_HOUR * 60) / 60) * HOUR_PX;
                      const height = dense
                        ? equalDivisionHeight(v.bucketSize, HOUR_PX)
                        : blockHeightPx(appt.durationMin, gapToNext(timeline, appt.startMin));
                      return (
                        <ApptBlock
                          key={appt.id}
                          appt={appt}
                          top={top}
                          height={height}
                          secondary={mode === "room" ? doctorShort(appt.doctor) : (appt.isVideo ? "Video" : roomName(appt.room))}
                        />
                      );
                    })}
                    {/* Micro-pill stack (Apple Calendar-style) — a dense hour
                        renders up to MAX_PILLS_PER_HOUR compact pills; the
                        rest fold into a "+N" caption. The stack's own
                        container still spans the FULL hour, so the grid
                        keeps one uniform rectangle per hour. */}
                    {overflow.map((group) => {
                      const top = ((group.hourStartMin - DAY_START_HOUR * 60) / 60) * HOUR_PX;
                      const height = HOUR_PX - 2;
                      const visiblePills = group.items.slice(0, MAX_PILLS_PER_HOUR);
                      const hiddenCount = group.items.length - visiblePills.length;
                      const isOpen = openOverflow?.colKey === c.key && openOverflow?.hourStartMin === group.hourStartMin;
                      return (
                        <div key={`overflow-${group.hourStartMin}`} style={{ top, height }} className="absolute left-0.5 right-0.5 flex flex-col pt-0.5">
                          <div className="flex flex-col" style={{ gap: PILL_GAP }}>
                            {visiblePills.map((appt) => <MicroPill key={appt.id} appt={appt} />)}
                          </div>
                          {hiddenCount > 0 && (
                            <button
                              ref={isOpen ? overflowAnchorRef : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                overflowAnchorRef.current = e.currentTarget;
                                setOpenOverflow(isOpen ? null : { colKey: c.key, hourStartMin: group.hourStartMin });
                              }}
                              className={`text-micro text-ink-muted text-center mt-0.5 ${isOpen ? "underline" : ""}`}
                            >
                              +{hiddenCount}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {openOverflow && (() => {
              const col = columns.find((c) => c.key === openOverflow.colKey);
              const group = col
                ? clusterColumnByHour(col.appts, (a) => a.startMin, MAX_VISIBLE_PER_HOUR).overflow
                    .find((g) => g.hourStartMin === openOverflow.hourStartMin)
                : undefined;
              if (!group) return null;
              return (
                <FloatingPopover anchorRef={overflowAnchorRef} onClose={() => setOpenOverflow(null)}>
                  <div className="w-64 bg-surface border border-divider rounded-card shadow-xl py-1.5 max-h-72 overflow-y-auto">
                    <div className="px-3 pb-1.5 text-label font-bold text-ink-muted uppercase tracking-wider">
                      {minToClock(openOverflow.hourStartMin)}–{minToClock(openOverflow.hourStartMin + 60)} · {group.items.length} appointments
                    </div>
                    {group.items.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => { navigate(`/dashboard/appointment/${appt.id}`); setOpenOverflow(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="w-11 shrink-0 text-label font-semibold text-ink-muted tabular-nums">{minToClock(appt.startMin)}</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
                        {appt.isVideo && <Video className="w-3.5 h-3.5 text-ink-muted shrink-0" />}
                        <span className="min-w-0 flex-1 text-sm font-bold text-ink truncate">{appt.patient.name}</span>
                        <span className="shrink-0 text-label text-ink-muted">{appt.durationMin}m</span>
                      </button>
                    ))}
                  </div>
                </FloatingPopover>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
