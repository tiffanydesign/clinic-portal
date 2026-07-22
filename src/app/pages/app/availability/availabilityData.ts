// Pure types, mock reference data, and time/interval math for the
// Availability request/approval workflow. Stateful orchestration (the
// pending slots, decisions, actions) lives in availabilityStore.ts, which is
// built on top of these helpers.

export type Slot = { start: string; end: string };
export type DayConfig = { active: boolean; slots: Slot[] };
export type WeekSchedule = Record<string, DayConfig>;

// A one-off "Blocked Time" the signed-in staff member holds against a specific
// date (admin, paperwork, a meeting) — read-only in the My Schedule
// availability layer. Minute offsets from midnight so the calendar can place it
// directly.
export type BlockedTime = { id: string; date: string; startMin: number; durationMin: number; reason: string };

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export function scheduleEquals(a: WeekSchedule, b: WeekSchedule): boolean {
  return DAYS.every((day) => a[day].active === b[day].active && JSON.stringify(a[day].slots) === JSON.stringify(b[day].slots));
}

// --- mock existing confirmed bookings, used purely for conflict detection ---
export type BookedAppt = { date: string; dayOfWeek: string; time: string; patient: string; type: string; resolved?: boolean };

// Note: 8 Jul and 15 Jul 2026 both fall on a Wednesday (verified against real
// calendar math, matching the July date picker grid used in OverrideModal).
export const BOOKED_APPOINTMENTS: BookedAppt[] = [
  { date: "8 Jul 2026", dayOfWeek: "Wednesday", time: "10:00am", patient: "Ece Yıldırım", type: "Body Scan" },
  { date: "15 Jul 2026", dayOfWeek: "Wednesday", time: "11:00am", patient: "Tarkan Solmaz", type: "Consultation" },
];

export function bookingLabel(b: BookedAppt): string {
  const short = b.date.replace(/^(\d+) (\w+) (\d+)$/, (_m, d, mo) => `${dayAbbrev(b.dayOfWeek)} ${d} ${mo}`);
  return `${short}, ${b.time} – ${b.patient} (${b.type})`;
}
function dayAbbrev(day: string): string {
  return day.slice(0, 3);
}

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

export function fmtSlots(slots: Slot[]): string {
  return slots.map((s) => `${s.start}–${s.end}`).join(", ");
}

// Full day-by-day description (not a diff) — used for the Admin approval
// card's before/after comparison.
export function describeScheduleLines(schedule: WeekSchedule): { day: string; text: string }[] {
  return DAYS.map((day) => ({ day: day.slice(0, 3), text: schedule[day].active ? fmtSlots(schedule[day].slots) : "Unavailable" }));
}

// --- interval math (minute ranges) ---
type Range = [number, number];

function dayRanges(day: DayConfig): Range[] {
  if (!day.active) return [];
  return day.slots
    .map((s) => [timeToMinutes(s.start), timeToMinutes(s.end)] as Range)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
}

function mergeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r] as Range);
  }
  return out;
}

// subtract b-ranges from a-ranges, returning what's left of `a`
function subtractRanges(a: Range[], b: Range[]): Range[] {
  let remaining = mergeRanges(a);
  for (const [bs, be] of mergeRanges(b)) {
    const next: Range[] = [];
    for (const [as, ae] of remaining) {
      if (be <= as || bs >= ae) { next.push([as, ae]); continue; }
      if (bs > as) next.push([as, Math.min(bs, ae)]);
      if (be < ae) next.push([Math.max(be, as), ae]);
    }
    remaining = next.filter(([s, e]) => e > s);
  }
  return remaining;
}

function isPointCovered(ranges: Range[], point: number): boolean {
  return ranges.some(([s, e]) => point >= s && point < e);
}

export type ChangeDirection = "Expanding" | "Reducing" | "Same";

// Compares old -> new minute-ranges and classifies the change. Mixed
// (something removed AND something added) is treated as Reducing, per spec.
function classifyRanges(oldRanges: Range[], newRanges: Range[]): ChangeDirection {
  const removed = subtractRanges(oldRanges, newRanges);
  const added = subtractRanges(newRanges, oldRanges);
  if (removed.length === 0 && added.length === 0) return "Same";
  if (removed.length === 0) return "Expanding";
  return "Reducing";
}

export function classifyDayChange(oldDay: DayConfig, newDay: DayConfig): ChangeDirection {
  return classifyRanges(dayRanges(oldDay), dayRanges(newDay));
}

