// Pure data + derivation logic for the Nurse Dashboard's Patient Journey
// card. Ported from the imported "Nurse Focus Mode" design's step config and
// state machine (milestones the nurse just confirms; stations she enters and
// exits), adapted from its class-based prototype into plain functions a
// React hook can drive.

export type StepKind = "milestone" | "station";

export type JourneyStepConfig = {
  id: string;
  name: string;
  subtitle?: string; // small parenthetical shown next to the name (e.g. what "Checked In" actually means)
  kind: StepKind;
  room?: string;
  est?: number; // minutes, stations only
  owner?: string | null; // shown as a tag on milestones the nurse doesn't own
};

// Consent & Payment is settled before the nurse's involvement, so
// `currentStep` never returns it as actionable. Every other milestone —
// Patient Intake and the final Check Out handoff — is something the nurse
// confirms herself with an explicit tap.
export const JOURNEY_STEPS: JourneyStepConfig[] = [
  { id: "signed", name: "Checked In", subtitle: "Consent & Payment Complete", kind: "milestone", owner: null },
  { id: "pickup", name: "Patient Intake", kind: "milestone", owner: null },
  { id: "changing", name: "Preparation", kind: "station", room: "Changing 1", est: 5 },
  // Milestone, not folded into "scan1"'s own enter/exit: once the patient
  // has changed, the nurse escorts them to their assigned room and confirms
  // arrival there before anything downstream proceeds. Confirming it is also
  // what unlocks the Clinician Dashboard's Start gate — see
  // nurseMarkPatientArrived() in appointmentsStore.ts, which this milestone
  // triggers.
  { id: "arrived-room", name: "In Room", kind: "milestone", owner: null },
  { id: "scan1", name: "Scan 1", kind: "station", room: "Room 3", est: 15 },
  { id: "scan2", name: "Scan 2", kind: "station", room: "Room 4", est: 12 },
  { id: "machine1", name: "Machine 1", kind: "station", room: "Room 3", est: 27 },
  { id: "machine2", name: "Machine 2", kind: "station", room: "Room 4", est: 18 },
  { id: "sample1", name: "Sample Collection 1", kind: "station", room: "Draw 1", est: 8 },
  { id: "sample2", name: "Sample Collection 2", kind: "station", room: "Draw 2", est: 6 },
  { id: "consult", name: "Results Consultation", kind: "station", room: "Consult 2", est: 20 },
  { id: "checkout", name: "Check Out", kind: "milestone", owner: null },
];

export const SKIP_REASONS = ["Patient declined", "Not applicable for this package", "Clinician's decision", "Rescheduled", "Other"] as const;

// Normal transit time between stations reads as routine, not a clinical
// problem — only a wait past this threshold should escalate to a warning
// color. Keeps the timeline's cool, low-saturation tone intact for the
// common 1-6 minute gaps between stations.
export const WAIT_SLA_MIN = 20;

export type StepEntry = { at?: number; enter?: number; exit?: number; skipped?: boolean; reason?: string; note?: string };
export type JourneyEntries = Record<string, StepEntry>;

