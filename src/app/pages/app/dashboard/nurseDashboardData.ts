// Mock data and types for the redesigned, single-focus Nurse Dashboard.
// Unlike the shared multi-role dashboard (KPI bar + calendar + queue panels),
// this page has its own dedicated model built around one question: what does
// this nurse do right now, and who's next — not a KPI/metrics summary.
// The Patient Journey card's own step/state-machine model lives in
// ./journey/journeyEngine.ts; this file only carries patient identity plus
// the rail cards (schedule, queue, completed).

import { NOW_MINUTES } from "./dashboardData";
import type { JourneyEntries } from "./journey/journeyEngine";

export type PatientIdentity = {
  name: string;
  tag: string; // "34 · F"
  meta: string; // "Body Scan · 08:00 · Dr. Ebru Reis · Room 3"
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
  meta: "Body Scan · 08:00 · Dr. Ebru Reis · Room 3",
  route: "/patients/P-001",
};

// Clock is in minutes-from-midnight, sharing NOW_MINUTES with the rest of
// the dashboard so the journey's "now" agrees with the schedule rail below
// it. The entries below tell a mid-flow story ending in machine1: signed,
// picked up, two scans done, and 16 of 27 min into the third station.
export const INITIAL_CLOCK = NOW_MINUTES;
export const INITIAL_ENTRIES: JourneyEntries = {
  signed: { at: 480 },
  pickup: { at: 495 },
  scan1: { enter: 500, exit: 515 },
  scan2: { enter: 521, exit: 533 },
  machine1: { enter: 538 },
};

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

// Starting the next patient from the queue: consent & payment are already
// settled by the time the nurse takes over, but pickup is left unconfirmed —
// the nurse's journey always starts with her manually confirming "Picked up
// from waiting area" before the journey engine will advance to Scan 1.
export function buildPatientFromQueueItem(item: QueueItem, clock: number): { identity: PatientIdentity; entries: JourneyEntries } {
  return {
    identity: { name: item.name, tag: "—", meta: `${item.type} · ${item.time}`, route: "/patients/P-001" },
    entries: { signed: { at: clock } },
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

export type DemoMoment = "day-start" | "mid-shift" | "day-wrap";

export type NurseDemoScenario = {
  label: string;
  patient: PatientIdentity | null;
  entries: JourneyEntries;
  clock: number;
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

// End of shift: everyone assigned today has been checked out, so no
// schedule row should still read "in progress".
const DAY_WRAP_SCHEDULE: ScheduleItem[] = INITIAL_SCHEDULE.map((item) =>
  item.status === "in-progress" ? { ...item, status: "upcoming" as ScheduleStatus } : item
);
const DAY_WRAP_COMPLETED: CompletedItem[] = [
  { name: "Ceyda Aksu", type: "Consultation", time: "07:40" },
  { name: "Emir Tekin", type: "Body Scan", time: "07:55" },
  { name: "İpek Sarıkaya", type: "Check-in", time: "08:10" },
  { name: "Ece Yıldırım", type: "Body Scan", time: "09:20" },
  { name: "Hakan Bulut", type: "Consultation", time: "10:05" },
];

export const NURSE_DEMO_SCENARIOS: Record<DemoMoment, NurseDemoScenario> = {
  "day-start": {
    label: "Day Start",
    patient: null,
    entries: {},
    clock: 7 * 60 + 30, // 07:30, before the 08:00 opening appointment
    schedule: DAY_START_SCHEDULE,
    upNext: [],
    completedToday: [],
  },
  "mid-shift": {
    label: "Mid-Shift",
    patient: INITIAL_PATIENT,
    entries: INITIAL_ENTRIES,
    clock: INITIAL_CLOCK,
    schedule: INITIAL_SCHEDULE,
    upNext: INITIAL_UP_NEXT,
    completedToday: INITIAL_COMPLETED_TODAY,
  },
  "day-wrap": {
    label: "Day Wrap",
    patient: null,
    entries: {},
    clock: 17 * 60, // 17:00, after the last 14:00 appointment
    schedule: DAY_WRAP_SCHEDULE,
    upNext: [],
    completedToday: DAY_WRAP_COMPLETED,
  },
};