// --- weekly template change classification + conflicts (checked across all matching weekdays) ---
export function classifyWeekChange(oldSchedule: WeekSchedule, newSchedule: WeekSchedule): { direction: ChangeDirection; conflicts: BookedAppt[] } {
  let anyReduction = false;
  let anyChange = false;
  const conflicts: BookedAppt[] = [];

  DAYS.forEach((day) => {
    const oldRanges = dayRanges(oldSchedule[day]);
    const newRanges = dayRanges(newSchedule[day]);
    const dir = classifyRanges(oldRanges, newRanges);
    if (dir !== "Same") anyChange = true;
    if (dir === "Reducing") anyReduction = true;

    const removed = subtractRanges(oldRanges, newRanges);
    if (removed.length > 0) {
      BOOKED_APPOINTMENTS.filter((b) => b.dayOfWeek === day).forEach((b) => {
        if (isPointCovered(removed, timeToMinutes(b.time))) conflicts.push(b);
      });
    }
  });

  const direction: ChangeDirection = !anyChange ? "Same" : anyReduction ? "Reducing" : "Expanding";
  return { direction, conflicts };
}

// --- single-date change classification + conflicts (overrides) ---
export function classifyDateChange(oldSlots: Slot[], oldActive: boolean, newSlots: Slot[], newActive: boolean, date: string): { direction: ChangeDirection; conflicts: BookedAppt[] } {
  const oldRanges = oldActive ? mergeRanges(oldSlots.map((s) => [timeToMinutes(s.start), timeToMinutes(s.end)] as Range)) : [];
  const newRanges = newActive ? mergeRanges(newSlots.map((s) => [timeToMinutes(s.start), timeToMinutes(s.end)] as Range)) : [];
  const direction = classifyRanges(oldRanges, newRanges);
  const removed = subtractRanges(oldRanges, newRanges);
  const conflicts = removed.length === 0 ? [] : BOOKED_APPOINTMENTS.filter((b) => b.date === date && isPointCovered(removed, timeToMinutes(b.time)));
  return { direction, conflicts };
}

// leave always requires approval; conflicts are informational only
export function checkLeaveConflicts(dateFrom: string, dateTo: string, duration: LeaveDuration): BookedAppt[] {
  const dates = new Set([dateFrom, dateTo]); // demo scope: only the two mock dates ever appear in BOOKED_APPOINTMENTS
  return BOOKED_APPOINTMENTS.filter((b) => {
    if (!dates.has(b.date)) return false;
    if (duration === "Full Day") return true;
    const t = timeToMinutes(b.time);
    if (duration === "Morning") return t < timeToMinutes("1:00pm");
    return t >= timeToMinutes("1:00pm");
  });
}

// --- domain types for overrides / leave / pending / decisions ---
export type OverrideStatus = "Approved" | "Pending" | "Rejected";
export type OverridePendingAction = "create" | "edit" | "delete";
export type OverrideItem = {
  id: string;
  date: string;
  dayOfWeek: string;
  slots: Slot[];
  status: OverrideStatus;
  pendingAction?: OverridePendingAction;
  conflicts?: BookedAppt[];
  submittedAt?: string;
  rejectionReason?: string;
};

export type LeaveDuration = "Full Day" | "Morning" | "Afternoon";
export type LeaveReason = "Annual Leave" | "Sick Leave" | "Conference / Training" | "Personal" | "Other";
export const LEAVE_REASONS: LeaveReason[] = ["Annual Leave", "Sick Leave", "Conference / Training", "Personal", "Other"];
export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type LeaveItem = {
  id: string;
  dateFrom: string;
  dateTo: string;
  duration: LeaveDuration;
  reason: LeaveReason;
  reasonOther?: string;
  status: LeaveStatus;
  conflicts: BookedAppt[];
  submittedAt: string;
  rejectionReason?: string;
};

export type PendingKind = "Schedule Change" | "Date Override" | "Leave";
export type PendingRequest = {
  id: string;
  kind: PendingKind;
  summary: string;
  submittedAt: string;
  conflicts: BookedAppt[];
  relatedId?: string; // OverrideItem.id or LeaveItem.id; absent for the single schedule request
};

export type DecisionResult = "Approved" | "Rejected";
export type Decision = {
  id: string;
  kind: PendingKind;
  summary: string;
  result: DecisionResult;
  by: string;
  at: string;
  rejectionReason?: string;
};

export function overrideStatusPillClass(status: OverrideStatus | LeaveStatus): string {
  switch (status) {
    case "Approved": return "bg-success/10 text-success-ink border-success/30";
    case "Pending": return "bg-warning/10 text-warning-ink border-warning/30";
    case "Rejected": return "bg-danger/10 text-danger-ink border-danger/30";
    default: return "bg-surface-page text-ink-muted border-divider";
  }
}

// One neutral style for every kind — the label text ("Leave", "Date Override",
// "Schedule Change") says what it is; per-kind colours were visual noise.
export function kindBadgeClass(_kind: PendingKind): string {
  return "bg-surface-hover text-ink-soft border-divider";
}

export function leaveDateLabel(l: Pick<LeaveItem, "dateFrom" | "dateTo">): string {
  return l.dateFrom === l.dateTo ? l.dateFrom : `${l.dateFrom.split(" ").slice(0, 2).join(" ")}–${l.dateTo}`;
}
