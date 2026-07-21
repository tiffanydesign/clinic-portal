// The time grid for the My Schedule view — week (7 cols) or day (1 wide col).
// Renders working-hours shading, the read-only availability layer (Clinician
// only — non-working bands, blocked time, approved leave), the now line (bold
// on today's column), and event blocks. Every day's appts are pre-guaranteed
// non-overlapping (deoverlapSequential in myScheduleData.ts), so each block is
// simply full-width — no lane-packing or "+N more" collapsing.
import React, { useEffect, useRef } from "react";
import { format, isBefore } from "date-fns";
import { Video, Plane } from "lucide-react";
import { Appt, HOUR_PX, minToClock, apptBlockClass, apptStatusDotClass } from "./scheduleData";
import { WeekSchedule, BlockedTime, LeaveItem } from "../availability/availabilityData";
import {
  ScheduleRole, WeekDay, LayerState, LaidItem, layoutDay, apptVisible, typeShort,
  nonWorkingBands, blocksForDate, leaveForDate, DAY_START, DAY_END, SCROLL_TO,
} from "./myScheduleData";
import { JourneyProgressChip } from "../dashboard/journey/JourneyProgress";

const GRID_MIN_H = 66; // touch-friendly floor — tall enough for every info line below (every appt is now a real 1-2h slot)
const topPx = (min: number) => ((min - DAY_START) / 60) * HOUR_PX;
const matches = (a: Appt, q: string) => a.patient.name.toLowerCase().includes(q.trim().toLowerCase());

function longPress(handler: () => void) {
  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(handler, 500); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  return { onTouchStart: start, onTouchEnd: cancel, onTouchMove: cancel, onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); handler(); } };
}

function EventBlock({ item, role, dimmed, past, onClick, onLong }: {
  item: LaidItem; role: ScheduleRole; dimmed: boolean; past: boolean; onClick: () => void; onLong: () => void;
}) {
  const a = item.appt;
  const height = Math.max(GRID_MIN_H, (a.durationMin / 60) * HOUR_PX) - 2;
  const showJourney = role === "Nurse" && (a.status === "In Clinic" || a.status === "Checked In");
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      {...longPress(onLong)}
      style={{ top: topPx(a.startMin), height, left: 1, right: 1 }}
      className={`absolute px-2 py-1.5 text-left overflow-hidden cursor-pointer transition-all hover:shadow-md hover:z-10 ${apptBlockClass(a.status)} ${past ? "opacity-55" : ""} ${dimmed ? "opacity-25" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(a.status)}`} />
        {a.isVideo && <Video className="w-3 h-3 text-info-ink shrink-0" />}
        <span className="text-label font-bold text-ink truncate">{a.patient.name}</span>
      </div>
      <div className="text-label text-ink-soft truncate mt-0.5">{typeShort(a.type)} · {a.durationMin} min</div>
      <div className="text-label text-ink-muted truncate">{a.room} · {a.doctor}</div>
      {showJourney && (
        <div className="text-label font-semibold text-warning-ink truncate mt-0.5">
          → <JourneyProgressChip appt={a} className="!text-warning-ink" />
        </div>
      )}
      {a.isVideo && role === "Clinician" && (
        <div className="text-label font-semibold text-info-ink truncate mt-0.5">Video · ready to join</div>
      )}
    </div>
  );
}

