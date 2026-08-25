import React from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Check, Clock, UserRound } from "lucide-react";
import type { StepRenderState } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";
import { JOURNEY_TONE } from "./journeyStatus";
import { JourneyTimeline } from "./JourneyTimeline";
import { JourneyActionRail } from "./JourneyActionRail";
import { ExitConfirmPopover, GoBackDialog, NotePopover, SkipDialog } from "./JourneyDialogs";

// Segments read their fill from the shared status vocabulary — the bar can
// no longer disagree with the stepper node or the legend chip below it.
function ProgressBar({ segments }: { segments: StepRenderState[] }) {
  return (
    // Fixed, modest width: this is a shape to read at a glance, not a
    // ruler. Stretched across a wide card each segment turns into a slab
    // and the strip stops reading as one progress object.
    <div className="flex gap-1 w-full max-w-[240px] shrink-0">
      {segments.map((s, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full ${JOURNEY_TONE[s].bar} ${s === "prog" ? "motion-safe:animate-pulse" : ""}`}
        />
      ))}
    </div>
  );
}

function LegendChip({ state, count, label }: { state: StepRenderState; count: number; label: string }) {
  const tone = JOURNEY_TONE[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-label font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${tone.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.chipDot}`} />
      {count} {label}
    </span>
  );
}

export type NextAppointment = { name: string; time: string };

// The dashboard's three "no active patient" moments. Branch A (a queue is
// waiting) is the original behavior; B and C read the shift's shape from
// completedCount to tell "hasn't started yet" apart from "already wrapped
// up" — two very different moments that a single generic empty state would
// blur together.
export function EmptyJourney({
  hasQueue, completedCount, nextAppt, onStartNext,
}: {
  hasQueue: boolean;
  completedCount: number;
  nextAppt: NextAppointment | null;
  onStartNext: () => void;
}) {
  const navigate = useNavigate();

  if (hasQueue) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <UserRound className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">No patient in progress</h2>
        <p className="text-sm text-ink-muted mb-5 max-w-xs">Start the next patient from your queue to begin their journey.</p>
        <button
          onClick={onStartNext}
          className="px-6 py-3 rounded-control text-sm font-bold transition-colors btn-primary shadow-md"
        >
          Start Next Patient
        </button>
      </div>
    );
  }

  if (completedCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">Awaiting First Patient</h2>
        <p className="text-sm text-ink-muted max-w-xs">
          {nextAppt
            ? <>The queue is currently empty. Next upcoming appointment is <span className="font-semibold text-ink-soft">{nextAppt.name}</span> at <span className="font-semibold text-ink-soft">{nextAppt.time}</span>.</>
            : "The queue is currently empty. No further appointments are scheduled today."}
        </p>
        <button onClick={() => navigate("/calendar/schedule")} className="mt-4 text-sm font-bold text-ink-soft hover:text-ink hover:underline">
          View today's schedule ↓
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="w-11 h-11 rounded-full bg-success-ink text-white flex items-center justify-center mb-2.5">
        <Check className="w-5 h-5" strokeWidth={3} />
      </div>
      <h2 className="text-sm font-extrabold text-ink">All Patients Completed</h2>
      <p className="text-sm text-ink-muted mt-1 max-w-xs">You have successfully processed all {completedCount} assigned patients for today.</p>
    </div>
  );
}

