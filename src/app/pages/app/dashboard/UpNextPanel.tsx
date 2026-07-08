import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { QueueItem, CompletedItem } from "./nurseDashboardData";

function QueueRow({ item, isFirst, onStart }: { item: QueueItem; isFirst: boolean; onStart: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-800 truncate">{item.name}</div>
        <div className="text-xs text-gray-400">{item.time} · {item.type}</div>
      </div>
      <button
        onClick={onStart}
        disabled={!isFirst}
        className={`px-3 py-1.5 text-xs font-bold rounded shrink-0 transition-colors ${
          isFirst ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
        }`}
      >
        Start
      </button>
    </div>
  );
}

function CompletedSection({ items }: { items: CompletedItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-200 shrink-0">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
        <span>Completed today ({items.length})</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
              <span className="flex-1 min-w-0 truncate font-medium text-gray-600">{it.name}</span>
              <span className="shrink-0">{it.type} · {it.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UpNextPanel({
  queue,
  completed,
  onStart,
}: {
  queue: QueueItem[];
  completed: CompletedItem[];
  onStart: () => void;
}) {
  return (
    <div className="h-full bg-white border border-gray-300 rounded-xl shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-baseline justify-between shrink-0">
        <h3 className="text-sm font-bold text-gray-800">Up Next</h3>
        <span className="text-xs text-gray-400 font-medium">{queue.length} waiting</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {queue.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 p-6 text-center">No patients waiting</div>
        ) : (
          queue.map((item, i) => <QueueRow key={item.name} item={item} isFirst={i === 0} onStart={onStart} />)
        )}
      </div>

      <CompletedSection items={completed} />
    </div>
  );
}
