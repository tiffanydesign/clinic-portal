// One pure derivation of everything the redesigned Patient Journey panel
// renders, from one StationJourneyState. Kept out of the hook so the four
// densities (phase rail, done group, now card, drawer) can never disagree
// about a station's status, times or ownership — they all read this.

import {
  FULL_DAY_STATIONS, PHASE_LABEL, PHASE_ORDER, StationConfig, StationJourneyState, StationPhase,
  StationStatus, StationTiming, fmtSpan, journeyMode, locSummary, stationStatus, stationTiming, subsOf, waitBefore,
} from "./stationJourney";

export type PhaseTick = { index: number; status: StationStatus; name: string };
export type PhaseGroup = { phase: StationPhase; label: string; ticks: PhaseTick[] };

export type StationRow = {
  index: number;
  name: string;
  role?: string;
  loc?: string;
  timing: StationTiming;
};

export type StationDetail = {
  index: number;
  config: StationConfig;
  status: StationStatus;
  timing: StationTiming;
  waited: number | null;
  subs: boolean[];
};

export function buildStationView(state: StationJourneyState) {
  const stations = FULL_DAY_STATIONS;
  const total = stations.length;
  const mode = journeyMode(state.cursor);

  const phases: PhaseGroup[] = PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABEL[phase],
    ticks: stations
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.phase === phase)
      .map(({ s, i }) => ({ index: i, status: stationStatus(state.cursor, i), name: s.name })),
  }));

  const doneIdx = stations.map((_, i) => i).filter((i) => stationStatus(state.cursor, i) === "done");
  const doneCount = doneIdx.length;
  const progressPct = Math.round((doneCount / total) * 100);

  const firstTiming = doneCount ? stationTiming(state, doneIdx[0]) : stationTiming(state, 0);
  const lastTiming = doneCount ? stationTiming(state, doneIdx[doneCount - 1]) : null;
  const firstStartAbs = firstTiming.startAbs;
  const lastEndAbs = lastTiming?.endAbs ?? null;
  const spanMin = firstStartAbs != null && lastEndAbs != null ? Math.max(0, lastEndAbs - firstStartAbs) : null;

  // Time the patient has been inside the clinic — the one number that tells
  // the nurse whether a visit is running long, independent of any station.
  const anchorEnd = mode === "complete" && lastEndAbs != null ? lastEndAbs : state.clock;
  const inClinicMin = firstStartAbs != null ? Math.max(0, anchorEnd - firstStartAbs) : null;

  const doneRows: StationRow[] = doneIdx.map((i) => ({
    index: i, name: stations[i].name, role: stations[i].role, loc: locSummary(stations[i]),
    timing: stationTiming(state, i),
  }));

  const todoIdx = stations.map((_, i) => i).filter((i) => stationStatus(state.cursor, i) === "todo");
  const todoRows: StationRow[] = todoIdx.map((i) => ({
    index: i, name: stations[i].name, role: stations[i].role, loc: locSummary(stations[i]),
    timing: stationTiming(state, i),
  }));

  const activeIndex = mode === "in-progress" ? state.cursor : null;
  const active: StationDetail | null =
    activeIndex == null
      ? null
      : {
          index: activeIndex,
          config: stations[activeIndex],
          status: "active",
          timing: stationTiming(state, activeIndex),
          waited: waitBefore(state, activeIndex),
          subs: subsOf(state, activeIndex),
        };

  const activeSteps = active?.config.steps ?? [];
  const activeSubs = active?.subs ?? [];
  const stepsDone = activeSubs.filter(Boolean).length;
  const stepsLeft = activeSubs.length - stepsDone;
  const nextOpenStep = stepsLeft > 0 ? activeSteps[activeSubs.findIndex((v) => !v)] : null;

  return {
    stations, total, mode, phases,
    doneCount, progressPct, doneRows, todoRows,
    firstStart: firstTiming.start, lastEnd: lastTiming?.end ?? null, spanMin, inClinicMin,
    active, activeSteps, activeSubs, stepsDone, stepsLeft, nextOpenStep,
    next: todoRows[0] ?? null,
    rest: todoRows.slice(1),
    lastStationName: stations[total - 1].name,
  };
}

export type StationView = ReturnType<typeof buildStationView>;

/** The rail's one-line readout: what the nurse is hovering, or — with
 *  nothing hovered — where the visit stands. */
export function railReadout(view: StationView, state: StationJourneyState, hover: number | null) {
  if (hover != null) {
    const cfg = view.stations[hover];
    const status = stationStatus(state.cursor, hover);
    const timing = stationTiming(state, hover);
    const meta =
      status === "done"
        ? `${timing.start ?? "—"} → ${timing.end ?? "—"} · ${fmtSpan(timing.dur)}`
        : status === "active"
          ? `in progress · ${fmtSpan(timing.dur)}`
          : cfg.role || locSummary(cfg) || "not started";
    return { title: cfg.name, meta };
  }
  if (view.mode === "not-started") {
    return {
      title: "Not started",
      meta: `first station ${view.stations[0].planStart != null ? view.firstStart : "—"} · ${view.total} stations`,
    };
  }
  if (view.mode === "complete") {
    return {
      title: "Journey complete",
      meta: `${view.total} of ${view.total}${view.lastEnd ? ` · ${view.firstStart} → ${view.lastEnd}` : ""}`,
    };
  }
  return {
    title: `Station ${state.cursor + 1} of ${view.total}`,
    meta: `${view.active?.config.name ?? ""} · ${view.progressPct}%`,
  };
}

export function railRightMeta(view: StationView): string {
  if (view.mode === "not-started") return `Arrives ${view.firstStart ?? "—"}`;
  return `Started ${view.firstStart ?? "—"} · in clinic ${fmtSpan(view.inClinicMin)}`;
}
