import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { JOURNEY_TONE } from "./journeyStatus";
import type { StationStatus } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";
import { railReadout, railRightMeta } from "./stationJourneyView";

// One tick per station, grouped by phase, with each phase as wide as the
// number of stations it holds — so the rail is a true map of the visit, not
// four equal quarters. This replaces the old twelve-segment strip AND the
// vertical list's role as "where am I": every one of the sixteen stations is
// on screen at all times, in ~40px of height, and any of them can be pulled
// up in the drawer with one tap.
//
// Colour comes from the app's ONE journey vocabulary (journeyStatus.ts), not
// from a second palette invented here: green = finished, info blue = the
// station happening now, grey = not started yet.
const TONE: Record<StationStatus, string> = {
  done: JOURNEY_TONE.done.bar,
  active: JOURNEY_TONE.prog.bar,
  todo: JOURNEY_TONE.up.bar,
};

// PRODUCT.md's accessibility rule: no colour-only signalling. The rail's ticks
// are pure colour, so the legend under them pairs each hue with an icon and a
// word — which is also what tells the nurse how far the visit has actually got
// without her counting sixteen dashes.
function Legend({ done, total, active }: { done: number; total: number; active: boolean }) {
  const todo = total - done - (active ? 1 : 0);
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="inline-flex items-center gap-1 text-xs text-success-ink">
        <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
        <span className="tabular-nums font-bold">{done}</span>
      </span>
      {active && (
        <span className="inline-flex items-center gap-1 text-xs text-info-ink">
          <Clock className="w-3 h-3" strokeWidth={2.6} />
          <span className="font-bold">1</span>
        </span>
      )}
      {todo > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <Circle className="w-3 h-3" />
          <span className="tabular-nums">{todo}</span>
        </span>
      )}
    </div>
  );
}

export function StationPhaseRail({ journey }: { journey: StationJourney }) {
  const { view, hover, setHover, drawer, openDrawer } = journey;
  const readout = railReadout(view, journey.state, hover);
  const right = railRightMeta(view);
  const activePhase = view.active?.config.phase ?? null;

  return (
    // White, not the page tint the rail used to sit on: two thirds of the
    // ticks are --surface-sunken, which against --surface-page measures about
    // 1.03:1 and simply disappeared. On white the unrun remainder reads as a
    // real track and the green/blue run reads as progress against it.
    // Separation from the header comes from the rule below.
    <div className="px-5 py-3 bg-surface border-b border-divider shrink-0">
      <div className="flex items-end gap-2.5" onMouseLeave={() => setHover(null)}>
        {view.phases.map((group) => {
          const current = group.phase === activePhase;
          return (
            <div key={group.phase} className="min-w-0 flex flex-col gap-1.5" style={{ flex: group.ticks.length }}>
              {/* Brand blue on the phase the patient is actually in — the one
                  wayfinding cue on the rail, and brand blue is the ramp
                  reserved for structure/identity rather than any status. */}
              <div
                className={`text-overline truncate ${
                  current ? "text-[color:var(--phenome-blue-500)]" : "text-ink-muted"
                }`}
              >
                {group.label}
              </div>
              <div className="flex items-end gap-1 h-4">
                {group.ticks.map((tick) => (
                  <button
                    key={tick.index}
                    type="button"
                    title={tick.name}
                    aria-label={`${tick.name} — ${tick.status}`}
                    onClick={() => openDrawer(tick.index)}
                    onMouseEnter={() => setHover(tick.index)}
                    onFocus={() => setHover(tick.index)}
                    className="flex-1 min-w-0 pt-1.5 cursor-pointer group"
                  >
                    <span
                      className={`block w-full rounded-full transition-all ${TONE[tick.status]} ${
                        tick.status === "active" ? "h-2.5 ring-4 ring-info/15" : "h-1.5"
                      } ${drawer === tick.index ? "ring-2 ring-border-strong" : ""} group-hover:opacity-70`}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* The rail's readout. With nothing hovered it reports where the visit
          stands; hovering any tick swaps it for that station's own name and
          logged times, so reading the rail never costs a click. */}
      <div className="flex items-baseline gap-2.5 mt-3">
        <span className="text-sm font-bold text-ink whitespace-nowrap">{readout.title}</span>
        <span className="text-xs text-ink-muted tabular-nums truncate">{readout.meta}</span>
        <span className="ml-auto flex items-baseline gap-3 shrink-0">
          <Legend done={view.doneCount} total={view.total} active={!!view.active} />
          <span className="text-xs text-ink-soft tabular-nums whitespace-nowrap">{right}</span>
        </span>
      </div>
    </div>
  );
}
