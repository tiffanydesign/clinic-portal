import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  JOURNEY_STEPS, JourneyEntries, currentStep, prevStationOf, buildJourneyRows, buildTimeBreakdown,
} from "./journeyEngine";

export type DialogState = { kind: "skip" } | { kind: "goback" } | null;

// Drives one patient's Patient Journey card: the entries/clock state machine
// (ported from the Focus Mode prototype) plus the UI-only state for its
// popovers and dialogs (exit confirm, note, skip reasons, go back).
export function useJourneyEngine(initialEntries: JourneyEntries, initialClock: number) {
  const [entries, setEntries] = useState<JourneyEntries>(initialEntries);
  const [clock, setClock] = useState(initialClock);
  const [paused, setPaused] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [exitPopover, setExitPopover] = useState(false);
  const [notePopover, setNotePopover] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [skipReason, setSkipReason] = useState<string | null>(null);
  const [skipNote, setSkipNote] = useState("");
  const [gobackReason, setGobackReason] = useState("");
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // A live demo clock: 1 simulated minute per 1.5s of real time, matching
  // the sourced Focus Mode design so waiting/elapsed counters visibly tick.
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) setClock((c) => c + 1);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const cur = currentStep(entries);

  const enterStep = () => {
    if (!cur.step) return;
    setEntries((e) => ({ ...e, [cur.step!.id]: { ...(e[cur.step!.id] || {}), enter: clock } }));
  };
  const confirmMilestone = () => {
    if (!cur.step) return;
    setEntries((e) => ({ ...e, [cur.step!.id]: { at: clock } }));
  };
  const openExit = () => setExitPopover(true);
  const closeExitPopover = () => setExitPopover(false);
  const confirmExit = () => {
    if (!cur.step) return;
    setEntries((e) => ({ ...e, [cur.step!.id]: { ...e[cur.step!.id], exit: clock } }));
    setExitPopover(false);
    toast.success(`${cur.step.name} marked complete.`);
  };

  const openSkip = () => { setDialog({ kind: "skip" }); setSkipReason(null); setSkipNote(""); };
  const confirmSkip = () => {
    if (!cur.step) return;
    const reason = skipReason === "Other" ? skipNote : skipReason ?? undefined;
    setEntries((e) => ({ ...e, [cur.step!.id]: { skipped: true, reason } }));
    setDialog(null);
    toast(`${cur.step.name} skipped.`);
  };

  const openGoBack = () => { setDialog({ kind: "goback" }); setGobackReason(""); };
  const confirmGoBack = () => {
    if (!cur.step) return;
    const step = cur.step;
    const prev = prevStationOf(step, entries);
    setEntries((e) => {
      const next = { ...e };
      if (prev) next[prev.id] = { ...next[prev.id], exit: undefined };
      next[step.id] = { ...(next[step.id] || {}), enter: undefined };
      return next;
    });
    setDialog(null);
    toast(`Returned to ${prev?.name ?? "the previous station"}.`);
  };

  const closeDialog = () => setDialog(null);
  const togglePause = () => setPaused((p) => !p);
  const toggleFlag = () => setFlagged((f) => !f);
  const openNote = () => { setNoteDraft(cur.step ? entries[cur.step.id]?.note ?? "" : ""); setNotePopover(true); };
  const closeNote = () => setNotePopover(false);
  const saveNote = () => {
    if (cur.step) {
      const text = noteDraft.trim();
      const stepId = cur.step.id;
      setEntries((e) => ({ ...e, [stepId]: { ...(e[stepId] || {}), note: text || undefined } }));
    }
    setNotePopover(false);
    toast.success("Note saved.");
  };

  const primaryTap = () => {
    if (paused) { togglePause(); return; }
    if (cur.mode === "enter") enterStep();
    else if (cur.mode === "exit") openExit();
    else if (cur.mode === "milestone") confirmMilestone();
  };

  const journey = buildJourneyRows(entries, clock);
  const timeBreakdown = buildTimeBreakdown(entries, clock);
  const prevStation = cur.step ? prevStationOf(cur.step, entries) : null;

  const skipOther = skipReason === "Other";
  const skipCan = !!skipReason && (!skipOther || skipNote.trim().length > 0);
  const gobackCan = gobackReason.trim().length > 0;

  return {
    entries, clock, paused, flagged, exitPopover, notePopover, noteDraft, setNoteDraft, dialog,
    skipReason, setSkipReason, skipNote, setSkipNote, skipOther, skipCan,
    gobackReason, setGobackReason, gobackCan,
    cur, journey, timeBreakdown, prevStation,
    primaryTap, openSkip, confirmSkip, openGoBack, confirmGoBack, closeDialog,
    closeExitPopover, confirmExit, togglePause, toggleFlag, openNote, closeNote, saveNote,
    totalSteps: JOURNEY_STEPS.length,
  };
}

export type JourneyEngine = ReturnType<typeof useJourneyEngine>;
