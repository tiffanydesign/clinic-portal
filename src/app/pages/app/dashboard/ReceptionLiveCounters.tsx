import React from "react";
import { Appt } from "./dashboardData";
import { CounterFilter, matchesFilter, parseCurrency, formatCurrency } from "./receptionDashboardData";

// Four plain live facts, not a KPI transplant: no trend, no vs-last-Friday
// delta, no range switcher. Each is also a filter toggle onto the single
// Front Desk Queue below — the same predicate drives both the count here
// and the rows shown there, so they can never drift apart.
function CounterButton({ label, value, sublabel, hasAlert, active, onClick }: {
  label: string;
  value: number;
  sublabel?: string;
  hasAlert?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 text-left px-5 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset ${active ? "bg-slate-50" : "hover:bg-gray-50"}`}
    >
      <span className="flex items-center gap-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? "text-slate-700" : "text-gray-500"}`}>{label}</span>
        {hasAlert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />}
      </span>
      <span className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-800 tabular-nums">{value}</span>
        {sublabel && <span className="text-xs font-medium text-gray-400 truncate">{sublabel}</span>}
      </span>
    </button>
  );
}

export function ReceptionLiveCounters({ appts, activeFilter, onToggleFilter }: {
  appts: Appt[];
  activeFilter: CounterFilter | null;
  onToggleFilter: (f: CounterFilter) => void;
}) {
  const awaiting = appts.filter((a) => matchesFilter(a, "awaiting"));
  const ready = appts.filter((a) => matchesFilter(a, "ready"));
  const inClinic = appts.filter((a) => matchesFilter(a, "in-clinic"));
  const unpaid = appts.filter((a) => matchesFilter(a, "unpaid"));
  const unpaidTotal = unpaid.reduce((sum, a) => sum + parseCurrency(a.balance), 0);

  return (
    <div className="flex items-stretch bg-white border border-gray-300 rounded-lg divide-x divide-gray-200 overflow-hidden shadow-sm">
      <CounterButton label="Awaiting Action" value={awaiting.length} hasAlert={awaiting.length > 0} active={activeFilter === "awaiting"} onClick={() => onToggleFilter("awaiting")} />
      <CounterButton label="Ready to Check In" value={ready.length} active={activeFilter === "ready"} onClick={() => onToggleFilter("ready")} />
      <CounterButton label="In Clinic" value={inClinic.length} active={activeFilter === "in-clinic"} onClick={() => onToggleFilter("in-clinic")} />
      <CounterButton label="Unpaid Today" value={unpaid.length} sublabel={formatCurrency(unpaidTotal)} active={activeFilter === "unpaid"} onClick={() => onToggleFilter("unpaid")} />
    </div>
  );
}
