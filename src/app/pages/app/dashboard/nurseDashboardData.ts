// Mock data and types for the Nurse Dashboard's own patient-focused body.
// It shares the standard KPI bar (KPI_CONFIG.Nurse, in kpiData.ts) with every
// other role, but below that header this page has its own dedicated model
// built around one question: what does this nurse do right now, and who's
// next. The Patient Journey panel's own station model lives in
// ./journey/stationJourney.ts; this file only carries patient identity plus
// the rail cards (schedule, queue, completed).

import { NOW_MINUTES } from "./dashboardData";
import { DAY_START_CLOCK, FULL_DAY_STATIONS, journeyMode } from "./journey/stationJourney";

export type PatientIdentity = {
  name: string;
  tag: string; // "34 · F"
  meta: string; // "Full-day assessment · 08:00 · Berna Koç · Diagnostic Room A"
  route: string;
};

export type ScheduleStatus = "in-progress" | "upcoming" | "cancelled";

export type ScheduleItem = {
  time: string;
  name: string;
  type: string;
  doctor: string;
  room: string;
  duration: string;
  status: ScheduleStatus;
};

export type QueueItem = {
  name: string;
  time: string;
  type: string;
};

export type CompletedItem = {
  name: string;
  type: string;
  time: string;
};

export const INITIAL_PATIENT: PatientIdentity = {
  name: "Ece Yıldırım",
  tag: "34 · F",
  meta: "Full-day assessment · 08:00 · Berna Koç · Diagnostic Room A",
  route: "/patients/P-001",
};

// Where a scenario drops the nurse into the sixteen-station full-day
// assessment: `cursor` is the station in progress (-1 before the first,
// FULL_DAY_STATIONS.length once checked out) and `clock` is minutes from
// midnight, sharing NOW_MINUTES with the rest of the dashboard so the
// journey's "now" agrees with the schedule rail beside it.
export type NurseJourneyStart = { cursor: number; clock: number };

export const INITIAL_CLOCK = NOW_MINUTES;

const MEASUREMENTS_INDEX = FULL_DAY_STATIONS.findIndex((s) => s.id === "measurements");
const ALL_STATIONS_DONE = FULL_DAY_STATIONS.length;

// The mid-flow story: reception and preparation logged, and the measurement
// block running since 08:15 with its nine-step sequence still open.
export const MID_SHIFT_JOURNEY: NurseJourneyStart = { cursor: MEASUREMENTS_INDEX, clock: INITIAL_CLOCK };

// Every station is a real 60-120 min block and the whole day is strictly
// sequential — a nurse's own supervised list is never room-scoped like the
// shared multi-clinician calendar, so nothing here is ever meant to overlap
// (unlike that grid, which legitimately lane-packs concurrent bookings
// across different rooms/doctors).
export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { time: "08:00", name: "Ece Yıldırım", type: "Body Scan", doctor: "Dr. Ebru Reis", room: "Room 3", duration: "90 min", status: "in-progress" },
  { time: "09:30", name: "Hakan Bulut", type: "Consultation", doctor: "Dr. Emre Yalçın", room: "Room 1", duration: "60 min", status: "upcoming" },
  { time: "10:30", name: "Aslı Kutlu", type: "Body Scan", doctor: "Dr. Ebru Reis", room: "Room 3", duration: "90 min", status: "cancelled" },
  { time: "12:00", name: "Yasemin Kaplan", type: "Check-in", doctor: "Dr. Emre Yalçın", room: "Room 2", duration: "60 min", status: "upcoming" },
  { time: "13:00", name: "Burak Kocaman", type: "Vitals", doctor: "Dr. Ebru Reis", room: "Room 1", duration: "90 min", status: "upcoming" },
  { time: "14:30", name: "Defne Korkut", type: "Body Scan", doctor: "Dr. Ebru Reis", room: "Room 3", duration: "90 min", status: "upcoming" },
  { time: "16:00", name: "Ozan Bilgin", type: "Blood Draw", doctor: "Lab 1", room: "Lab 1", duration: "90 min", status: "upcoming" },
  { time: "17:30", name: "Hakan Bulut", type: "Follow-up", doctor: "Dr. Emre Yalçın", room: "Room 1", duration: "60 min", status: "upcoming" },
];

