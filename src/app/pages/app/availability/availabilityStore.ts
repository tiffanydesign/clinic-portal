// A tiny external store (subscribe/getSnapshot, driven through React's
// useSyncExternalStore) holding the single source of truth for the
// Availability request/approval workflow. Both the staff-facing My
// Availability editor and the Admin Approval queue read/act on this same
// state, so approving a request in Admin (after switching the demo role)
// is immediately reflected back on the staff page — mirroring this
// prototype's existing "DEMO ROLE" switcher mechanic.

import { useSyncExternalStore } from "react";
import {
  DAYS, WeekSchedule, Slot, BookedAppt, BOOKED_APPOINTMENTS,
  buildDefaultSchedule, cloneSchedule, classifyWeekChange, classifyDateChange,
  checkLeaveConflicts, OverrideItem, LeaveItem, LeaveDuration, LeaveReason,
  PendingRequest, Decision, fmtSlots,
} from "./availabilityData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dayOfWeekForDate(dateStr: string): string {
  const [d, mon, y] = dateStr.split(" ");
  const idx = MONTHS.indexOf(mon);
  return DAYS[new Date(parseInt(y, 10), idx, parseInt(d, 10)).getDay()];
}

export const ADMIN_NAME = "Ayşe Hançer";

type ScheduleRequest = {
  id: string;
  draftSchedule: WeekSchedule;
  draftTimezone: string;
  submittedAt: string;
  conflicts: BookedAppt[];
};

type State = {
  savedSchedule: WeekSchedule;
  savedTimezone: string;
  scheduleRequest: ScheduleRequest | null;
  overrides: OverrideItem[];
  leaves: LeaveItem[];
  decisions: Decision[];
};

