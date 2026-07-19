// Canonical schema for the unified Stat component family.
//
// This module is the single source of truth for KPI/counter *shape* across
// the portal. It deliberately owns `TimeRange` (kpiRangeStore re-exports it)
// so the family never has to import types back out of a page module — the
// dependency always points components/ <- pages/, never the reverse.
//
// NOTE: this file describes shape only. Every number rendered through the
// family comes from an existing store or pure function (kpiData,
// receptionDashboardData, clinicianDashboardData, clinicUtilisationPct, ...).
// The components never compute, derive, or aggregate a value.

export type TimeRange = "today" | "7d" | "30d";

export type Trend = "up" | "down" | "flat";

/**
 * Data semantics — what kind of number this is.
 *
 * - `period`  A genuine period total. Value, comparison and sparkline all
 *             change with the selected range (e.g. Appointments).
 * - `live`    A live snapshot (e.g. In Clinic Now). The headline never
 *             changes with range; only the comparison line (which becomes an
 *             informational period average) and the sparkline's sampling do.
 * - `hybrid`  A metric whose *meaning* changes with range (Samples To Collect,
 *             a live backlog, becomes Samples Collected, a period total, at
 *             7d/30d). `label`/`inverse` may be overridden per range.
 * - `count`   An actionable to-do/queue count. No period concept; clicking it
 *             filters or deep-links. Never a trend narrative.
 */
export type StatKind = "period" | "live" | "hybrid" | "count";

/**
 * Presentation tier.
 *
 * - `card`   T1, <=96px. Trend-bearing. Range-switcher boards only.
 * - `tile`   T2, <=72px. Label + number, whole block drills down.
 * - `strip`  T3, <=56px. Single-row counter bar.
 * - `pill`   T4, inline. Pure count badge.
 */
export type StatVariant = "card" | "tile" | "strip" | "pill";

/** Emphasis tone for T4 pills (and the dot on T2/T3 `alert`). */
export type StatTone = "neutral" | "amber" | "red";

/**
 * Semantic icon tone for T1/T3. Not a status/trend indicator — the sparkline
 * and delta own that — just "what kind of thing is this number" at a glance.
 * Constrained to the app's existing 5-colour semantic set; never a new palette.
 */
export type StatIconTone = "emerald" | "amber" | "blue" | "red" | "slate";

export type RangeValue = {
  value: string;
  deltaText: string;
  trend: Trend;
  /** Today: 7 daily points · 7d: 8 weekly points · 30d: 6 monthly points */
  spark: number[];
  /** true => comparison line is a plain gray reference figure, no arrow */
  informational?: boolean;
  /** overrides the base label for this range (hybrid) */
  label?: string;
  /** overrides the stat-level `inverse` for this range (hybrid) */
  inverse?: boolean;
};

/**
 * One stat, any tier. `byRange` is only meaningful for period/live/hybrid;
 * `value` carries the simple count/live figure for count-kind stats.
 */
export type Stat = {
  id: string;
  /** base (Today) label */
  label: string;
  kind: StatKind;
  variant: StatVariant;
  /** "lower is better" — flips the up/down -> good/bad colour mapping */
  inverse?: boolean;
  /** T2/T3/T4 anomaly emphasis (amber + dot) */
  alert?: boolean;
  /** trailing context: "₺8,400" / "next 09:15" / "across 4 staff" */
  suffix?: string;
  /** longer-form description, surfaced by the Customise modal (T1) */
  desc?: string;
  /** drill-down target (may carry filter params) */
  route?: string;
  /** filter behaviour — use instead of `route`, not alongside it */
  onClick?: () => void;
  /** period/live/hybrid only */
  byRange?: Record<TimeRange, RangeValue>;
  /** count/live simple value */
  value?: string;
};

// --- Semantics -> tier discipline -------------------------------------------
//
// Enforced by convention + `assertStatDiscipline` below (dev-only warning),
// so a mis-tiered stat is caught at the call site rather than in review:
//
// 1. Sparklines and period-over-period deltas exist ONLY in T1, and T1 only
//    renders on boards that own a range switcher (Admin + Reception
//    dashboards). No other surface may render a trend line.
// 2. `count` may never use T1 — a to-do number has no trend narrative.
//    T3/T4 only.
// 3. `period`/`hybrid` may only use T1 — they are meaningless without the
//    range switcher that drives them.
// 4. `live` may use T1 (with a LIVE badge) or T3.
// 5. Every tier renders value AND label together; colour is always paired
//    with an icon, arrow or text — never carrying meaning on its own.

/**
 * Dev-only guard for the mapping rules above. No-ops in production.
 * Returns the offending rule text, or null when the pairing is legal.
 */
export function statDisciplineViolation(kind: StatKind, variant: StatVariant): string | null {
  if (kind === "count" && variant === "card") {
    return "`count` stats must not use the `card` tier — a to-do count has no trend narrative (use strip/pill).";
  }
  if ((kind === "period" || kind === "hybrid") && variant !== "card") {
    return `\`${kind}\` stats must use the \`card\` tier — they depend on the range switcher.`;
  }
  if (kind === "live" && (variant === "tile" || variant === "pill")) {
    return "`live` stats may only use the `card` or `strip` tier.";
  }
  return null;
}
