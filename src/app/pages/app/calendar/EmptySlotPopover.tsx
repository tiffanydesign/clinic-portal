import React, { useEffect, useRef } from "react";
import { CalendarPlus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { minToClock } from "./scheduleData";

// Lightweight confirm step between "clicked an empty slot" and "the booking
// modal opens". Before this, an empty-slot click threw the full New
// Appointment modal at the operator immediately — easy to trigger by accident
// while scrolling or dragging the grid.
//
// Only ever rendered for Admin/Reception: SchedulePage returns MyScheduleView
// for Nurse/Clinician long before the grid mounts, and the grid is what calls
// onEmptyClick, so an unprivileged role has no path to a booking here.

export type EmptySlotTarget = {
  /** Column the click landed in — a room id in room-grouped view, else a clinician id. */
  colKey: string;
  startMin: number;
  /** Screen position of the click, for anchoring. */
  x: number;
  y: number;
  /** Resolved display name of the column (e.g. "Room 2", "Dr. Ebru Reis"). */
  colLabel: string;
  byRoom: boolean;
  /** True when the slot falls outside the clinician's working hours / on Blocked Time. */
  outsideHours?: boolean;
};

export function EmptySlotPopover({
  target,
  date,
  onCancel,
  onConfirm,
}: {
  target: EmptySlotTarget;
  date: Date;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside + Escape close, per spec.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    // Deferred so the very click that opened this doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  // Keep the card on screen near the click.
  const left = Math.min(target.x, window.innerWidth - 300);
  const top = Math.min(target.y, window.innerHeight - 190);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="New booking"
      className="fixed z-50 w-[272px] bg-surface border border-divider rounded-card shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
      style={{ left, top }}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-card bg-surface-hover text-ink-soft flex items-center justify-center shrink-0">
          <CalendarPlus className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink leading-tight">New booking</div>
          <div className="text-xs text-ink-muted mt-1 leading-snug">
            {format(date, "EEE d MMM")}, {minToClock(target.startMin)}
            <br />
            {target.colLabel}
          </div>
        </div>
      </div>

      {/* Soft warning — never blocks. Same rule as the toolbar's create action:
          the clinic can knowingly book outside working hours. */}
      {target.outsideHours && (
        <div className="mt-3 flex items-start gap-1.5 rounded-card bg-warning/10 border border-warning/30 px-2.5 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning-ink shrink-0 mt-px" />
          <span className="text-label font-semibold text-warning-ink leading-snug">Outside working hours</span>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="min-h-11 px-3 py-2 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="min-h-11 px-3.5 py-2 rounded-control text-xs font-bold btn-primary transition-colors shadow-sm"
        >
          Create booking
        </button>
      </div>
    </div>
  );
}
