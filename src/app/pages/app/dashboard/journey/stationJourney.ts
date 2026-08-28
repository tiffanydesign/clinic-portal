// The full-day-assessment station model behind the Nurse Dashboard's
// redesigned Patient Journey panel.
//
// Why this exists next to journeyEngine.ts rather than replacing it:
// journeyEngine's milestone/station vocabulary is the app's CANONICAL station
// list (journeyTemplates.ts derives CANONICAL_STATIONS from it, and the
// roster, Front Desk Queue, calendar blocks, Appointment Drawer and Patient
// Record's Journeys tab all read through that). This module is the nurse's
// own *in-visit* checklist for a full-day assessment: sixteen stations that
// each carry a phase, an owning role, the room/devices/staff involved, the
// instruction the nurse follows, and — for the measurement block — its own
// ordered sub-step sequence.
//
// A flat sixteen-row list of all of that is what the panel used to render,
// and it ran several screens long. The panel now reads it in four densities
// instead: a phase rail (every station, one tick), a collapsed "done" group,
// one full-detail card for the station happening now, and a drawer for any
// single station the nurse pulls up. This file owns the data and every
// derivation those four densities share; nothing here renders.

export type StationPhase = "Reception" | "Preparation" | "Diagnostics" | "Checkout";

export type StationSubStep = {
  label: string;
  /** planning range as written on the clinic's own protocol sheet, e.g. "5–10 min" */
  est: string;
  desc: string;
};

export type StationConfig = {
  id: string;
  name: string;
  phase: StationPhase;
  /** Role pill — set only when the station is NOT the nurse's own to run. */
  role?: string;
  // Where the station happens, kept as three fields rather than one
  // "Room · Device · Device · Person" string. The string was the source
  // system's format and it forced every reader to parse it back apart — the
  // drawer cannot put a pin on the room and a person icon on the nurse if all
  // it has is seven dot-separated fragments, and a station whose only
  // fragment is a person ("Berna Koç") is indistinguishable from one whose
  // only fragment is a room.
  room?: string;
  devices?: string[];
  staff?: string;
  /** The instruction the nurse follows at this station. */
  desc?: string;
  /** Planned wall-clock start/end, minutes from midnight. Absent = unplanned. */
  planStart?: number;
  planEnd?: number;
  /** Planned duration in minutes, for stations with no logged times yet. */
  est?: number;
  stepsTitle?: string;
  steps?: StationSubStep[];
};

// Phase groups, in visit order. The rail's tick widths come from how many
// stations each phase holds, so the group that takes the longest on the
// clinic floor is also the widest on screen.
export const PHASE_ORDER: StationPhase[] = ["Reception", "Preparation", "Diagnostics", "Checkout"];

export const PHASE_LABEL: Record<StationPhase, string> = {
  Reception: "Reception",
  Preparation: "Preparation",
  Diagnostics: "Diagnostics",
  Checkout: "Consults & checkout",
};

// Times are anchored on Ece Yıldırım's real 08:00 slot (the same one the
// shared appointment store and Today's Schedule show her in), not on the
// source prototype's 12:44, so the panel's clock agrees with the rail beside
// it. Minutes from midnight throughout, matching NOW_MINUTES.
//
// EVERY station carries a planned start/end, not just the ones already run.
// A journey read at any cursor has to be able to answer "when is Radiology?"
// and "when does she leave?" — with the tail unplanned, the drawer says "not
// scheduled" for two thirds of the visit and a completed journey has no end
// time to print at all. The chain below is the clinic's own full-day plan:
// 08:00 arrival through 12:12 checkout.
const H8 = 8 * 60;

