import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { QueueItem, CompletedItem } from "./nurseDashboardData";

function QueueRow({ item, locked, onStart }: { item: QueueItem; locked: boolean; onStart: () => void }) {
  const ready = !locked;
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
        <div className="text-xs text-gray-400 font-medium mt-0.5">{item.time} · {item.type}</div>
      </div>
      <button
        onClick={onStart}
        disabled={!ready}
        title={!ready ? "Requires next patient check-in and current journey completion." : undefined}
        className={`px-4 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors ${
          ready ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
        }`}
      >
        Start
      </button>
    </div>
  );
}

function CompletedSection({ items }: { items: CompletedItem[] }) {
  const [open, setOpen] = useState(true);
  return (
    // `grow` (not shrink-0) — this is the one section of the card that
    // absorbs whatever extra height items-stretch hands the card from
    // NurseDashboardPage's row, so Up Next's own bottom edge lands flush
    // with Patient Journey's. `min-h-0` on both this and the list below is
    // required for the flex-1 list's own overflow-y-auto to ever kick in
    // (a flex child's automatic min-height is its content size otherwise,
    // which would keep growing the card past the row's height instead of
    // scrolling internally).
    <div className="border-t border-gray-100 grow flex flex-col min-h-0">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors shrink-0">
        <span>Completed today ({items.length})</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-2.5">
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
  locked,
  onStart,
}: {
  queue: QueueItem[];
  completed: CompletedItem[];
  locked: boolean;
  onStart: () => void;
}) {
  const next = queue[0];
  return (
    // shrink-0 is still load-bearing: without it, this being the only rail
    // card whose root has overflow other than "visible" makes its flexbox
    // automatic minimum size 0 (per spec), so if the column's content ever
    // exceeded the row's height, the browser would shrink THIS card first —
    // all the way down if needed — and overflow-hidden would then clip
    // whatever doesn't fit with no scrollbar, silently. `grow` is the new
    // half of the story: NurseDashboardPage's row now stretches this
    // column to Patient Journey's height, and `grow` is what lets this
    // card (rather than blank space below it) absorb that extra room, so
    // its own bottom edge lines up with Patient Journey's — CompletedSection
    // below is where that extra height actually gets spent (its own list
    // scrolls internally via min-h-0 + overflow-y-auto rather than
    // stretching past whatever height it's given).
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 grow">
      <div className="px-5 pt-5 pb-1 shrink-0">
        <h3 className="text-base font-extrabold text-slate-800">Up Next</h3>
      </div>

      <div className="px-5 pb-3 shrink-0">
        {next ? (
          <QueueRow item={next} locked={locked} onStart={onStart} />
        ) : (
          <div className="text-sm text-gray-400 text-center py-6">Nothing checked in yet</div>
        )}
      </div>

      {locked && next && (
        <div className="px-5 pb-4 -mt-1 text-xs font-medium text-gray-400 shrink-0">Unlocks once the current patient's journey is complete</div>
      )}

      <CompletedSection items={completed} />
    </div>
  );
}
