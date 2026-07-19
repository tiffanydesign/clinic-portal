// Shared in-memory store for today's appointments — the single source of
// truth Reception and Nurse both read/write, so a check-in or a nurse
// checkout actually propagates across roles instead of living in each
// page's own local `useState` override (the old pattern). Follows the same
// useSyncExternalStore shape as paymentTerminalsStore.ts.

import { useSyncExternalStore } from "react";
import { APPTS, Appt, minToClock, NOW_MINUTES } from "./dashboardData";
import { RESULTS_CONSULTATION_INDEX } from "./journey/journeyTemplates";
import { logAudit, AUDIT_ACTOR } from "../clinic-settings/auditStore";

let appts: Appt[] = APPTS.map((a) => structuredClone(a));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function update(id: string, patch: Partial<Appt> | ((a: Appt) => Partial<Appt>)) {
  appts = appts.map((a) => (a.id === id ? { ...a, ...(typeof patch === "function" ? patch(a) : patch) } : a));
  emit();
}

export function useAppointments(): Appt[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => appts
  );
}

export function getAppointment(id: string): Appt | undefined {
  return appts.find((a) => a.id === id);
}

/**
 * Adds a newly booked appointment to the shared store.
 *
 * Every booking entry point routes through here rather than each page holding
 * its own `created` array — that local-state pattern was why a booking made on
 * the Schedule page never showed up in Reception's Front Desk Queue, which
 * reads this store.
 */
export function addAppointment(a: Appt) {
  appts = [...appts, a];
  emit();
  logAudit({
    actor: AUDIT_ACTOR,
    entityType: "appointment",
    entityId: a.id,
    action: "Created appointment",
    detail: `${a.patient.name} · ${a.type} · ${a.timeLabel}`,
  });
}

export function markArrived(id: string) {
  update(id, { status: "Arrived", arrivedTime: minToClock(NOW_MINUTES), waitMinutes: 0 });
}

// Signs every required form and the legacy `consent` field together — the
// two have drifted into separate flags over this app's history, but a real
// patient signature settles both at once.
export function signConsent(id: string) {
  update(id, (a) => ({
    forms: a.forms.map((f) => ({ ...f, status: "Signed" as const })),
    consent: "Signed",
  }));
}

export function recordPayment(id: string) {
  update(id, { payment: "Paid", balance: "₺0" });
}

export function checkIn(id: string) {
  update(id, { status: "Checked In" });
}

// The Nurse dashboard's patient model has no shared Appt id (it's its own
// name-only mock scenario system — see nurseDashboardData.ts) — so checkout
// joins back to this store by patient name, matching whichever of today's
// checked-in/in-clinic appointments for that name is furthest along. This is
// a deliberately minimal join, not a general identity system: it exists
// only so the demo's one "current patient" can hand off cleanly.
export function nurseCheckOutByName(name: string) {
  const candidate = appts.find((a) => a.patient.name === name && (a.status === "Checked In" || a.status === "In Clinic"));
  if (candidate) update(candidate.id, { status: "Completed" });
}

// Nurse-side confirmation (the Patient Journey card's "Arrived at Room X"
// milestone — see journeyEngine.ts) that a patient is now physically in
// their assigned room, early in the visit (right after Changing Room).
// Deliberately bumps currentStep all the way to Consultation: this is a
// simplified single-milestone gate (not a per-station one) — its trade-off
// is that the Clinician Dashboard's in-person "Start" unlocks as soon as
// the patient arrives, rather than only right before the consultation
// itself (inPersonStartState in clinicianDashboardData.ts checks
// `currentStep >= RESULTS_CONSULTATION_INDEX`). Joined by name for the same
// reason nurseCheckOutByName is (no shared Appt id on the Nurse side).
export function nurseMarkPatientArrived(name: string) {
  const candidate = appts.find((a) => a.patient.name === name && (a.status === "Checked In" || a.status === "In Clinic" || a.status === "Arrived"));
  if (candidate && candidate.currentStep < RESULTS_CONSULTATION_INDEX) update(candidate.id, { currentStep: RESULTS_CONSULTATION_INDEX });
}
