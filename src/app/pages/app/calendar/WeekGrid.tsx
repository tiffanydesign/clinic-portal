import React from "react";
import { Video } from "lucide-react";
import {
  Appt, WeekAppt, WEEK_DAYS, WEEK_DATES, TODAY_WEEK_INDEX,
  DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES, apptBlockClass, minToClock,
} from "./scheduleData";

const MIN_MIN = DAY_START_HOUR * 60;

// Read-only weekly overview (Admin / Clinician). Clicking a block opens the drawer.
export function WeekGrid({ weekAppts, onApptClick }: { weekAppts: WeekAppt[]; onApptClick: (appt: Appt) => void }) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - MIN_MIN) / 60) * HOUR_PX;

  return (
    <div className="border border-gray-300 rounded bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* day headers */}
      <div className="flex border-b border-gray-200 shrink-0 pl-14">
        {WEEK_DAYS.map((d, i) => (
          <div key={d} className={`flex-1 px-2 py-2 text-center border-l border-gray-100 ${i === TODAY_WEEK_INDEX ? "bg-slate-50" : ""}`}>
            <div className={`text-xs font-bold ${i === TODAY_WEEK_INDEX ? "text-slate-700" : "text-gray-700"}`}>{d}</div>
            <div className={`text-[10px] ${i === TODAY_WEEK_INDEX ? "text-slate-500 font-bold" : "text-gray-400"}`}>{WEEK_DATES[i]}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          <div className="w-14 shrink-0 relative border-r border-gray-200">
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-[10px] text-gray-400" style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            {hours.map((h, i) => <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />)}
            <div className="flex h-full">
              {WEEK_DAYS.map((d, dayIdx) => (
                <div key={d} className={`flex-1 relative border-l border-gray-100 ${dayIdx === TODAY_WEEK_INDEX ? "bg-slate-50/40" : ""}`}>
                  {dayIdx === TODAY_WEEK_INDEX && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none border-t border-red-500" style={{ top: nowTop }}>
                      <span className="absolute -left-[3px] -top-[4px] w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  )}
                  {weekAppts.filter((a) => a.dayIndex === dayIdx).map((a) => {
                    const top = ((a.startMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = Math.max(18, (a.durationMin / 60) * HOUR_PX - 2);
                    return (
                      <button key={a.id} onClick={() => onApptClick(a)} style={{ top, height }}
                        className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-left overflow-hidden hover:shadow-md ${apptBlockClass(a.status)}`}>
                        <div className="flex items-center gap-1 min-w-0">
                          {a.isVideo && <Video className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                          <span className="text-[10px] font-bold text-gray-800 truncate">{a.patient.name}</span>
                        </div>
                        {height >= 32 && <div className="text-[9px] text-gray-500 truncate">{minToClock(a.startMin)}</div>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
