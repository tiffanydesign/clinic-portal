import React from "react";
import { Check, X } from "lucide-react";
import type { CompletedItem } from "./nurseDashboardData";

// Slide-in panel listing everyone this nurse has already checked out today —
// same shell shape as AppointmentDrawer's (backdrop + right-edge slide-in),
// kept local here since it's a much simpler, single-purpose list.
//
// Lives in its own file because its opener moved: it used to hang off the
// standalone Up Next panel, which is now folded into My Patients Today.
export function CompletedTodayDrawer({ items, onClose }: { items: CompletedItem[]; onClose: () => void }) {
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
