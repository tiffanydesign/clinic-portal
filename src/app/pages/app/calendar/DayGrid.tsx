import React, { useRef, useState } from "react";
import { Video } from "lucide-react";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";
import {
  Appt, TimeBlock, DAY_START_HOUR, DAY_END_HOUR, NOW_MINUTES,
  apptBlockClass, apptMicroPillClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
  clusterColumnByHour, equalDivisionTop, equalDivisionHeight, OverflowGroup, VisibleItem,
} from "./scheduleData";

export type GridColumn = { key: string; title: string; sub?: string; avatar?: string; count?: number; muted?: boolean };
export type PlacedAppt = { appt: Appt; colKey: string; overlay?: boolean };
export type PlacedBlock = { block: TimeBlock; colKey: string };

// The full Schedule page gets its own, taller hour row (180px vs the
// Dashboard "Today's Schedule" widget's compact 90px) specifically so a
// packed Scan/Sample hour can show up to MAX_VISIBLE_PER_HOUR (6) real
// blocks at a readable size — this override is local to this file, the
// Dashboard widget keeps importing the shared (shorter) HOUR_PX unchanged.
const HOUR_PX = 180;

// A column's own appointment list renders individually up to this many per
// clock hour; crossing it switches that whole hour to a stacked
// micro-pill list (Apple Calendar-style) instead of time-positioned blocks
// (see clusterColumnByHour in dashboardData.ts) — a densely-booked
// Scan/Sample room can run 4-6 real visits an hour, and rendering each as
// its own absolutely-positioned block both reads as noise and lets
// blockHeightPx's legibility floor push the last one's bottom edge past the
// hour it belongs to.
const MAX_VISIBLE_PER_HOUR = 6;
// Inside a dense hour's micro-pill stack, show at most this many pills
// before folding the rest into a "+N" line — sized so 3 pills (18px + 2px
// gap each) plus the "+N" caption still fit inside one HOUR_PX row.
const MAX_PILLS_PER_HOUR = 3;
const PILL_HEIGHT = 18;
const PILL_GAP = 2;

const SNAP = 15; // minutes
const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const MIN_MIN = DAY_START_HOUR * 60;
const MAX_MIN = DAY_END_HOUR * 60;

