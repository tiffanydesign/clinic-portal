import React from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Stat as StatConfig, StatIconTone, StatTone, TimeRange } from "./types";
import { statDisciplineViolation } from "./types";
import { Sparkline, DeltaLine, AnimatedNumber } from "./trend";

// =============================================================================
// Stat — the portal's single KPI / counter component family.
//
// Four tiers, one schema (see ./types.ts). Every number rendered here comes
// from an existing store or pure function; this component NEVER computes,
// derives or aggregates a value.
//
// Semantics -> tier discipline (enforced by statDisciplineViolation in dev):
//   1. Sparklines + period-over-period deltas exist ONLY in T1 `card`, and
//      `card` only renders on boards owning a range switcher (Admin +
//      Reception dashboards).
//   2. `count` may never be `card`  -> strip/pill only.
//   3. `period`/`hybrid` may only be `card` (they need the range switcher).
//   4. `live` may be `card` (LIVE badge) or `strip`.
//   5. Every tier renders value AND label together; colour never carries
//      meaning alone — always paired with an icon, arrow, dot or text.
//
// Height budgets (measured against these classes):
//   card <=128px · tile <=72px · strip <=56px · pill inline
// (card budget widened 96->128px in the 2026-07-24 v3 spacing pass: KPI
// padding 16px all sides, 24px icon, 12px title->value gap per the new
// KPI Card spec — see KPI_CARD_SPEC.md.)
//
// -----------------------------------------------------------------------------
// Examples
//
// T1 — Admin/Reception dashboard KPI card (period, drills down at 7d/30d):
//   <Stat
//     stat={{ id: "appts-today", label: "Appointments Today", kind: "period",
//             variant: "card", byRange: APPTS_BY_RANGE, route: "/calendar/schedule" }}
//     range={range} locked icon={CalendarClock} iconTone="blue"
//     onOpen={(route) => navigate(route)}
//   />
//
// T2 — Staff Overview drill-down tile (count, amber when backing up):
//   <Stat stat={{ id: "results-awaiting", label: "Results Awaiting", kind: "count",
//                 variant: "tile", value: String(n), alert: n > 0,
//                 onClick: goPatients }} />
//
// T3 — queue/summary strip item (count, filters the list below):
//   <StatStripGroup>
//     <Stat stat={{ id: "review", label: "Results to Review", kind: "count",
//                   variant: "strip", value: "5", alert: true,
//                   onClick: jumpToWorkQueue }} icon={FileSearch} iconTone="amber" />
//   </StatStripGroup>
//
// T4 — inline count badge on a tab:
//   <Stat stat={{ id: "leave", label: "Leave", kind: "count",
//                 variant: "pill", value: "2" }} tone="amber" />
// =============================================================================

const ICON_TONE_CLASS: Record<StatIconTone, string> = {
  emerald: "bg-success/10 text-success-ink",
  amber: "bg-warning/10 text-warning-ink",
  blue: "bg-info/10 text-info-ink",
  red: "bg-danger/10 text-danger-ink",
  slate: "bg-surface-hover text-ink-muted",
};

const PILL_TONE_CLASS: Record<StatTone, string> = {
  neutral: "bg-surface-hover text-ink-soft",
  amber: "bg-warning/15 text-warning-ink",
  red: "bg-danger/15 text-danger-ink",
};

const PILL_DOT_CLASS: Record<StatTone, string> = {
  neutral: "bg-ink-muted",
  amber: "bg-warning-ink",
  red: "bg-danger-ink",
};

// Solid-fill counterpart to ICON_TONE_CLASS's tinted chip, for `strip`
// `compact` mode's tone dot (see below).
const ICON_TONE_DOT_CLASS: Record<StatIconTone, string> = {
  emerald: "bg-success-ink",
  amber: "bg-warning-ink",
  blue: "bg-info-ink",
  red: "bg-danger-ink",
  slate: "bg-ink-muted",
};