export const FULL_DAY_STATIONS: StationConfig[] = [
  {
    id: "payment", name: "Payment not required", phase: "Reception", role: "Receptionist",
    room: "Front Desk", staff: "Elif Yıldız",
    planStart: H8, planEnd: H8, est: 0,
  },
  {
    id: "forms", name: "Required forms signed", phase: "Reception", role: "Receptionist",
    room: "Front Desk", staff: "Elif Yıldız",
    desc: "One consent form signed and on file — nothing outstanding at the desk.",
    planStart: H8, planEnd: H8 + 1, est: 1,
  },
  {
    id: "pickup", name: "Pick up from reception", phase: "Reception",
    room: "Front Desk", staff: "Berna Koç",
    desc: "Meet the patient at reception and escort them into the hallway toward the assigned diagnostic room.",
    planStart: H8 + 1, planEnd: H8 + 3, est: 2,
  },
  {
    id: "slippers", name: "Slippers and coat drop", phase: "Preparation",
    staff: "Berna Koç",
    desc: "Confirm slippers are on, store the patient coat and accompany the patient to the diagnostic room.",
    planStart: H8 + 3, planEnd: H8 + 6, est: 3,
  },
  {
    id: "intake", name: "Diagnostic-room intake and patient history", phase: "Preparation",
    room: "Diagnostic Room A", staff: "Berna Koç",
    desc: "Explain the visit, record the anamnesis and complete the patient date of birth and sex fields.",
    planStart: H8 + 6, planEnd: H8 + 12, est: 6,
  },
  {
    id: "gown", name: "Change into gown", phase: "Preparation",
    room: "Changing Room", staff: "Berna Koç",
    desc: "Escort the patient to the changing room and confirm they are ready in a gown.",
    planStart: H8 + 12, planEnd: H8 + 15, est: 3,
  },
  {
    id: "measurements", name: "Measurements", phase: "Diagnostics",
    room: "Diagnostic Room A", staff: "Berna Koç",
    devices: [
      "Generic Tonometer", "Generic Vital Signs Monitor", "Generic ECG System",
      "Generic ABI System", "Generic Indirect Calorimeter",
    ],
    desc: "Complete the measurement sequence in order while preserving the rest periods required for EKG, ABI and RMR.",
    planStart: H8 + 15, planEnd: H8 + 60, est: 45,
    stepsTitle: "Measurement sequence",
    steps: [
      { label: "Tonometry", est: "1–3 min", desc: "Perform the standalone eye-pressure check." },
      { label: "SpO2 and blood pressure", est: "2–3 min", desc: "Record SpO2 and blood pressure while the patient is seated." },
      { label: "Lie down, rest and briefing", est: "3–5 min", desc: "Place the patient supine, begin the rest period and explain the remaining measurements." },
      { label: "EKG", est: "6–8 min", desc: "Place electrodes during the rest period and take the recording toward its end." },
      { label: "ABI", est: "5–10 min", desc: "Measure ankle-brachial index after at least five to ten minutes of rest." },
      { label: "RMR", est: "5–10 min", desc: "Measure resting metabolic rate after the full twenty-minute rest period." },
      { label: "Saliva sample", est: "1–3 min", desc: "Collect the saliva sample during the measurement block." },
      { label: "Provide 1L of water", est: "0–1 min", desc: "Provide one litre of water during the measurement block." },
      { label: "Blood draw", est: "5–8 min", desc: "Have the patient stand and complete the blood draw last." },
    ],
  },
  {
    id: "radiology", name: "Radiology", phase: "Diagnostics", role: "Radiologist",
    room: "Diagnostic Room A", staff: "Radiology team", devices: ["Bindex", "Generic Ultrasound"],
    desc: "The radiologist performs the REMS or Bindex bone scan and ultrasound in the diagnostic room.",
    planStart: H8 + 60, planEnd: H8 + 85, est: 25,
  },
  {
    id: "gp", name: "GP examination", phase: "Diagnostics", role: "Clinician",
    room: "Diagnostic Room A", staff: "Dr. Ebru Reis", devices: ["Generic Dermatoscope"],
    desc: "Complete the general physical and neurological examination, dermoscopy and the cognitive tests included in the patient package.",
    planStart: H8 + 85, planEnd: H8 + 125, est: 40,
  },
  {
    id: "imaging", name: "Body imaging", phase: "Diagnostics",
    room: "Body Scan Room", staff: "Berna Koç",
    devices: ["FotoFinder Total Body Mapping", "Visbody 3D Body Composition"],
    desc: "Complete FotoFinder total-body skin mapping and the Visbody 3D body-composition scan.",
    planStart: H8 + 125, planEnd: H8 + 155, est: 30,
  },
  {
    id: "stool", name: "Stool-sample request", phase: "Diagnostics",
    room: "Sample Room", staff: "Berna Koç",
    desc: "Ask for the stool sample. If it is unavailable, arrange home pickup for another day.",
    planStart: H8 + 155, planEnd: H8 + 160, est: 5,
  },
  {
    id: "dressed", name: "Get dressed", phase: "Checkout",
    room: "Changing Room", staff: "Berna Koç",
    desc: "Escort the patient to the changing room and wait until they are ready to continue.",
    planStart: H8 + 160, planEnd: H8 + 165, est: 5,
  },
  {
    id: "results", name: "Same-day results consultation", phase: "Checkout", role: "Clinician",
    room: "Consult Room A", staff: "Dr. Ebru Reis",
    desc: "Provide drinks and snacks, then present the measurements available the same day, including vitals, body composition and imaging.",
    planStart: H8 + 165, planEnd: H8 + 210, est: 45,
  },
  {
    id: "dietitian", name: "Dietitian consultation", phase: "Checkout", role: "Dietitian",
    room: "Consult Room A", staff: "Dietitian on duty",
    desc: "Review nutrition priorities and introduce the relevant rings, bands and monitoring plan.",
    planStart: H8 + 210, planEnd: H8 + 240, est: 30,
  },
  {
    id: "reception-checkout", name: "Reception checkout", phase: "Checkout", role: "Receptionist",
    room: "Front Desk", staff: "Elif Yıldız",
    desc: "Return the patient coat, collect the slippers and book the second visit for approximately two weeks later.",
    planStart: H8 + 240, planEnd: H8 + 250, est: 10,
  },
  {
    // No role pill: the pill marks a station the nurse does NOT own, and
    // this one is hers.
    id: "checkout", name: "Check out", phase: "Checkout",
    staff: "Berna Koç",
    planStart: H8 + 250, planEnd: H8 + 252, est: 2,
  },
];

