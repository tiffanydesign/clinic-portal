// Data + pure gating logic specific to the Clinician Dashboard rebuild.
// Kept out of dashboardData.ts (already at the project's file-size ceiling)
// so the shared Appt model stays generic and this role's rules stay together.

import { Appt, JOURNEY_STEPS_RECEPTION, NOW_MINUTES } from "./dashboardData";

export const CLINICIAN_ID = "EMP-003"; // Dr. Ebru Reis (signed-in clinician)

export const CONSULTATION_STEP_INDEX = JOURNEY_STEPS_RECEPTION.indexOf("Consultation");

// A video call may only be joined inside a window around its own start time;
// outside that window (or before its check-in), it isn't callable yet.
const JOIN_WINDOW_MIN = 5;

export type QueueItem = { patient: string; test: string; submitted: string; overdue: boolean };

// Results waiting for a first look — sorted overdue-first so the queue
// itself carries the same triage signal as the counter above it.
export const CLINICIAN_REVIEW_QUEUE: QueueItem[] = [
  { patient: "Gül Korkmaz", test: "Genetic Panel", submitted: "28 Jun", overdue: true },
  { patient: "Cem Polat", test: "Comprehensive Blood", submitted: "01 Jul", overdue: false },
  { patient: "Yasemin Kaplan", test: "Lipid Panel", submitted: "02 Jul", overdue: false },
  { patient: "Ece Yıldırım", test: "Metabolic Panel", submitted: "02 Jul", overdue: false },
  { patient: "Burak Kocaman", test: "Hormone Screen", submitted: "03 Jul", overdue: false },
];

// Reports already reviewed, now awaiting the clinician's own signature —
// a distinct queue from the one above (never the same report in both).
export const CLINICIAN_SIGNOFF_QUEUE: QueueItem[] = [
  { patient: "Hakan Bulut", test: "Hormone Panel", submitted: "27 Jun", overdue: true },
  { patient: "Tarkan Solmaz", test: "Body Scan Report", submitted: "30 Jun", overdue: false },
  { patient: "Serkan Çetin", test: "Metabolic Panel", submitted: "01 Jul", overdue: false },
];

// The one appointment currently "in progress" for this clinician, if any —
// the single-active-session rule the Now/Up Next card and mutual-exclusion
// logic below are both built around.
export function activeApptFor(appts: Appt[]): Appt | undefined {
  return appts.find((a) => a.status === "In Clinic");
}

// The next appointment worth showing once nothing is active: earliest by
// time, excluding anything that's already a dead end.
export function upNextApptFor(appts: Appt[]): Appt | undefined {
  return appts
    .filter((a) => a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "No Show")
    .sort((a, b) => a.startMin - b.startMin)[0];
}

// In-person "Start Consultation" gate: the patient's own journey has to have
// reached the consultation station itself, not just arrived at the clinic.
export function inPersonStartState(appt: Appt): { enabled: boolean; reason: string } {
  if (appt.currentStep >= CONSULTATION_STEP_INDEX) return { enabled: true, reason: "" };
  return { enabled: false, reason: `Patient currently in ${JOURNEY_STEPS_RECEPTION[appt.currentStep]}` };
}

// Video "Join Call" gate: blocked outright while another session (in-person
// or video) is active, otherwise only callable inside its own time window.
export function videoJoinState(appt: Appt, hasActiveSession: boolean, nowMin: number = NOW_MINUTES): { enabled: boolean; reason: string } {
  if (hasActiveSession) return { enabled: false, reason: "Queued · starts after current session" };
  if (Math.abs(appt.startMin - nowMin) <= JOIN_WINDOW_MIN) return { enabled: true, reason: "" };
  if (nowMin < appt.startMin) return { enabled: false, reason: `Starts at ${appt.timeLabel.split(" – ")[0]}` };
  return { enabled: false, reason: "Call window has passed" };
}
