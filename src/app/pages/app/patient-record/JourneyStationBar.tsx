import React from "react";
import { Check } from "lucide-react";
import type { Journey, JourneyStep } from "./patientRecordData";
import { JOURNEY_TONE, recordStepState } from "../dashboard/journey/journeyStatus";

// Patient Record's read-only density of the journey. Where the Nurse
// Dashboard runs a tall vertical stepper (one station per row, because she
// acts on one at a time), a record reader wants the whole visit as a single
// horizontal shape: twelve stations side by side, each a labelled bar, so the
// span of the day and where it stalled are legible without scrolling.
//
// Same status vocabulary as every other journey surface — see journeyStatus.ts.

export type JourneyTally = { done: number; active: number; remaining: number; skipped: number };

export function journeyTally(steps: JourneyStep[]): JourneyTally {
  let done = 0, active = 0, skipped = 0;
  for (const s of steps) {
    if (s.status === "Completed") done++;
    else if (s.status === "In Progress") active++;
    else if (s.status === "Skipped") skipped++;
  }
  return { done, active, skipped, remaining: steps.length - done - active - skipped };
}

// The first not-yet-started station after the active one. Called out with a
// dashed outline so "what happens next" is findable without giving an
// unstarted station a status colour it hasn't earned.
function nextIndexOf(steps: JourneyStep[]): number {
  const activeIdx = steps.findIndex((s) => s.status === "In Progress");
  if (activeIdx === -1) return -1;
  for (let i = activeIdx + 1; i < steps.length; i++) {
    if (steps[i].status === "Pending") return i;
  }
  return -1;
}

function StationColumn({ step, isNext }: { step: JourneyStep; isNext: boolean }) {
  const state = recordStepState(step.status);
  const tone = JOURNEY_TONE[state];
  const meta = step.timeLabel ?? step.durationLabel ?? "";

  const labelCls =
    state === "prog" ? "text-info-ink font-bold"
    : isNext ? "text-ink-soft font-bold"
    : state === "skip" ? "text-ink-muted font-semibold line-through decoration-ink-muted/50"
    : "text-ink-muted font-semibold";

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      {/* Fixed label height keeps every bar on one baseline whether its name
          wraps to one line or two — without it the row combs up and down. */}
      <div className={`text-label text-center leading-tight h-8 flex items-end justify-center w-full ${labelCls}`}>
        <span className="line-clamp-2">{step.name}</span>
      </div>
      <div
        className={`w-full h-2 rounded-full ${tone.bar} ${
          state === "prog" ? "ring-4 ring-info/20" : ""
        } ${isNext ? "border border-dashed border-border-strong" : ""}`}
      />
      <div className={`text-label tabular-nums h-4 ${state === "prog" ? "text-info-ink font-bold" : "text-ink-muted"}`}>
        {state === "prog" ? (step.progressLabel ?? "") : meta}
      </div>
    </div>
  );
}

