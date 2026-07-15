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

// --- queue grouping: "all" (every row, chronological) plus 3 gate-triage
// sections, in this fixed order, no "awaiting checkout" group ---
export type QueueGroup = "all" | "needs-action" | "upcoming" | "in-clinic";

export const GROUP_LABEL: Record<QueueGroup, string> = {
  all: "All",
  "needs-action": "Needs Action",
  upcoming: "Upcoming",
  "in-clinic": "In Clinic",
};

// Any patient physically at the desk (Arrived) is, by definition, something
// the front desk needs to act on next — whether that's clearing a blocked
// gate or simply tapping Check In once both gates are clear. "Upcoming"
// therefore only ever holds Booked (not-yet-arrived) appointments.
export function groupFor(a: Appt): QueueGroup | null {
  if (isSettled(a)) return null; // settled rows leave the queue entirely
  // Video appointments never need a physical arrival/check-in — they stay
  // visible only in Today's Schedule and never occupy a Front Desk Queue
  // row or count toward any group, per the front desk's own scope.
  if (a.isVideo) return null;
  if (a.status === "Arrived") return "needs-action";
  if (isReadOnlyInClinic(a)) return "in-clinic";
  return "upcoming"; // Booked
}

// "All" is always chronological (by appointment time), same as Upcoming/In
// Clinic — only Needs Action sorts by wait time, since that's the one tab
// where triage order matters more than the clock.
export function sortGroup(appts: Appt[], group: QueueGroup): Appt[] {
  if (group === "needs-action") return [...appts].sort((a, b) => (b.waitMinutes ?? 0) - (a.waitMinutes ?? 0));
  return [...appts].sort((a, b) => a.startMin - b.startMin);
}

// "All" is a right-now view of the desk, not the whole day. A patient who's
// physically present (Arrived / Checked In / In Clinic) is always relevant
// now regardless of their scheduled slot; a not-yet-arrived Booked
// appointment only appears once it's within a couple hours of the clock —
// so the front desk sees who's actually around instead of every far-future
// booking padding the list.
const ALL_WINDOW_BEFORE = 120; // 2h before now
const ALL_WINDOW_AFTER = 180; // 3h after now
export function nearNow(a: Appt): boolean {
  if (a.status !== "Booked") return true;
  return a.startMin >= NOW_MINUTES - ALL_WINDOW_BEFORE && a.startMin <= NOW_MINUTES + ALL_WINDOW_AFTER;
}

export function groupQueue(appts: Appt[]): Record<QueueGroup, Appt[]> {
  const out: Record<QueueGroup, Appt[]> = { all: [], "needs-action": [], upcoming: [], "in-clinic": [] };
  appts.forEach((a) => {
    const g = groupFor(a);
    if (g) { out[g].push(a); if (nearNow(a)) out.all.push(a); }
  });
  (Object.keys(out) as QueueGroup[]).forEach((g) => { out[g] = sortGroup(out[g], g); });
  return out;
}

// --- header Stat Strip: counts derived from the exact same groupQueue()
// buckets the Front Desk Queue itself renders, so the strip's numbers and
// the Queue's own tab counts can never drift apart ---
export type StatKey = "appointments" | "in-clinic" | "awaiting-checkin" | "unpaid";

export type ReceptionStats = {
  appointments: number;
  inClinic: number;
  awaitingCheckIn: number;
  unpaidCount: number;
  unpaidAmount: number;
};

function parseLira(text: string): number {
  const digits = text.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatLira(amount: number): string {
  return `₺${amount.toLocaleString("en-US")}`;
}

export function computeReceptionStats(appts: Appt[]): ReceptionStats {
  const grouped = groupQueue(appts);
  const unpaid = grouped.all.filter((a) => !paymentOk(a));
  return {
    appointments: grouped.all.length,
    inClinic: grouped["in-clinic"].length,
    awaitingCheckIn: grouped["needs-action"].length,
    unpaidCount: unpaid.length,
    unpaidAmount: unpaid.reduce((sum, a) => sum + parseLira(a.balance), 0),
  };
}

// Which Queue tab a Stat Strip click focuses, plus whether it also narrows
// that tab to unpaid rows only — Unpaid has no QueueGroup of its own, so it
// reuses "all" plus this one extra filter dimension rather than inventing a
// parallel filtering UI.
export function statTarget(key: StatKey): { tab: QueueGroup; unpaidOnly: boolean } {
  switch (key) {
    case "appointments": return { tab: "all", unpaidOnly: false };
    case "in-clinic": return { tab: "in-clinic", unpaidOnly: false };
    case "awaiting-checkin": return { tab: "needs-action", unpaidOnly: false };
    case "unpaid": return { tab: "all", unpaidOnly: true };
  }
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

export { NOW_MINUTES };
