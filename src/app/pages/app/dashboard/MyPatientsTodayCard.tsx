import React, { useState } from "react";
import { CalendarClock, Activity, CheckCircle2, ChevronRight } from "lucide-react";
import { Stat, StatStripGroup } from "../../../components/stat";
import type { QueueItem, CompletedItem } from "./nurseDashboardData";
import { CompletedTodayDrawer } from "./CompletedTodayDrawer";

// The nurse rail's shift card. My Patients Today and Up Next used to be two
// separate cards stacked on top of each other, which split one thought —
// "how is the shift going, and who's next" — across two shells and two
// headers. Merged, the counters, the proportion of the day actually seen and
// the one patient she can start next read as a single object.
//
// The three counters stay the Stat family's T3 `strip` tier (same counter bar
// as the Clinician queue and the Staff / Timesheet summaries); their
// semantics ride on `iconTone`, which is the sanctioned channel — slate "not
// started", blue "in progress", emerald "done".

function ProgressProportion({ done, inProgress, remaining }: { done: number; inProgress: number; remaining: number }) {
  const total = done + inProgress + remaining;
  if (total === 0) return null;

  // Proportional widths, not a percentage fill: the point is the shape of the
  // shift — how much is behind her versus ahead — in the same three colours
  // the counters above it use.
  const segs = [
    { n: done, cls: "bg-success-fill" },
    { n: inProgress, cls: "bg-info-fill" },
    { n: remaining, cls: "bg-surface-sunken" },
  ].filter((s) => s.n > 0);

  return (
    <div className="flex gap-1">
      {segs.map((s, i) => (
        <div key={i} className={`h-1.5 rounded-full ${s.cls}`} style={{ flexGrow: s.n }} />
      ))}
    </div>
  );
}

export function MyPatientsTodayCard({
  scheduled, inProgress, done, next, locked, onStart, completed,
}: {
  scheduled: number;
  inProgress: number;
  done: number;
  next: QueueItem | null;
  locked: boolean;
  onStart: () => void;
  completed: CompletedItem[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const total = scheduled + inProgress + done;
  const seen = done + inProgress;
  const pct = total === 0 ? 0 : Math.round((seen / total) * 100);

  return (
    <div className="bg-surface rounded-card border border-divider shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-divider">
        <h3 className="text-sm font-bold text-ink">My Patients Today</h3>
        <span className="ml-auto text-xs text-ink-muted tabular-nums">{total} total</span>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        <StatStripGroup className="!shadow-none border border-divider">
          <Stat stat={{ id: "scheduled", label: "Scheduled", kind: "count", variant: "strip", value: String(scheduled) }} icon={CalendarClock} iconTone="slate" compact />
          <Stat stat={{ id: "in-progress", label: "In progress", kind: "count", variant: "strip", value: String(inProgress) }} icon={Activity} iconTone="blue" compact />
          <Stat stat={{ id: "completed", label: "Completed", kind: "count", variant: "strip", value: String(done) }} icon={CheckCircle2} iconTone="emerald" compact />
        </StatStripGroup>

        <ProgressProportion done={done} inProgress={inProgress} remaining={scheduled} />

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-muted tabular-nums">{seen} of {total} seen · {pct}%</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-0.5 text-xs font-semibold text-ink-muted hover:text-ink-soft transition-colors"
          >
            Completed today ({completed.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Up next — a tinted footer strip rather than its own card. The Start
          button is the rail's one primary action, so it sits at the card's
          foot where the eye lands after reading the counters. */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-page border-t border-divider">
        {next ? (
          <>
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-label font-bold text-ink-muted">Up next</span>
              <span className="text-sm font-bold text-ink truncate">{next.name}</span>
              <span className="text-xs text-ink-muted truncate">{next.time} · {next.type}</span>
            </div>
            <button
              onClick={onStart}
              disabled={locked}
              title={locked ? "Requires next patient check-in and current journey completion." : undefined}
              className={`ml-auto shrink-0 min-h-11 px-5 rounded-control text-xs font-bold transition-colors ${
                locked ? "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed" : "btn-primary"
              }`}
            >
              Start
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="text-label font-bold text-ink-muted">Up next</span>
            <span className="text-sm text-ink-muted">Nothing checked in yet</span>
          </div>
        )}
      </div>

      {drawerOpen && <CompletedTodayDrawer items={completed} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
