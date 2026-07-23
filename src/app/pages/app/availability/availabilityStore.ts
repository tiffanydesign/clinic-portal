// A tiny external store (subscribe/getSnapshot, driven through React's
// useSyncExternalStore) holding the single source of truth for the
// Availability request/approval workflow. Both the staff-facing My
// Availability editor and the Admin Approval queue read/act on this same
// state, so approving a request in Admin (after switching the demo role)
// is immediately reflected back on the staff page — mirroring this
// prototype's existing "DEMO ROLE" switcher mechanic.

import { useSyncExternalStore } from "react";
import {
  DAYS, WeekSchedule, BookedAppt, BlockedTime,
  buildDefaultSchedule, checkLeaveConflicts, LeaveItem, LeaveDuration, LeaveReason,
  PendingRequest, Decision, fmtSlots, minToLabel,
} from "./availabilityData";

export type { BlockedTime } from "./availabilityData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dayOfWeekForDate(dateStr: string): string {
  const [d, mon, y] = dateStr.split(" ");
  const idx = MONTHS.indexOf(mon);
  return DAYS[new Date(parseInt(y, 10), idx, parseInt(d, 10)).getDay()];
}

export const ADMIN_NAME = "Ayşe Hançer";

// A read-only trail of Weekly Hours changes that have already taken effect
// (no approval workflow — see directSaveSchedule). Admin sees these as
// system notifications only, never as something to approve.
export type ScheduleChangeLogItem = { id: string; summary: string; at: string };

type State = {
  savedSchedule: WeekSchedule;
  savedTimezone: string;
  scheduleChangeLog: ScheduleChangeLogItem[];
  leaves: LeaveItem[];
  decisions: Decision[];
  blockedTime: BlockedTime[];
};

function initialState(): State {
  const savedSchedule = buildDefaultSchedule("9:00am", "5:00pm");
  return {
    savedSchedule,
    savedTimezone: "Europe/Istanbul",
    scheduleChangeLog: [
      { id: "SCL-1", summary: "Wednesday: Unavailable", at: "2h ago" },
    ],
    // Only ONE Leave request may be Pending at a time (see hasPendingRequest /
    // submitLeave below), so the demo seed keeps exactly one — the rest are
    // already-decided history for the Request modal's "Recent decisions" list.
    leaves: [
      // An already-approved full day inside the demo week, so the My Schedule
      // availability layer shows a real leave block (Thu 2 Jul 2026).
      { id: "LV-0", dateFrom: "2 Jul 2026", dateTo: "2 Jul 2026", duration: "Full Day", reason: "Conference / Training", status: "Approved", conflicts: [], submittedAt: "1w ago" },
      { id: "LV-1", dateFrom: "22 Jul 2026", dateTo: "24 Jul 2026", duration: "Full Day", reason: "Annual Leave", status: "Rejected", conflicts: [], submittedAt: "1d ago", rejectionReason: "Clinic is short-staffed that week" },
      { id: "LV-2", dateFrom: "2 Aug 2026", dateTo: "2 Aug 2026", duration: "Full Day", reason: "Sick Leave", status: "Pending", conflicts: [], submittedAt: "5h ago" },
      { id: "LV-3", dateFrom: "10 Aug 2026", dateTo: "12 Aug 2026", duration: "Full Day", reason: "Conference / Training", status: "Approved", conflicts: [], submittedAt: "3d ago" },
    ],
    // Read-only Blocked Time inside the demo week (Wed 1 Jul + Fri 3 Jul 2026).
    // BT-2 sits in Dr. Reis's real 14:00–15:00 gap today (between the video
    // consultations ending at 14:00 and her 15:00 in-person appointment) —
    // must never coincide with an actual booked appointment/video slot from
    // dashboardData.ts's APPTS for EMP-003, or "My Availability" would show
    // her simultaneously blocked and in a live session.
    blockedTime: [
      { id: "BT-1", date: "1 Jul 2026", startMin: 15 * 60, durationMin: 60, reason: "Team meeting" },
      { id: "BT-2", date: "3 Jul 2026", startMin: 14 * 60, durationMin: 60, reason: "Admin & report notes" },
    ],
    decisions: [
      { id: "DEC-1", kind: "Leave", summary: "10 Aug–12 Aug 2026: Full Day – Conference / Training", result: "Approved", by: ADMIN_NAME, at: "2d ago" },
      { id: "DEC-2", kind: "Leave", summary: "22 Jul–24 Jul 2026: Full Day – Annual Leave", result: "Rejected", by: ADMIN_NAME, at: "20h ago", rejectionReason: "Clinic is short-staffed that week" },
      { id: "DEC-3", kind: "Leave", summary: "5 Jun: Full Day — Personal", result: "Approved", by: ADMIN_NAME, at: "1 Jun" },
      { id: "DEC-4", kind: "Leave", summary: "5 Jul: Full Day – Personal", result: "Rejected", by: ADMIN_NAME, at: "2 Jul", rejectionReason: "Insufficient staffing that week" },
    ],
  };
}

