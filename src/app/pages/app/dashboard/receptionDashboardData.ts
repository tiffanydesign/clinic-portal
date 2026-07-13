// Data-layer sort/gate logic for the Reception Front Desk Queue. Kept as pure
// functions (per the project's own coding-style rule) so the row bucket a
// patient lands in, and which single action their row shows, are testable
// independent of any component.

import { Appt, canCheckIn, JOURNEY_STEPS_RECEPTION } from "./dashboardData";

export const FINAL_STEP_INDEX = JOURNEY_STEPS_RECEPTION.length - 1;

export const consentOk = (a: Appt): boolean => a.forms.every((f) => f.status === "Signed");
export const paymentOk = (a: Appt): boolean => a.payment === "Paid";

// A patient's journey reaching its last station (the same step
// JOURNEY_STEPS_ADMIN itself calls "Check Out") — the nurse's own signal
// that the visit is winding down. Check-out itself is a nurse action, not a
// Reception one: Reception only ever reads this, it never has a button for
// it (see primaryActionFor below).
export function readyForCheckout(a: Appt): boolean {
  return a.status === "In Clinic" && a.currentStep >= FINAL_STEP_INDEX;
}

// Already inside, with nothing left for Reception to do — including a
// patient whose journey has reached its last station, since check-out is
// the nurse's action to take, synced here read-only once she takes it.
export function isReadOnlyInClinic(a: Appt): boolean {
  return a.status === "Checked In" || a.status === "In Clinic";
}

// The front desk's own triage order — not the raw ApptStatus order:
// 1 unresolved gate, 2 ready to check in, 3 not arrived yet, 4 already
// inside (nothing for Reception to do), 5 fully settled.
export function bucketFor(a: Appt): number {
  if (a.status === "Arrived") return canCheckIn(a) ? 2 : 1;
  if (a.status === "Booked") return 3;
  if (isReadOnlyInClinic(a)) return 4;
  return 5; // Completed (checked out by the nurse), Cancelled, No Show
}

export function sortQueue(appts: Appt[]): Appt[] {
  return [...appts].sort((a, b) => {
    const ba = bucketFor(a);
    const bb = bucketFor(b);
    if (ba !== bb) return ba - bb;
    // Within the two action buckets, longest-waiting first; everywhere else,
    // chronological is the more useful read.
    if (ba === 1 || ba === 2) return (b.waitMinutes ?? 0) - (a.waitMinutes ?? 0);
    return a.startMin - b.startMin;
  });
}

export type RowAction =
  | { kind: "take-payment" }
  | { kind: "send-form"; label: "Send Form" | "Resend" }
  | { kind: "check-in" }
  | { kind: "mark-arrived" }
  | { kind: "none" };

// The single next-step button a row shows — payment takes priority over
// consent when both gates are open, per the front desk's own convention
// (settle money first); the row's Consent chip still surfaces the form gap.
// Note there's no "check-out" action here: check-out is the nurse's own
// step (she marks it from her side once the patient's journey finishes),
// Reception only ever sees the resulting status, never triggers it.
export function primaryActionFor(a: Appt): RowAction {
  if (a.status === "Arrived") {
    if (!paymentOk(a)) return { kind: "take-payment" };
    if (!consentOk(a)) return { kind: "send-form", label: a.forms.some((f) => f.status === "Not Sent") ? "Send Form" : "Resend" };
    return { kind: "check-in" };
  }
  // A video visit has no physical arrival for Reception to mark.
  if (a.status === "Booked") return a.isVideo ? { kind: "none" } : { kind: "mark-arrived" };
  return { kind: "none" };
}

export type CounterFilter = "awaiting" | "ready" | "in-clinic" | "unpaid";

export function matchesFilter(a: Appt, filter: CounterFilter): boolean {
  switch (filter) {
    case "awaiting": return a.status === "Arrived" && !canCheckIn(a);
    case "ready": return a.status === "Arrived" && canCheckIn(a);
    case "in-clinic": return isReadOnlyInClinic(a);
    case "unpaid": return a.payment !== "Paid";
  }
}

export function parseCurrency(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

export function formatCurrency(n: number): string {
  return `₺${n.toLocaleString("en-US")}`;
}
