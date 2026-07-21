// Data layer for the Clinician/Nurse "My Schedule" view (the Lark-style
// sidebar + calendar). Pure functions: role-scoped appointment selection,
// week/day fabrication anchored on the one modelled day, the collision
// lane-packing that fixes the old text-overlap bug, the layer model, and the
// read-only availability derivation from availabilityStore. No business
// mutations — this is view math only.
import { addDays, isSameDay, startOfWeek } from "date-fns";
import {
  APPTS, Appt, ApptType, CLINICIAN_SELF_ID, NURSE_SELF_NAME, ANCHOR_DATE, fmtRange,
} from "./scheduleData";
import { DAYS, WeekSchedule, timeToMinutes } from "../availability/availabilityData";
import { BlockedTime } from "../availability/availabilityStore";
import { LeaveItem } from "../availability/availabilityData";

export type ScheduleRole = "Nurse" | "Clinician";

// Lets a caller ask for a specific staff member's schedule instead of the
// signed-in self (see Staff Management's Availability tab, which shows a
// read-only schedule for whichever staff member is being viewed). Omitting
// the target keeps the original self-only behavior used by the Calendar's
// own "My Schedule" surface.
export type ScheduleTarget = { doctorId: string } | { nurseName: string };

export const DAY_START = 7 * 60; // 07:00 top of grid
export const DAY_END = 20 * 60; // 20:00 bottom
export const SCROLL_TO = 8 * 60; // default scroll position

export const weekStartOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

// --- role-scoped "my appointments" ---
export function myAppts(role: ScheduleRole, target?: ScheduleTarget): Appt[] {
  if (role === "Clinician") {
    const doctorId = target && "doctorId" in target ? target.doctorId : CLINICIAN_SELF_ID;
    return APPTS.filter((a) => a.doctorId === doctorId);
  }
  const nurseName = target && "nurseName" in target ? target.nurseName : NURSE_SELF_NAME;
  return APPTS.filter((a) => a.nurse === nurseName);
}

// Fabricate a fuller week from the single modelled day, the same demo device
// the existing Week view uses: the anchor day carries the real set, a few
// other weekdays get shifted subsets, and Thursday is deliberately left as an
// approved-leave day (no appts). Non-anchor weeks are genuinely empty. Every
// day's list is run through deoverlapSequential() below — a patient is never
// shown overlapping another, and each occupies its own real 1-2h slot.
type ShiftPlan = { idx: number; delta?: number };
const WEEKDAY_PLANS: Record<number, ShiftPlan[]> = {
  1: [{ idx: 0, delta: 30 }, { idx: 1, delta: 45 }, { idx: 3, delta: 60 }], // Mon — spread
  2: [{ idx: 0, delta: 0 }, { idx: 2, delta: 15 }, { idx: 4, delta: 30 }], // Tue
  3: [{ idx: 1, delta: 0 }, { idx: 3, delta: 20 }, { idx: 5, delta: 40 }, { idx: 6, delta: 60 }], // Wed
  4: [], // Thu — approved leave day, intentionally empty
};

function placeAppt(a: Appt, p: ShiftPlan, suffix: string): Appt {
  const startMin = Math.max(DAY_START, Math.min(DAY_END - a.durationMin, a.startMin + (p.delta ?? 0)));
  return { ...a, id: `${a.id}${suffix}`, startMin, timeLabel: fmtRange(startMin, a.durationMin) };
}

// Guarantees a day's appointment list never overlaps: sorted by start time,
// any appointment that would start before the previous one ends is pushed
// out to start right when it does (duration untouched — every patient still
// gets their real 1-2h slot, just sequentially). Applied uniformly so no
// single hand-authored time ever needs to be re-checked by hand.
export function deoverlapSequential(appts: Appt[]): Appt[] {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  let prevEnd = -Infinity;
  return sorted.map((a) => {
    const startMin = Math.max(a.startMin, prevEnd);
    prevEnd = startMin + a.durationMin;
    if (startMin === a.startMin) return a;
    return { ...a, startMin, timeLabel: fmtRange(startMin, a.durationMin) };
  });
}

export type WeekDay = { date: Date; isToday: boolean; appts: Appt[] };

export function buildMyWeek(role: ScheduleRole, weekStart: Date, target?: ScheduleTarget): WeekDay[] {
  const base = myAppts(role, target);
  const isAnchorWeek = isSameDay(weekStart, weekStartOf(ANCHOR_DATE));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isToday = isSameDay(date, ANCHOR_DATE);
    if (!isAnchorWeek) return { date, isToday: false, appts: [] };
    if (isToday) return { date, isToday, appts: deoverlapSequential(base) };
    const plan = WEEKDAY_PLANS[date.getDay()] ?? [];
    const appts = plan
      .map((p, k) => (base[p.idx % base.length] ? placeAppt(base[p.idx % base.length], p, `-w${date.getDay()}-${k}`) : null))
      .filter((a): a is Appt => a !== null);
    return { date, isToday, appts: deoverlapSequential(appts) };
  });
}

