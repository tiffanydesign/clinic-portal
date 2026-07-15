// The time grid for the My Schedule view — week (7 cols) or day (1 wide col).
// Renders working-hours shading, the read-only availability layer (non-working
// bands, blocked time, approved leave), the now line (bold on today's column),
// and event blocks laid out with the collision algorithm so overlaps sit side
// by side instead of colliding.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, isBefore, isSameDay } from "date-fns";
import { Video, Plane } from "lucide-react";
import { Appt, HOUR_PX, minToClock, apptBlockClass, apptStatusDotClass } from "./scheduleData";
import { WeekSchedule, BlockedTime, LeaveItem } from "../availability/availabilityData";
import {
  ScheduleRole, WeekDay, LayerState, LaidItem, layoutDay, apptVisible, typeShort, journeyStepLabel,
  nonWorkingBands, blocksForDate, leaveForDate, DAY_START, DAY_END, SCROLL_TO,
} from "./myScheduleData";

const GRID_MIN_H = 44; // touch-friendly floor for event blocks
const topPx = (min: number) => ((min - DAY_START) / 60) * HOUR_PX;
const matches = (a: Appt, q: string) => a.patient.name.toLowerCase().includes(q.trim().toLowerCase());

function longPress(handler: () => void) {
  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(handler, 500); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  return { onTouchStart: start, onTouchEnd: cancel, onTouchMove: cancel, onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); handler(); } };
}

function EventBlock({ item, role, dimmed, past, onClick, onLong }: {
  item: Extract<LaidItem, { kind: "appt" }>; role: ScheduleRole; dimmed: boolean; past: boolean; onClick: () => void; onLong: () => void;
}) {
  const a = item.appt;
  const height = Math.max(GRID_MIN_H, (a.durationMin / 60) * HOUR_PX) - 2;
  const gap = 3;
  const step = journeyStepLabel(a);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      {...longPress(onLong)}
      style={{
        top: topPx(a.startMin), height,
        left: `calc(${(item.lane / item.lanes) * 100}% + 1px)`,
        width: `calc(${100 / item.lanes}% - ${gap}px)`,
      }}
      className={`absolute px-2 py-1 text-left overflow-hidden cursor-pointer transition-all hover:shadow-md hover:z-10 ${apptBlockClass(a.status)} ${past ? "opacity-55" : ""} ${dimmed ? "opacity-25" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(a.status)}`} />
        {a.isVideo && <Video className="w-3 h-3 text-cyan-600 shrink-0" />}
        <span className="text-[11px] font-bold text-gray-800 truncate">{a.patient.name}</span>
      </div>
      {height >= 34 && (
        <div className="text-[10px] text-gray-500 truncate">{typeShort(a.type)} · {a.durationMin}m</div>
      )}
      {height >= 50 && step && role === "Nurse" && (
        <div className="text-[10px] font-semibold text-orange-700 truncate mt-0.5">→ {step}</div>
      )}
      {height >= 50 && a.isVideo && role === "Clinician" && (
        <div className="text-[10px] font-semibold text-cyan-700 truncate mt-0.5">Video · ready to join</div>
      )}
    </div>
  );
}

