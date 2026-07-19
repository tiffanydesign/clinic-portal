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
    <div className={`border border-gray-300 rounded bg-white flex flex-col ${className}`}>
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm flex items-center">{title}</h3>
        {action}
      </div>
      {subHeader && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/60 shrink-0">{subHeader}</div>
      )}
      <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center ml-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
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
  let style = "bg-gray-100 border-gray-200 text-gray-600";
  if (type === "success") style = "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (type === "warning") style = "bg-orange-50 border-orange-200 text-orange-700";
  if (type === "error") style = "bg-red-50 border-red-200 text-red-700";
  return (
    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}

// NOTE: Sparkline / DeltaLine / AnimatedNumber / sentimentFor used to live
// here. They moved to components/stat/trend.tsx — per the Stat family's
// discipline rule 1, trend rendering belongs to the T1 `card` tier alone and
// nothing outside that module should reach for it.
