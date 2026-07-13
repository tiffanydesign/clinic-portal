// Data-layer sort/gate logic for the Reception Front Desk Queue. Kept as pure
// functions (per the project's own coding-style rule) so the row bucket a
// patient lands in, and which single action their row shows, are testable
// independent of any component.

import { Appt, NOW_MINUTES } from "./dashboardData";

export const consentOk = (a: Appt): boolean => a.forms.every((f) => f.status === "Signed");
export const paymentOk = (a: Appt): boolean => a.payment === "Paid";

// Already inside, with nothing left for Reception to do — including a
// patient whose journey has reached its last station, since check-out is
// the nurse's action to take (journeyEngine.ts's final "checkout"
// milestone), synced here read-only once she takes it.
export function isReadOnlyInClinic(a: Appt): boolean {
  return a.status === "Checked In" || a.status === "In Clinic";
}

export function isSettled(a: Appt): boolean {
  return a.status === "Completed" || a.status === "Cancelled" || a.status === "No Show";
}

// A patient waiting noticeably longer than the front desk would expect for
// a simple gate fix — worth an Icon-only Call quick-action on their row.
export function isLate(a: Appt): boolean {
  return a.status === "Arrived" && (a.waitMinutes ?? 0) >= 15;
}

// --- queue grouping: 3 sections, in this fixed order, no "awaiting checkout" group ---
export type QueueGroup = "needs-action" | "ready-upcoming" | "in-clinic";

export const GROUP_LABEL: Record<QueueGroup, string> = {
  "needs-action": "Needs Action",
  "ready-upcoming": "Ready / Upcoming",
  "in-clinic": "In Clinic",
};

export function groupFor(a: Appt): QueueGroup | null {
  if (isSettled(a)) return null; // settled rows leave the queue entirely
  // Video appointments never need a physical arrival/check-in — they stay
  // visible only in Today's Schedule and never occupy a Front Desk Queue
  // row or count toward any group, per the front desk's own scope.
  if (a.isVideo) return null;
  if (a.status === "Arrived" && (!consentOk(a) || !paymentOk(a))) return "needs-action";
  if (isReadOnlyInClinic(a)) return "in-clinic";
  return "ready-upcoming"; // Arrived+ready, or Booked
}

export function sortGroup(appts: Appt[], group: QueueGroup): Appt[] {
  if (group === "needs-action") return [...appts].sort((a, b) => (b.waitMinutes ?? 0) - (a.waitMinutes ?? 0));
  if (group === "ready-upcoming") {
    // Arrived-and-ready patients (physically waiting, just need the tap)
    // surface above still-booked ones, regardless of appointment time.
    return [...appts].sort((a, b) => {
      const arrivedRank = (x: Appt) => (x.status === "Arrived" ? 0 : 1);
      const ra = arrivedRank(a), rb = arrivedRank(b);
      if (ra !== rb) return ra - rb;
      return a.startMin - b.startMin;
    });
  }
  return [...appts].sort((a, b) => a.startMin - b.startMin);
}

export function groupQueue(appts: Appt[]): Record<QueueGroup, Appt[]> {
  const out: Record<QueueGroup, Appt[]> = { "needs-action": [], "ready-upcoming": [], "in-clinic": [] };
  appts.forEach((a) => {
    const g = groupFor(a);
    if (g) out[g].push(a);
  });
  (Object.keys(out) as QueueGroup[]).forEach((g) => { out[g] = sortGroup(out[g], g); });
  return out;
}

// --- row action state machine (consent-first: Consent → Payment → Check In) ---
// No "send-link"/video case — video appointments never reach this function
// at all, since groupFor excludes them from the queue upstream.
export type RowAction =
  | { kind: "sign-consent" }
  | { kind: "take-payment" }
  | { kind: "check-in" }
  | { kind: "mark-arrived" }
  | { kind: "none" };

// The single next-step button a row shows. Payment takes priority over
// consent — the front desk settles the balance first, then walks the
// patient through the consent form once money's no longer outstanding.
export function primaryActionFor(a: Appt): RowAction {
  if (a.status === "Arrived") {
    if (!paymentOk(a)) return { kind: "take-payment" };
    if (!consentOk(a)) return { kind: "sign-consent" };
    return { kind: "check-in" };
  }
  if (a.status === "Booked") return { kind: "mark-arrived" };
  return { kind: "none" };
}

// --- header stat chips: fixed pair, not a customisable KPI layout ---
export type ChipId = "in-clinic" | "unpaid";

export function chipValue(id: ChipId, appts: Appt[]): { count: number; sublabel?: string } {
  if (id === "in-clinic") return { count: appts.filter(isReadOnlyInClinic).length };
  const unpaid = appts.filter((a) => !a.isVideo && a.payment !== "Paid");
  const total = unpaid.reduce((sum, a) => sum + parseCurrency(a.balance), 0);
  return { count: unpaid.length, sublabel: formatCurrency(total) };
}

// Each chip also acts as a queue filter — same predicate drives both the
// count on the chip and which rows appear below when it's tapped. Video
// appointments never count here either, same as in the queue itself.
export function matchesChip(a: Appt, id: ChipId): boolean {
  return id === "in-clinic" ? isReadOnlyInClinic(a) : !a.isVideo && a.payment !== "Paid";
}

export function parseCurrency(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

export function formatCurrency(n: number): string {
  return `₺${n.toLocaleString("en-US")}`;
}

export { NOW_MINUTES };