function DayColumn({ day, role, layers, schedule, blockedTime, leaves, search, nowMinutes, isToday, onApptClick, onLongPress, onMore }: {
  day: WeekDay; role: ScheduleRole; layers: LayerState; schedule: WeekSchedule; blockedTime: BlockedTime[]; leaves: LeaveItem[];
  search: string; nowMinutes: number; isToday: boolean; onApptClick: (a: Appt) => void; onLongPress: (a: Appt) => void;
  onMore: (x: number, y: number, items: Appt[]) => void;
}) {
  const visible = day.appts.filter((a) => apptVisible(a, layers));
  const laid = layoutDay(visible);
  const leave = layers.availability ? leaveForDate(day.date, leaves) : null;
  const bands = layers.availability ? nonWorkingBands(day.date, schedule) : [];
  const blocks = layers.availability ? blocksForDate(day.date, blockedTime) : [];
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex-1 relative border-l border-gray-200 min-w-0">
      {/* non-working shading */}
      {bands.map(([s, e], i) => (
        <div key={`nw-${i}`} className="absolute left-0 right-0 bg-gray-100/70 pointer-events-none" style={{ top: topPx(s), height: ((e - s) / 60) * HOUR_PX }} />
      ))}
      {/* approved leave — full grey wash */}
      {leave && (
        <div className="absolute inset-0 bg-gray-200/70 pointer-events-none flex flex-col items-center pt-8 gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 uppercase tracking-wide bg-white rounded-full px-2.5 py-1 shadow-sm border border-gray-200">
            <Plane className="w-3 h-3" /> On leave
          </span>
          <span className="text-[10px] font-semibold text-gray-500 bg-white/80 rounded px-1.5 py-0.5">{leave.reason}</span>
        </div>
      )}
      {/* blocked time — diagonal stripes + reason */}
      {blocks.map((b) => (
        <div
          key={b.id}
          style={{ top: topPx(b.startMin), height: (b.durationMin / 60) * HOUR_PX - 2 }}
          className="absolute left-0.5 right-0.5 rounded-md border border-gray-300 bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_6px,#e5e7eb_6px,#e5e7eb_12px)] px-2 py-1 overflow-hidden pointer-events-none"
        >
          <div className="text-[10px] font-bold text-gray-500 truncate">{b.reason}</div>
          <div className="text-[9px] text-gray-400">Blocked</div>
        </div>
      ))}

      {/* events */}
      {laid.map((item, idx) => {
        if (item.kind === "more") {
          return (
            <button
              key={`more-${idx}`}
              onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onMore(r.left, r.bottom, item.hidden); }}
              style={{
                top: topPx(item.startMin), height: Math.max(GRID_MIN_H, (item.durationMin / 60) * HOUR_PX) - 2,
                left: `calc(${(item.lane / item.lanes) * 100}% + 1px)`, width: `calc(${100 / item.lanes}% - 3px)`,
              }}
              className="absolute rounded-lg bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              +{item.hidden.length} more
            </button>
          );
        }
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
          <div className="relative border-t-2 border-red-500">
            <span className="absolute -left-[3px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function MorePopover({ x, y, items, onPick, onClose }: { x: number; y: number; items: Appt[]; onPick: (a: Appt) => void; onClose: () => void }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="fixed z-50 w-60 bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-72 overflow-y-auto" style={{ top: Math.min(y + 4, window.innerHeight - 260), left: Math.min(x, window.innerWidth - 250) }}>
        {items.map((a) => (
          <button key={a.id} onClick={() => { onClose(); onPick(a); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(a.status)}`} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">{a.patient.name}</div>
              <div className="text-xs text-gray-500">{minToClock(a.startMin)} · {typeShort(a.type)}</div>
            </div>
          </button>
        ))}
      </div>
    </>,
    document.body
  );
}

export function MyScheduleGrid({ role, view, weekDays, nowMinutes, layers, schedule, blockedTime, leaves, search, onApptClick, onLongPress }: {
  role: ScheduleRole; view: "week" | "day"; weekDays: WeekDay[]; nowMinutes: number; layers: LayerState;
  schedule: WeekSchedule; blockedTime: BlockedTime[]; leaves: LeaveItem[]; search: string;
  onApptClick: (a: Appt) => void; onLongPress: (a: Appt) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState<{ x: number; y: number; items: Appt[] } | null>(null);
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
  const gridHeight = ((DAY_END - DAY_START) / 60) * HOUR_PX;
  const anyToday = weekDays.some((d) => d.isToday);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = ((SCROLL_TO - DAY_START) / 60) * HOUR_PX;
  }, [view]);

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* column headers */}
      <div className="flex border-b border-gray-200 bg-gray-50 shrink-0 pl-14">
        {weekDays.map((d) => (
          <div key={d.date.toISOString()} className={`flex-1 px-2 py-2 text-center border-l border-gray-200 min-w-0 ${d.isToday ? "bg-slate-100/70" : ""}`}>
            {view === "week" ? (
              <>
                <div className="text-[10px] font-bold text-gray-400 uppercase">{format(d.date, "EEE")}</div>
                <div className={`text-sm font-bold tabular-nums ${d.isToday ? "text-slate-700" : "text-gray-700"}`}>{format(d.date, "d")}</div>
              </>
            ) : (
              <div className="text-sm font-bold text-gray-700">{format(d.date, "EEEE, d MMM")}</div>
            )}
          </div>
        ))}
      </div>

      {/* scroll body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* gutter */}
          <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/40">
            <span className="absolute left-1 top-1 text-[9px] font-bold text-gray-400">GMT+3</span>
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-[10px] font-semibold text-gray-500 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
            {anyToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
              <span className="absolute right-1.5 z-20 text-[9px] font-bold text-white bg-red-500 rounded px-1 py-[1px] tabular-nums" style={{ top: topPx(nowMinutes) - 7 }}>
                {minToClock(nowMinutes)}
              </span>
            )}
          </div>

          {/* columns */}
          <div className="flex-1 relative">
            {/* hour gridlines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />
            ))}
            {/* faint now line across all columns */}
            {anyToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
              <div className="absolute left-0 right-0 border-t border-red-200 pointer-events-none z-10" style={{ top: topPx(nowMinutes) }} />
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
                  onMore={(x, y, items) => setMore({ x, y, items })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {more && <MorePopover x={more.x} y={more.y} items={more.items} onPick={onApptClick} onClose={() => setMore(null)} />}
    </div>
  );
}
