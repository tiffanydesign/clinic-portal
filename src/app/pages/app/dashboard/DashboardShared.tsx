import React, { useEffect, useRef, useState } from "react";

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

export type Sentiment = "good" | "bad" | "neutral";

// For most KPIs "up" is good and "down" is bad. A handful of backlog/negative
// indicators (No Show Rate, Average Wait, ...) are the opposite — pass
// inverse=true so a falling value reads as good (green) rather than bad.
export function sentimentFor(trend: "up" | "down" | "flat", inverse = false): Sentiment {
  if (trend === "flat") return "neutral";
  const rising = trend === "up";
  return rising !== inverse ? "good" : "bad";
}

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  good: "#059669",
  bad: "#dc2626",
  neutral: "#94a3b8",
};

// Compact inline SVG sparkline for a KPI's recent history.
export function Sparkline({
  data,
  trend = "up",
  sentiment,
  inverse = false,
  width = 60,
  height = 22,
}: {
  data: number[];
  trend?: "up" | "down" | "flat";
  sentiment?: Sentiment;
  inverse?: boolean;
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
  const stroke = SENTIMENT_COLOR[sentiment ?? sentimentFor(trend, inverse)];
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2} fill={stroke} />
    </svg>
  );
}

// The ↑/↓ comparison line under each KPI value. `informational` renders
// plain gray text with no arrow — used for a live metric's "avg X over
// period" line, which is a reference figure, not a trend judgement.
export function DeltaLine({
  text,
  trend,
  inverse = false,
  informational = false,
}: {
  text: string;
  trend: "up" | "down" | "flat";
  inverse?: boolean;
  informational?: boolean;
}) {
  if (informational) {
    return <span className="text-xs font-medium text-gray-400">{text}</span>;
  }
  const sentiment = sentimentFor(trend, inverse);
  const color = sentiment === "bad" ? "text-red-600" : sentiment === "neutral" ? "text-gray-400" : "text-emerald-600";
  const arrow = trend === "down" ? "↓" : trend === "flat" ? "—" : "↑";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {text}
    </span>
  );
}

// Animates the leading number in a KPI value string (e.g. "78%", "12 min",
// "14") from its previous value to the next over ~300ms. Falls back to an
// instant snap for values it can't parse (e.g. "3/5") or when the user has
// requested reduced motion.
export function AnimatedNumber({ value, durationMs = 300 }: { value: string; durationMs?: number }) {
  const match = value.match(/^(\D*)([\d.]+)(.*)$/);
  const [display, setDisplay] = useState(value);
  const prevNumRef = useRef<number | null>(match ? parseFloat(match[2]) : null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!match) { setDisplay(value); return; }
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const from = prevNumRef.current ?? target;
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (from === target || reduceMotion) {
      setDisplay(value);
      prevNumRef.current = target;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      const current = from + (target - from) * eased;
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevNumRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}
