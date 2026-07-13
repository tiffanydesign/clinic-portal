import React from "react";
import { CLINICIAN_REVIEW_QUEUE, CLINICIAN_SIGNOFF_QUEUE } from "./clinicianDashboardData";

// Three plain entry points into today's work, not a KPI-bar transplant: no
// sparkline, no vs-last-Friday delta, no locked/live pill, no range switcher.
// A queue count is a live fact ("this many things need you"), not a trend to
// contextualize — the Work Queue card and Schedule list right below carry the
// same numbers, so these are read-only mirrors, never a second data source.
function CounterButton({ label, value, sublabel, hasOverdue, onClick }: {
  label: string;
  value: number;
  sublabel?: string;
  hasOverdue?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-0 text-left px-5 py-3.5 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset"
    >
      <span className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />}
      </span>
      <span className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-800 tabular-nums">{value}</span>
        {sublabel && <span className="text-xs font-medium text-gray-400 truncate">{sublabel}</span>}
      </span>
    </button>
  );
}

export function ClinicianQueueCounters({
  todaysCount,
  nextTimeLabel,
  onSelectQueueTab,
  onJumpToSchedule,
}: {
  todaysCount: number;
  nextTimeLabel: string | null;
  onSelectQueueTab: (tab: "review" | "signoff") => void;
  onJumpToSchedule: () => void;
}) {
  const reviewOverdue = CLINICIAN_REVIEW_QUEUE.some((q) => q.overdue);
  const signoffOverdue = CLINICIAN_SIGNOFF_QUEUE.some((q) => q.overdue);

  return (
    <div className="flex items-stretch bg-white border border-gray-300 rounded-lg divide-x divide-gray-200 overflow-hidden shadow-sm">
      <CounterButton
        label="Results to Review"
        value={CLINICIAN_REVIEW_QUEUE.length}
        hasOverdue={reviewOverdue}
        onClick={() => onSelectQueueTab("review")}
      />
      <CounterButton
        label="Awaiting Sign-off"
        value={CLINICIAN_SIGNOFF_QUEUE.length}
        hasOverdue={signoffOverdue}
        onClick={() => onSelectQueueTab("signoff")}
      />
      <CounterButton
        label="Today's Patients"
        value={todaysCount}
        sublabel={nextTimeLabel ? `next ${nextTimeLabel}` : "day complete"}
        onClick={onJumpToSchedule}
      />
    </div>
  );
}