// Dev-only nudge when a call site breaks the semantics -> tier mapping.
function useDisciplineWarning(stat: StatConfig) {
  const violation = statDisciplineViolation(stat.kind, stat.variant);
  if (violation && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[Stat:${stat.id}] ${violation}`);
  }
}

export type StatProps = {
  stat: StatConfig;
  /** T1 only — which range's RangeValue to render. */
  range?: TimeRange;
  /** T1 only — renders the clinic-set lock affordance. */
  locked?: boolean;
  /** T1 only — Today's cards are a live glance, not a drill-down entry. */
  clickable?: boolean;
  /** T1/T3 — semantic icon. Not a status indicator; "what kind of thing is this". */
  icon?: LucideIcon;
  iconTone?: StatIconTone;
  /** T4 only — emphasis tone. */
  tone?: StatTone;
  /** T4 only — prefix the count with a tone-matched dot. */
  dot?: boolean;
  /** T3 only — active item gets an accent underline. */
  active?: boolean;
  /** T3 only — narrow-container layout: value stacked above label instead of
   * inline, icon swapped for a small tone dot. Use where a strip group sits
   * in a fixed-width sidebar column rather than the main content area. */
  compact?: boolean;
  /** T1 only — drill-down handler; receives stat.route. */
  onOpen?: (route?: string) => void;
};

export function Stat(props: StatProps) {
  useDisciplineWarning(props.stat);
  switch (props.stat.variant) {
    case "card": return <StatCard {...props} />;
    case "tile": return <StatTile {...props} />;
    case "strip": return <StatStripItem {...props} />;
    case "pill": return <StatPill {...props} />;
  }
}

// --- T1 `card` (<=96px) ------------------------------------------------------
// Trend-bearing tier. Layout is intentionally: [icon | label+number | badge+
// sparkline] with the delta caption on its own full-width row underneath —
// at a true 4-up layout (~254px cards) a long caption like "vs previous 30
// days" collides with the 28px headline if packed into the right zone.
function StatCard({ stat, range = "today", locked, clickable, icon, iconTone, onOpen }: StatProps) {
  const rv = stat.byRange?.[range];
  if (!rv) return null;

  const label = rv.label ?? stat.label;
  const isLive = stat.kind === "live";
  const pillText = isLive ? "Live" : RANGE_PILL[range];
  const inverse = rv.inverse ?? stat.inverse ?? false;
  const Icon = icon;
  const interactive = clickable ?? true;

  return (
    <button
      onClick={interactive ? () => onOpen?.(stat.route) : undefined}
      className={`text-left rounded-control bg-surface p-4 min-h-[104px] max-h-32 flex flex-col gap-2 relative transition-all ${
        interactive ? "hover:shadow-sm cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 ${ICON_TONE_CLASS[iconTone ?? "blue"]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <span className="text-overline leading-tight truncate">{label}</span>
          <div className="kpi-value-lg font-semibold text-ink leading-none">
            <AnimatedNumber value={rv.value} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-control text-overline shrink-0 ${
                isLive ? "bg-success/10 text-success-ink" : "bg-surface-hover text-ink-soft"
              }`}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
              {pillText}
            </span>
            {locked && (
              <span className="relative group/lock shrink-0">
                <Lock className="w-3.5 h-3.5 text-ink-muted" />
                <span className="absolute right-0 top-full mt-1 w-44 bg-ink text-white text-label font-medium normal-case tracking-normal px-2.5 py-1.5 rounded-control shadow-lg opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-20">
                  Default metric — set by your clinic
                </span>
              </span>
            )}
          </div>
          {/* `live` in T1 shows no trend meaning — the sparkline renders neutral
              and the delta line falls back to informational gray (no arrow). */}
          <Sparkline
            data={rv.spark}
            trend={rv.trend}
            inverse={inverse}
            sentiment={rv.informational ? "neutral" : undefined}
            width={72}
            height={28}
          />
        </div>
      </div>

      <DeltaLine text={rv.deltaText} trend={rv.trend} inverse={inverse} informational={rv.informational} />
    </button>
  );
}

// --- T2 `tile` (<=72px) ------------------------------------------------------
// Label + number, whole block drills down. No trend, no badge.
function StatTile({ stat }: StatProps) {
  const handler = stat.onClick ?? undefined;
  const nav = useNavigate();
  const onActivate = handler ?? (stat.route ? () => nav(stat.route!) : undefined);
  const Tag = onActivate ? "button" : "div";

  return (
    <Tag
      onClick={onActivate}
      className={`w-full min-h-[44px] max-h-[72px] text-left bg-surface rounded-card px-5 py-3 transition-colors ${
        onActivate ? "hover:shadow-md cursor-pointer" : ""
      }`}
    >
      <div className="text-overline truncate">{stat.label}</div>
      <div className={`text-2xl font-semibold leading-tight mt-1 flex items-center gap-2 ${stat.alert ? "text-warning-ink" : "text-ink"}`}>
        <span className="tabular-nums">{stat.value}</span>
        {stat.alert && <span className="w-1.5 h-1.5 rounded-full bg-warning-ink shrink-0" aria-hidden />}
      </div>
    </Tag>
  );
}

/**
 * T3 container — a single bordered bar; children are `strip` Stats.
 * Items are separated by hairlines and stretch to equal width.
 */
export function StatStripGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-stretch bg-surface rounded-card shadow-sm divide-x divide-divider overflow-hidden shrink-0 ${className}`}>
      {children}
    </div>
  );
}

