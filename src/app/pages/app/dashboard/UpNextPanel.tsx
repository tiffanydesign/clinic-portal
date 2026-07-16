import React, { useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import type { QueueItem, CompletedItem } from "./nurseDashboardData";

function QueueRow({ item, locked, onStart }: { item: QueueItem; locked: boolean; onStart: () => void }) {
  const ready = !locked;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
        <div className="text-xs text-gray-400 font-medium mt-0.5">{item.time} · {item.type}</div>
      </div>
      <button
        onClick={onStart}
        disabled={!ready}
        title={!ready ? "Requires next patient check-in and current journey completion." : undefined}
        className={`px-4 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all ${
          ready
            ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm"
            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
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
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-[420px] bg-white border-l border-gray-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50">
          <div>
            <div className="font-bold text-gray-800">Completed Today</div>
            <div className="text-xs text-gray-500">{items.length} patient{items.length === 1 ? "" : "s"} checked out</div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-gray-400 text-center">Nothing completed yet today.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-800 truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.type}</div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 shrink-0">{it.time}</span>
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm shrink-0">
      <div className="px-5 pt-4 pb-1">
        <h3 className="text-base font-extrabold text-slate-800">Up Next</h3>
      </div>

      <div className="px-5 pb-3">
        {next ? (
          <QueueRow item={next} locked={locked} onStart={onStart} />
        ) : (
          <div className="text-sm text-gray-400 text-center py-4">Nothing checked in yet</div>
        )}
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors rounded-b-2xl"
      >
        <span>Completed today ({completed.length})</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {drawerOpen && <CompletedTodayDrawer items={completed} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
