import React from "react";
import { ReceptionStats, StatKey, formatLira } from "./receptionDashboardData";

// Single-row replacement for the old 4-card KPI grid: label + number per
// item, no trend line, no period switcher — front desk only ever needs
// "how many, right now". A transparent border-b-2 renders even when
// inactive so the active state's accent underline never shifts row height.
function StatItem({ label, value, sub, warning, active, onClick }: {
  label: string; value: number; sub?: string; warning?: boolean; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 min-w-0 min-h-[44px] flex flex-col items-start justify-center gap-0.5 px-4 border-b-2 transition-colors hover:bg-gray-50/60 ${
        active ? "border-slate-600" : "border-transparent"
      }`}
    >
      <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${active ? "text-slate-600" : "text-gray-400"}`}>
        {label}
      </span>
      <span className={`text-xl font-semibold leading-none flex items-center gap-1.5 ${warning ? "text-amber-600" : active ? "text-slate-800" : "text-gray-800"}`}>
        {warning && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
        {value}
        {sub && <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{sub}</span>}
      </span>
    </button>
  );
}

export function StatStrip({ stats, active, onSelect }: {
  stats: ReceptionStats;
  active: StatKey | null;
  onSelect: (key: StatKey) => void;
}) {
  return (
    <div className="flex items-stretch divide-x divide-gray-200 border border-gray-200 rounded-xl bg-white shadow-sm">
      <StatItem label="Appointments" value={stats.appointments} active={active === "appointments"} onClick={() => onSelect("appointments")} />
      <StatItem label="In Clinic" value={stats.inClinic} active={active === "in-clinic"} onClick={() => onSelect("in-clinic")} />
      <StatItem label="Awaiting Check In" value={stats.awaitingCheckIn} active={active === "awaiting-checkin"} onClick={() => onSelect("awaiting-checkin")} />
      <StatItem
        label="Unpaid"
        value={stats.unpaidCount}
        sub={stats.unpaidCount > 0 ? `(${formatLira(stats.unpaidAmount)})` : undefined}
        warning={stats.unpaidCount > 0}
        active={active === "unpaid"}
        onClick={() => onSelect("unpaid")}
      />
    </div>
  );
}
