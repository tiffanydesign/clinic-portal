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
  meta: string; // "Body Scan · 08:00 · Dr. Claudia Reis · Room 3"
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
  name: "Mackenzie Messineo",
  tag: "34 · F",
  meta: "Body Scan · 08:00 · Dr. Claudia Reis · Room 3",
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

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { time: "08:00", name: "Mackenzie Messineo", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "in-progress" },
  { time: "08:30", name: "Gustavo Propolis", type: "Consultation", doctor: "Dr. Chad Okonkwo", room: "Room 1", duration: "20 min", status: "upcoming" },
  { time: "09:00", name: "Penny Pelargonium", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "cancelled" },
  { time: "09:15", name: "Cynthia Riboflavin", type: "Check-in", doctor: "Dr. Chad Okonkwo", room: "Room 2", duration: "10 min", status: "upcoming" },
  { time: "10:00", name: "Dylan Daniel", type: "Vitals", doctor: "Dr. Claudia Reis", room: "Room 1", duration: "15 min", status: "upcoming" },
  { time: "10:30", name: "Amara Chen", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "upcoming" },
  { time: "11:00", name: "Noah Kimura", type: "Blood Draw", doctor: "Lab 1", room: "Lab 1", duration: "10 min", status: "upcoming" },
  { time: "14:00", name: "Gustavo Propolis", type: "Follow-up", doctor: "Dr. Chad Okonkwo", room: "Room 1", duration: "20 min", status: "upcoming" },
];

export const INITIAL_UP_NEXT: QueueItem[] = [
  { name: "Gustavo Propolis", time: "08:30", type: "Consultation" },
  { name: "Cynthia Riboflavin", time: "09:15", type: "Check-in" },
  { name: "Dylan Daniel", time: "10:00", type: "Vitals" },
  { name: "Amara Chen", time: "10:30", type: "Body Scan" },
  { name: "Noah Kimura", time: "11:00", type: "Blood Draw" },
];

export const INITIAL_COMPLETED_TODAY: CompletedItem[] = [
  { name: "Sophia Lindqvist", type: "Consultation", time: "07:40" },
  { name: "Marco Duarte", type: "Body Scan", time: "07:55" },
  { name: "Elena Popescu", type: "Check-in", time: "08:10" },
];

// Starting the next patient from the queue: signed and picked up are already
// settled by the time the nurse takes over, so the journey engine's
// currentStep() lands directly on the first station in "enter" mode.
export function buildPatientFromQueueItem(item: QueueItem, clock: number): { identity: PatientIdentity; entries: JourneyEntries } {
  return {
    identity: { name: item.name, tag: "—", meta: `${item.type} · ${item.time}`, route: "/patients/P-001" },
    entries: { signed: { at: clock }, pickup: { at: clock } },
  };
}