// Identity bar. The meta string arrives as "Body Scan · 08:00 · Dr. Ebru Reis
// · Room 3"; the procedure leads it and is what the nurse scans for, so it
// carries the weight and the rest stays a quiet dotted trail.
function PatientHeader({
  patientName, patientTag, patientMeta, patientRoute, flagged,
}: {
  patientName: string; patientTag: string; patientMeta: string; patientRoute: string; flagged: boolean;
}) {
  const initials = patientName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const [procedure, ...rest] = patientMeta.split(" · ");

  return (
    <header className="flex items-center gap-3 px-5 py-3 border-b border-divider shrink-0">
      <div className="w-10 h-10 rounded-full bg-surface-hover text-ink-soft flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>

      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-section font-bold text-ink truncate">{patientName}</h2>
          <span className="text-xs font-semibold text-ink-muted shrink-0">{patientTag}</span>
          {flagged && <span className="text-label font-bold text-white bg-danger-ink rounded-full px-2 py-0.5 shrink-0">⚑ Flagged</span>}
        </div>
        <div className="text-xs text-ink-muted flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-ink-soft">{procedure}</span>
          {rest.map((part) => (
            <React.Fragment key={part}>
              <span className="text-ink-muted/50">·</span>
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Link
        to={patientRoute}
        className="ml-auto shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3 rounded-control border border-divider bg-surface text-xs font-bold text-ink-soft hover:bg-surface-hover transition-colors"
      >
        Open Patient Record
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </header>
  );
}

export function PatientJourneyCard({
  engine, patientName, patientTag, patientMeta, patientRoute,
}: {
  engine: JourneyEngine;
  patientName: string;
  patientTag: string;
  patientMeta: string;
  patientRoute: string;
}) {
  const { journey, cur } = engine;
  const isDoneAll = cur.mode === "done";

  return (
    <div className="h-full bg-surface rounded-card flex flex-col overflow-hidden">
      <PatientHeader
        patientName={patientName}
        patientTag={patientTag}
        patientMeta={patientMeta}
        patientRoute={patientRoute}
        flagged={engine.flagged}
      />

      {/* Progress strip — one horizontal read of the whole visit before the
          eye ever reaches the step list. */}
      <div className="flex items-center gap-4 flex-wrap px-5 py-2.5 bg-surface-page border-b border-divider shrink-0">
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-sm font-bold text-ink">Patient Journey</span>
          <span className="text-xs font-semibold text-ink-muted tabular-nums">
            {journey.doneN} of {journey.totalStations} stations · {journey.progressPct}%
          </span>
        </div>
        <ProgressBar segments={journey.segments} />
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <LegendChip state="done" count={journey.doneN} label="done" />
          {journey.progN > 0 && <LegendChip state="prog" count={journey.progN} label="active" />}
          {journey.remainN > 0 && <LegendChip state="up" count={journey.remainN} label="to go" />}
          {journey.skipN > 0 && <LegendChip state="skip" count={journey.skipN} label="skipped" />}
        </div>
      </div>

      {isDoneAll ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-11 h-11 rounded-full bg-success-ink text-white flex items-center justify-center mb-2.5"><Check className="w-5 h-5" strokeWidth={3} /></div>
          <h2 className="text-sm font-extrabold text-ink">Patient Checked Out</h2>
          <p className="text-sm text-ink-muted mt-1">{patientName}'s visit is complete.</p>
        </div>
      ) : (
        // Timeline and actions side by side. The rail is a fixed column so
        // the CTA lands in the same place for every patient and every step —
        // muscle memory matters more here than a fluid width.
        //
        // The breakpoints are measured, not guessed: this card is whatever
        // the viewport has left after the 245px nav and the 396px side
        // column, so it only clears ~700px at a 1440px viewport. Below that
        // a fixed rail would starve the timeline to ~190px, so the rail
        // stacks underneath instead.
        <div className="grid grid-cols-1 min-[1440px]:grid-cols-[minmax(0,1fr)_320px] min-[1720px]:grid-cols-[minmax(0,1fr)_360px] flex-1 min-h-0">
          <div className="overflow-y-auto px-5 py-3 min-h-0">
            {/* Capped measure: each step's name and its timestamp have to
                stay in one glance. Uncapped on a wide desktop card, the row
                stretches until the time is stranded a screen away from the
                station it belongs to. */}
            <div className="max-w-[680px]">
              <JourneyTimeline rows={journey.rows} />
            </div>
          </div>
          <JourneyActionRail engine={engine} />
        </div>
      )}

      {engine.exitPopover && cur.step && <ExitConfirmPopover engine={engine} step={cur.step} />}
      {engine.notePopover && <NotePopover engine={engine} />}
      {engine.dialog?.kind === "skip" && cur.step && <SkipDialog engine={engine} stepName={cur.step.name} />}
      {engine.dialog?.kind === "goback" && cur.step && <GoBackDialog engine={engine} prevName={engine.prevStation?.name ?? "the previous station"} curName={cur.step.name} />}
    </div>
  );
}
