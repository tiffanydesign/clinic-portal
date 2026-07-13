import React from "react";

// Status Pill, DESIGN_STYLE.md §5.3 — full-round, 12%-opacity status-color
// fill, status-color text, leading icon/dot. Color never carries meaning
// alone; `icon` (or the default dot) always pairs with it.
export type FrostedStatus = "success" | "warning" | "danger" | "info" | "special";

const STATUS_COLOR: Record<FrostedStatus, string> = {
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  danger: "var(--status-danger)",
  info: "var(--status-info)",
  special: "var(--status-special)",
};

export function GlassStatusPill({ status, label, icon }: { status: FrostedStatus; label: string; icon?: React.ReactNode }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      {icon ?? <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {label}
    </span>
  );
}