export const INITIAL_UP_NEXT: QueueItem[] = [
  { name: "Hakan Bulut", time: "09:30", type: "Consultation" },
  { name: "Yasemin Kaplan", time: "12:00", type: "Check-in" },
  { name: "Burak Kocaman", time: "13:00", type: "Vitals" },
  { name: "Defne Korkut", time: "14:30", type: "Body Scan" },
  { name: "Ozan Bilgin", time: "16:00", type: "Blood Draw" },
];

export const INITIAL_COMPLETED_TODAY: CompletedItem[] = [
  { name: "Ceyda Aksu", type: "Consultation", time: "07:40" },
  { name: "Emir Tekin", type: "Body Scan", time: "07:55" },
  { name: "İpek Sarıkaya", type: "Check-in", time: "08:10" },
];

// Starting the next patient from the queue: nothing is logged yet, so the
// panel opens on its not-started state and the nurse's first tap is the
// explicit "Start journey" on the first station.
export function buildPatientFromQueueItem(item: QueueItem, clock: number): { identity: PatientIdentity; journey: NurseJourneyStart } {
  return {
    identity: { name: item.name, tag: "—", meta: `${item.type} · ${item.time}`, route: "/patients/P-001" },
    journey: { cursor: -1, clock },
  };
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// The earliest non-cancelled appointment on the schedule — used by the
// "Awaiting First Patient" empty state to name what's coming up next.
export function nextUpcomingAppointment(schedule: ScheduleItem[]): { name: string; time: string } | null {
  const sorted = schedule.filter((s) => s.status !== "cancelled").slice().sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const first = sorted[0];
  return first ? { name: first.name, time: first.time } : null;
}

// --- Demo Moment scenarios (QA/demo aid only) ---
// Lets the Nurse dashboard preview all three "no active patient" states —
// the shared dashboardData.ts NOW_MINUTES stays untouched (other roles'
// pages read it too); only this page's own `clock` shifts per scenario.

export type DemoMoment = "day-start" | "handoff" | "mid-shift" | "day-wrap";

export type NurseDemoScenario = {
  label: string;
  patient: PatientIdentity | null;
  journey: NurseJourneyStart;
  schedule: ScheduleItem[];
  upNext: QueueItem[];
  completedToday: CompletedItem[];
};

// Before the first patient has checked in: no one's arrived yet, so the
// queue is empty and every appointment is still just "upcoming". Same
// non-overlapping 60-120 min blocks as INITIAL_SCHEDULE, minus the
// cancelled Aslı Kutlu slot and the second (Follow-up) Hakan Bulut visit.
const DAY_START_SCHEDULE: ScheduleItem[] = [
  { time: "08:00", name: "Ece Yıldırım", type: "Body Scan", doctor: "Dr. Ebru Reis", room: "Room 3", duration: "90 min", status: "upcoming" },
  { time: "09:30", name: "Hakan Bulut", type: "Consultation", doctor: "Dr. Emre Yalçın", room: "Room 1", duration: "60 min", status: "upcoming" },
  { time: "12:00", name: "Yasemin Kaplan", type: "Check-in", doctor: "Dr. Emre Yalçın", room: "Room 2", duration: "60 min", status: "upcoming" },
  { time: "13:00", name: "Burak Kocaman", type: "Vitals", doctor: "Dr. Ebru Reis", room: "Room 1", duration: "90 min", status: "upcoming" },
  { time: "14:30", name: "Defne Korkut", type: "Body Scan", doctor: "Dr. Ebru Reis", room: "Room 3", duration: "90 min", status: "upcoming" },
];

// The whole day still ahead of her, Ece's own 08:00 slot included — at day
// start the queue is the schedule.
const DAY_START_UP_NEXT: QueueItem[] = [
  { name: "Ece Yıldırım", time: "08:00", type: "Full-day assessment" },
  ...INITIAL_UP_NEXT.slice(0, 4),
];

// No patient is mid-visit in these scenarios, so no schedule row may still
// read "in progress" — same normalization the live checkout applies.
function withoutInProgress(schedule: ScheduleItem[]): ScheduleItem[] {
  return schedule.map((item) => (item.status === "in-progress" ? { ...item, status: "upcoming" as ScheduleStatus } : item));
}

// End of shift: everyone assigned today has been checked out, so no
// schedule row should still read "in progress".
const DAY_WRAP_SCHEDULE: ScheduleItem[] = withoutInProgress(INITIAL_SCHEDULE);
const DAY_WRAP_COMPLETED: CompletedItem[] = [
  { name: "Ceyda Aksu", type: "Consultation", time: "07:40" },
  { name: "Emir Tekin", type: "Body Scan", time: "07:55" },
  { name: "İpek Sarıkaya", type: "Check-in", time: "08:10" },
  { name: "Ece Yıldırım", type: "Body Scan", time: "09:20" },
  { name: "Hakan Bulut", type: "Consultation", time: "10:05" },
];

// Up Next stays locked only while the patient on screen still has a live
// journey. A checked-out patient keeps the card (that's the "Patient Checked
// Out" screen) but no longer holds the queue, so the Start button is already
// lit when the scenario loads — no post-mount flicker from disabled to lit.
export function isQueueLocked(scenario: NurseDemoScenario): boolean {
  return !!scenario.patient && journeyMode(scenario.journey.cursor) !== "complete";
}

export const NURSE_DEMO_SCENARIOS: Record<DemoMoment, NurseDemoScenario> = {
  // Nobody is on the panel yet, so it shows the shift's own empty state and
  // the whole day sits in Up Next. Tapping Start there puts the first patient
  // on the panel in its not-started state ("Start journey — <first
  // station>"), which is the moment the old card had no way to show at all.
  "day-start": {
    label: "Day Start",
    patient: null,
    journey: { cursor: -1, clock: DAY_START_CLOCK },
    schedule: DAY_START_SCHEDULE,
    upNext: DAY_START_UP_NEXT,
    completedToday: [],
  },
  handoff: {
    label: "Handoff",
    patient: INITIAL_PATIENT,
    // All sixteen stations logged: the panel sits on its "Journey complete"
    // state while Up Next's Start button comes back to life for Hakan. The
    // clock is two minutes past the plan's own 12:12 checkout — a full-day
    // assessment cannot close inside the old twelve-station journey's 90
    // minutes, and the panel's own clock has always been per-scenario (see
    // Day Wrap's 17:00) rather than the page-wide NOW_MINUTES now-line.
    journey: { cursor: ALL_STATIONS_DONE, clock: 12 * 60 + 14 }, // 12:14
    schedule: withoutInProgress(INITIAL_SCHEDULE),
    upNext: INITIAL_UP_NEXT,
    // Ece is deliberately absent here: the journey card reports her own
    // check-out as it mounts (PatientJourneySection's onComplete), which
    // prepends her to this list exactly as a live checkout would.
    completedToday: INITIAL_COMPLETED_TODAY,
  },
  "mid-shift": {
    label: "Mid-Shift",
    patient: INITIAL_PATIENT,
    journey: MID_SHIFT_JOURNEY,
    schedule: INITIAL_SCHEDULE,
    upNext: INITIAL_UP_NEXT,
    completedToday: INITIAL_COMPLETED_TODAY,
  },
  "day-wrap": {
    label: "Day Wrap",
    patient: null,
    journey: { cursor: ALL_STATIONS_DONE, clock: 17 * 60 }, // 17:00
    schedule: DAY_WRAP_SCHEDULE,
    upNext: [],
    completedToday: DAY_WRAP_COMPLETED,
  },
};
