import React from "react";
import { Check, SkipForward, StickyNote } from "lucide-react";
import type { StepRenderState, StepRow } from "./journeyEngine";
import { JOURNEY_TONE, waitPillClass, waitTextClass } from "./journeyStatus";

// The vertical stepper's node. Every state occupies the same 22px slot so
// the rail stays perfectly straight, but only `done` and `prog` are filled
// shapes — everything not yet started is the small gray circle the reference
// panel uses, which stops the timeline reading as a wall of ringed bullets.
function StepNode({ state, isCurrent }: { state: StepRenderState; isCurrent: boolean }) {
  const tone = JOURNEY_TONE[state];

  if (state === "done") {
    return (
      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-white ${tone.dot}`}>
        <Check className="w-3 h-3" strokeWidth={3.5} />
      </div>
    );
  }

  if (state === "skip") {
    return (
      <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 text-ink-muted ${tone.ring}`}>
        <SkipForward className="w-3 h-3" />
      </div>
    );
  }

  if (state === "prog") {
    return (
      <div className="relative w-[22px] h-[22px] shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-info/30 motion-safe:animate-ping" />
        <div className={`relative w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${tone.ring}`}>
          <div className={`w-2 h-2 rounded-full ${tone.dot}`} />
        </div>
      </div>
    );
  }

  // up / wait — the small gray circle, centered in the 22px slot. The step
  // the nurse is standing on gets a halo rather than a colour: it still
  // hasn't started, so claiming a status colour for it would be a lie, but
  // "you are here" has to be findable down a twelve-step list.
  return (
    <div className="w-[22px] h-[22px] shrink-0 flex items-center justify-center">
      <div
        className={`w-2.5 h-2.5 rounded-full bg-surface-sunken border border-border-strong ${
          isCurrent ? "ring-4 ring-surface-sunken" : ""
        }`}
      />
    </div>
  );
}

// One step's content. Single-line by default (name on the left, timing hard
// right) — the reference panel's rhythm. Only the current step and steps
// carrying a note/skip reason grow taller, which is what makes "where am I"
// readable at a glance down a twelve-step list.
function StepBody({ row }: { row: StepRow }) {
  const tone = JOURNEY_TONE[row.state];
  const highlight = row.isCurrent && row.state !== "done";

  const nameLine = (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className={`min-w-0 truncate text-sm ${tone.label}`}>{row.name}</span>
      {row.subtitle && <span className="shrink-0 text-xs font-medium text-ink-muted truncate">({row.subtitle})</span>}
      {row.showOwner && (
        <span className="shrink-0 text-label font-bold text-ink-muted bg-surface-hover px-1.5 py-0.5 rounded-chip">{row.owner}</span>
      )}
    </div>
  );

  return (
    <div className="flex-1 min-w-0 py-1">
      {row.showWaited && (
        <div className={`text-label font-semibold mb-0.5 ${waitTextClass(row.waitedOverSla)}`}>
          Waited {row.waited} min
        </div>
      )}

      {highlight ? (
        // The "you are here" band. Info-tinted while a station is genuinely
        // running; neutral gray while the patient is only queued for it —
        // same rule as every other surface in the panel.
        <div
          className={`flex items-center gap-2 flex-wrap rounded-card border px-3 py-2 ${
            row.state === "prog" ? "bg-info/10 border-info/25" : "bg-surface-page border-divider"
          }`}
        >
          <span className={`text-sm truncate ${row.state === "prog" ? "font-bold text-ink" : "font-bold text-ink-soft"}`}>{row.name}</span>
          {row.showProg && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-info-ink tabular-nums shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-info-fill" />
              {row.progTxt}
            </span>
          )}
          {row.showWaitLive && (
            <span className={`shrink-0 inline-flex items-center gap-1 text-label font-bold px-2 py-0.5 rounded-full ${waitPillClass(row.waitLiveOverSla)}`}>
              Waiting · {row.waitLive} min
            </span>
          )}
          {row.room && (
            <span className="ml-auto shrink-0 text-label font-bold text-ink-soft bg-surface border border-divider rounded-chip px-2 py-0.5">
              {row.room}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          {nameLine}
          <span className="ml-auto shrink-0 text-xs font-bold text-ink-muted tabular-nums">
            {row.showTime && row.timeTxt}
            {row.showDur && row.durTxt}
          </span>
        </div>
      )}

      {row.showSkip && <div className="text-label text-ink-muted font-semibold mt-1">{row.skipCap}</div>}

      {row.note && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-soft bg-surface-page border border-divider rounded-card px-2.5 py-1.5">
          <StickyNote className="w-3 h-3 mt-0.5 text-ink-muted shrink-0" />
          <span>{row.note}</span>
        </div>
      )}
    </div>
  );
}

// The vertical stepper itself — kept from the previous design rather than
// swapped for the reference's single flat rail, because a per-segment
// connector still carries information the flat rail throws away: the trail
// is success-coloured up to where the patient actually got, gray from there
// on. Same status vocabulary as everything else (journeyStatus.ts).
export function JourneyTimeline({ rows }: { rows: StepRow[] }) {
  return (
    <div>
      {rows.map((row) => (
        <div key={row.id} className="flex gap-3">
          {/* The current step's content sits in a padded band, so its node
              needs a matching nudge to stay centered on it. */}
          <div className={`flex flex-col items-center shrink-0 ${row.isCurrent && row.state !== "done" ? "pt-2.5" : "pt-1"}`}>
            <StepNode state={row.state} isCurrent={row.isCurrent} />
            {/* Trail, not state: the leg BELOW a node is only travelled once
                that step is done. An in-progress step has not been left yet,
                so its leg stays gray like everything still ahead. */}
            {row.notLast && (
              <div className={`w-0.5 flex-1 min-h-[14px] my-0.5 rounded-full ${row.state === "done" ? JOURNEY_TONE.done.bar : "bg-surface-sunken"}`} />
            )}
          </div>
          <StepBody row={row} />
        </div>
      ))}
    </div>
  );
}
