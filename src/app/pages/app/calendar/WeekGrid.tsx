import React from "react";
import { Video } from "lucide-react";
import {
  Appt, WeekAppt, WEEK_DAYS, WEEK_DATES, TODAY_WEEK_INDEX,
  DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./scheduleData";

const MIN_MIN = DAY_START_HOUR * 60;

// Read-only weekly overview (Admin / Clinician). Clicking a block opens the drawer.
export function WeekGrid({ weekAppts, onApptClick }: { weekAppts: WeekAppt[]; onApptClick: (appt: Appt) => void }) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - MIN_MIN) / 60) * HOUR_PX;

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* day headers */}
      <div className="flex border-b border-gray-200 bg-gray-50/70 shrink-0 pl-14">
        {WEEK_DAYS.map((d, i) => (
          <div key={d} className={`flex-1 px-2 py-2.5 text-center border-l border-gray-100 ${i === TODAY_WEEK_INDEX ? "bg-slate-100/70" : ""}`}>
            <div className={`text-xs font-bold ${i === TODAY_WEEK_INDEX ? "text-slate-700" : "text-gray-600"}`}>{d}</div>
            <div className={`text-[10px] tabular-nums ${i === TODAY_WEEK_INDEX ? "inline-flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-slate-700 text-white font-bold" : "text-gray-400 mt-0.5"}`}>{WEEK_DATES[i].split(" ")[0]}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/40">
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-[10px] font-medium text-gray-400 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            {hours.map((h, i) => <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />)}
            <div className="flex h-full">
              {WEEK_DAYS.map((d, dayIdx) => {
                const dayItems = weekAppts.filter((a) => a.dayIndex === dayIdx);
                return (
                <div key={d} className={`flex-1 relative border-l border-gray-100 ${dayIdx === TODAY_WEEK_INDEX ? "bg-slate-50/50" : ""}`}>
                  {dayIdx === TODAY_WEEK_INDEX && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none border-t-2 border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]" style={{ top: nowTop }}>
                      <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
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
                          {a.isVideo && <Video className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                          <span className="text-[10px] font-bold text-gray-800 truncate">{a.patient.name}</span>
                        </div>
                        {height >= 30 && <div className="text-[9px] text-gray-500 truncate pl-3">{minToClock(a.startMin)}</div>}
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
