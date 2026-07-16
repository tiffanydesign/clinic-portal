import React, { useRef, useState } from "react";
import { Plane, Pencil } from "lucide-react";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";
import type { GridCell, GridDay, GridRow } from "./types";

const HEADER_COL_W = 232;

// Heatmap tiers: all four derived from the existing emerald/success scale —
// no new palette. Fully free sits at the lightest tier that's still visibly
// green; the busier a "normal" (still has some free time) cell gets, the
// closer its tint fades to white. Fully Booked is a separate status (plain
// white + gray text below), not the bottom of this ramp.
function heatmapClass(ratio: number): string {
  if (ratio >= 0.7) return "bg-emerald-200/60";
  if (ratio >= 0.45) return "bg-emerald-100/70";
  if (ratio >= 0.2) return "bg-emerald-50";
  return "bg-emerald-50/25";
}

// Faint diagonal hatch, used at two different weights: barely-there for Day
// Off (lowest visual weight of the three unavailable states) and a touch
// darker for a Blocked Time segment inside an otherwise-normal cell.
function hatchStyle(rgba: string): React.CSSProperties {
  return { backgroundImage: `repeating-linear-gradient(135deg, ${rgba} 0px, ${rgba} 1px, transparent 1px, transparent 7px)` };
}

function OverrideMarker({ detail }: { detail: NonNullable<GridCell["override"]> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={ref}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Manually edited — view details"
        className="inline-flex items-center justify-center w-5 h-5 -m-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {open && (
        <FloatingPopover anchorRef={ref} onClose={() => setOpen(false)} align="left">
          <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3.5 text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Manual override</div>
            <div className="text-sm font-semibold text-gray-800">{detail.by}</div>
            <div className="text-xs text-gray-400 mb-2">{detail.at}</div>
            <div className="text-sm text-gray-600">{detail.reason}</div>
          </div>
        </FloatingPopover>
      )}
    </>
  );
}

function Cell({ cell, isToday }: { cell: GridCell; isToday: boolean }) {
  const clickable = !!cell.onClick;
  const base = "relative flex-1 min-w-0 px-2.5 py-2 border-b border-gray-100 overflow-hidden";
  const interactivity = clickable ? "cursor-pointer hover:brightness-[0.98] transition-[filter]" : "";

  if (cell.status === "off") {
    return (
      <div className={`${base} ${interactivity} bg-gray-50/70`} style={hatchStyle("rgba(100,116,139,0.07)")} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />}
        <span className="text-[10px] font-medium text-gray-400">{cell.offLabel ?? "Off"}</span>
      </div>
    );
  }
  if (cell.status === "leave") {
    return (
      <div className={`${base} ${interactivity} bg-amber-100/60 flex items-center gap-1.5`} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />}
        <Plane className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="text-xs font-semibold text-amber-800">On leave</span>
      </div>
    );
  }
  if (cell.status === "full") {
    return (
      <div className={`${base} ${interactivity} bg-white flex items-center justify-center`} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />}
        <span className="text-xs font-medium text-gray-600">Fully booked</span>
      </div>
    );
  }

  const ratio = cell.freeRatio ?? 0;
  return (
    <div className={`${base} ${interactivity} ${heatmapClass(ratio)} flex flex-col justify-center gap-1`} onClick={cell.onClick}>
      {isToday && <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />}
      {cell.override && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-400" />
      )}
      <div className="flex items-center justify-between gap-1">
        {cell.freeLabel && <span className="text-[11px] text-gray-500">{cell.freeLabel}</span>}
        {cell.override && <OverrideMarker detail={cell.override} />}
      </div>
      {cell.lines && cell.lines.length > 0 && (
        <div className={cell.lines.length > 1 ? "flex flex-col gap-1.5" : ""}>
          {cell.lines.map((line, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              {cell.lines!.length > 1 && <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />}
              <span className="text-[13px] font-medium text-slate-800 truncate tabular-nums">{line}</span>
            </div>
          ))}
        </div>
      )}
      {cell.blocked && cell.blocked.length > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={hatchStyle("rgba(100,116,139,0.35)")} />
          <span className="text-[10px] text-gray-500 truncate">{cell.blocked[0].label}</span>
        </div>
      )}
    </div>
  );
}

export function AvailabilityGrid({
  days, rows, showColumnSummary,
}: {
  days: GridDay[];
  rows: GridRow[];
  showColumnSummary?: boolean;
}) {
  let lastGroup: string | undefined;
  const UTIL_COL_W = 96;
  const hasUtil = rows.some((r) => r.utilPct !== undefined);

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[880px]">
        {/* Header */}
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="shrink-0 bg-gray-50/70 border-r border-gray-200" style={{ width: HEADER_COL_W }} />
          {days.map((d) => (
            <div
              key={d.key}
              className={`flex-1 min-w-0 py-2.5 text-center ${d.isToday ? "bg-slate-100/70" : "bg-gray-50/70"}`}
            >
              <span className={`text-xs uppercase tracking-wider ${d.isToday ? "font-extrabold text-slate-800" : "font-bold text-gray-500"}`}>
                {d.label}
              </span>
            </div>
          ))}
          {hasUtil && (
            <div className="shrink-0 bg-gray-50/70 border-l border-gray-200 flex items-center justify-center" style={{ width: UTIL_COL_W }}>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Util.</span>
            </div>
          )}
        </div>

        {rows.map((row) => {
          const showGroup = row.groupLabel && row.groupLabel !== lastGroup;
          lastGroup = row.groupLabel ?? lastGroup;
          const rowH = row.cells.some((c) => (c.lines?.length ?? 0) > 1) ? 88 : 72;

          return (
            <React.Fragment key={row.id}>
              {showGroup && (
                <div className="flex items-end pt-6 pb-1.5 px-1">
                  <div className="shrink-0" style={{ width: HEADER_COL_W }}>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">{row.groupLabel}</span>
                  </div>
                </div>
              )}
              <div className="flex" style={{ height: rowH }}>
                <div
                  className="shrink-0 sticky left-0 z-10 bg-white border-r border-b border-gray-100 flex items-center px-4"
                  style={{ width: HEADER_COL_W }}
                >
                  {row.header}
                </div>
                {row.cells.map((cell, i) => (
                  <Cell key={days[i]?.key ?? i} cell={cell} isToday={!!days[i]?.isToday} />
                ))}
                {hasUtil && (
                  <div className="shrink-0 border-l border-b border-gray-100 flex flex-col items-center justify-center gap-1 px-2" style={{ width: UTIL_COL_W }}>
                    <span className={`text-xs tabular-nums ${(row.utilPct ?? 0) > 85 || (row.utilPct ?? 0) < 30 ? "font-bold text-gray-700" : "font-semibold text-gray-500"}`}>
                      {row.utilPct ?? 0}%
                    </span>
                    <div className="w-12 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${Math.min(100, row.utilPct ?? 0)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {showColumnSummary && (
          <div className="flex border-t border-gray-200 bg-gray-50/50">
            <div className="shrink-0 flex items-center px-4 py-2" style={{ width: HEADER_COL_W }}>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Team free hours</span>
            </div>
            {days.map((d, i) => {
              const total = rows.reduce((sum, r) => sum + (r.cells[i]?.freeHours ?? 0), 0);
              return (
                <div key={d.key} className="flex-1 min-w-0 flex items-center justify-center py-2">
                  <span className="text-xs font-semibold text-gray-500 tabular-nums">{Math.round(total * 10) / 10}h</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
