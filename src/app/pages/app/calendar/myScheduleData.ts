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
import { relevantJourneySteps } from "../dashboard/dashboardData";
import { DAYS, WeekSchedule, timeToMinutes } from "../availability/availabilityData";
import { BlockedTime } from "../availability/availabilityStore";
import { LeaveItem } from "../availability/availabilityData";

export type ScheduleRole = "Nurse" | "Clinician";

export const DAY_START = 7 * 60; // 07:00 top of grid
export const DAY_END = 20 * 60; // 20:00 bottom
export const SCROLL_TO = 8 * 60; // default scroll position

export const weekStartOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

// --- role-scoped "my appointments" ---
export function myAppts(role: ScheduleRole): Appt[] {
  if (role === "Clinician") return APPTS.filter((a) => a.doctorId === CLINICIAN_SELF_ID);
  return APPTS.filter((a) => a.nurse === NURSE_SELF_NAME);
}

// Fabricate a fuller week from the single modelled day, the same demo device
// the existing Week view uses: the anchor day carries the real set, a few
// other weekdays get shifted subsets, and Thursday is deliberately left as an
// approved-leave day (no appts). Wednesday's subset is engineered to overlap so
// the collision layout is demonstrable. Non-anchor weeks are genuinely empty.
// `at` pins an absolute start (used to engineer overlaps that exercise the
// collision layout); otherwise `delta` shifts the appt's natural time.
type ShiftPlan = { idx: number; delta?: number; at?: number };
const WEEKDAY_PLANS: Record<number, ShiftPlan[]> = {
  1: [{ idx: 0, delta: 30 }, { idx: 3, delta: 60 }], // Mon — spread
  2: [{ idx: 0, at: 600 }, { idx: 1, at: 615 }], // Tue — two overlapping → side-by-side lanes
  3: [{ idx: 0, at: 600 }, { idx: 1, at: 610 }, { idx: 2, at: 620 }, { idx: 3, at: 630 }], // Wed — four overlapping → "+N more"
  4: [], // Thu — approved leave day, intentionally empty
};

function placeAppt(a: Appt, p: ShiftPlan, suffix: string): Appt {
  const startMin = p.at != null ? p.at : Math.max(DAY_START, Math.min(DAY_END - a.durationMin, a.startMin + (p.delta ?? 0)));
  return { ...a, id: `${a.id}${suffix}`, startMin, timeLabel: fmtRange(startMin, a.durationMin) };
}

export type WeekDay = { date: Date; isToday: boolean; appts: Appt[] };

export function buildMyWeek(role: ScheduleRole, weekStart: Date): WeekDay[] {
  const base = myAppts(role);
  const isAnchorWeek = isSameDay(weekStart, weekStartOf(ANCHOR_DATE));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isToday = isSameDay(date, ANCHOR_DATE);
    if (!isAnchorWeek) return { date, isToday: false, appts: [] };
    if (isToday) return { date, isToday, appts: base };
    const plan = WEEKDAY_PLANS[date.getDay()] ?? [];
    const appts = plan
      .map((p, k) => (base[p.idx % base.length] ? placeAppt(base[p.idx % base.length], p, `-w${date.getDay()}-${k}`) : null))
      .filter((a): a is Appt => a !== null);
    return { date, isToday, appts };
  });
}

export function apptsForDate(role: ScheduleRole, date: Date): Appt[] {
  return buildMyWeek(role, weekStartOf(date)).find((d) => isSameDay(d.date, date))?.appts ?? [];
}

// --- collision lane-packing ---
// Overlapping appointments must render side by side, never stacked with
// colliding text. Events are grouped into connected overlap clusters; within a
// cluster each event greedily takes the first free lane. A cluster that needs
// 3+ lanes shows the first two and collapses the rest into a "+N more" chip so
// nothing shrinks to an unreadable sliver.
const MAX_VISIBLE_LANES = 2;

export type LaidItem =
  | { kind: "appt"; appt: Appt; startMin: number; durationMin: number; lane: number; lanes: number }
  | { kind: "more"; startMin: number; durationMin: number; lane: number; lanes: number; hidden: Appt[] };

export function layoutDay(appts: Appt[]): LaidItem[] {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin);
  const clusters: Appt[][] = [];
  let cur: Appt[] = [];
  let curEnd = -1;
  for (const a of sorted) {
    if (cur.length && a.startMin < curEnd) {
      cur.push(a);
      curEnd = Math.max(curEnd, a.startMin + a.durationMin);
    } else {
      if (cur.length) clusters.push(cur);
      cur = [a];
      curEnd = a.startMin + a.durationMin;
    }
  }
  if (cur.length) clusters.push(cur);

  const out: LaidItem[] = [];
  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const withLane = cluster.map((a) => {
      let lane = laneEnds.findIndex((end) => end <= a.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = a.startMin + a.durationMin;
      return { appt: a, lane };
    });
    const used = laneEnds.length;
    if (used <= MAX_VISIBLE_LANES) {
      withLane.forEach(({ appt, lane }) => out.push({ kind: "appt", appt, startMin: appt.startMin, durationMin: appt.durationMin, lane, lanes: Math.max(1, used) }));
    } else {
      const lanes = MAX_VISIBLE_LANES + 1;
      const hidden = withLane.filter((x) => x.lane >= MAX_VISIBLE_LANES).map((x) => x.appt);
      withLane
        .filter((x) => x.lane < MAX_VISIBLE_LANES)
        .forEach(({ appt, lane }) => out.push({ kind: "appt", appt, startMin: appt.startMin, durationMin: appt.durationMin, lane, lanes }));
      const hStart = Math.min(...hidden.map((a) => a.startMin));
      const hEnd = Math.max(...hidden.map((a) => a.startMin + a.durationMin));
      out.push({ kind: "more", startMin: hStart, durationMin: hEnd - hStart, lane: MAX_VISIBLE_LANES, lanes, hidden });
    }
  }
  return out;
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
  "Body Scan": "bg-violet-500",
  Consultation: "bg-blue-500",
  "Sample Collection": "bg-teal-500",
  "Follow-up": "bg-amber-500",
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

// The nurse's block subtext: the patient's current journey station.
export function journeyStepLabel(a: Appt): string | null {
  if (a.status !== "In Clinic" && a.status !== "Checked In") return null;
  const { steps, current } = relevantJourneySteps(a);
  return steps[current] ?? null;
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