/** The compact one-line "where" for a tight row: room and staff only, never
 *  the device list — five device names in a 320px row is noise, and the
 *  drawer is where devices belong. */
export function locSummary(cfg: StationConfig): string {
  return [cfg.room, cfg.staff].filter(Boolean).join(" · ");
}

/** The station index whose completion means the patient is physically in
 *  their assigned diagnostic room — the gate the Clinician Dashboard's own
 *  Start button waits on (see nurseMarkPatientArrived). */
export const IN_ROOM_STATION = FULL_DAY_STATIONS.findIndex((s) => s.id === "intake");

export const DAY_START_CLOCK = H8;

export type StationStatus = "done" | "active" | "todo";

/** Per-station logged times. Absent entries fall back to the planned times. */
export type StationLogEntry = { startAbs?: number; endAbs?: number; note?: string };
export type StationLog = Record<number, StationLogEntry>;

/** `cursor` is the one station in progress. -1 = not started, length = done. */
export type StationJourneyState = {
  cursor: number;
  clock: number;
  log: StationLog;
  /** Sub-step ticks, per station index. Absent = derived from station status. */
  subs: Record<number, boolean[]>;
};

export type JourneyMode = "not-started" | "in-progress" | "complete";

export function journeyMode(cursor: number): JourneyMode {
  if (cursor < 0) return "not-started";
  if (cursor >= FULL_DAY_STATIONS.length) return "complete";
  return "in-progress";
}

export function stationStatus(cursor: number, i: number): StationStatus {
  if (i < cursor) return "done";
  if (i === cursor) return "active";
  return "todo";
}

/** Sub-step ticks for one station: explicit state if the nurse has touched
 *  it, otherwise all-done for a finished station and all-open for the rest. */
