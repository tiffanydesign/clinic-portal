import React from "react";

// Small shared building blocks for the Dashboard, matching the portal's
// existing card / pill / section language (slate primary, gray borders).

export function Section({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
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

// Compact inline SVG sparkline for the last 7 days of a KPI.
export function Sparkline({
  data,
  trend = "up",
  width = 60,
  height = 22,
}: {
  data: number[];
  trend?: "up" | "down" | "flat";
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke =
    trend === "down" ? "#dc2626" : trend === "flat" ? "#94a3b8" : "#059669";
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2} fill={stroke} />
    </svg>
  );
}

// The ↑/↓ comparison line under each KPI value.
export function DeltaLine({ text, trend }: { text: string; trend: "up" | "down" | "flat" }) {
  const color = trend === "down" ? "text-red-600" : trend === "flat" ? "text-gray-400" : "text-emerald-600";
  const arrow = trend === "down" ? "↓" : trend === "flat" ? "→" : "↑";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {text}
    </span>
  );
}
