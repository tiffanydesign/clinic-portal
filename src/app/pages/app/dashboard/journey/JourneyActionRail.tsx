import React from "react";
import { Check, Flag, PauseCircle, PlayCircle, SkipForward, StickyNote, Undo2 } from "lucide-react";
import { nextStepOf } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";

// The panel's action column. Everything the nurse can DO to the journey now
// lives here instead of in a full-width bar under the timeline: the wide
// desktop card had ~700px of dead space to the right of a twelve-step list,
// and the one decision she has to make was stranded at the bottom of it.
// Docking it beside the timeline puts "what's happening" and "what to tap"
// in the same glance, which is the whole point of the reference layout.

function RailButton({
  onClick, icon, label, tone = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 min-h-11 px-3 rounded-control text-xs font-bold text-left transition-colors hover:bg-surface-hover ${
        tone === "danger" ? "text-danger-ink" : "text-ink-soft"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}

export function JourneyActionRail({ engine }: { engine: JourneyEngine }) {
  const { cur, journey } = engine;
  const step = cur.step;
  if (!step) return null;

  const isRunning = cur.mode === "exit";
  const elapsed = isRunning ? Math.max(0, engine.clock - (engine.entries[step.id]?.enter ?? engine.clock)) : 0;
  const next = nextStepOf(step, engine.entries);

  // The rail's own heading tracks what the step IS right now, so the card
  // never says "Current station" about something that hasn't started.
  const heading = isRunning ? "Current station" : cur.mode === "milestone" ? "Next milestone" : "Next station";

  let primaryLabel = "";
  if (cur.mode === "enter") primaryLabel = `Start — ${step.name}`;
  else if (cur.mode === "exit") primaryLabel = `Complete — ${step.name}`;
  else if (cur.mode === "milestone") primaryLabel = `Confirm — ${step.name}`;
  if (engine.paused) primaryLabel = "Resume Journey";

  const waitingRow = journey.rows.find((r) => r.id === step.id);
  const showWaitLive = !!waitingRow?.showWaitLive;

  return (
    <aside className="border-t min-[1440px]:border-t-0 min-[1440px]:border-l border-divider bg-surface-page p-4 flex flex-col gap-3">
      <div className="bg-surface border border-divider rounded-card p-4 shadow-sm">
        <div className="text-label font-bold text-ink-muted">{heading}</div>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-section font-bold text-ink">{step.name}</span>
          {step.room && (
            <span className="shrink-0 text-label font-bold text-ink-soft bg-surface-page border border-divider rounded-chip px-2 py-0.5">
              {step.room}
            </span>
          )}
        </div>

        {/* Status line — the same vocabulary as the timeline and the strip:
            blue only while a station is genuinely running, gray otherwise. */}
        <div className="mt-1 text-xs font-bold">
          {engine.paused ? (
            <span className="inline-flex items-center gap-1.5 text-warning-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-fill" />
              Paused — timers stopped
            </span>
          ) : isRunning ? (
            // No minute count here — the Elapsed well directly below owns
            // that number, and printing it twice makes neither one the
            // thing your eye goes to.
            <span className="inline-flex items-center gap-1.5 text-info-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-info-fill" />
              In progress
            </span>
          ) : showWaitLive ? (
            <span className={`inline-flex items-center gap-1.5 tabular-nums ${waitingRow!.waitLiveOverSla ? "text-warning-ink" : "text-ink-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${waitingRow!.waitLiveOverSla ? "bg-warning-fill" : "bg-ink-muted"}`} />
              Waiting · {waitingRow!.waitLive} min
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
              Not started
            </span>
          )}
        </div>

        {isRunning && (
          <div className="mt-3 flex items-baseline justify-between rounded-card bg-surface-page border border-divider px-3 py-2">
            <span className="text-xs font-semibold text-ink-muted">Elapsed</span>
            <span className="kpi-value-sm text-info-ink">{elapsed} min</span>
          </div>
        )}

        <button
          onClick={engine.primaryTap}
          className="btn-primary w-full mt-3 flex items-center justify-center gap-2 h-12 rounded-control text-sm font-extrabold tracking-tight transition-colors"
        >
          {isRunning && !engine.paused && <Check className="w-4 h-4" strokeWidth={3} />}
          {primaryLabel}
        </button>

        {next && (
          <div className="mt-2 text-label text-ink-muted text-center">
            Next up · <span className="font-semibold text-ink-soft">{next.name}</span>
          </div>
        )}
      </div>

      <div className="bg-surface border border-divider rounded-card p-1">
        {cur.mode === "enter" && (
          <RailButton onClick={engine.openSkip} icon={<SkipForward className="w-3.5 h-3.5" />} label="Skip this station" />
        )}
        <RailButton onClick={engine.openNote} icon={<StickyNote className="w-3.5 h-3.5" />} label="Add Note" />
        <RailButton
          onClick={engine.toggleFlag}
          icon={<Flag className="w-3.5 h-3.5" />}
          label={engine.flagged ? "Unflag Issue" : "Flag Issue"}
          tone={engine.flagged ? "danger" : "default"}
        />
        <RailButton
          onClick={engine.togglePause}
          icon={engine.paused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
          label={engine.paused ? "Resume Journey" : "Pause Journey"}
        />
      </div>

      {engine.prevStation && (
        <button
          onClick={engine.openGoBack}
          className="mt-auto flex items-center justify-center gap-2 min-h-11 px-3 rounded-control border border-divider bg-surface text-xs font-bold text-ink-muted hover:bg-surface-hover hover:text-ink-soft transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Go Back to {engine.prevStation.name}
        </button>
      )}
    </aside>
  );
}
