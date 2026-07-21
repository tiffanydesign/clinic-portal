import React from "react";
import { Video } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import {
  Appt, WeekAppt, ANCHOR_DATE,
  DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./scheduleData";

const MIN_MIN = DAY_START_HOUR * 60;

// Read-only weekly overview (Admin / Clinician). Clicking a block opens the drawer.
// `weekStart` is whatever Monday the toolbar's date picker has navigated to —
// headers and the "today" highlight/now-line are derived from it, so the grid
// stays honest about which week it's actually showing.
export function WeekGrid({ weekStart, weekAppts, onApptClick }: { weekStart: Date; weekAppts: WeekAppt[]; onApptClick: (appt: Appt) => void }) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - MIN_MIN) / 60) * HOUR_PX;
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="border border-divider rounded-card shadow-md bg-surface flex flex-col h-full min-h-0 overflow-hidden">
      {/* day headers */}
      <div className="flex border-b border-divider bg-gradient-to-b from-surface-page to-surface-page/50 shrink-0 pl-14 relative z-10 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {dates.map((date, i) => {
          const isToday = isSameDay(date, ANCHOR_DATE);
          return (
            <div key={i} className={`flex-1 px-2 py-2.5 text-center border-l border-divider ${isToday ? "bg-surface-hover/70" : ""}`}>
              <div className={`text-xs font-bold ${isToday ? "text-ink-soft" : "text-ink-soft"}`}>{format(date, "EEE")}</div>
              <div className={`text-label tabular-nums ${isToday ? "inline-flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-surface-sunken text-ink-soft font-bold" : "text-ink-muted mt-0.5"}`}>{format(date, "d")}</div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          <div className="w-14 shrink-0 relative border-r border-divider bg-surface-page/40">
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-hover/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-label font-semibold text-ink-muted tabular-nums" style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-page/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => <div key={h} className="absolute left-0 right-0 border-t border-divider" style={{ top: i * HOUR_PX }} />)}
            <div className="flex h-full">
              {dates.map((date, dayIdx) => {
                const dayItems = weekAppts.filter((a) => a.dayIndex === dayIdx);
                const isToday = isSameDay(date, ANCHOR_DATE);
                return (
                <div key={dayIdx} className={`flex-1 relative border-l border-divider ${isToday ? "bg-surface-page/50" : ""}`}>
                  {isToday && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none border-t-2 border-danger shadow-[0_0_6px_rgba(239,68,68,0.35)]" style={{ top: nowTop }}>
                      <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-danger-ink ring-2 ring-white" />
                    </div>
                  )}
                  {dayItems.map((a) => {
                    const top = ((a.startMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = blockHeightPx(a.durationMin, gapToNext(dayItems, a.startMin), 26);
                    return (
                      <button key={a.id} onClick={() => onApptClick(a)} style={{ top, height }}
                        className={`absolute left-0.5 right-0.5 px-1.5 py-0.5 text-left overflow-hidden hover:shadow-md transition-shadow ${apptBlockClass(a.status)}`}>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(a.status)}`} />
                          {a.isVideo && <Video className="w-2.5 h-2.5 text-ink-muted shrink-0" />}
                          <span className="text-label font-bold text-ink truncate">{a.patient.name}</span>
                        </div>
                        {height >= 30 && <div className="text-label text-ink-muted truncate pl-3">{minToClock(a.startMin)}</div>}
                      </button>
                    );
                  })}
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
