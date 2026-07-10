import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import type { ScheduleItem } from "./nurseDashboardData";
import { NOW_MINUTES, TODAY_SHORT, minToClock } from "./dashboardData";

// A quiet rail-card list, not a full calendar grid — this is the nurse's
// secondary glance at the shape of her day, so it stays out of the way of
// the Patient Journey card, which carries the real visual weight.
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function ScheduleRow({ item, open, onToggle }: { item: ScheduleItem; open: boolean; onToggle: () => void }) {
  const cancelled = item.status === "cancelled";
  const active = item.status === "in-progress";
  const dotClass = cancelled ? "bg-gray-300" : active ? "bg-amber-500" : "bg-blue-500";
  const highlight = active || open;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={cancelled}
        className={`w-full grid grid-cols-[44px_1fr] gap-2.5 items-center py-2.5 text-left transition-colors ${highlight ? "bg-amber-50 -mx-2.5 px-2.5 rounded-lg" : "-mx-2.5 px-2.5 rounded-lg"} ${cancelled ? "cursor-default" : "hover:bg-gray-50"}`}
      >
        <span className="text-xs font-bold text-gray-400 tabular-nums">{item.time}</span>
        <span className={`flex items-center gap-2 min-w-0 text-sm font-semibold ${cancelled ? "text-gray-400 line-through" : active ? "text-amber-900" : "text-gray-800"}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
          <span className="truncate">{item.name}</span>
          <span className={`ml-auto shrink-0 text-xs font-medium truncate max-w-[92px] ${active ? "text-amber-700" : "text-gray-400"}`}>{item.type}</span>
        </span>
      </button>

      {open && !cancelled && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-sm font-bold text-gray-800">{item.name}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{item.type} · {item.duration}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{item.doctor} · {item.room}</div>
          </div>
        </>
      )}
    </div>
  );
}

export function TodaysSchedulePanel({ items }: { items: ScheduleItem[] }) {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const sorted = [...items].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  const before = sorted.filter((i) => parseTime(i.time) <= NOW_MINUTES);
  const after = sorted.filter((i) => parseTime(i.time) > NOW_MINUTES);
  const toggle = (key: string) => setOpenKey((k) => (k === key ? null : key));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-3.5">
        <h3 className="text-base font-extrabold text-slate-800">Today's Schedule</h3>
        <button onClick={() => navigate("/calendar/schedule")} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">
          Open calendar <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-col divide-y divide-gray-100 max-h-[260px] overflow-y-auto overflow-x-hidden">
        {before.map((item) => {
          const key = `${item.time}-${item.name}`;
          return <ScheduleRow key={key} item={item} open={openKey === key} onToggle={() => toggle(key)} />;
        })}
        <div className="grid grid-cols-[44px_1fr] gap-2.5 items-center py-0.5">
          <span className="text-[10px] font-extrabold text-red-500 text-right tabular-nums">{minToClock(NOW_MINUTES)}</span>
          <div className="h-0.5 bg-red-500 rounded-full relative">
            <span className="absolute -left-[3px] -top-[3px] w-2 h-2 rounded-full bg-red-500" />
          </div>
        </div>
        {after.map((item) => {
          const key = `${item.time}-${item.name}`;
          return <ScheduleRow key={key} item={item} open={openKey === key} onToggle={() => toggle(key)} />;
        })}
      </div>
    </div>
  );
}
