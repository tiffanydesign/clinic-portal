import React from "react";
import { Check } from "lucide-react";
import { Appt } from "../dashboardData";
import { journeyStepsFor, journeyChipInfo } from "./journeyTemplates";
import { journeyTimingCaption } from "../AppointmentDrawerShared";

// The two read-only densities of the unified Journey Progress system (see
// journeyTemplates.ts for the shared station model). `timeline` is not a
// variant of this component — it's Patient Record's existing JourneyDetailPage,
// left in its own current shape and just rewired onto the same station data.

// chip — "{station} · x/N", or "Completed" once checked out. Used in the
// patient roster's Journey column, Front Desk Queue's in-clinic rows, and
// calendar/schedule-list event blocks. No wait-duration text (reserved for
// strip + timeline) and no per-station color scheme — a single line of text
// is all the space allows.
export function JourneyProgressChip({ appt, className = "" }: { appt: Appt; className?: string }) {
  const info = journeyChipInfo(appt);
  if (info.kind === "none") return <span className={`text-ink-muted ${className}`}>—</span>;
  if (info.kind === "completed") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold text-success-ink ${className}`}>
        <Check className="w-3.5 h-3.5" /> Completed
      </span>
    );
  }
  return (
    <span className={`text-xs font-bold text-ink-soft whitespace-nowrap ${className}`}>
      {info.station} <span className="text-ink-muted font-semibold">· {info.x}/{info.N}</span>
    </span>
  );
}

// strip — the Prev / Current / Next window: what was just finished, what's
// happening now (with a real timing/room caption, never a fabricated
// per-station duration), and what's next, plus a thin progress bar and
// "x of N". Takes plain primitives (not an Appt) so it can render any
// journey-shaped data — Patient Record's Journeys tab has its own separate
// Journey/JourneyStep model, not an Appt. `ApptJourneyStrip` below is the
// convenience wrapper for call sites that already have an Appt on hand.
// The whole row is clickable to Journey Detail when `onOpen` is given —
// this density never carries its own Mark Started/Complete/Skip controls
// (timeline-only).
export function JourneyProgressStrip({ steps, current, isDone, caption, onOpen, className = "" }: {
  steps: string[]; current: number; isDone?: boolean; caption?: string; onOpen?: () => void; className?: string;
}) {
  const prevName = current > 0 ? steps[current - 1] : "Checked In";
  const currentName = steps[current];
  const nextName = current < steps.length - 1 ? steps[current + 1] : "Check Out";
  const x = Math.min(current + 1, steps.length);
  const pct = Math.round(((isDone ? steps.length : current) / steps.length) * 100);

  const Wrapper = onOpen ? "button" : "div";

  return (
    <Wrapper
      onClick={onOpen}
      className={`w-full text-left block ${onOpen ? "cursor-pointer hover:bg-surface-hover rounded-card transition-colors" : ""} ${className}`}
    >
      <div className="flex items-center gap-3 min-h-11">
        <div className="flex items-center gap-1 min-w-0 flex-1 text-xs text-ink-muted font-semibold truncate">
          <Check className="w-3 h-3 text-success-ink shrink-0" />
          <span className="truncate">{isDone ? steps[steps.length - 1] : prevName}</span>
        </div>

        <div className="min-w-0 flex-[2] text-center">
          {isDone ? (
            <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-success-ink">
              <Check className="w-4 h-4" /> Completed
            </div>
          ) : (
            <>
              <div className="text-sm font-bold text-info-ink truncate">{currentName}</div>
              {caption && <div className="text-label text-ink-muted truncate">{caption}</div>}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 min-w-0 flex-1 justify-end text-xs text-ink-muted font-semibold truncate">
          {!isDone && (
            <>
              <span className="truncate">{nextName}</span>
              <span className="w-1.5 h-1.5 rounded-full border border-divider shrink-0" />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 h-1 bg-surface-hover rounded-full overflow-hidden">
          {/* Same status colors as the text above it: emerald once done,
              blue while a step is actively in progress — not a fixed gray
              regardless of where the journey actually stands. */}
          <div className={`h-full rounded-full transition-all ${isDone ? "bg-success" : "bg-info"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-label font-bold text-ink-muted shrink-0">{x} of {steps.length}</span>
      </div>
    </Wrapper>
  );
}

// Convenience wrapper for the common case: an Appt already on hand
// (Appointment Drawer, Clinician Dashboard's Up Next card).
export function ApptJourneyStrip({ appt, onOpen, className }: { appt: Appt; onOpen?: () => void; className?: string }) {
  const { steps, current } = journeyStepsFor(appt);
  const timing = journeyTimingCaption(appt);
  const caption = timing ? `${timing}${appt.room ? ` · ${appt.room}` : ""}` : undefined;
  return (
    <JourneyProgressStrip
      steps={steps}
      current={current}
      isDone={appt.status === "Completed"}
      caption={caption}
      onOpen={onOpen}
      className={className}
    />
  );
}