let state: State = initialState();
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  emit();
}

let counter = 100;
const nextId = (prefix: string) => `${prefix}-${counter++}`;

// --- schedule change ---
// Weekly Hours changes never require Admin approval, regardless of
// direction or conflicts — the editor UI forces every conflicting booking
// to be individually resolved (Reschedule/Cancel) before Save is callable
// at all (see AvailabilityEditorPage's ConflictModal flow). Once resolved,
// this applies immediately and just leaves a read-only trail for Admin.
function directSaveSchedule(schedule: WeekSchedule, timezone: string) {
  const summary = summarizeSchedule(state.savedSchedule, schedule, state.savedTimezone, timezone);
  set((s) => ({
    savedSchedule: schedule,
    savedTimezone: timezone,
    scheduleChangeLog: summary === "No changes" ? s.scheduleChangeLog : [{ id: nextId("SCL"), summary, at: "Just now" }, ...s.scheduleChangeLog],
  }));
}

export function summarizeSchedule(saved: WeekSchedule, draft: WeekSchedule, savedTz: string, tz: string): string {
  const parts: string[] = [];
  DAYS.forEach((day) => {
    const a = saved[day]; const b = draft[day];
    const same = a.active === b.active && JSON.stringify(a.slots) === JSON.stringify(b.slots);
    if (!same) parts.push(b.active ? `${day}: ${fmtSlots(b.slots)}` : `${day}: Unavailable`);
  });
  if (tz !== savedTz) parts.push(`Timezone: ${tz}`);
  return parts.length ? parts.join(" · ") : "No changes";
}

// --- blocked time (one-off carve-out) ---
// Like Weekly Hours, Blocked Time applies instantly and never needs Admin
// approval — the editor forces any conflicting booking to be resolved
// (ConflictModal) before calling addBlockedTime, so it is safe to apply
// directly. It leaves a read-only trail Admin sees as a system notification,
// and (per SchedulePage) hard-blocks new bookings over the window.
function addBlockedTime(date: string, startMin: number, durationMin: number, reason: string) {
  const summary = `Blocked ${date}, ${minToLabel(startMin)}–${minToLabel(startMin + durationMin)} — ${reason}`;
  set((s) => ({
    blockedTime: [...s.blockedTime, { id: nextId("BT"), date, startMin, durationMin, reason }],
    scheduleChangeLog: [{ id: nextId("SCL"), summary, at: "Just now" }, ...s.scheduleChangeLog],
  }));
}

// Removing a block only frees time (expands availability) — never conflicts.
function removeBlockedTime(id: string) {
  set((s) => ({ blockedTime: s.blockedTime.filter((b) => b.id !== id) }));
}

