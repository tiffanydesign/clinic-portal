// Month view for the My Schedule surface (Nurse only — see MyScheduleView.tsx).
// A calendar-month overview, not a detail surface: each day cell shows the
// date and how many patients are on it; tapping a day drills into Day view
// for the full, non-clipped block list. This is what keeps month view free
// of any "+N more" collapsing — a small cell simply isn't the place to try
// to cram full appointment detail into.
import React from "react";
import { addDays, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MyScheduleMonthGrid({ viewMonth, selectedDate, today, countFor, onSelectDay }: {
  viewMonth: Date;
  selectedDate: Date;
  today: Date;
  countFor: (d: Date) => number;
  onSelectDay: (d: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const rows = days.slice(0, endOfMonth(viewMonth) < days[35] ? 35 : 42);

  return (
    <div className="rounded-card bg-surface flex flex-col h-full min-h-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-divider bg-surface-page shrink-0">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-label font-bold text-ink-muted uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
        {rows.map((d) => {
          const inMonth = isSameMonth(d, viewMonth);
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDate);
          const count = inMonth ? countFor(d) : 0;
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className={`flex flex-col items-start p-2 border-b border-r border-divider min-h-0 min-w-0 transition-colors text-left ${
                isSelected ? "bg-surface-page" : "hover:bg-surface-page"
              } ${!inMonth ? "bg-surface-page/40" : ""}`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold tabular-nums shrink-0 ${
                  isToday ? "bg-ink text-white" : inMonth ? "text-ink-soft" : "text-ink-muted"
                }`}
              >
                {d.getDate()}
              </span>
              {count > 0 && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-label font-bold text-ink-soft bg-surface-hover rounded-full px-2 py-0.5">
                  {count} {count === 1 ? "patient" : "patients"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
