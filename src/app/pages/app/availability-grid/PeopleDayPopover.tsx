// Per-day detail popover for the People tab — the one click-triggered
// behavior the spec explicitly calls out to preserve unchanged from the old
// Team Availability page. Positioned from the clicked cell's own bounding
// rect (not FloatingPopover's ref pattern) since the cell that was clicked
// is a transient grid item, not a stable anchor element.
import React from "react";
import type { StaffMember, DaySchedule } from "./peopleAvailabilityData";

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function availabilityWindows(blocks?: DaySchedule["blocks"]): { start: string; end: string }[] {
  if (!blocks || blocks.length === 0) return [];
  const ranges = blocks.map((b) => [toMin(b.start), toMin(b.end)] as [number, number]).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged.map(([s, e]) => ({ start: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, end: `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}` }));
}

export function PeopleDayPopover({
  staff, dayLabel, day, currentUserRole, x, y, onClose,
}: {
  staff: StaffMember;
  dayLabel: string;
  day: DaySchedule;
  currentUserRole: string;
  x: number;
  y: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        className="absolute bg-surface border border-divider rounded-card shadow-xl w-[320px] text-ink -translate-x-1/2"
        style={{
          left: Math.min(Math.max(x, 170), window.innerWidth - 170),
          top: Math.min(y + 8, window.innerHeight - 340),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-divider bg-surface-page rounded-t-lg">
          <div className="font-bold text-sm text-ink mb-1">{staff.name} · {dayLabel}</div>
          <span className="text-label font-medium text-ink-muted">{staff.role}</span>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-b-lg">
          <div className="p-4 border-b border-divider">
            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Scheduled Availability</h4>
            <div className="space-y-2">
              {availabilityWindows(day.blocks).map((w, idx) => (
                <div key={idx} className="flex items-center text-sm font-semibold text-ink">
                  <div className="w-2 h-2 rounded-full mr-2 bg-success" />
                  {w.start} – {w.end}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Booked Appointments</h4>
            <div className="space-y-2">
              {(!day.appointments || day.appointments.length === 0) ? (
                <div className="text-sm text-ink-muted italic">No appointments booked</div>
              ) : (
                day.appointments.map((appt, idx) => {
                  const isOwnPatient = staff.name.includes("Ebru");
                  const showNames = currentUserRole === "Admin" || currentUserRole === "Reception" || (currentUserRole === "Clinician" && isOwnPatient);
                  return (
                    <div key={idx} className="flex items-center text-sm text-ink-soft">
                      <div className="w-2 h-2 rounded-full bg-ink-muted mr-2 shrink-0" />
                      <span className="font-medium mr-2">{appt.start} – {appt.end}</span>
                      <span className="text-ink-muted truncate">· {showNames ? appt.patient : "Patient"}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