export function fmtClock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = ((min % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmtDuration(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem} min`;
}

export type CurrentInfo = { step: JourneyStepConfig | null; mode: "enter" | "exit" | "milestone" | "done" };

// The next thing the nurse needs to act on. Consent & Payment is always
// treated as already settled from her view; every later milestone
// (including Check Out) is hers to confirm.
export function currentStep(entries: JourneyEntries): CurrentInfo {
  for (const s of JOURNEY_STEPS) {
    if (s.id === "signed") continue;
    const r = entries[s.id] || {};
    if (r.skipped) continue;
    if (s.kind === "milestone") {
      if (r.at != null) continue;
      return { step: s, mode: "milestone" };
    }
    if (r.exit != null) continue;
    if (r.enter != null) return { step: s, mode: "exit" };
    return { step: s, mode: "enter" };
  }
  return { step: null, mode: "done" };
}

export function prevStationOf(step: JourneyStepConfig, entries: JourneyEntries): JourneyStepConfig | null {
  const idx = JOURNEY_STEPS.findIndex((x) => x.id === step.id);
  for (let i = idx - 1; i >= 0; i--) {
    const s = JOURNEY_STEPS[i];
    const r = entries[s.id] || {};
    if (s.kind === "station" && r.exit != null) return s;
  }
  return null;
}

export type StepRenderState = "done" | "prog" | "up" | "wait" | "skip";

export type StepRow = {
  id: string;
  state: StepRenderState;
  name: string;
  subtitle?: string;
  notLast: boolean;
  isStation: boolean;
  showDur: boolean; durTxt: string;
  showProg: boolean; progTxt: string;
  showInfo: boolean; infoTxt: string;
  showTime: boolean; timeTxt: string;
  showSkip: boolean; skipCap: string;
  showWaited: boolean; waited: number; waitedOverSla: boolean;
  showWaitLive: boolean; waitLive: number; waitLiveOverSla: boolean;
  showOwner: boolean; owner: string;
  note?: string;
};

export function buildJourneyRows(entries: JourneyEntries, clock: number) {
  const cur = currentStep(entries);
  const curId = cur.step?.id ?? null;
  let prevEnd: number | null = null;

  const rows: StepRow[] = JOURNEY_STEPS.map((s, i) => {
    const r = entries[s.id] || {};
    let state: StepRenderState;
    if (r.skipped) state = "skip";
    else if (s.kind === "milestone") state = r.at != null ? "done" : "up";
    else state = r.exit != null ? "done" : r.enter != null ? "prog" : "up";

    const isCurrent = s.id === curId;
    if (state === "up" && s.kind === "station" && isCurrent && prevEnd != null) state = "wait";

    const startT = s.kind === "milestone" ? r.at : r.enter;
    const endT = s.kind === "milestone" ? r.at : r.exit;
    let waited = 0;
    if (startT != null && prevEnd != null) waited = startT - prevEnd;
    let waitLive = 0;
    if (state === "wait" && prevEnd != null) waitLive = Math.max(0, clock - prevEnd);

    let showDur = false, durTxt = "", showProg = false, progTxt = "", showInfo = false, infoTxt = "";
    let showTime = false, timeTxt = "", showSkip = false, skipCap = "", showWaited = false;

    if (state === "done") {
      if (s.kind === "station") {
        showDur = true;
        durTxt = `${fmtClock(r.enter!)} → ${fmtClock(r.exit!)} · ${r.exit! - r.enter!} min`;
        if (waited > 0) showWaited = true;
      } else {
        showTime = true;
        timeTxt = fmtClock(r.at!);
      }
    } else if (state === "prog") {
      showProg = true;
      const elapsed = Math.max(0, clock - r.enter!);
      progTxt = `In progress · ${elapsed} min`;
      showInfo = true;
      infoTxt = s.room ?? "";
    } else if (state === "skip") {
      showSkip = true;
      skipCap = `Skipped · ${r.reason || "no reason given"}`;
    }

    if (state === "done") prevEnd = endT ?? prevEnd;

    return {
      id: s.id, state, name: s.name, subtitle: s.subtitle, notLast: i < JOURNEY_STEPS.length - 1, isStation: s.kind === "station",
      showDur, durTxt, showProg, progTxt, showInfo, infoTxt, showTime, timeTxt, showSkip, skipCap,
      showWaited, waited, waitedOverSla: waited > WAIT_SLA_MIN,
      showWaitLive: state === "wait" && waitLive > 0, waitLive, waitLiveOverSla: waitLive > WAIT_SLA_MIN,
      showOwner: !!s.owner, owner: s.owner || "",
      note: r.note,
    };
  });

  const segments = rows.filter((r) => r.isStation).map((r) => r.state);
  let doneN = 0, progN = 0, skipN = 0;
  for (const r of rows) {
    if (!r.isStation) continue;
    if (r.state === "done") doneN++;
    else if (r.state === "prog") progN++;
    else if (r.state === "skip") skipN++;
  }
  const totalStations = JOURNEY_STEPS.filter((s) => s.kind === "station").length;
  const remainN = totalStations - doneN - progN - skipN;
  const progressPct = Math.round(((doneN + skipN) / totalStations) * 100);

  return { rows, segments, doneN, progN, skipN, remainN, totalStations, progressPct, cur };
}

export function buildTimeBreakdown(entries: JourneyEntries, clock: number) {
  let activeMin = 0, waitMin = 0;
  let prevEnd: number | null = null;
  for (const s of JOURNEY_STEPS) {
    const r = entries[s.id] || {};
    if (s.kind !== "station") {
      if (r.at != null) prevEnd = r.at;
      continue;
    }
    if (r.skipped) continue;
    if (r.exit != null) {
      activeMin += r.exit - r.enter!;
      if (prevEnd != null && r.enter! > prevEnd) waitMin += r.enter! - prevEnd;
      prevEnd = r.exit;
    } else if (r.enter != null) {
      activeMin += clock - r.enter;
      if (prevEnd != null && r.enter > prevEnd) waitMin += r.enter - prevEnd;
      prevEnd = r.enter;
    }
  }
  const signedAt = entries.signed?.at;
  const inClinicMin = signedAt != null ? clock - signedAt : 0;
  return { activeMin, waitMin, inClinicMin };
}
