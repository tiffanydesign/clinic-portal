import React from "react";
import { Info, Trash2 } from "lucide-react";
import { BlockedTime, minToLabel } from "./availabilityData";

// Blocked Time — a one-off carve-out from a normal working day (a meeting,
// training, paperwork). Applies instantly (no approval); hard-blocks new
// bookings over the window.
export function BlockedTimeSection({ blocks, onAdd, onRemove }: {
  blocks: BlockedTime[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-surface rounded-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-ink">Blocked Time</h3>
        <span className="px-2 py-0.5 bg-success/10 border border-success/30 text-success-ink text-overline rounded-full">Applies instantly</span>
        <div className="group relative ml-auto">
          <Info className="w-4 h-4 text-ink-muted cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-ink text-white text-xs p-3 rounded-control shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Carve a block out of a normal working day (meeting, training, admin). For a whole day off, use Leave instead.
          </div>
        </div>
      </div>
      <p className="text-sm text-ink-muted mb-4">Block out part of a working day. No booking can be made during a blocked window.</p>

      {blocks.length === 0 ? (
        <p className="text-sm text-ink-muted italic mb-4">No blocked time yet.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {blocks.map((b) => (
            <div key={b.id} className="flex justify-between items-start border-b border-divider pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink tabular-nums">{b.date}</div>
                <div className="text-xs text-ink-soft tabular-nums">{minToLabel(b.startMin)}–{minToLabel(b.startMin + b.durationMin)} · {b.reason}</div>
              </div>
              <button
                onClick={() => onRemove(b.id)}
                title="Remove blocked time"
                className="p-1.5 rounded-control text-ink-muted hover:text-danger-ink hover:bg-danger/10 transition-colors shrink-0 touch-extend"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAdd} className="w-full py-2.5 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
        + Add Blocked Time
      </button>

      {/* Prototype limitation: personal Schedule + Preview reflect Blocked Time;
          the shared Team Availability grid uses a separate mock and is not synced. */}
      <p className="text-label text-ink-muted mt-3">Reflected in your Schedule &amp; Preview. Not yet mirrored in the Team Availability grid (demo).</p>
    </div>
  );
}
