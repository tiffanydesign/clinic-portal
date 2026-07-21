// Trend primitives for the Stat family's T1 (`card`) tier.
//
// Moved verbatim from pages/app/dashboard/DashboardShared.tsx (behaviour
// unchanged) so they live beside the only tier allowed to render them —
// per the family's discipline rule 1, sparklines and period-over-period
// deltas exist ONLY in T1. Nothing outside this module should import them.

import React, { useEffect, useRef, useState } from "react";
import type { Trend } from "./types";

export type Sentiment = "good" | "bad" | "neutral";

// For most stats "up" is good and "down" is bad. A handful of backlog/negative
// indicators (No Show Rate, Average Wait, Results Pending, ...) are the
// opposite — pass inverse=true so a falling value reads as good (green).
export function sentimentFor(trend: Trend, inverse = false): Sentiment {
  if (trend === "flat") return "neutral";
  const rising = trend === "up";
  return rising !== inverse ? "good" : "bad";
}

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  good: "var(--status-success)",
  bad: "var(--status-danger)",
  neutral: "var(--text-muted)",
};

/** Compact inline SVG sparkline for a stat's recent history. */
export function Sparkline({
  data,
  trend = "up",
  sentiment,
  inverse = false,
  width = 60,
  height = 22,
}: {
  data: number[];
  trend?: Trend;
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

// The up/down comparison line under each stat value. `informational` renders
// plain gray text with no arrow — used for a live metric's "avg X over
// period" line, which is a reference figure, not a trend judgement.
// Colour is never alone: every sentiment ships with its arrow glyph.
export function DeltaLine({
  text,
  trend,
  inverse = false,
  informational = false,
}: {
  text: string;
  trend: Trend;
  inverse?: boolean;
  informational?: boolean;
}) {
  if (informational) {
    return <span className="text-xs font-medium text-ink-muted">{text}</span>;
  }
  const sentiment = sentimentFor(trend, inverse);
  const color = sentiment === "bad" ? "text-danger-ink" : sentiment === "neutral" ? "text-ink-muted" : "text-success-ink";
  const arrow = trend === "down" ? "↓" : trend === "flat" ? "—" : "↑";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {text}
    </span>
  );
}

// Animates the leading number in a value string (e.g. "78%", "12 min", "14")
// from its previous value to the next over ~300ms. Falls back to an instant
// snap for values it can't parse (e.g. "3/5") or under reduced-motion.
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
