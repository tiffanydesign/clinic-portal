// Shared "row x day" grid vocabulary for the Availability page's People and
// Rooms tabs — one visual shell, two data sources (see AvailabilityGrid.tsx).
import type React from "react";

export type CellStatus = "normal" | "off" | "full" | "leave";

export type OverrideDetail = { by: string; at: string; reason: string };
export type BlockedSegment = { label: string };

export type GridCell = {
  status: CellStatus;
  offLabel?: string; // "off" status label override, e.g. "Closed" for a non-operating day on the Rooms tab (default "Off")
  // Heatmap input for "normal" cells only: 0 = almost fully booked (near-white),
  // 1 = fully free (lightest visibly-green tier). Fully Booked is its own
  // status, not ratio 0 on this scale — see AvailabilityGrid's tier note.
  freeRatio?: number;
  freeHours?: number; // numeric free hours, feeds the optional column summary row
  lines?: string[]; // primary shift time range(s) — 2 entries render as a double-shift cell
  freeLabel?: string; // secondary small text, e.g. "5h free" — never color-coded
  override?: OverrideDetail;
  blocked?: BlockedSegment[];
  onClick?: (e: React.MouseEvent) => void;
};

export type GridRow = {
  id: string;
  groupLabel?: string; // rendered as a group header above this row when it differs from the previous row's
  header: React.ReactNode;
  utilPct?: number; // Rooms tab only — row-end weekly utilisation
  cells: GridCell[]; // one per GridDay, same order
};

export type GridDay = { key: string; label: string; isToday: boolean };