function initialState(): State {
  const savedSchedule = buildDefaultSchedule("9:00am", "5:00pm");
  return {
    savedSchedule,
    savedTimezone: "Europe/Istanbul",
    scheduleRequest: {
      id: "REQ-SCH-1",
      draftSchedule: (() => {
        const d = cloneSchedule(savedSchedule);
        d.Wednesday = { active: false, slots: [{ start: "9:00am", end: "5:00pm" }] };
        return d;
      })(),
      draftTimezone: "Europe/Istanbul",
      submittedAt: "2h ago",
      conflicts: BOOKED_APPOINTMENTS.filter((b) => b.dayOfWeek === "Wednesday"),
    },
    overrides: [
      { id: "OV-1", date: "15 Jul 2026", dayOfWeek: "Wednesday", slots: [{ start: "10:00am", end: "2:00pm" }], status: "Approved" },
    ],
    leaves: [
      { id: "LV-1", dateFrom: "22 Jul 2026", dateTo: "24 Jul 2026", duration: "Full Day", reason: "Annual Leave", status: "Pending", conflicts: [], submittedAt: "1d ago" },
    ],
    decisions: [
      { id: "DEC-1", kind: "Date Override", summary: "8 Jul: 9:00am–1:00pm", result: "Approved", by: ADMIN_NAME, at: "3 Jul" },
      { id: "DEC-2", kind: "Leave", summary: "5 Jul: Full Day – Personal", result: "Rejected", by: ADMIN_NAME, at: "2 Jul", rejectionReason: "Insufficient staffing that week" },
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
// Expanding changes (and Reducing changes with zero conflicts) apply
// immediately, no approval workflow involved.
function directSaveSchedule(schedule: WeekSchedule, timezone: string) {
  set({ savedSchedule: schedule, savedTimezone: timezone });
}
function submitScheduleChange(draftSchedule: WeekSchedule, draftTimezone: string, conflicts: BookedAppt[]) {
  set({ scheduleRequest: { id: nextId("REQ-SCH"), draftSchedule, draftTimezone, submittedAt: "Just now", conflicts } });
}
function withdrawScheduleChange() {
  set({ scheduleRequest: null });
}
function decideScheduleChange(result: "Approved" | "Rejected", rejectionReason?: string) {
  const req = state.scheduleRequest;
  if (!req) return;
  const summary = summarizeSchedule(state.savedSchedule, req.draftSchedule, state.savedTimezone, req.draftTimezone);
  set((s) => ({
    scheduleRequest: null,
    savedSchedule: result === "Approved" ? req.draftSchedule : s.savedSchedule,
    savedTimezone: result === "Approved" ? req.draftTimezone : s.savedTimezone,
    decisions: [{ id: nextId("DEC"), kind: "Schedule Change", summary, result, by: ADMIN_NAME, at: "Just now", rejectionReason }, ...s.decisions],
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

// --- overrides ---
function templateDayFor(date: string): { active: boolean; slots: Slot[] } {
  const day = dayOfWeekForDate(date);
  return state.savedSchedule[day];
}

function submitOverride(date: string, slots: Slot[]): { ok: true } | { ok: false; error: string } {
  const existing = state.overrides.find((o) => o.date === date && o.status !== "Rejected");
  if (existing) return { ok: false, error: "This date already has an override." };

  const template = templateDayFor(date);
  const { direction, conflicts } = classifyDateChange(template.slots, template.active, slots, true, date);
  const dayOfWeek = dayOfWeekForDate(date);

  if (direction !== "Reducing" || conflicts.length === 0) {
    set((s) => ({ overrides: [...s.overrides, { id: nextId("OV"), date, dayOfWeek, slots, status: "Approved" }] }));
  } else {
    set((s) => ({
      overrides: [...s.overrides, { id: nextId("OV"), date, dayOfWeek, slots, status: "Pending", pendingAction: "create", conflicts, submittedAt: "Just now" }],
    }));
  }
  return { ok: true };
}

function submitOverrideEdit(id: string, slots: Slot[]): { ok: true } | { ok: false; error: string } {
  const existing = state.overrides.find((o) => o.id === id);
  if (!existing) return { ok: false, error: "Override not found." };
  const { direction, conflicts } = classifyDateChange(existing.slots, true, slots, true, existing.date);

  if (direction !== "Reducing" || conflicts.length === 0) {
    set((s) => ({ overrides: s.overrides.map((o) => (o.id === id ? { ...o, slots, status: "Approved", pendingAction: undefined, conflicts: undefined } : o)) }));
  } else {
    set((s) => ({ overrides: s.overrides.map((o) => (o.id === id ? { ...o, slots, status: "Pending", pendingAction: "edit", conflicts, submittedAt: "Just now" } : o)) }));
  }
  return { ok: true };
}

function deleteOverride(id: string) {
  const existing = state.overrides.find((o) => o.id === id);
  if (!existing) return;
  const template = templateDayFor(existing.date);
  const { direction, conflicts } = classifyDateChange(existing.slots, true, template.slots, template.active, existing.date);

  if (direction !== "Reducing" || conflicts.length === 0) {
    set((s) => ({ overrides: s.overrides.filter((o) => o.id !== id) }));
  } else {
    set((s) => ({ overrides: s.overrides.map((o) => (o.id === id ? { ...o, status: "Pending", pendingAction: "delete", conflicts, submittedAt: "Just now" } : o)) }));
  }
}

function withdrawOverride(id: string) {
  set((s) => ({
    overrides: s.overrides
      .map((o) => {
        if (o.id !== id) return o;
        if (o.pendingAction === "create") return null; // never existed before
        if (o.pendingAction === "delete") return { ...o, status: "Approved" as const, pendingAction: undefined, conflicts: undefined };
        return { ...o, status: "Approved" as const, pendingAction: undefined, conflicts: undefined }; // edit: revert status flag (slots already show the attempted edit in this simplified demo)
      })
      .filter((o): o is OverrideItem => o !== null),
  }));
}

function decideOverride(id: string, result: "Approved" | "Rejected", rejectionReason?: string) {
  const item = state.overrides.find((o) => o.id === id);
  if (!item) return;
  const summary = `${item.date}: ${item.pendingAction === "delete" ? "Remove override" : fmtSlots(item.slots)}`;
  set((s) => ({
    overrides: result === "Approved"
      ? (item.pendingAction === "delete" ? s.overrides.filter((o) => o.id !== id) : s.overrides.map((o) => (o.id === id ? { ...o, status: "Approved", pendingAction: undefined, conflicts: undefined } : o)))
      : s.overrides.map((o) => (o.id === id ? { ...o, status: "Rejected", pendingAction: undefined, rejectionReason } : o)),
    decisions: [{ id: nextId("DEC"), kind: "Date Override", summary, result, by: ADMIN_NAME, at: "Just now", rejectionReason }, ...s.decisions],
  }));
}

// --- leave ---
// Pure pre-check so the page can decide whether to show the (non-blocking)
// conflict-awareness modal before actually committing the request.
function hasLeaveOverlap(dateFrom: string, dateTo: string): boolean {
  return state.leaves.some((l) => l.status !== "Rejected" && l.dateFrom === dateFrom && l.dateTo === dateTo);
}

function submitLeave(dateFrom: string, dateTo: string, duration: LeaveDuration, reason: LeaveReason, reasonOther?: string): { ok: true; conflicts: BookedAppt[] } | { ok: false; error: string } {
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

// resolve/unresolve an individual conflicting booking on a pending request (Admin-side "Reschedule"/"Cancel" shortcut)
function resolveConflict(kind: "schedule" | "override" | "leave", id: string, bookingIndex: number) {
  set((s) => {
    if (kind === "schedule" && s.scheduleRequest) {
      const conflicts = s.scheduleRequest.conflicts.map((c, i) => (i === bookingIndex ? { ...c, resolved: true } : c));
      return { scheduleRequest: { ...s.scheduleRequest, conflicts } };
    }
    if (kind === "override") {
      return { overrides: s.overrides.map((o) => (o.id === id && o.conflicts ? { ...o, conflicts: o.conflicts.map((c, i) => (i === bookingIndex ? { ...c, resolved: true } : c)) } : o)) };
    }
    return { leaves: s.leaves.map((l) => (l.id === id ? { ...l, conflicts: l.conflicts.map((c, i) => (i === bookingIndex ? { ...c, resolved: true } : c)) } : l)) };
  });
}

// --- derived: aggregated pending list for the staff-facing section ---
export function getPendingRequests(s: State): PendingRequest[] {
  const out: PendingRequest[] = [];
  if (s.scheduleRequest) {
    out.push({
      id: s.scheduleRequest.id,
      kind: "Schedule Change",
      summary: summarizeSchedule(s.savedSchedule, s.scheduleRequest.draftSchedule, s.savedTimezone, s.scheduleRequest.draftTimezone),
      submittedAt: s.scheduleRequest.submittedAt,
      conflicts: s.scheduleRequest.conflicts,
    });
  }
  s.overrides.filter((o) => o.status === "Pending").forEach((o) => {
    out.push({
      id: `pending-${o.id}`,
      kind: "Date Override",
      summary: `${o.date}: ${o.pendingAction === "delete" ? "Remove override" : fmtSlots(o.slots)}`,
      submittedAt: o.submittedAt ?? "Just now",
      conflicts: o.conflicts ?? [],
      relatedId: o.id,
    });
  });
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
  directSaveSchedule, submitScheduleChange, withdrawScheduleChange, decideScheduleChange,
  submitOverride, submitOverrideEdit, deleteOverride, withdrawOverride, decideOverride,
  hasLeaveOverlap, submitLeave, withdrawLeave, decideLeave,
  resolveConflict,
};

export function useAvailabilityStore(): State {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}