function DayColumn({ day, role, layers, schedule, blockedTime, leaves, search, nowMinutes, isToday, onApptClick, onLongPress }: {
  day: WeekDay; role: ScheduleRole; layers: LayerState; schedule: WeekSchedule; blockedTime: BlockedTime[]; leaves: LeaveItem[];
  search: string; nowMinutes: number; isToday: boolean; onApptClick: (a: Appt) => void; onLongPress: (a: Appt) => void;
}) {
  const visible = day.appts.filter((a) => apptVisible(a, layers));
  const laid = layoutDay(visible);
  // Availability overlay (working-hours shading, blocked time, approved leave)
  // is Clinician-only — Nurse has no self-service availability page, so the
  // read-only layer that visualizes it is dropped for that role entirely.
  const showAvailability = role === "Clinician" && layers.availability;
  const leave = showAvailability ? leaveForDate(day.date, leaves) : null;
  const bands = showAvailability ? nonWorkingBands(day.date, schedule) : [];
  const blocks = showAvailability ? blocksForDate(day.date, blockedTime) : [];
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex-1 relative border-l border-divider min-w-0">
      {/* non-working shading */}
      {bands.map(([s, e], i) => (
        <div key={`nw-${i}`} className="absolute left-0 right-0 bg-surface-hover/70 pointer-events-none" style={{ top: topPx(s), height: ((e - s) / 60) * HOUR_PX }} />
      ))}
      {/* approved leave — full grey wash */}
      {leave && (
        <div className="absolute inset-0 bg-surface-sunken/70 pointer-events-none flex flex-col items-center pt-4 gap-1">
          <span className="inline-flex items-center gap-1 text-label font-bold text-ink-soft uppercase tracking-wide bg-surface rounded-full px-2.5 py-1 shadow-sm border border-divider">
            <Plane className="w-3 h-3" /> On leave
          </span>
          <span className="text-label font-semibold text-ink-muted bg-surface/80 rounded-control px-1.5 py-0.5">{leave.reason}</span>
        </div>
      )}
      {/* blocked time — diagonal stripes + reason */}
      {blocks.map((b) => (
        <div
          key={b.id}
          style={{ top: topPx(b.startMin), height: (b.durationMin / 60) * HOUR_PX - 2 }}
          className="absolute left-0.5 right-0.5 rounded-control border border-divider bg-[repeating-linear-gradient(45deg,var(--surface-hover),var(--surface-hover)_6px,var(--border-strong)_6px,var(--border-strong)_12px)] px-2 py-1 overflow-hidden pointer-events-none"
        >
          <div className="text-label font-bold text-ink-muted truncate">{b.reason}</div>
          <div className="text-label text-ink-muted">Blocked</div>
        </div>
      ))}

      {/* events */}
      {laid.map((item) => {
        const past = isBefore(day.date, new Date(2026, 6, 3)) || (isToday && item.appt.startMin + item.appt.durationMin <= nowMinutes);
        return (
          <EventBlock
            key={item.appt.id}
            item={item}
            role={role}
            dimmed={hasSearch && !matches(item.appt, search)}
            past={past}
            onClick={() => onApptClick(item.appt)}
            onLong={() => onLongPress(item.appt)}
          />
        );
      })}

      {/* now line */}
      {isToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: topPx(nowMinutes) }}>
          <div className="relative border-t-2 border-danger">
            <span className="absolute -left-[3px] -top-[5px] w-2.5 h-2.5 rounded-full bg-danger-ink ring-2 ring-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export function MyScheduleGrid({ role, view, weekDays, nowMinutes, layers, schedule, blockedTime, leaves, search, onApptClick, onLongPress }: {
  role: ScheduleRole; view: "week" | "day"; weekDays: WeekDay[]; nowMinutes: number; layers: LayerState;
  schedule: WeekSchedule; blockedTime: BlockedTime[]; leaves: LeaveItem[]; search: string;
  onApptClick: (a: Appt) => void; onLongPress: (a: Appt) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
  const gridHeight = ((DAY_END - DAY_START) / 60) * HOUR_PX;
  const anyToday = weekDays.some((d) => d.isToday);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = ((SCROLL_TO - DAY_START) / 60) * HOUR_PX;
  }, [view]);

  return (
    <div className="rounded-card bg-surface flex flex-col h-full min-h-0 overflow-hidden">
      {/* column headers */}
      <div className="flex border-b border-divider bg-surface-page shrink-0 pl-14">
        {weekDays.map((d) => (
          <div key={d.date.toISOString()} className={`flex-1 px-2 py-2 text-center border-l border-divider min-w-0 ${d.isToday ? "bg-surface-hover/70" : ""}`}>
            {view === "week" ? (
              <>
                <div className="text-label font-bold text-ink-muted uppercase">{format(d.date, "EEE")}</div>
                <div className={`text-sm font-bold tabular-nums ${d.isToday ? "text-ink-soft" : "text-ink-soft"}`}>{format(d.date, "d")}</div>
              </>
            ) : (
              <div className="text-sm font-bold text-ink-soft">{format(d.date, "EEEE, d MMM")}</div>
            )}
          </div>
        ))}
      </div>

      {/* scroll body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* gutter */}
          <div className="w-14 shrink-0 relative border-r border-divider bg-surface-page/40">
            <span className="absolute left-1 top-1 text-label font-bold text-ink-muted">GMT+3</span>
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-label font-semibold text-ink-muted tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
            {anyToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
              <span className="absolute right-1.5 z-20 text-label font-bold text-white bg-danger-ink rounded-control px-1 py-[1px] tabular-nums" style={{ top: topPx(nowMinutes) - 7 }}>
                {minToClock(nowMinutes)}
              </span>
            )}
          </div>

          {/* columns */}
          <div className="flex-1 relative">
            {/* hour gridlines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-divider" style={{ top: i * HOUR_PX }} />
            ))}
            {/* faint now line across all columns */}
            {anyToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
              <div className="absolute left-0 right-0 border-t border-danger/30 pointer-events-none z-10" style={{ top: topPx(nowMinutes) }} />
            )}
            <div className="flex h-full">
              {weekDays.map((d) => (
                <DayColumn
                  key={d.date.toISOString()}
                  day={d}
                  role={role}
                  layers={layers}
                  schedule={schedule}
                  blockedTime={blockedTime}
                  leaves={leaves}
                  search={search}
                  nowMinutes={nowMinutes}
                  isToday={d.isToday}
                  onApptClick={onApptClick}
                  onLongPress={onLongPress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