export function apptsForDate(role: ScheduleRole, date: Date, target?: ScheduleTarget): Appt[] {
  return buildMyWeek(role, weekStartOf(date), target).find((d) => isSameDay(d.date, date))?.appts ?? [];
}

// --- day layout ---
// Every day's appts are guaranteed non-overlapping by deoverlapSequential()
// above, so each one is simply its own full-width row — no lane-packing or
// "+N more" collapsing needed.
export type LaidItem = { appt: Appt; startMin: number; durationMin: number };

export function layoutDay(appts: Appt[]): LaidItem[] {
  return [...appts]
    .sort((a, b) => a.startMin - b.startMin)
    .map((appt) => ({ appt, startMin: appt.startMin, durationMin: appt.durationMin }));
}

// --- layers ---
export type TypeBucket = "Body Scan" | "Consultation" | "Sample Collection" | "Follow-up";
export const TYPE_BUCKETS: TypeBucket[] = ["Body Scan", "Consultation", "Sample Collection", "Follow-up"];

export function typeBucket(t: ApptType): TypeBucket {
  if (t.startsWith("Consultation")) return "Consultation";
  if (t === "Body Scan") return "Body Scan";
  if (t === "Sample Collection") return "Sample Collection";
  return "Follow-up";
}

// Fixed semantic tint per type layer's checkbox swatch.
export const TYPE_LAYER_COLOR: Record<TypeBucket, string> = {
  "Body Scan": "bg-special",
  Consultation: "bg-info",
  "Sample Collection": "bg-success",
  "Follow-up": "bg-warning",
};

export type LayerState = {
  mine: boolean;
  video: boolean;
  availability: boolean;
  types: Record<TypeBucket, boolean>;
};

export function defaultLayers(): LayerState {
  return {
    mine: true,
    video: true,
    availability: true,
    types: { "Body Scan": true, Consultation: true, "Sample Collection": true, "Follow-up": true },
  };
}

// A single appointment's visibility under the current layer toggles.
export function apptVisible(a: Appt, layers: LayerState): boolean {
  if (!layers.mine) return false;
  if (!layers.types[typeBucket(a.type)]) return false;
  if (a.isVideo && !layers.video) return false;
  return true;
}

// Layer counts for the current week (sum across its days).
export function layerCounts(week: WeekDay[]) {
  const all = week.flatMap((d) => d.appts);
  const byType: Record<TypeBucket, number> = { "Body Scan": 0, Consultation: 0, "Sample Collection": 0, "Follow-up": 0 };
  all.forEach((a) => (byType[typeBucket(a.type)] += 1));
  return { mine: all.length, video: all.filter((a) => a.isVideo).length, types: byType };
}

// --- event helpers ---
export function typeShort(t: ApptType): string {
  return t.replace(" (in-person)", "").replace(" (video)", "");
}

// --- availability layer (read-only, from availabilityStore) ---
export type MinRange = [number, number];

export function workingRangesFor(date: Date, schedule: WeekSchedule): MinRange[] {
  const cfg = schedule[DAYS[date.getDay()]];
  if (!cfg || !cfg.active) return [];
  return cfg.slots.map((s) => [timeToMinutes(s.start), timeToMinutes(s.end)] as MinRange).filter(([a, b]) => b > a);
}

// The gray (non-working) bands = the grid window minus the working ranges.
export function nonWorkingBands(date: Date, schedule: WeekSchedule): MinRange[] {
  const work = workingRangesFor(date, schedule).sort((a, b) => a[0] - b[0]);
  if (work.length === 0) return [[DAY_START, DAY_END]];
  const bands: MinRange[] = [];
  let cursor = DAY_START;
  for (const [s, e] of work) {
    if (s > cursor) bands.push([cursor, Math.min(s, DAY_END)]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < DAY_END) bands.push([cursor, DAY_END]);
  return bands;
}

function dateKey(d: Date): string {
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

export function blocksForDate(date: Date, blocked: BlockedTime[]): BlockedTime[] {
  return blocked.filter((b) => b.date === dateKey(date));
}

// Approved leave covering this date (inclusive range, demo dates are single or
// short ranges within the same month).
export function leaveForDate(date: Date, leaves: LeaveItem[]): LeaveItem | null {
  const key = dateKey(date);
  return (
    leaves.find((l) => l.status === "Approved" && (l.dateFrom === key || l.dateTo === key || withinRange(key, l.dateFrom, l.dateTo))) ?? null
  );
}

function withinRange(key: string, from: string, to: string): boolean {
  const parse = (s: string) => {
    const [d, mon, y] = s.split(" ");
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return new Date(parseInt(y, 10), MON.indexOf(mon), parseInt(d, 10)).getTime();
  };
  const t = parse(key);
  return t >= parse(from) && t <= parse(to);
}
