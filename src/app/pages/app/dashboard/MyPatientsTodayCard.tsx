import React from "react";
import { CalendarClock, Activity, CheckCircle2 } from "lucide-react";
import { Stat, StatStripGroup } from "../../../components/stat";

// The three segments are `count` semantics rendered through the Stat family's
// T3 `strip` tier — the same bar the Clinician queue counters and the Staff /
// Timesheet summaries use. Tone rides on the semantic icon (slate "not
// started" / blue "in progress" / emerald "done"), never on the number alone.
export function MyPatientsTodayCard({ scheduled, inProgress, done }: { scheduled: number; inProgress: number; done: number }) {
  const total = scheduled + inProgress + done;
  return (
    <div className="bg-surface rounded-card p-5 shrink-0">
      <div className="flex items-baseline justify-between mb-3.5">
        <h3 className="text-base font-extrabold text-ink">My Patients Today</h3>
        <span className="text-xs font-semibold text-ink-muted">{total} total</span>
      </div>
      <StatStripGroup>
        <Stat
          stat={{ id: "scheduled", label: "Scheduled", kind: "count", variant: "strip", value: String(scheduled) }}
          icon={CalendarClock}
          iconTone="slate"
        />
        <Stat
          stat={{ id: "in-progress", label: "In progress", kind: "count", variant: "strip", value: String(inProgress) }}
          icon={Activity}
          iconTone="blue"
        />
        <Stat
          stat={{ id: "completed", label: "Completed", kind: "count", variant: "strip", value: String(done) }}
          icon={CheckCircle2}
          iconTone="emerald"
        />
      </StatStripGroup>
    </div>
  );
}
