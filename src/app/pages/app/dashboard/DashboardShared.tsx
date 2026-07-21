import React from "react";

// Small shared building blocks for the Dashboard, matching the portal's
// existing card / pill / section language (slate primary, gray borders).

export function Section({
  title,
  action,
  subHeader,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  // Optional second, non-scrolling header row. Use for controls that belong to
  // the section but shouldn't be crammed onto the title line (e.g. category
  // filter chips) — keeps the title + its count clean on row one.
  subHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`border border-divider rounded-control bg-surface flex flex-col ${className}`}>
      <div className="h-12 border-b border-divider px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-ink text-sm flex items-center">{title}</h3>
        {action}
      </div>
      {subHeader && (
        <div className="px-4 py-2 border-b border-divider bg-surface-page/60 shrink-0">{subHeader}</div>
      )}
      <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center ml-2 text-label font-bold text-success-ink uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
      Live
    </span>
  );
}

export function StatusPill({
  status,
  type = "default",
}: {
  status: string;
  type?: "default" | "success" | "warning" | "error";
}) {
  let style = "bg-surface-hover border-divider text-ink-soft";
  if (type === "success") style = "bg-success/10 border-success/30 text-success-ink";
  if (type === "warning") style = "bg-warning/10 border-warning/30 text-warning-ink";
  if (type === "error") style = "bg-danger/10 border-danger/30 text-danger-ink";
  return (
    <span className={`px-2 py-0.5 border rounded-control text-overline whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}

// NOTE: Sparkline / DeltaLine / AnimatedNumber / sentimentFor used to live
// here. They moved to components/stat/trend.tsx — per the Stat family's
// discipline rule 1, trend rendering belongs to the T1 `card` tier alone and
// nothing outside that module should reach for it.
