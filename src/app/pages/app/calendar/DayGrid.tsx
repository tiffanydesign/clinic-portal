import React, { useRef, useState } from "react";
import { Video } from "lucide-react";
import {
  Appt, TimeBlock, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./scheduleData";

export type GridColumn = { key: string; title: string; sub?: string; avatar?: string; count?: number; muted?: boolean };
export type PlacedAppt = { appt: Appt; colKey: string; overlay?: boolean };
export type PlacedBlock = { block: TimeBlock; colKey: string };

const SNAP = 15; // minutes
const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const MIN_MIN = DAY_START_HOUR * 60;
const MAX_MIN = DAY_END_HOUR * 60;

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
  onEmptyClick?: (colKey: string, startMin: number) => void;
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
    onEmptyClick(colKey, Math.min(MAX_MIN - 30, startMin));
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-md bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* column headers */}
      <div className="flex border-b border-gray-200 bg-gradient-to-b from-gray-50 to-gray-50/50 shrink-0 pl-14 relative z-10 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {columns.map((c) => (
          <div key={c.key} className={`flex-1 px-2 py-2.5 text-center border-l border-gray-200 min-w-0 ${c.muted ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-center gap-1.5">
              {c.avatar && <span className="w-6 h-6 rounded-full bg-white ring-1 ring-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">{c.avatar}</span>}
              <span className="text-xs font-bold text-gray-700 truncate">{c.title}</span>
            </div>
            {c.sub && <div className="text-[10px] text-gray-400 truncate mt-0.5">{c.sub}</div>}
            {c.count !== undefined && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-[9px] font-bold text-gray-500 tabular-nums">
                {c.count} appt{c.count === 1 ? "" : "s"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* hour gutter */}
          <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/40">
            {/* alternating hour bands — a light rhythm that helps the eye
                track a row across the full grid width without adding noise */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-100/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {hours.map((h, i) => (
              <div key={h} className="absolute right-2 text-[10px] font-semibold text-gray-500 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>{i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</div>
            ))}
            {showNow && (
              <span className="absolute right-1.5 z-20 text-[9px] font-bold text-white bg-red-500 rounded px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
                {minToClock(NOW_MINUTES)}
              </span>
            )}
          </div>

          {/* columns area */}
          <div ref={contentRef} className="flex-1 relative">
            {/* alternating hour bands, matching the gutter's rhythm */}
            {hours.map((h, i) => i % 2 === 1 && (
              <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-50/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
            ))}
            {/* half-hour gridlines */}
            {Array.from({ length: halfRows + 1 }).map((_, i) => (
              <div key={i} className={`absolute left-0 right-0 ${i % 2 === 0 ? "border-t border-gray-200" : "border-t border-dashed border-gray-100"}`} style={{ top: (i * HOUR_PX) / 2 }} />
            ))}
            {/* now line */}
            {showNow && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                <div className="relative border-t-2 border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]">
                  <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </div>
              </div>
            )}

            <div className="flex h-full">
              {columns.map((col) => {
                const colItems = placed.filter((p) => p.colKey === col.key);
                return (
                <div key={col.key} className="flex-1 relative border-l border-gray-200" onClick={(e) => colBackgroundClick(e, col.key)}>
                  {/* blocked time */}
                  {blocks.filter((b) => b.colKey === col.key).map(({ block }) => {
                    const top = ((block.startMin - MIN_MIN) / 60) * HOUR_PX;
                    const height = Math.max(24, (block.durationMin / 60) * HOUR_PX - 2);
                    return (
                      <div key={block.id} style={{ top, height }} className="absolute left-0.5 right-0.5 rounded-lg bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_6px,#e5e7eb_6px,#e5e7eb_12px)] border border-gray-300 px-2 py-1 overflow-hidden">
                        <div className="text-[10px] font-bold text-gray-500 truncate">{block.reason}</div>
                        <div className="text-[9px] text-gray-400 truncate">Blocked</div>
                      </div>
                    );
                  })}

                  {/* appointments */}
                  {colItems.map((p) => {
                    const isDragging = drag?.id === p.appt.id;
                    const isResizing = resize?.id === p.appt.id;
                    const startMin = isDragging ? drag!.startMin : p.appt.startMin;
                    const durationMin = isResizing ? resize!.durationMin : p.appt.durationMin;
                    const top = ((startMin - MIN_MIN) / 60) * HOUR_PX;
                    const gapMin = isDragging || isResizing ? undefined : gapToNext(colItems.map((o) => o.appt), startMin);
                    const height = blockHeightPx(durationMin, gapMin);
                    const showDetail = height >= 36;
                    if (p.overlay) {
                      return (
                        <button key={p.appt.id} onClick={(e) => { e.stopPropagation(); onApptClick(p.appt, true); }} style={{ top, height }}
                          className="absolute left-0.5 right-0.5 rounded-lg px-2 py-1 text-left overflow-hidden bg-gray-100/70 border border-gray-200 opacity-70 hover:opacity-90">
                          <div className="text-[10px] font-bold text-gray-500 truncate">{minToClock(p.appt.startMin)}</div>
                          <div className="text-[9px] text-gray-400 truncate">Other clinician</div>
                        </button>
                      );
                    }
                    return (
                      <div
                        key={p.appt.id}
                        onMouseDown={(e) => (editable ? startDrag(e, p) : undefined)}
                        onClick={(e) => { e.stopPropagation(); if (!editable) onApptClick(p.appt); }}
                        style={{ top, height, zIndex: isDragging || isResizing ? 30 : undefined }}
                        className={`absolute left-0.5 right-0.5 px-2 py-1 text-left overflow-hidden ${editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} hover:shadow-md transition-shadow ${apptBlockClass(p.appt.status)} ${isDragging ? "shadow-lg ring-2 ring-slate-400" : ""}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(p.appt.status)}`} />
                          {p.appt.isVideo && <Video className="w-3 h-3 text-slate-500 shrink-0" />}
                          <span className="text-[11px] font-bold text-gray-800 truncate">{p.appt.patient.name}</span>
                        </div>
                        {showDetail && <div className="text-[10px] text-gray-500 truncate pl-3">{p.appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {durationMin}m</div>}
                        {editable && allowResize && (
                          <div onMouseDown={(e) => startResize(e, p)} className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize" />
                        )}
                      </div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
