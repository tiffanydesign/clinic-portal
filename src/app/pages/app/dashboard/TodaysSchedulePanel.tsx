import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import type { ScheduleItem, ScheduleStatus } from "./nurseDashboardData";
import { NOW_MINUTES, minToClock, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX } from "./dashboardData";

// A quiet rail-card list, not a full calendar grid — this is the nurse's
// secondary glance at the shape of her day, so it stays out of the way of
// the Patient Journey card, which carries the real visual weight. The
// calendar view (toggle below) is an alternate, at-a-glance shape-of-the-day
// rendering of this exact same data, for whoever prefers that over the list.
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function parseDurationMin(d: string): number {
  return parseInt(d, 10) || 30;
}

type ScheduleView = "list" | "calendar";

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

const STATUS_BLOCK_CLASS: Record<ScheduleStatus, { block: string; dot: string }> = {
  "in-progress": { block: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  upcoming: { block: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  cancelled: { block: "bg-gray-50 border-gray-200 opacity-70", dot: "bg-gray-300" },
};

type LaidOutItem = { item: ScheduleItem; start: number; lane: number; laneCount: number };

// A nurse's own supervised list is a single sequential day (see
// nurseDashboardData.ts — every station is a strictly non-overlapping
// 60-120 min block, unlike the shared multi-clinician calendar's
// legitimately concurrent room/doctor bookings), so lanes only ever
// resolve to 1 in practice. Kept as a real, general-purpose layout — a
// defensive safety net if the mock data ever changes — rather than
// assuming the caller always hands over a conflict-free list.
function layoutWithLanes(items: ScheduleItem[]): LaidOutItem[] {
  const intervals = items
    .map((item) => {
      const start = parseTime(item.time);
      return { item, start, end: start + parseDurationMin(item.duration) };
    })
    .sort((a, b) => a.start - b.start);

  const clusters: (typeof intervals)[] = [];
  let current: typeof intervals = [];
  let currentEnd = -Infinity;
  for (const iv of intervals) {
    if (current.length > 0 && iv.start >= currentEnd) {
      clusters.push(current);
      current = [];
      currentEnd = -Infinity;
    }
    current.push(iv);
    currentEnd = Math.max(currentEnd, iv.end);
  }
  if (current.length > 0) clusters.push(current);

  const result: LaidOutItem[] = [];
  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const placed: { iv: (typeof cluster)[number]; lane: number }[] = [];
    for (const iv of cluster) {
      let lane = laneEnds.findIndex((end) => end <= iv.start);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(iv.end); }
      else { laneEnds[lane] = iv.end; }
      placed.push({ iv, lane });
    }
    const laneCount = laneEnds.length;
    for (const { iv, lane } of placed) result.push({ item: iv.item, start: iv.start, lane, laneCount });
  }
  return result;
}

// Single-column day timeline — time-proportional top to bottom, with
// concurrent patients (see layoutWithLanes above) placed in side-by-side
// lanes instead of one shared full-width column.
function ScheduleCalendarView({ items, now }: { items: ScheduleItem[]; now: number }) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((now - DAY_START_HOUR * 60) / 60) * HOUR_PX;

  return (
    <div className="max-h-[260px] overflow-y-auto overflow-x-hidden">
      <div className="flex" style={{ height: gridHeight }}>
        <div className="w-11 shrink-0 relative border-r border-gray-200 bg-gray-50/30">
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 text-[9px] font-semibold text-gray-500 text-right pr-1.5 tabular-nums" style={{ top: i * HOUR_PX - 5 }}>
              {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>
        <div className="flex-1 relative">
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />
          ))}
          <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
            <div className="relative border-t-2 border-red-500">
              <span className="absolute -left-[4px] -top-[4px] w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </div>
          </div>
          {layoutWithLanes(items).map(({ item, start, lane, laneCount }) => {
            const durMin = parseDurationMin(item.duration);
            const top = ((start - DAY_START_HOUR * 60) / 60) * HOUR_PX;
            const height = Math.max(24, (durMin / 60) * HOUR_PX - 2);
            const widthPct = 100 / laneCount;
            const color = STATUS_BLOCK_CLASS[item.status];
            return (
              <div
                key={`${item.time}-${item.name}`}
                style={{ top, height, left: `calc(${widthPct * lane}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                className={`absolute px-2 py-1 text-left overflow-hidden rounded-lg border ${color.block}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`} />
                  <span className={`text-[11px] font-bold text-gray-800 truncate ${item.status === "cancelled" ? "line-through" : ""}`}>{item.name}</span>
                </div>
                {height >= 34 && laneCount === 1 && <div className="text-[10px] text-gray-500 truncate mt-0.5 pl-3">{item.type}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ScheduleView; onChange: (v: ScheduleView) => void }) {
  return (
    <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
      {(["list", "calendar"] as ScheduleView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all capitalize ${view === v ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function TodaysSchedulePanel({ items, now = NOW_MINUTES }: { items: ScheduleItem[]; now?: number }) {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [view, setView] = useState<ScheduleView>("list");
  const sorted = [...items].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  const before = sorted.filter((i) => parseTime(i.time) <= now);
  const after = sorted.filter((i) => parseTime(i.time) > now);
  const toggle = (key: string) => setOpenKey((k) => (k === key ? null : key));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 shrink-0">
      <div className="flex items-start justify-between mb-3.5 gap-3">
        <h3 className="text-base font-extrabold text-slate-800">Today's Schedule</h3>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button onClick={() => navigate("/calendar/schedule")} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">
            Open calendar <ArrowRight className="w-3 h-3" />
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>
      {view === "list" ? (
        <div className="flex flex-col divide-y divide-gray-100 max-h-[260px] overflow-y-auto overflow-x-hidden">
          {before.map((item) => {
            const key = `${item.time}-${item.name}`;
            return <ScheduleRow key={key} item={item} open={openKey === key} onToggle={() => toggle(key)} />;
          })}
          <div className="grid grid-cols-[44px_1fr] gap-2.5 items-center py-0.5">
            <span className="text-[10px] font-extrabold text-red-500 text-right tabular-nums">{minToClock(now)}</span>
            <div className="h-0.5 bg-red-500 rounded-full relative">
              <span className="absolute -left-[3px] -top-[3px] w-2 h-2 rounded-full bg-red-500" />
            </div>
          </div>
          {after.map((item) => {
            const key = `${item.time}-${item.name}`;
            return <ScheduleRow key={key} item={item} open={openKey === key} onToggle={() => toggle(key)} />;
          })}
        </div>
      ) : (
        <ScheduleCalendarView items={sorted} now={now} />
      )}
    </div>
  );
}
