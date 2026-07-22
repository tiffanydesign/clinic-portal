import React, { useRef, useState } from "react";
import { Plane, Pencil } from "lucide-react";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";
import { Stat } from "../../../components/stat";
import type { GridCell, GridDay, GridRow } from "./types";

const HEADER_COL_W = 232;

// Heatmap tiers: all four are soft, evenly-stepped tints of the success green
// (no solid fill) so the ramp reads as one calm family that sits with the
// system's muted palette — the old top tier used the full-saturation green,
// which jumped hard off the lighter cells and clashed. More free time = a
// slightly deeper (but still gentle) mint; busier cells fade toward white.
// Fully Booked is a separate status (plain white + gray text), not this ramp.
function heatmapClass(ratio: number): string {
  if (ratio >= 0.7) return "bg-success/25";
  if (ratio >= 0.45) return "bg-success/15";
  if (ratio >= 0.2) return "bg-success/10";
  return "bg-success/[0.06]";
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
        className="inline-flex items-center justify-center w-5 h-5 -m-1 rounded-control text-ink-muted hover:text-ink-soft hover:bg-surface-hover transition-colors shrink-0"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {open && (
        <FloatingPopover anchorRef={ref} onClose={() => setOpen(false)} align="left">
          <div className="w-64 bg-surface border border-divider rounded-card shadow-xl p-3.5 text-left">
            <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1.5">Manual override</div>
            <div className="text-sm font-semibold text-ink">{detail.by}</div>
            <div className="text-xs text-ink-muted mb-2">{detail.at}</div>
            <div className="text-sm text-ink-soft">{detail.reason}</div>
          </div>
        </FloatingPopover>
      )}
    </>
  );
}

