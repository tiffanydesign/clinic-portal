// Shared types, mock data, and conflict-detection helpers for the My
// Availability request/approval workflow. Weekly schedule changes, date
// overrides, and leave requests all funnel through a single pending-request
// slot: only one request may be Pending at a time, and the current effective
// schedule never changes until that request is approved (out of scope here —
// this prototype models the staff-facing submit/withdraw side only).

export type RequestStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Withdrawn";
export type RequestType = "Availability Change" | "Override" | "Leave";

export type Slot = { start: string; end: string };
export type DayConfig = { active: boolean; slots: Slot[] };
export type WeekSchedule = Record<string, DayConfig>;

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type OverrideItem = {
  id: string;
  date: string; // "15 Jul 2026"
  slots: Slot[];
  reason?: string;
  status: RequestStatus;
  hasConflict?: boolean;
};

export type LeaveItem = {
  id: string;
  date: string;
  fullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: RequestStatus;
  hasConflict?: boolean;
};

export type PendingRequest = {
  id: string;
  type: RequestType;
  submittedAt: string;
  summary: string;
  hasConflict: boolean;
  relatedId?: string; // links back to the OverrideItem/LeaveItem this request represents
};

export function buildDefaultSchedule(start: string, end: string): WeekSchedule {
  const init: WeekSchedule = {};
  DAYS.forEach((day) => {
    const isWeekend = day === "Sunday" || day === "Saturday";
    init[day] = { active: !isWeekend, slots: [{ start, end }] };
  });
  return init;
}

export function cloneSchedule(schedule: WeekSchedule): WeekSchedule {
  const out: WeekSchedule = {};
  DAYS.forEach((day) => { out[day] = { active: schedule[day].active, slots: schedule[day].slots.map((s) => ({ ...s })) }; });
  return out;
}

// --- mock existing confirmed bookings, used purely for conflict detection ---
export type BookedAppt = { date: string; dayOfWeek: string; time: string; patient: string };

export const BOOKED_APPOINTMENTS: BookedAppt[] = [
  { date: "3 Jul 2026", dayOfWeek: "Friday", time: "10:00am", patient: "Mackenzie Messineo" },
  { date: "6 Jul 2026", dayOfWeek: "Monday", time: "10:00am", patient: "Riley Guarana" },
  { date: "8 Jul 2026", dayOfWeek: "Wednesday", time: "2:00pm", patient: "Gustavo Propolis" },
  { date: "15 Jul 2026", dayOfWeek: "Wednesday", time: "11:00am", patient: "Cynthia Riboflavin" },
];

// --- time helpers ---
export function timeToMinutes(t: string): number {
  const m = t.match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toLowerCase();
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

function isCoveredByDay(config: DayConfig, time: string): boolean {
  if (!config.active) return false;
  const t = timeToMinutes(time);
  return config.slots.some((s) => t >= timeToMinutes(s.start) && t < timeToMinutes(s.end));
}

// --- conflict detection ---
export function checkWeeklyConflicts(schedule: WeekSchedule): BookedAppt[] {
  return BOOKED_APPOINTMENTS.filter((b) => {
    const config = schedule[b.dayOfWeek];
    return !config || !isCoveredByDay(config, b.time);
  });
}

export function checkOverrideConflicts(date: string, slots: Slot[], unavailable: boolean): BookedAppt[] {
  return BOOKED_APPOINTMENTS.filter((b) => {
    if (b.date !== date) return false;
    if (unavailable) return true;
    const t = timeToMinutes(b.time);
    return !slots.some((s) => t >= timeToMinutes(s.start) && t < timeToMinutes(s.end));
  });
}

export function checkLeaveConflicts(date: string, fullDay: boolean, start?: string, end?: string): BookedAppt[] {
  return BOOKED_APPOINTMENTS.filter((b) => {
    if (b.date !== date) return false;
    if (fullDay) return true;
    if (!start || !end) return false;
    const t = timeToMinutes(b.time);
    return t >= timeToMinutes(start) && t < timeToMinutes(end);
  });
}

// --- overlap / duplicate validation (edge cases: duplicate override, leave/override overlap) ---
const isActive = (status: RequestStatus) => status !== "Withdrawn" && status !== "Rejected";

export function isDuplicateOverrideDate(overrides: OverrideItem[], date: string): boolean {
  return overrides.some((o) => o.date === date && isActive(o.status));
}

export function isDateBlockedForLeave(overrides: OverrideItem[], leaves: LeaveItem[], date: string): boolean {
  return overrides.some((o) => o.date === date && isActive(o.status)) || leaves.some((l) => l.date === date && isActive(l.status));
}

// --- change summary for the Pending Request card ---
export function summarizeScheduleChange(saved: WeekSchedule, draft: WeekSchedule, savedTz: string, tz: string): string {
  const parts: string[] = [];
  DAYS.forEach((day) => {
    const a = saved[day];
    const b = draft[day];
    const same = a.active === b.active && JSON.stringify(a.slots) === JSON.stringify(b.slots);
    if (!same) {
      parts.push(b.active ? `${day}: ${b.slots.map((s) => `${s.start}–${s.end}`).join(", ")}` : `${day}: Unavailable`);
    }
  });
  if (tz !== savedTz) parts.push(`Timezone: ${tz}`);
  return parts.length ? parts.join(" · ") : "No changes";
}

export function statusPillClass(status: RequestStatus): string {
  switch (status) {
    case "Pending": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected": return "bg-red-50 text-red-700 border-red-200";
    case "Withdrawn": return "bg-gray-100 text-gray-500 border-gray-200";
    default: return "bg-gray-50 text-gray-500 border-gray-200";
  }
}
