import React, { useEffect, useRef } from "react";
import { Wrench, CalendarClock } from "lucide-react";
import type { Room } from "../clinic-settings/roomsData";
import type { Appt } from "../dashboard/dashboardData";

// Click-a-grid-cell popover for the Rooms tab — mirrors the calendar's
// EmptySlotPopover.tsx shell (fixed position near the click, click-outside +
// Escape to close). Shows that room-day's real booked appointments, plus a
// Block time entry point rendered only for Admin (Reception sees the same
// list, read-only — no create/edit affordance anywhere in this popover).
export function RoomDayPopover({
  room, dateLabel, appts, canBlock, x, y, onClose, onBlockTime,
}: {
  room: Room;
  dateLabel: string;
  appts: Appt[];
  canBlock: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onBlockTime: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 300);
  const top = Math.min(y, window.innerHeight - 320);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${room.name} — ${dateLabel}`}
      className="fixed z-50 w-[288px] bg-surface border border-divider rounded-card shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
      style={{ left, top }}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-card bg-surface-hover text-ink-soft flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink leading-tight truncate">{room.name}</div>
          <div className="text-xs text-ink-muted mt-0.5">{dateLabel}</div>
        </div>
      </div>

      {appts.length === 0 ? (
        <p className="text-xs text-ink-muted italic mb-1">Nothing booked.</p>
      ) : (
        <div className="space-y-1.5 mb-1 max-h-40 overflow-y-auto">
          {appts.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-xs bg-surface-page rounded-control px-2.5 py-1.5">
              <span className="font-semibold text-ink truncate">{a.patient.name}</span>
              <span className="text-ink-muted tabular-nums shrink-0">{a.timeLabel}</span>
            </div>
          ))}
        </div>
      )}

      {canBlock && (
        <button
          onClick={onBlockTime}
          className="w-full mt-3 min-h-11 flex items-center justify-center gap-1.5 px-3 py-2 rounded-control text-xs font-bold text-ink-soft border border-divider bg-surface hover:bg-surface-hover transition-colors"
        >
          <Wrench className="w-3.5 h-3.5" /> Block time
        </button>
      )}
    </div>
  );
}