function Cell({ cell, isToday }: { cell: GridCell; isToday: boolean }) {
  const clickable = !!cell.onClick;
  // Cells carry BOTH a bottom and a right border so the day columns read as a
  // real grid — a border-strong vertical rule keeps adjacent heatmap cells
  // (green-on-green) visibly separated where the faint divider disappeared.
  const base = "relative flex-1 min-w-0 px-2.5 py-2 border-b border-divider border-r border-border-strong overflow-hidden";
  const interactivity = clickable ? "cursor-pointer hover:brightness-[0.98] transition-[filter]" : "";

  if (cell.status === "off") {
    return (
      <div className={`${base} ${interactivity} bg-surface-page/70`} style={hatchStyle("rgba(100,116,139,0.07)")} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-surface-sunken/[0.03] pointer-events-none" />}
        <span className="text-label font-medium text-ink-muted">{cell.offLabel ?? "Off"}</span>
      </div>
    );
  }
  if (cell.status === "leave") {
    return (
      <div className={`${base} ${interactivity} bg-warning/15 flex items-center gap-1.5`} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-surface-sunken/[0.03] pointer-events-none" />}
        <Plane className="w-3.5 h-3.5 text-warning-ink shrink-0" />
        <span className="text-xs font-semibold text-warning-ink">On leave</span>
      </div>
    );
  }
  if (cell.status === "full") {
    return (
      <div className={`${base} ${interactivity} bg-surface flex items-center justify-center`} onClick={cell.onClick}>
        {isToday && <div className="absolute inset-0 bg-surface-sunken/[0.03] pointer-events-none" />}
        <span className="text-xs font-medium text-ink-soft">Fully booked</span>
      </div>
    );
  }

  const ratio = cell.freeRatio ?? 0;
  return (
    <div className={`${base} ${interactivity} ${heatmapClass(ratio)} flex flex-col justify-center gap-1`} onClick={cell.onClick}>
      {isToday && <div className="absolute inset-0 bg-surface-sunken/[0.03] pointer-events-none" />}
      {cell.override && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ink-muted" />
      )}
      <div className="flex items-center justify-between gap-1">
        {cell.freeLabel && <span className="text-label text-ink-muted">{cell.freeLabel}</span>}
        {cell.override && <OverrideMarker detail={cell.override} />}
      </div>
      {cell.lines && cell.lines.length > 0 && (
        <div className={cell.lines.length > 1 ? "flex flex-col gap-1.5" : ""}>
          {cell.lines.map((line, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              {cell.lines!.length > 1 && <span className="w-1 h-1 rounded-full bg-ink-muted shrink-0" />}
              <span className="text-data font-medium text-ink truncate tabular-nums">{line}</span>
            </div>
          ))}
        </div>
      )}
      {cell.blocked && cell.blocked.length > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-control shrink-0" style={hatchStyle("rgba(100,116,139,0.35)")} />
          <span className="text-label text-ink-muted truncate">{cell.blocked[0].label}</span>
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
        <div className="flex sticky top-0 z-20 bg-surface border-b border-divider">
          <div className="shrink-0 bg-surface-page/70 border-r border-divider" style={{ width: HEADER_COL_W }} />
          {days.map((d) => (
            <div
              key={d.key}
              className={`flex-1 min-w-0 py-2.5 text-center border-r border-border-strong ${d.isToday ? "bg-surface-hover/70" : "bg-surface-page/70"}`}
            >
              <span className={`text-xs uppercase tracking-wider ${d.isToday ? "font-extrabold text-ink" : "font-bold text-ink-muted"}`}>
                {d.label}
              </span>
            </div>
          ))}
          {hasUtil && (
            <div className="shrink-0 bg-surface-page/70 border-l border-divider flex items-center justify-center" style={{ width: UTIL_COL_W }}>
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Util.</span>
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
                    <span className="text-label font-bold text-ink-muted uppercase tracking-wider pl-1">{row.groupLabel}</span>
                  </div>
                </div>
              )}
              <div className="flex" style={{ height: rowH }}>
                <div
                  className="shrink-0 sticky left-0 z-10 bg-surface border-r border-b border-divider flex items-center px-4"
                  style={{ width: HEADER_COL_W }}
                >
                  {row.header}
                </div>
                {row.cells.map((cell, i) => (
                  <Cell key={days[i]?.key ?? i} cell={cell} isToday={!!days[i]?.isToday} />
                ))}
                {hasUtil && (
                  <div className="shrink-0 border-l border-b border-divider flex flex-col items-center justify-center gap-1 px-2" style={{ width: UTIL_COL_W }}>
                    {/* Row-end utilisation rides in the Stat family's T4 `pill`
                        tier. Amber marks an out-of-band room (over-booked >85%
                        or under-used <30%) — the same threshold the plain-text
                        bold used to signal. */}
                    <Stat
                      stat={{
                        id: `util-${row.id}`,
                        label: "utilisation",
                        kind: "count",
                        variant: "pill",
                        value: `${row.utilPct ?? 0}%`,
                      }}
                      tone={(row.utilPct ?? 0) > 85 || (row.utilPct ?? 0) < 30 ? "amber" : "neutral"}
                    />
                    <div className="w-12 h-1 rounded-full bg-surface-sunken overflow-hidden">
                      <div className="h-full bg-ink-muted" style={{ width: `${Math.min(100, row.utilPct ?? 0)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {showColumnSummary && (
          <div className="flex border-t border-divider bg-surface-page/50">
            <div className="shrink-0 flex items-center px-4 py-2" style={{ width: HEADER_COL_W }}>
              <span className="text-label font-bold text-ink-muted uppercase tracking-wider">Team free hours</span>
            </div>
            {days.map((d, i) => {
              const total = rows.reduce((sum, r) => sum + (r.cells[i]?.freeHours ?? 0), 0);
              return (
                <div key={d.key} className="flex-1 min-w-0 flex items-center justify-center py-2">
                  <span className="text-xs font-semibold text-ink-muted tabular-nums">{Math.round(total * 10) / 10}h</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