// The banner above the bars: one sentence on where this journey stands.
// Active reads forward (what's running, who has it, what's next); completed
// reads backward (what the visit added up to).
function JourneyBanner({ journey, tally }: { journey: Journey; tally: JourneyTally }) {
  const active = journey.steps.find((s) => s.status === "In Progress");
  const nextIdx = nextIndexOf(journey.steps);
  const next = nextIdx === -1 ? null : journey.steps[nextIdx];

  if (journey.status === "Completed") {
    const stamps = journey.steps.map((s) => s.timeLabel).filter(Boolean) as string[];
    // Only ever rendered from two real recorded stamps — never a computed
    // stand-in for timings this journey does not actually have.
    const span = stamps.length >= 2 ? `${stamps[0]} → ${stamps[stamps.length - 1]}` : null;
    const last = journey.steps[journey.steps.length - 1];

    return (
      <div className="flex items-center gap-2.5 flex-wrap rounded-card bg-success/10 border border-success/25 px-3 py-2">
        <span className="text-label font-bold text-ink-muted">Outcome</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success-ink">
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
          All {tally.done} stations completed
        </span>
        {last && <span className="text-xs text-ink-muted">· ended at {last.name}</span>}
        {span && (
          <span className="ml-auto shrink-0 text-label font-bold text-ink-soft bg-surface border border-success/25 rounded-chip px-2 py-0.5 tabular-nums">
            {span}
          </span>
        )}
      </div>
    );
  }

  if (!active) {
    return (
      <div className="flex items-center gap-2.5 flex-wrap rounded-card bg-surface-page border border-divider px-3 py-2">
        <span className="text-label font-bold text-ink-muted">Status</span>
        <span className="text-sm font-bold text-ink-soft">Not started</span>
        <span className="text-xs text-ink-muted">· {tally.remaining} stations ahead</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap rounded-card bg-info/10 border border-info/25 px-3 py-2">
      <span className="text-label font-bold text-ink-muted">Current</span>
      <span className="text-sm font-bold text-ink">{active.name}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink">
        <span className="w-1.5 h-1.5 rounded-full bg-info-fill" />
        In Progress{active.by ? ` · ${active.by}` : ""}
      </span>
      {/* Elapsed and what's next are the banner's right-hand pair: the reader
          scans "Current <station> — In Progress" on the left and picks up the
          clock and the handoff together on the right. Whichever of the two
          exists takes the gap, so a journey missing either one still reads as
          one bar rather than a left-hugged fragment. */}
      {active.progressLabel && (
        <span className="ml-auto shrink-0 text-xs font-bold text-info-ink tabular-nums">{active.progressLabel}</span>
      )}
      {next && (
        <span className={`${active.progressLabel ? "" : "ml-auto "}shrink-0 text-label font-bold text-ink-soft bg-surface border border-info/25 rounded-chip px-2 py-0.5`}>
          Next · {next.name}
        </span>
      )}
    </div>
  );
}

function LegendItem({ tone, count, label, textCls }: { tone: string; count: number; label: string; textCls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-label font-semibold whitespace-nowrap ${textCls}`}>
      <span className={`w-3.5 h-1.5 rounded-full ${tone}`} />
      {count} {label}
    </span>
  );
}

export function JourneyStationBar({ journey }: { journey: Journey }) {
  const tally = journeyTally(journey.steps);
  const nextIdx = nextIndexOf(journey.steps);

  return (
    <div className="flex flex-col gap-3">
      <JourneyBanner journey={journey} tally={tally} />

      {/* Twelve stations on a narrow card would be illegible, so each column
          keeps a real minimum and the row scrolls inside itself rather than
          crushing every label to a sliver. The max width is the other half of
          that: a three-station journey stretched to 1fr turns three bars into
          full-width slabs that read as a chart of nothing. */}
      <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
        <div
          className="grid gap-x-1.5 items-end"
          style={{
            gridTemplateColumns: `repeat(${journey.steps.length}, minmax(58px, 1fr))`,
            maxWidth: `${journey.steps.length * 132}px`,
          }}
        >
          {journey.steps.map((step, i) => (
            <StationColumn key={`${step.name}-${i}`} step={step} isNext={i === nextIdx} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-ink-muted">
          {journey.startedAt && <>Started {journey.startedAt} · </>}
          {journey.assignedClinician ?? "—"} · {journey.assignedNurse ?? "—"}
        </span>
        <span className="ml-auto flex items-center gap-3 flex-wrap">
          <LegendItem tone={JOURNEY_TONE.done.bar} count={tally.done} label="done" textCls="text-success-ink" />
          {tally.active > 0 && <LegendItem tone={JOURNEY_TONE.prog.bar} count={tally.active} label="active" textCls="text-info-ink" />}
          {tally.skipped > 0 && <LegendItem tone={JOURNEY_TONE.skip.bar} count={tally.skipped} label="skipped" textCls="text-ink-muted" />}
          {tally.remaining > 0 && <LegendItem tone={JOURNEY_TONE.up.bar} count={tally.remaining} label="to go" textCls="text-ink-muted" />}
        </span>
      </div>
    </div>
  );
}
