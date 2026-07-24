import React from "react";
import { FileSearch, FileCheck2, CalendarClock } from "lucide-react";
import { Stat, StatStripGroup } from "../../../components/stat";
import { CLINICIAN_REVIEW_QUEUE, CLINICIAN_SIGNOFF_QUEUE } from "./clinicianDashboardData";

// Three plain entry points into today's work, rendered through the Stat
// family's T3 `strip` tier: no sparkline, no vs-last-Friday delta, no
// locked/live pill, no range switcher. A queue count is `count` semantics —
// a live fact ("this many things need you"), not a trend to contextualize —
// so per the family's discipline it may never be a T1 card.
//
// The Work Queue card right below carries the same Review number: this is a
// read-only mirror of the same source arrays, never a second data source.
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
    <StatStripGroup>
      <Stat
        stat={{
          id: "results-to-review",
          label: "Results",
          kind: "count",
          variant: "strip",
          value: String(CLINICIAN_REVIEW_QUEUE.length),
          alert: reviewOverdue,
          onClick: onJumpToWorkQueue,
        }}
        icon={FileSearch}
        iconTone="amber"
      />
      {/* Awaiting Sign-off has no destination of its own on this dashboard
          (Work Queue only shows Review) — no onClick, so the Stat renders as
          a plain div rather than a button that would silently go nowhere. */}
      <Stat
        stat={{
          id: "awaiting-sign-off",
          label: "Sign-off",
          kind: "count",
          variant: "strip",
          value: String(CLINICIAN_SIGNOFF_QUEUE.length),
          alert: signoffOverdue,
        }}
        icon={FileCheck2}
        iconTone="amber"
      />
      <Stat
        stat={{
          id: "todays-patients",
          label: "Patients",
          kind: "count",
          variant: "strip",
          value: String(todaysCount),
          suffix: nextTimeLabel ?? "done",
          onClick: onJumpToSchedule,
        }}
        icon={CalendarClock}
        iconTone="blue"
      />
    </StatStripGroup>
  );
}
