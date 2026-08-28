import React from "react";
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
// station happening now, gray = not started yet.
const TONE: Record<StationStatus, string> = {
  done: JOURNEY_TONE.done.bar,
  active: JOURNEY_TONE.prog.bar,
  todo: JOURNEY_TONE.up.bar,
};

export function StationPhaseRail({ journey }: { journey: StationJourney }) {
  const { view, hover, setHover, drawer, openDrawer } = journey;
  const readout = railReadout(view, journey.state, hover);
  const right = railRightMeta(view);

  return (
    <div className="px-5 py-3 bg-surface-page border-b border-divider shrink-0">
      <div className="flex items-end gap-2.5" onMouseLeave={() => setHover(null)}>
        {view.phases.map((group) => (
          <div key={group.phase} className="min-w-0 flex flex-col gap-1.5" style={{ flex: group.ticks.length }}>
            <div className="text-overline text-ink-muted truncate">{group.label}</div>
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
        ))}
      </div>

      {/* The rail's readout. With nothing hovered it reports where the visit
          stands; hovering any tick swaps it for that station's own name and
          logged times, so reading the rail never costs a click. */}
      <div className="flex items-baseline gap-2.5 mt-3">
        <span className="text-sm font-bold text-ink whitespace-nowrap">{readout.title}</span>
        <span className="text-xs text-ink-muted tabular-nums truncate">{readout.meta}</span>
        <span className="ml-auto text-xs text-ink-soft tabular-nums whitespace-nowrap shrink-0">{right}</span>
      </div>
    </div>
  );
}
