import React from "react";
import { DAYS, WeekSchedule, timeToMinutes } from "./availabilityData";

const PREVIEW_START_MIN = 6 * 60; // 6:00am
const PREVIEW_END_MIN = 21 * 60; // 9:00pm
const PREVIEW_SPAN = PREVIEW_END_MIN - PREVIEW_START_MIN;

function dayAbbrev(day: string): string {
  return day.slice(0, 3);
}

// One time-proportional strip per day — position along the strip encodes
// time of day, the same visual language as a real calendar, just collapsed
// to a single row per day so a full week still fits this panel's narrow
// (35%) column. Reads `schedule` directly (the left side's live, unsaved
// draft) rather than the last-saved copy, so toggling a day or dragging a
// slot's time here updates instantly — an actual preview of what Save will
// apply, not a snapshot of what's already applied.
export function WeeklyAvailabilityPreview({ schedule }: { schedule: WeekSchedule }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Weekly Preview</label>
      <div className="bg-surface rounded-card p-3">
        <div className="flex pl-9 mb-1.5 text-label font-semibold text-ink-muted">
          <span className="flex-1">6am</span>
          <span className="flex-1 text-center">12pm</span>
          <span>9pm</span>
        </div>
        <div className="space-y-1.5">
          {DAYS.map((day) => {
            const config = schedule[day];
            return (
              <div key={day} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-label font-bold text-ink-muted">{dayAbbrev(day)}</span>
                <div className="flex-1 h-4 bg-surface-hover rounded-control relative overflow-hidden">
                  {!config.active ? (
                    <span className="absolute inset-0 flex items-center justify-center text-overline text-ink-muted">Off</span>
                  ) : (
                    config.slots.map((slot, idx) => {
                      const s = Math.max(timeToMinutes(slot.start), PREVIEW_START_MIN);
                      const e = Math.min(timeToMinutes(slot.end), PREVIEW_END_MIN);
                      if (e <= s) return null;
                      const left = ((s - PREVIEW_START_MIN) / PREVIEW_SPAN) * 100;
                      const width = ((e - s) / PREVIEW_SPAN) * 100;
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 bg-ink-muted rounded-control"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${slot.start} – ${slot.end}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