// Micro-pill (Apple Calendar-style): status dot + name only — no time, no
// service type, no duration. Tonal background (apptMicroPillClass — same
// bg-{status}/10 tint the full block uses, no border) keeps it visually
// quiet next to the section's real, time-positioned blocks. Text never
// wraps and clips hard (no ellipsis) at narrow column widths, per spec.
function MicroPill({ appt, onClick }: { appt: Appt; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ height: PILL_HEIGHT }}
      className={`w-full shrink-0 flex items-center gap-1 px-1.5 rounded-full overflow-hidden whitespace-nowrap text-left hover:brightness-95 transition-[filter] ${apptMicroPillClass(appt.status)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
      <span className="text-micro text-ink truncate">{appt.patient.name}</span>
    </button>
  );
}

export function DayGrid({
  columns, placed, blocks = [], editable = false, allowReassign = false, allowResize = false,
  onApptClick, onEmptyClick, onDragEnd, onResizeEnd, showNow = true,
}: {
  columns: GridColumn[];
  placed: PlacedAppt[];
  blocks?: PlacedBlock[];
  editable?: boolean;
  allowReassign?: boolean;
  allowResize?: boolean;
  onApptClick: (appt: Appt, overlay?: boolean) => void;
  /** `at` carries the click position so the caller can anchor a popover to it. */
  onEmptyClick?: (colKey: string, startMin: number, at: { x: number; y: number }) => void;
  onDragEnd?: (appt: Appt, newColKey: string, newStartMin: number) => void;
  onResizeEnd?: (appt: Appt, newDuration: number) => void;
  showNow?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const halfRows = (DAY_END_HOUR - DAY_START_HOUR) * 2;
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - MIN_MIN) / 60) * HOUR_PX;

  // live drag / resize preview (does not commit until the parent confirms)
  const [drag, setDrag] = useState<{ id: string; startMin: number; colKey: string } | null>(null);
  const [resize, setResize] = useState<{ id: string; durationMin: number } | null>(null);
  const moved = useRef(false);

  // Aggregate-block popover — one open at a time, identified by column +
  // hour so it's unambiguous which block it belongs to across every
  // column's own independent clustering.
  const [openOverflow, setOpenOverflow] = useState<{ colKey: string; hourStartMin: number } | null>(null);
  const overflowAnchorRef = useRef<HTMLButtonElement>(null);

  const pointerToMin = (clientY: number) => {
    const rect = contentRef.current!.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.min(MAX_MIN, Math.max(MIN_MIN, snap(MIN_MIN + (y / HOUR_PX) * 60)));
  };
  const pointerToCol = (clientX: number) => {
    const rect = contentRef.current!.getBoundingClientRect();
    const idx = Math.floor(((clientX - rect.left) / rect.width) * columns.length);
    return columns[Math.min(columns.length - 1, Math.max(0, idx))].key;
  };

  const startDrag = (e: React.MouseEvent, p: PlacedAppt) => {
    if (!editable || p.overlay) return;
    e.preventDefault();
    e.stopPropagation();
    moved.current = false;
    const rect = contentRef.current!.getBoundingClientRect();
    const topPx = ((p.appt.startMin - MIN_MIN) / 60) * HOUR_PX;
    const grabDy = e.clientY - rect.top - topPx;
    const onMove = (ev: MouseEvent) => {
      moved.current = true;
      const y = ev.clientY - rect.top - grabDy;
      const startMin = Math.min(MAX_MIN - p.appt.durationMin, Math.max(MIN_MIN, snap(MIN_MIN + (y / HOUR_PX) * 60)));
      const colKey = allowReassign ? pointerToCol(ev.clientX) : p.colKey;
      setDrag({ id: p.appt.id, startMin, colKey });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!moved.current) { onApptClick(p.appt, p.overlay); setDrag(null); return; }
      const startMin = Math.min(MAX_MIN - p.appt.durationMin, Math.max(MIN_MIN, pointerToMin(ev.clientY) - 0));
      const colKey = allowReassign ? pointerToCol(ev.clientX) : p.colKey;
      const changed = startMin !== p.appt.startMin || colKey !== p.colKey;
      setDrag(null);
      if (changed && onDragEnd) onDragEnd(p.appt, colKey, startMin);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (e: React.MouseEvent, p: PlacedAppt) => {
    if (!editable || p.overlay || !allowResize) return;
    e.preventDefault();
    e.stopPropagation();
    const topPx = ((p.appt.startMin - MIN_MIN) / 60) * HOUR_PX;
    const onMove = (ev: MouseEvent) => {
      const rect = contentRef.current!.getBoundingClientRect();
      const bottomMin = snap(MIN_MIN + ((ev.clientY - rect.top) / HOUR_PX) * 60);
      const durationMin = Math.max(SNAP, Math.min(MAX_MIN - p.appt.startMin, bottomMin - p.appt.startMin));
      setResize({ id: p.appt.id, durationMin });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setResize((r) => {
        if (r && r.durationMin !== p.appt.durationMin && onResizeEnd) onResizeEnd(p.appt, r.durationMin);
        return null;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const colBackgroundClick = (e: React.MouseEvent, colKey: string) => {
    if (!editable || !onEmptyClick) return;
    const startMin = pointerToMin(e.clientY);
    onEmptyClick(colKey, Math.min(MAX_MIN - 30, startMin), { x: e.clientX, y: e.clientY });
  };

  return (
    <div className="rounded-card bg-surface flex flex-col h-full min-h-0 overflow-hidden">
      {/* column headers */}
      <div className="flex border-b border-divider bg-gradient-to-b from-surface-page to-surface-page/50 shrink-0 pl-14 relative z-10 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {columns.map((c) => (
          <div key={c.key} className={`flex-1 px-2 py-2.5 text-center border-l border-divider min-w-0 ${c.muted ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-center gap-1.5">
              {c.avatar && <span className="w-6 h-6 rounded-full bg-surface ring-1 ring-divider text-ink-soft text-label font-bold flex items-center justify-center shrink-0 shadow-sm">{c.avatar}</span>}
              <span className="text-xs font-bold text-ink-soft truncate">{c.title}</span>
              {c.count !== undefined && (
                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[color:var(--phenome-blue-500)]/10 text-[color:var(--phenome-blue-500)] text-label font-bold tabular-nums">
                  {c.count}
                </span>
              )}
            </div>
            {c.sub && <div className="text-label text-ink-muted truncate mt-0.5">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* hour gutter */}
          <div className="w-14 shrink-0 relative border-r border-divider bg-surface-page/40">
            {/* alternating hour bands — a light rhythm that helps the eye
                track a row across the full grid width without adding noise */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-hover/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-label font-semibold text-ink-muted tabular-nums" style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</div>
            ))}
            {showNow && (
              <span className="absolute right-1.5 z-20 text-label font-bold text-white bg-danger-ink rounded-control px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
                {minToClock(NOW_MINUTES)}
              </span>
            )}
          </div>

          {/* columns area */}
          <div ref={contentRef} className="flex-1 relative">
            {/* alternating hour bands, matching the gutter's rhythm */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-page/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {/* half-hour gridlines */}
            {Array.from({ length: halfRows + 1 }).map((_, i) => (
              <div key={i} className={`absolute left-0 right-0 ${i % 2 === 0 ? "border-t border-divider" : "border-t border-dashed border-divider"}`} style={{ top: (i * HOUR_PX) / 2 }} />
            ))}
            {/* now line */}
            {showNow && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                <div className="relative border-t-2 border-danger shadow-[0_0_6px_rgba(239,68,68,0.35)]">
                  <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-danger-ink ring-2 ring-white" />
                </div>
              </div>
            )}

            <div className="flex h-full">
              {columns.map((col) => {
                const colItems = placed.filter((p) => p.colKey === col.key);
                // The actively dragged/resized item always renders as its own
                // visible block at its live position, regardless of which
                // hour bucket it clusters into at rest — folding the very
                // item the user is mid-drag on into the micro-pill stack
                // would be a jarring disappearance.
                const activeId = drag?.id ?? resize?.id ?? null;
                const clusterInput = activeId ? colItems.filter((p) => p.appt.id !== activeId) : colItems;
                const activeItem = activeId ? colItems.find((p) => p.appt.id === activeId) ?? null : null;
                // A dragged/resized item is excluded from clustering (see above)
                // and rendered as its own always-fallback entry (bucketSize 1),
                // so it never gets pulled into another hour's equal-division sizing.
                const activeVisible: VisibleItem<PlacedAppt> | null = activeItem
                  ? { item: activeItem, bucketSize: 1, bucketIndex: 0, hourStartMin: 0 }
                  : null;
                const { visible, overflow } = clusterColumnByHour(clusterInput, (p) => p.appt.startMin, MAX_VISIBLE_PER_HOUR);
                // Ceiling timeline for gapToNext: every visible block's neighbor,
                // PLUS a pseudo-boundary at each overflow group's hour end — so a
                // visible block followed by a hidden cluster is capped at the
                // hour's own end instead of the legibility floor pushing its
                // bottom edge past it (the exact bug this feature fixes). Only
                // matters for a lone (bucketSize 1) item's natural-duration sizing.
                const timeline = [
                  ...visible.map((v) => ({ startMin: v.item.appt.startMin })),
                  ...overflow.map((g) => ({ startMin: g.hourStartMin + 60 })),
                  ...(activeItem ? [{ startMin: activeItem.appt.startMin }] : []),
                ];
                return (
                <div key={col.key} className="flex-1 relative border-l border-divider" onClick={(e) => colBackgroundClick(e, col.key)}>
                  {/* blocked time */}
                  {blocks.filter((b) => b.colKey === col.key).map(({ block }) => {
                    const top = ((block.startMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = Math.max(24, (block.durationMin / 60) * HOUR_PX - 2);
                    return (
                      <div key={block.id} style={{ top, height }} className="absolute left-0.5 right-0.5 rounded-card bg-[repeating-linear-gradient(45deg,var(--surface-hover),var(--surface-hover)_6px,var(--border-strong)_6px,var(--border-strong)_12px)] border border-divider px-2 py-1 overflow-hidden">
                        <div className="text-label font-bold text-ink-muted truncate">{block.reason}</div>
                        <div className="text-label text-ink-muted truncate">Blocked</div>
                      </div>
                    );
                  })}

                  {/* appointments — capped to MAX_VISIBLE_PER_HOUR full blocks
                      per clock hour; crossing that renders the whole hour as
                      a micro-pill stack instead (see below). A packed hour
                      (bucketSize > 1) divides HOUR_PX evenly across its items
                      instead of sizing each by its own real duration — the
                      exact fix for a 4-item hour looking nothing like a
                      3-item one; a lone item (bucketSize 1) keeps its natural
                      duration-based size so it can still span past its hour. */}
                  {[...visible, ...(activeVisible ? [activeVisible] : [])].map((v) => {
                    const p = v.item;
                    const isDragging = drag?.id === p.appt.id;
                    const isResizing = resize?.id === p.appt.id;
                    const dense = v.bucketSize > 1 && !isDragging && !isResizing;
                    const startMin = isDragging ? drag!.startMin : p.appt.startMin;
                    const durationMin = isResizing ? resize!.durationMin : p.appt.durationMin;
                    const gapMin = isDragging || isResizing ? undefined : gapToNext(timeline, startMin);
                    const top = dense
                      ? equalDivisionTop(v.hourStartMin, v.bucketIndex, v.bucketSize, HOUR_PX)
                      : ((startMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = dense
                      ? equalDivisionHeight(v.bucketSize, HOUR_PX)
                      : blockHeightPx(durationMin, gapMin, 30, HOUR_PX);
                    const showDetail = height >= 36;
                    if (p.overlay) {
                      return (
                        <button key={p.appt.id} onClick={(e) => { e.stopPropagation(); onApptClick(p.appt, true); }} style={{ top, height }}
                          className="absolute left-0.5 right-0.5 rounded-card px-2 py-1 text-left overflow-hidden bg-surface-hover/70 border border-divider opacity-70 hover:opacity-90">
                          <div className="text-label font-bold text-ink-muted truncate">{minToClock(p.appt.startMin)}</div>
                          <div className="text-label text-ink-muted truncate">Other clinician</div>
                        </button>
                      );
                    }
                    return (
                      <div
                        key={p.appt.id}
                        onMouseDown={(e) => (editable ? startDrag(e, p) : undefined)}
                        onClick={(e) => { e.stopPropagation(); if (!editable) onApptClick(p.appt); }}
                        style={{ top, height, zIndex: isDragging || isResizing ? 30 : undefined }}
                        className={`absolute left-0.5 right-0.5 px-2 py-1 text-left overflow-hidden ${editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} hover:shadow-md transition-shadow ${apptBlockClass(p.appt.status)} ${isDragging ? "shadow-lg ring-2 ring-info" : ""}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(p.appt.status)}`} />
                          {p.appt.isVideo && <Video className="w-3 h-3 text-ink-muted shrink-0" />}
                          <span className="text-label font-bold text-ink truncate">{p.appt.patient.name}</span>
                        </div>
                        {showDetail && <div className="text-label text-ink-muted truncate pl-3">{p.appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {durationMin}m</div>}
                        {editable && allowResize && (
                          <div onMouseDown={(e) => startResize(e, p)} className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize" />
                        )}
                      </div>
                    );
                  })}

                  {/* Micro-pill stack (Apple Calendar-style) — a dense hour
                      renders as a vertical flex column of up to
                      MAX_PILLS_PER_HOUR compact pills instead of
                      time-positioned blocks; anything past that folds into a
                      quiet "+N" caption. The stack's own container still
                      spans the FULL hour (never sized off item count), so
                      the grid keeps one uniform rectangle per hour. */}
                  {overflow.map((group) => {
                    const top = ((group.hourStartMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = HOUR_PX - 2;
                    const visiblePills = group.items.slice(0, MAX_PILLS_PER_HOUR);
                    const hiddenCount = group.items.length - visiblePills.length;
                    const isOpen = openOverflow?.colKey === col.key && openOverflow?.hourStartMin === group.hourStartMin;
                    return (
                      <div
                        key={`overflow-${group.hourStartMin}`}
                        style={{ top, height }}
                        className="absolute left-0.5 right-0.5 flex flex-col pt-0.5"
                      >
                        <div className="flex flex-col" style={{ gap: PILL_GAP }}>
                          {visiblePills.map((p) => (
                            <MicroPill key={p.appt.id} appt={p.appt} onClick={() => onApptClick(p.appt, p.overlay)} />
                          ))}
                        </div>
                        {hiddenCount > 0 && (
                          <button
                            ref={isOpen ? overflowAnchorRef : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              overflowAnchorRef.current = e.currentTarget;
                              setOpenOverflow(isOpen ? null : { colKey: col.key, hourStartMin: group.hourStartMin });
                            }}
                            className={`text-micro text-ink-muted text-center mt-0.5 ${isOpen ? "underline" : ""}`}
                          >
                            +{hiddenCount}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                );
              })}
            </div>

            {openOverflow && (() => {
              const group = [...columns].flatMap((col) =>
                col.key === openOverflow.colKey
                  ? clusterColumnByHour(
                      placed.filter((p) => p.colKey === col.key),
                      (p) => p.appt.startMin,
                      MAX_VISIBLE_PER_HOUR
                    ).overflow.filter((g) => g.hourStartMin === openOverflow.hourStartMin)
                  : []
              )[0];
              if (!group) return null;
              return (
                <FloatingPopover anchorRef={overflowAnchorRef} onClose={() => setOpenOverflow(null)}>
                  <div className="w-64 bg-surface border border-divider rounded-card shadow-xl py-1.5 max-h-72 overflow-y-auto">
                    <div className="px-3 pb-1.5 text-label font-bold text-ink-muted uppercase tracking-wider">
                      {minToClock(openOverflow.hourStartMin)}–{minToClock(openOverflow.hourStartMin + 60)} · {group.items.length} appointments
                    </div>
                    {group.items.map((p) => (
                      <button
                        key={p.appt.id}
                        onClick={() => { onApptClick(p.appt, p.overlay); setOpenOverflow(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="w-11 shrink-0 text-label font-semibold text-ink-muted tabular-nums">{minToClock(p.appt.startMin)}</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(p.appt.status)}`} />
                        {p.appt.isVideo && <Video className="w-3.5 h-3.5 text-ink-muted shrink-0" />}
                        <span className="min-w-0 flex-1 text-sm font-bold text-ink truncate">{p.appt.patient.name}</span>
                        <span className="shrink-0 text-label text-ink-muted">{p.appt.durationMin}m</span>
                      </button>
                    ))}
                  </div>
                </FloatingPopover>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