// --- leave ---
// Only one Leave request may be Pending at a time — submitting a new one
// while a decision is outstanding must Withdraw or wait first. Checked
// independently of, and before, the date-overlap check below.
function hasPendingRequest(): boolean {
  return state.leaves.some((l) => l.status === "Pending");
}

// Pure pre-check so the page can decide whether to show the (non-blocking)
// conflict-awareness modal before actually committing the request.
function hasLeaveOverlap(dateFrom: string, dateTo: string): boolean {
  return state.leaves.some((l) => l.status !== "Rejected" && l.dateFrom === dateFrom && l.dateTo === dateTo);
}

function submitLeave(dateFrom: string, dateTo: string, duration: LeaveDuration, reason: LeaveReason, reasonOther?: string): { ok: true; conflicts: BookedAppt[] } | { ok: false; error: string } {
  if (hasPendingRequest()) return { ok: false, error: "You already have a request pending approval. Withdraw it or wait for a decision before submitting a new one." };
  if (hasLeaveOverlap(dateFrom, dateTo)) return { ok: false, error: "You already have a leave request for this date." };

  const conflicts = checkLeaveConflicts(dateFrom, dateTo, duration);
  set((s) => ({
    leaves: [...s.leaves, { id: nextId("LV"), dateFrom, dateTo, duration, reason, reasonOther, status: "Pending", conflicts, submittedAt: "Just now" }],
  }));
  return { ok: true, conflicts };
}

function withdrawLeave(id: string) {
  set((s) => ({ leaves: s.leaves.filter((l) => l.id !== id) }));
}

function decideLeave(id: string, result: "Approved" | "Rejected", rejectionReason?: string) {
  const item = state.leaves.find((l) => l.id === id);
  if (!item) return;
  const summary = `${item.dateFrom === item.dateTo ? item.dateFrom : `${item.dateFrom}–${item.dateTo}`}: ${item.duration} – ${item.reason}`;
  set((s) => ({
    leaves: s.leaves.map((l) => (l.id === id ? { ...l, status: result, rejectionReason } : l)),
    decisions: [{ id: nextId("DEC"), kind: "Leave", summary, result, by: ADMIN_NAME, at: "Just now", rejectionReason }, ...s.decisions],
  }));
}

// resolve/unresolve an individual conflicting booking on a pending Leave
// request (Admin-side "Reschedule"/"Cancel" shortcut in Approval Center).
// Weekly Hours and Blocked Time conflicts are resolved locally in the
// editor's ConflictModal before they ever reach the store — see
// directSaveSchedule / addBlockedTime.
function resolveConflict(id: string, bookingIndex: number) {
  set((s) => ({
    leaves: s.leaves.map((l) => (l.id === id ? { ...l, conflicts: l.conflicts.map((c, i) => (i === bookingIndex ? { ...c, resolved: true } : c)) } : l)),
  }));
}

// --- derived: aggregated pending list for the staff-facing section ---
// Leave is the only kind that can ever be Pending here — Weekly Hours and
// Blocked Time both apply instantly (see directSaveSchedule / addBlockedTime).
export function getPendingRequests(s: State): PendingRequest[] {
  const out: PendingRequest[] = [];
  s.leaves.filter((l) => l.status === "Pending").forEach((l) => {
    out.push({
      id: `pending-${l.id}`,
      kind: "Leave",
      summary: `${l.dateFrom === l.dateTo ? l.dateFrom : `${l.dateFrom}–${l.dateTo}`}: ${l.duration} – ${l.reason}`,
      submittedAt: l.submittedAt,
      conflicts: l.conflicts,
      relatedId: l.id,
    });
  });
  return out;
}

export const availabilityActions = {
  directSaveSchedule,
  addBlockedTime, removeBlockedTime,
  hasPendingRequest, hasLeaveOverlap, submitLeave, withdrawLeave, decideLeave,
  resolveConflict,
};

export function useAvailabilityStore(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}