export function subsOf(state: StationJourneyState, i: number): boolean[] {
  const explicit = state.subs[i];
  if (explicit) return explicit;
  const steps = FULL_DAY_STATIONS[i]?.steps ?? [];
  const allDone = stationStatus(state.cursor, i) === "done";
  return steps.map(() => allDone);
}

export function fmtClockAbs(abs: number | null | undefined): string | null {
  if (abs == null) return null;
  const h = Math.floor(abs / 60) % 24;
  const m = ((abs % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "—" / "0m" / "47m" / "1h 7m" — the panel never prints a bare 0. */
export function fmtSpan(min: number | null | undefined): string {
  if (min == null) return "—";
  if (min < 1) return "0m";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export type StationTiming = {
  startAbs: number | null;
  endAbs: number | null;
  start: string | null;
  end: string | null;
  /** Live for the active station, logged for a done one, planned otherwise.
   *  Callers mark it as an estimate off the station's own status ("todo"),
   *  which is the same signal — no second flag to keep in sync. */
  dur: number | null;
};

export function stationTiming(state: StationJourneyState, i: number): StationTiming {
  const cfg = FULL_DAY_STATIONS[i];
  const logged = state.log[i] ?? {};
  const status = stationStatus(state.cursor, i);
  const startAbs = logged.startAbs ?? cfg.planStart ?? null;

  if (status === "active") {
    return {
      startAbs, endAbs: null, start: fmtClockAbs(startAbs), end: null,
      dur: startAbs != null ? Math.max(0, state.clock - startAbs) : null,
    };
  }
  if (status === "done") {
    const endAbs = logged.endAbs ?? cfg.planEnd ?? null;
    const dur = endAbs != null && startAbs != null ? Math.max(0, endAbs - startAbs) : cfg.est ?? null;
    return { startAbs, endAbs, start: fmtClockAbs(startAbs), end: fmtClockAbs(endAbs), dur };
  }
  const endAbs = cfg.planEnd ?? null;
  return {
    startAbs, endAbs, start: fmtClockAbs(startAbs), end: fmtClockAbs(endAbs),
    dur: cfg.est ?? null,
  };
}

/** Gap between the previous station's end and this one's start. `null` when
 *  either side has no real time to measure from — never a fabricated 0. */
export function waitBefore(state: StationJourneyState, i: number): number | null {
  if (i < 1) return null;
  const prev = stationTiming(state, i - 1);
  const me = stationTiming(state, i);
  if (prev.endAbs == null || me.startAbs == null) return null;
  const w = me.startAbs - prev.endAbs;
  return w >= 0 ? w : null;
}

/** Advance the cursor: close the active station at `clock`, open the next
 *  one at the same moment. Returns the next state, or the same state when
 *  there is nothing left to advance. */
export function advanceStations(state: StationJourneyState): StationJourneyState {
  const mode = journeyMode(state.cursor);
  if (mode === "complete") return state;
  if (mode === "not-started") {
    const start = FULL_DAY_STATIONS[0].planStart ?? state.clock;
    return { ...state, cursor: 0, clock: Math.max(state.clock, start), log: { 0: { startAbs: start } } };
  }

  const i = state.cursor;
  const timing = stationTiming(state, i);
  const startAbs = timing.startAbs ?? state.clock;
  const endAbs = Math.max(state.clock, startAbs);
  const log: StationLog = { ...state.log, [i]: { ...state.log[i], startAbs, endAbs } };
  const next = i + 1;
  if (next < FULL_DAY_STATIONS.length) log[next] = { ...state.log[next], startAbs: endAbs };
  return { ...state, cursor: next, clock: endAbs, log };
}

/** Reopen the previous station and reset the current one — the "step back a
 *  station" correction. */
export function stepBackStations(state: StationJourneyState): StationJourneyState {
  if (state.cursor <= 0) return state;
  const prev = state.cursor - 1;
  const log: StationLog = { ...state.log };
  log[prev] = { ...log[prev], endAbs: undefined };
  delete log[state.cursor];
  const subs = { ...state.subs };
  delete subs[prev];
  delete subs[state.cursor];
  return { ...state, cursor: prev, log, subs };
}
