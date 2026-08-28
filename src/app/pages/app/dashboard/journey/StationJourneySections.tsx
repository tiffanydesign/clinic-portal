import React from "react";
import { ChevronRight } from "lucide-react";
import { fmtSpan } from "./stationJourney";
import type { StationRow } from "./stationJourneyView";
import type { StationJourney } from "./useStationJourney";
import { RolePill } from "./StationNowCard";

// The two quiet densities either side of the now card: what is already
// logged, and what is still coming. Both stay collapsed by default — the old
// panel spent its whole height printing these two groups in full, which is
// what pushed the one actionable station off screen.

function Disclosure({
  open, onToggle, children, right,
}: {
  open: boolean; onToggle: () => void; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center gap-2.5 min-h-11 px-3 text-left transition-colors hover:bg-surface-hover"
    >
      <ChevronRight
        className={`w-3 h-3 text-ink-muted shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      />
      {children}
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </button>
  );
}

/** Everything already logged, one line each with its real start → end and
 *  duration. Collapsed it is a count, a sparkline of ticks and the span. */
export function StationDoneGroup({ journey }: { journey: StationJourney }) {
  const { view, doneOpen, toggleDone, openDrawer } = journey;
  if (!view.doneCount) return null;

  const range = `${view.firstStart ?? "—"} → ${view.lastEnd ?? "—"}${
    view.spanMin != null ? ` · ${fmtSpan(view.spanMin)}` : ""
  }`;

  return (
    <div className="shrink-0 border border-divider rounded-card bg-surface-page overflow-hidden">
      <Disclosure open={doneOpen} onToggle={toggleDone}>
        <span className="text-sm font-bold text-ink-soft whitespace-nowrap">
          {view.doneCount} station{view.doneCount === 1 ? "" : "s"} done
        </span>
        <span className="flex items-center gap-0.5 shrink-0" aria-hidden>
          {view.doneRows.slice(-8).map((row) => (
            <span key={row.index} className="w-2.5 h-1 rounded-full bg-success-fill/45" />
          ))}
        </span>
        <span className="text-xs text-ink-muted tabular-nums whitespace-nowrap truncate">{range}</span>
      </Disclosure>

      {doneOpen && (
        <div className="border-t border-divider p-1">
          {view.doneRows.map((row) => (
            <StationLine key={row.index} row={row} tone="done" onOpen={() => openDrawer(row.index)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StationLine({
  row, tone, onOpen,
}: {
  row: StationRow; tone: "done" | "todo"; onOpen: () => void;
}) {
  const done = tone === "done";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-2 min-h-11 px-2 rounded-chip text-left transition-colors hover:bg-surface-hover"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? "bg-success-fill" : "bg-surface-sunken"}`} />
      <span className={`text-label truncate min-w-0 ${done ? "text-ink-soft" : "text-ink-muted"}`}>{row.name}</span>
      <RolePill role={row.role} quiet />
      {done ? (
        <>
          <span className="ml-auto text-xs text-ink-soft tabular-nums whitespace-nowrap shrink-0 w-[150px] text-right">
            {row.timing.start ?? "—"} → {row.timing.end ?? "—"}
          </span>
          <span className="text-xs text-ink-soft tabular-nums whitespace-nowrap shrink-0 w-16 text-right">
            {fmtSpan(row.timing.dur)}
          </span>
        </>
      ) : (
        <span className="ml-auto text-xs text-ink-muted truncate max-w-[320px] shrink">{row.loc ?? ""}</span>
      )}
    </button>
  );
}

/** The next station in full, then the rest of the visit behind one
 *  disclosure — the nurse needs to know what she is walking into next, not
 *  all fifteen remaining rooms at once. */
export function StationNextGroup({ journey }: { journey: StationJourney }) {
  const { view, restOpen, toggleRest, openDrawer } = journey;
  if (!view.next) return null;

  return (
    <div className="shrink-0 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => openDrawer(view.next!.index)}
        className="w-full flex items-center gap-2.5 min-h-11 px-3.5 py-3 border border-divider rounded-card bg-surface text-left transition-colors hover:bg-surface-page"
      >
        <span className="w-2 h-2 rounded-full border-[1.5px] border-border-strong shrink-0" />
        <span className="text-overline text-ink-muted shrink-0">Next</span>
        <span className="text-data font-bold text-ink-soft truncate">{view.next.name}</span>
        <RolePill role={view.next.role} quiet />
        <span className="ml-auto text-xs text-ink-muted truncate max-w-[300px] shrink">{view.next.loc ?? ""}</span>
      </button>

      {view.rest.length > 0 && (
        <div className="border border-divider rounded-card bg-surface-page overflow-hidden">
          <Disclosure
            open={restOpen}
            onToggle={toggleRest}
            right={<span className="text-xs text-ink-muted tabular-nums">{view.rest.length} stations</span>}
          >
            <span className="text-sm text-ink-muted truncate">
              then {view.rest.length} more to {view.lastStationName}
            </span>
          </Disclosure>
          {restOpen && (
            <div className="border-t border-divider p-1">
              {view.rest.map((row) => (
                <StationLine key={row.index} row={row} tone="todo" onOpen={() => openDrawer(row.index)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
