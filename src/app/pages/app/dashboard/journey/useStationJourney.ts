import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FULL_DAY_STATIONS, StationJourneyState, advanceStations, journeyMode, stepBackStations, subsOf,
} from "./stationJourney";
import { buildStationView } from "./stationJourneyView";

export type StationDialog = { kind: "complete" } | { kind: "note" } | { kind: "stepback" } | null;

/** Drives one patient's redesigned Patient Journey panel: the station
 *  cursor/log state machine plus the panel's own UI state (which station's
 *  drawer is open, which groups are expanded, the overflow menu, dialogs). */
export function useStationJourney(initial: { cursor: number; clock: number }) {
  const [state, setState] = useState<StationJourneyState>({
    cursor: initial.cursor,
    clock: initial.clock,
    log: {},
    subs: {},
  });

  const [hover, setHover] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<number | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<StationDialog>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [stepBackReason, setStepBackReason] = useState("");
  const [paused, setPaused] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Same live demo clock the previous panel ran on: 1 simulated minute per
  // 1.5s of real time, so elapsed and waiting counters visibly tick.
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) setState((s) => ({ ...s, clock: s.clock + 1 }));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const view = useMemo(() => buildStationView(state), [state]);
  const mode = view.mode;

  const closeMenu = () => setMenuOpen(false);

  const toggleSub = (stationIndex: number, stepIndex: number) => {
    setState((s) => {
      const arr = subsOf(s, stationIndex).slice();
      arr[stepIndex] = !arr[stepIndex];
      const left = arr.filter((v) => !v).length;
      if (!left) toast.success(`All ${arr.length} measurement steps done — ready to complete this station.`);
      return { ...s, subs: { ...s.subs, [stationIndex]: arr } };
    });
  };

  // The primary action. A station whose checklist still has open steps is not
  // completable — the CTA reports what's left instead of confirming.
  const primaryTap = () => {
    closeMenu();
    if (paused) { setPaused(false); return; }
    if (mode === "complete") { toast.success("Visit summary sent to the care team."); return; }
    if (mode === "not-started") {
      setState((s) => advanceStations(s));
      toast.success(`Journey started — ${FULL_DAY_STATIONS[0].name}.`);
      return;
    }
    if (view.stepsLeft > 0) return;
    setDialog({ kind: "complete" });
  };

  const confirmComplete = () => {
    const finished = view.active?.config.name;
    setState((s) => advanceStations(s));
    setDialog(null);
    if (finished) toast.success(`${finished} marked complete.`);
  };

  const openNote = () => {
    closeMenu();
    setNoteDraft(view.active ? state.log[view.active.index]?.note ?? "" : "");
    setDialog({ kind: "note" });
  };

  const saveNote = () => {
    const i = view.active?.index;
    const text = noteDraft.trim();
    if (i != null) {
      setState((s) => ({ ...s, log: { ...s.log, [i]: { ...s.log[i], note: text || undefined } } }));
    }
    setDialog(null);
    toast.success("Note saved.");
  };

  const openStepBack = () => {
    closeMenu();
    setStepBackReason("");
    setDialog({ kind: "stepback" });
  };

  const confirmStepBack = () => {
    const prevName = FULL_DAY_STATIONS[state.cursor - 1]?.name;
    setState((s) => stepBackStations(s));
    setDialog(null);
    toast(`Returned to ${prevName ?? "the previous station"}.`);
  };

  const toggleFlag = () => {
    closeMenu();
    setFlagged((f) => {
      toast(f ? "Issue cleared." : `Issue flagged on ${view.active?.config.name ?? "this journey"}.`);
      return !f;
    });
  };

  const togglePause = () => {
    closeMenu();
    setPaused((p) => {
      toast(p ? "Journey resumed." : "Journey paused — timers stopped.");
      return !p;
    });
  };

  return {
    state, view, mode, clock: state.clock,
    hover, setHover,
    drawer, openDrawer: (i: number) => { setDrawer(i); closeMenu(); }, closeDrawer: () => setDrawer(null),
    drawerPrev: () => setDrawer((d) => Math.max(0, (d ?? 0) - 1)),
    drawerNext: () => setDrawer((d) => Math.min(FULL_DAY_STATIONS.length - 1, (d ?? 0) + 1)),
    doneOpen, toggleDone: () => setDoneOpen((v) => !v),
    restOpen, toggleRest: () => setRestOpen((v) => !v),
    menuOpen, toggleMenu: () => setMenuOpen((v) => !v), closeMenu,
    dialog, closeDialog: () => setDialog(null),
    noteDraft, setNoteDraft, saveNote, openNote,
    stepBackReason, setStepBackReason, openStepBack, confirmStepBack,
    canStepBack: journeyMode(state.cursor) === "in-progress" && state.cursor > 0,
    paused, togglePause, flagged, toggleFlag,
    toggleSub, primaryTap, confirmComplete,
  };
}

export type StationJourney = ReturnType<typeof useStationJourney>;
