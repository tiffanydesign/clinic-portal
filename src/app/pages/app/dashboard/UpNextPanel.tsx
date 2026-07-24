import React, { useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import type { QueueItem, CompletedItem } from "./nurseDashboardData";

function QueueRow({ item, locked, onStart }: { item: QueueItem; locked: boolean; onStart: () => void }) {
  const ready = !locked;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink truncate">{item.name}</div>
        <div className="text-xs text-ink-muted font-medium mt-0.5">{item.time} · {item.type}</div>
      </div>
      <button
        onClick={onStart}
        disabled={!ready}
        title={!ready ? "Requires next patient check-in and current journey completion." : undefined}
        className={`px-4 py-1.5 text-xs font-bold rounded-card shrink-0 transition-all ${
          ready
            ? "bg-success-ink text-white hover:bg-success-ink hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm"
            : "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
        }`}
      >
        Start
      </button>
    </div>
  );
}

// Slide-in panel listing everyone this nurse has already checked out today —
// same shell shape as AppointmentDrawer's (backdrop + right-edge slide-in),
// kept local here since it's a much simpler, single-purpose list.
function CompletedTodayDrawer({ items, onClose }: { items: CompletedItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-surface-sunken/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-[420px] bg-surface border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between shrink-0 bg-surface-page">
          <div>
            <div className="font-bold text-ink">Completed Today</div>
            <div className="text-xs text-ink-muted">{items.length} patient{items.length === 1 ? "" : "s"} checked out</div>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-ink-muted text-center">Nothing completed yet today.</div>
          ) : (
            <div className="divide-y divide-divider">
              {items.map((it, i) => (
                // Same feed-row language as the Admin Recent Activity card: a
                // neutral icon chip (colour isn't used to encode type), the
                // entity name bold in full ink, the time muted on the right.
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-8 h-8 rounded-card bg-surface-hover flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-ink-soft" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink truncate">{it.name}</div>
                    <div className="text-xs text-ink-muted">{it.type}</div>
                  </div>
                  <span className="text-xs font-medium text-ink-muted shrink-0">{it.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpNextPanel({
  queue,
  completed,
  locked,
  onStart,
}: {
  queue: QueueItem[];
  completed: CompletedItem[];
  locked: boolean;
  onStart: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const next = queue[0];

  return (
    <div className="bg-surface rounded-card shrink-0">
      <div className="px-5 pt-4 pb-1">
        <h3 className="text-base font-extrabold text-ink">Up Next</h3>
      </div>

      <div className="px-5 pb-3">
        {next ? (
          <QueueRow item={next} locked={locked} onStart={onStart} />
        ) : (
          <div className="text-sm text-ink-muted text-center py-4">Nothing checked in yet</div>
        )}
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-divider text-xs font-bold text-ink-muted hover:bg-surface-hover transition-colors rounded-b-2xl"
      >
        <span>Completed today ({completed.length})</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {drawerOpen && <CompletedTodayDrawer items={completed} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