// --- T3 `strip` (<=56px) -----------------------------------------------------
// Single-row counter. 20px/600 number + 12px label + optional suffix/icon.
// Clickable items filter or deep-link; the active item gets an accent underline.
function StatStripItem({ stat, icon, iconTone, active, compact }: StatProps) {
  const nav = useNavigate();
  const onActivate = stat.onClick ?? (stat.route ? () => nav(stat.route!) : undefined);
  const Icon = icon;
  const Tag = onActivate ? "button" : "div";
  const activeCls = active ? "border-ink" : "border-transparent";
  const hoverCls = onActivate ? "hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-inset" : "";

  // A 3-4 wide strip group in a fixed sidebar column doesn't have the width
  // for icon + inline number + label — that combination truncates the label
  // (see My Patients Today). Stacking the label under the value instead of
  // beside it gives the label its own full-width line, and a tone dot
  // replaces the 28px icon chip.
  if (compact) {
    return (
      <Tag
        onClick={onActivate}
        className={`flex-1 min-w-0 min-h-[52px] max-h-14 flex flex-col justify-center gap-0.5 text-left px-3 py-2 border-b-2 transition-colors ${activeCls} ${hoverCls}`}
      >
        <span className="flex items-center gap-1.5">
          <span className={`text-xl font-semibold tabular-nums leading-none ${stat.alert ? "text-warning-ink" : "text-ink"}`}>
            {stat.value}
          </span>
          {iconTone && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ICON_TONE_DOT_CLASS[iconTone]}`} aria-hidden />}
          {stat.alert && <span className="w-1.5 h-1.5 rounded-full bg-warning-ink shrink-0" aria-hidden />}
        </span>
        <span className="text-xs font-medium text-ink-muted truncate">{stat.label}</span>
      </Tag>
    );
  }

  return (
    <Tag
      onClick={onActivate}
      className={`flex-1 min-w-0 min-h-[52px] max-h-14 flex items-center gap-2.5 text-left px-4 py-2 border-b-2 transition-colors ${activeCls} ${hoverCls}`}
    >
      {Icon && (
        <span className={`w-7 h-7 rounded-control flex items-center justify-center shrink-0 ${ICON_TONE_CLASS[iconTone ?? "slate"]}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      )}
      <span className="min-w-0 flex items-baseline gap-1.5">
        <span className={`text-xl font-semibold tabular-nums leading-none shrink-0 ${stat.alert ? "text-warning-ink" : "text-ink"}`}>
          {stat.value}
        </span>
        <span className="text-xs font-medium text-ink-muted truncate">{stat.label}</span>
        {stat.alert && <span className="w-1.5 h-1.5 rounded-full bg-warning-ink shrink-0 self-center" aria-hidden />}
        {stat.suffix && <span className="text-overline font-medium text-ink-muted truncate">{stat.suffix}</span>}
      </span>
    </Tag>
  );
}

// --- T4 `pill` (inline) ------------------------------------------------------
// Pure count badge for tabs, queue groups and row-end figures. The host
// supplies the visible label, so `stat.label` rides along as the accessible
// name rather than being rendered twice.
function StatPill({ stat, tone = "neutral", dot }: StatProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-label font-bold tabular-nums shrink-0 ${PILL_TONE_CLASS[tone]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${PILL_DOT_CLASS[tone]}`} aria-hidden />}
      {stat.value}
      <span className="sr-only"> {stat.label}</span>
    </span>
  );
}

// Range pill text lives here (not kpiRangeStore) so the family owns every
// string it renders.
const RANGE_PILL: Record<TimeRange, string> = { today: "Today", "7d": "7d", "30d": "30d" };
