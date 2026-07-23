// Compact month calendar for the schedule's left rail. Two-way synced with the
// main grid: clicking a day drives the right view; the shown month follows the
// selected date. Days that hold appointments get a dot marker.
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from "date-fns";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function MiniCalendar({ selectedDate, today, onSelectDate, hasApptsOn }: {
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  hasApptsOn: (d: Date) => boolean;
}) {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));

  // Follow the selected date into its month when the grid pages across a boundary.
  useEffect(() => {
    setViewMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // Trim the trailing all-next-month week when the month only needs 5 rows.
  const rows = days.slice(0, endOfMonth(viewMonth) < days[35] ? 35 : 42);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-ink">{format(viewMonth, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setViewMonth((m) => subMonths(m, 1))} aria-label="Previous month" className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-control transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMonth((m) => addMonths(m, 1))} aria-label="Next month" className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-control transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-label font-bold text-ink-muted text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {rows.map((d) => {
          const inMonth = isSameMonth(d, viewMonth);
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDate);
          const hasAppts = inMonth && hasApptsOn(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              className={`relative aspect-square flex items-center justify-center rounded-full text-xs transition-colors ${
                isSelected
                  ? "bg-ink text-white font-bold"
                  : isToday
                  ? "text-ink-soft font-bold ring-1 ring-info"
                  : inMonth
                  ? "text-ink-soft hover:bg-surface-hover"
                  : "text-ink-muted hover:bg-surface-hover"
              }`}
            >
              {d.getDate()}
              {hasAppts && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-surface" : "bg-ink-muted"}`} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
