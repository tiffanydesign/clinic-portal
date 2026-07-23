import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarOff, Plane, Clock3 } from "lucide-react";
import {
  DAYS, WeekSchedule, BlockedTime, LeaveItem,
  timeToMinutes, blockedTimeForDate, leaveForDate,
} from "./availabilityData";

// Same demo anchor "today" used across the app (scheduleData.ts's
// ANCHOR_DATE / notificationsData.ts's MOCK_TODAY) — Fri 3 Jul 2026.
const ANCHOR = new Date(2026, 6, 3);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const GRID_START_MIN = 6 * 60; // 6:00am
const GRID_END_MIN = 21 * 60; // 9:00pm
const GRID_SPAN = GRID_END_MIN - GRID_START_MIN;
const GRID_HEIGHT = 112; // px — the "mini" in mini week calendar
const NOON = timeToMinutes("1:00pm"); // same AM/PM cutoff as checkLeaveConflicts

function pct(min: number): number {
  const clamped = Math.max(GRID_START_MIN, Math.min(GRID_END_MIN, min));
  return ((clamped - GRID_START_MIN) / GRID_SPAN) * 100;
}

function startOfWeekSun(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
}
function addDaysLocal(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function fmtDateStr(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShort(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function leaveRangeStyle(duration: LeaveItem["duration"]): { top: string; height: string } {
  if (duration === "Morning") return { top: "0%", height: `${pct(NOON)}%` };
  if (duration === "Afternoon") return { top: `${pct(NOON)}%`, height: `${100 - pct(NOON)}%` };
  return { top: "0%", height: "100%" };
}

const HATCH_STYLE: React.CSSProperties = {
  backgroundImage: "repeating-linear-gradient(45deg, var(--ink-400) 0px, var(--ink-400) 2px, transparent 2px, transparent 6px)",
};

// Legend row — icons carry the two EXCEPTION states (Blocked / Leave) so
// colour is never the only signal; Working/Off (the default, routine states)
// stay a plain swatch with no icon, per "don't decorate the normal state".
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-ink-muted mb-3">
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-[3px] bg-surface border border-divider" /> Working</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-[3px] bg-surface-hover" /> Off</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-[3px]" style={HATCH_STYLE} /> <CalendarOff className="w-3 h-3 text-warning-ink" /> Blocked</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-[3px] bg-special/40" /> <Plane className="w-3 h-3 text-special-ink" /> Leave</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-[3px] border-2 border-dashed border-special" /> <Clock3 className="w-3 h-3 text-special-ink" /> Pending</span>
    </div>
  );
}

// Read-only synthesis of everything that decides whether the signed-in
// person is bookable on a given day, shown as a compact week calendar (7
// vertical day-columns, 6am-9pm) rather than a linear list — a real calendar
// shape reads faster than a table of text. Live (possibly unsaved) Weekly
// Hours draft, Blocked Time carve-outs, and Leave all layer onto the same
// grid so "what's actually bookable" is one glance, not three lookups.
export function AvailabilityPreview({ savedSchedule, localSchedule, blockedTime, leaves }: {
  savedSchedule: WeekSchedule;
  localSchedule: WeekSchedule;
  blockedTime: BlockedTime[];
  leaves: LeaveItem[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDaysLocal(startOfWeekSun(ANCHOR), weekOffset * 7);
  const weekEnd = addDaysLocal(weekStart, 6);

  return (
    <div className="bg-surface rounded-card p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-ink">Availability Preview</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" className="p-1.5 text-ink-muted hover:text-ink-soft rounded-control hover:bg-surface-hover transition-colors touch-extend">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-ink-soft tabular-nums w-24 text-center">{fmtShort(weekStart)} – {fmtShort(weekEnd)}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" className="p-1.5 text-ink-muted hover:text-ink-soft rounded-control hover:bg-surface-hover transition-colors touch-extend">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-label font-bold text-ink-soft hover:underline ml-1">Today</button>
          )}
        </div>
      </div>
      <p className="text-sm text-ink-muted mb-3">Mini week calendar — what's actually bookable, combined.</p>

      <Legend />

      <div className="flex gap-1.5">
        {/* Shared time-axis rail (once, not per column) */}
        <div className="w-6 shrink-0 relative" style={{ height: GRID_HEIGHT }}>
          <span className="absolute -top-0.5 text-overline text-ink-muted">6a</span>
          <span className="absolute text-overline text-ink-muted" style={{ top: "50%", transform: "translateY(-50%)" }}>1p</span>
          <span className="absolute bottom-0 text-overline text-ink-muted">9p</span>
        </div>

        {Array.from({ length: 7 }, (_, i) => {
          const date = addDaysLocal(weekStart, i);
          const dateStr = fmtDateStr(date);
          const dayName = DAYS[date.getDay()];
          const draftCfg = localSchedule[dayName];
          const savedCfg = savedSchedule[dayName];
          const dirty = JSON.stringify(draftCfg) !== JSON.stringify(savedCfg);
          const blocks = blockedTimeForDate(dateStr, blockedTime);
          const leave = leaveForDate(dateStr, leaves);
          const isToday = dateStr === fmtDateStr(ANCHOR);

          // One status icon per day (priority Leave > Blocked), shown above
          // the column so the tiny vertical bar itself stays uncluttered.
          const StatusIcon = leave ? Plane : blocks.length > 0 ? CalendarOff : null;
          const statusColor = leave ? "text-special-ink" : "text-warning-ink";

          return (
            <div key={dateStr} className="flex-1 min-w-0 flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-label font-bold ${isToday ? "text-ink" : "text-ink-muted"}`}>{dayName.slice(0, 3)}</span>
              </div>
              <span className="text-label text-ink-muted tabular-nums">{date.getDate()}</span>
              <div className="h-3 flex items-center justify-center">
                {StatusIcon && <StatusIcon className={`w-3 h-3 ${statusColor}`} />}
              </div>

              <div className="w-full rounded-control relative overflow-hidden bg-surface-hover" style={{ height: GRID_HEIGHT }} title={dateStr}>
                {draftCfg.active && draftCfg.slots.map((slot, idx) => {
                  const s = timeToMinutes(slot.start);
                  const e = timeToMinutes(slot.end);
                  const top = pct(s);
                  const height = pct(e) - top;
                  if (height <= 0) return null;
                  return (
                    <div
                      key={idx}
                      className={`absolute left-0 right-0 bg-surface border ${dirty ? "border-dashed border-border-strong opacity-60" : "border-divider"}`}
                      style={{ top: `${top}%`, height: `${height}%` }}
                      title={`${slot.start} – ${slot.end}${dirty ? " (unsaved)" : ""}`}
                    />
                  );
                })}

                {blocks.map((b) => {
                  const top = pct(b.startMin);
                  const height = pct(b.startMin + b.durationMin) - top;
                  if (height <= 0) return null;
                  return (
                    <div
                      key={b.id}
                      className="absolute left-0 right-0"
                      style={{ top: `${top}%`, height: `${height}%`, opacity: 0.6, ...HATCH_STYLE }}
                      title={`Blocked: ${b.reason}`}
                    />
                  );
                })}

                {leave && (
                  <div
                    className={leave.status === "Approved" ? "absolute left-0 right-0 bg-special/40" : "absolute left-0 right-0 border-2 border-dashed border-special rounded-control"}
                    style={leaveRangeStyle(leave.duration)}
                    title={`${leave.status === "Approved" ? "Leave" : "Leave (pending)"} — ${leave.reason === "Other" ? (leave.reasonOther ?? "Other") : leave.reason}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
