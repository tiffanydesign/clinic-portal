import React, { useState } from "react";
import { CalendarClock, Activity, CheckCircle2, ChevronRight, Play } from "lucide-react";
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
// started", blue "in progress", emerald "done". The strip runs full-bleed
// between two hairlines rather than inside its own bordered box: a bordered
// card nested one border deep inside another card spends ~10px of the rail's
// width on chrome that draws no distinction the hairlines don't already make.

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

// Up next — the card's own foot, on the SAME white as the card above it.
// It used to be filled with --surface-page, which is the exact colour of the
// page behind the rail: the card appeared to end after the counters and this
// block read as loose furniture floating on the background, with a
// --surface-hover Start button on it that was near-invisible against the fill.
// White keeps the card one solid object, so the only thing carrying emphasis
// down here is the button itself.
function UpNext({
  next, locked, onStart,
}: {
  next: QueueItem | null; locked: boolean; onStart: () => void;
}) {
  if (!next) {
    return (
      <div className="px-4 py-2.5 border-t border-divider flex items-center gap-2">
        <span className="text-label font-bold text-ink-muted">Up next</span>
        <span className="text-sm text-ink-muted">Nothing checked in yet</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 border-t border-divider flex items-center gap-3">
      {/* Two lines, not three: the label rides above, and the name and its
          time/type share one line the way the schedule rows below already
          pair them. */}
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-label font-bold text-ink-muted">Up next</span>
        <span className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-bold text-ink truncate">{next.name}</span>
          <span className="text-xs text-ink-muted tabular-nums truncate">{next.time} · {next.type}</span>
        </span>
      </div>
      <button
        onClick={onStart}
        disabled={locked}
        title={locked ? "Requires next patient check-in and current journey completion." : undefined}
        className={`ml-auto shrink-0 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-control text-xs font-bold transition-colors ${
          locked
            // Button.tsx's own DISABLED_CLASS verbatim, so this reads as the
            // same disabled control as every other button in the portal. It
            // only looked invisible before because the strip behind it was
            // filled --surface-page, a shade off --surface-hover; on the
            // card's white it lands correctly.
            ? "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
            : "btn-primary shadow-sm"
        }`}
      >
        {!locked && <Play className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />}
        Start
      </button>
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
    <div className="bg-surface rounded-card border border-divider shadow-sm shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <h3 className="text-sm font-bold text-ink">My Patients Today</h3>
        <span className="ml-auto text-xs text-ink-muted tabular-nums">{total} total</span>
      </div>

      <StatStripGroup className="!shadow-none !rounded-none border-y border-divider">
        <Stat stat={{ id: "scheduled", label: "Scheduled", kind: "count", variant: "strip", value: String(scheduled) }} icon={CalendarClock} iconTone="slate" compact />
        <Stat stat={{ id: "in-progress", label: "In progress", kind: "count", variant: "strip", value: String(inProgress) }} icon={Activity} iconTone="blue" compact />
        <Stat stat={{ id: "completed", label: "Completed", kind: "count", variant: "strip", value: String(done) }} icon={CheckCircle2} iconTone="emerald" compact />
      </StatStripGroup>

      <div className="px-4 py-2.5 flex flex-col gap-2">
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

      <UpNext next={next} locked={locked} onStart={onStart} />

      {drawerOpen && <CompletedTodayDrawer items={completed} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
