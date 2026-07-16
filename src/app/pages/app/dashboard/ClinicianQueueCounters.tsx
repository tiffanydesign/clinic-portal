import React from "react";
import { FileSearch, FileCheck2, CalendarClock } from "lucide-react";
import { CLINICIAN_REVIEW_QUEUE, CLINICIAN_SIGNOFF_QUEUE } from "./clinicianDashboardData";

// Same semantic icon+tone vocabulary as the KPI bar (KpiBar.tsx's KPI_ICON/
// TONE_CLASS): amber for "awaiting review/sign-off" work, blue for the
// day's schedule — never a new palette invented for this row.
const TONE_CLASS: Record<"amber" | "blue", string> = {
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

function CounterIcon({ icon: Icon, tone }: { icon: React.ComponentType<{ className?: string }>; tone: "amber" | "blue" }) {
  return (
    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TONE_CLASS[tone]}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

// Three plain entry points into today's work, not a KPI-bar transplant: no
// sparkline, no vs-last-Friday delta, no locked/live pill, no range switcher.
// A queue count is a live fact ("this many things need you"), not a trend to
// contextualize — the Work Queue card right below carries the same Review
// number, so this is a read-only mirror, never a second data source.
function CounterButton({ icon, tone, label, value, sublabel, hasOverdue, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "blue";
  label: string;
  value: number;
  sublabel?: string;
  hasOverdue?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-0 flex items-center gap-3 text-left px-3 py-3 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset"
    >
      <CounterIcon icon={icon} tone={tone} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap leading-tight">{label}</span>
          {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />}
        </span>
        <span className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold text-gray-800 tabular-nums">{value}</span>
          {sublabel && <span className="text-xs font-medium text-gray-400 truncate">{sublabel}</span>}
        </span>
      </span>
    </button>
  );
}

// Awaiting Sign-off has no destination of its own on this dashboard anymore
// (Work Queue only shows Review) — a plain, non-interactive tile rather than
// a button that would silently go nowhere useful.
function CounterTile({ icon, tone, label, value, hasOverdue }: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "blue";
  label: string;
  value: number;
  hasOverdue?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-3 text-left px-3 py-3">
      <CounterIcon icon={icon} tone={tone} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-500 uppercase whitespace-nowrap leading-tight">{label}</span>
          {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />}
        </span>
        <span className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold text-gray-800 tabular-nums">{value}</span>
        </span>
      </span>
    </div>
  );
}

export function ClinicianQueueCounters({
  todaysCount,
  nextTimeLabel,
  onJumpToWorkQueue,
  onJumpToSchedule,
}: {
  todaysCount: number;
  nextTimeLabel: string | null;
  onJumpToWorkQueue: () => void;
  onJumpToSchedule: () => void;
}) {
  const reviewOverdue = CLINICIAN_REVIEW_QUEUE.some((q) => q.overdue);
  const signoffOverdue = CLINICIAN_SIGNOFF_QUEUE.some((q) => q.overdue);

  return (
    <div className="flex items-stretch bg-white border border-gray-200 rounded-xl divide-x divide-gray-200 overflow-hidden shadow-sm shrink-0">
      <CounterButton
        icon={FileSearch}
        tone="amber"
        label="Results to Review"
        value={CLINICIAN_REVIEW_QUEUE.length}
        hasOverdue={reviewOverdue}
        onClick={onJumpToWorkQueue}
      />
      <CounterTile
        icon={FileCheck2}
        tone="amber"
        label="Awaiting Sign-off"
        value={CLINICIAN_SIGNOFF_QUEUE.length}
        hasOverdue={signoffOverdue}
      />
      <CounterButton
        icon={CalendarClock}
        tone="blue"
        label="Today's Patients"
        value={todaysCount}
        sublabel={nextTimeLabel ? `next ${nextTimeLabel}` : "day complete"}
        onClick={onJumpToSchedule}
      />
    </div>
  );
}
