import React from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import type { ScheduleItem } from "./nurseDashboardData";

// Deliberately compact and scrollable — a secondary time-of-day reference,
// not a full calendar grid, so it never competes with the Current Patient
// card for visual weight.
function ScheduleRow({ item, isOpen, onToggle }: { item: ScheduleItem; isOpen: boolean; onToggle: () => void }) {
  const cancelled = item.status === "cancelled";
  const current = item.status === "in-progress";

  return (
    <div>
      <button
        onClick={onToggle}
        disabled={cancelled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-l-[3px] transition-colors
          ${current ? "border-l-slate-600 bg-slate-50" : "border-l-transparent"}
          ${cancelled ? "opacity-50 cursor-default" : "hover:bg-gray-50 cursor-pointer"}`}
      >
        <span className="text-xs font-bold text-gray-500 w-11 shrink-0">{item.time}</span>
        <span className={`flex-1 min-w-0 text-sm truncate ${cancelled ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}>
          {item.name} <span className="text-gray-400 font-normal">· {item.type}</span>
        </span>
        {!cancelled && <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
      </button>
      {isOpen && !cancelled && (
        <div className="px-3 pb-3 pl-14 -mt-0.5">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <div className="font-bold text-gray-800">{item.name}</div>
            <div>{item.type} · {item.duration}</div>
            <div>{item.doctor} · {item.room}</div>
            <Link to="/patients/P-001" className="inline-block mt-1.5 text-slate-600 font-bold hover:underline">
              Open Record →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function TodaysSchedulePanel({
  items,
  openIndex,
  onToggle,
}: {
  items: ScheduleItem[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-gray-800">Today's Schedule</h3>
        <span className="text-xs text-gray-400 font-medium">Fri, 3 Jul</span>
      </div>
      <div className="max-h-[264px] overflow-y-auto divide-y divide-gray-100">
        {items.map((item, i) => (
          <ScheduleRow key={`${item.time}-${item.name}`} item={item} isOpen={openIndex === i} onToggle={() => onToggle(i)} />
        ))}
      </div>
    </div>
  );
}
