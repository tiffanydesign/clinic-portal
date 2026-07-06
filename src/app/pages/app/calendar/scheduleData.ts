// Data helpers for the Calendar Schedule view. Reuses the appointment model and
// the 14 mock appointments from the Dashboard so the shared drawer stays
// consistent, and adds calendar-specific structures (clinician/room columns,
// blocked time, week distribution, appointment types, conflict detection).

import {
  APPTS, Appt, ApptType, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, statusPillType,
} from "../dashboard/dashboardData";

export { APPTS, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES, apptBlockClass, statusPillType };
export type { Appt, ApptType };

export const CLINICIAN_SELF_ID = "EMP-003"; // signed-in clinician (Dr. Claudia Reis)
export const NURSE_SELF_NAME = "Berna Koç"; // signed-in nurse

export type Clinician = { id: string; name: string; short: string; avatar: string; onLeave?: boolean };

export const CLINICIANS: Clinician[] = [
  { id: "EMP-003", name: "Dr. Claudia Reis", short: "Dr. Reis", avatar: "CR" },
  { id: "EMP-004", name: "Dr. Chad Okonkwo", short: "Dr. Okonkwo", avatar: "CO" },
  { id: "EMP-005", name: "Dr. Felix Andersen", short: "Dr. Andersen", avatar: "FA" },
  { id: "EMP-006", name: "Dr. Adobe Martinez", short: "Dr. Martinez", avatar: "AM", onLeave: true },
];

export const NURSES = ["Berna Koç", "Aylin Demir", "Selin Yılmaz"];

export type Room = { id: string; label: string; kind: string };
export const ROOMS: Room[] = [
  { id: "Scan A", label: "Scan A", kind: "Scan Room" },
  { id: "Scan B", label: "Scan B", kind: "Scan Room" },
  { id: "Room 1", label: "Room 1", kind: "Consult Room" },
  { id: "Room 2", label: "Room 2", kind: "Consult Room" },
  { id: "Room 3", label: "Room 3", kind: "Consult Room" },
  { id: "Lab 1", label: "Lab 1", kind: "Sample Room" },
  { id: "Lab 2", label: "Lab 2", kind: "Sample Room" },
];

export const APPT_TYPES: ApptType[] = [
  "Body Scan",
  "Consultation (in-person)",
  "Consultation (video)",
  "Sample Collection",
  "Follow-up",
];
// The New Appointment modal also offers the packaged option.
export const NEW_APPT_TYPES: string[] = [...APPT_TYPES, "7-Omics Package"];

export const DURATION_DEFAULTS: Record<string, number> = {
  "Body Scan": 45,
  "Consultation (in-person)": 30,
  "Consultation (video)": 30,
  "Sample Collection": 20,
  "Follow-up": 20,
  "7-Omics Package": 90,
};

export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90];

// --- time helpers ---
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
export function minToClock(min: number): string {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}
export function clockToMin(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}
export function fmtRange(startMin: number, durationMin: number): string {
  return `${minToClock(startMin)} – ${minToClock(startMin + durationMin)}`;
}

// --- blocked time (clinician "Block Time") ---
export type TimeBlock = {
  id: string;
  doctorId: string;
  startMin: number;
  durationMin: number;
  reason: string;
  note?: string;
};

// --- overrides layer (drag / resize / reschedule / reassign, prototype-local) ---
export type ApptOverride = Partial<Pick<Appt, "startMin" | "durationMin" | "doctorId" | "doctor" | "room" | "status">>;

export function applyOverride(a: Appt, ov?: ApptOverride): Appt {
  if (!ov) return a;
  const merged = { ...a, ...ov };
  // keep the human-readable time label in sync when timing changed
  if (ov.startMin !== undefined || ov.durationMin !== undefined) {
    merged.timeLabel = fmtRange(merged.startMin, merged.durationMin);
  }
  return merged;
}

// --- conflict detection for the New Appointment modal ---
export function hasClinicianConflict(list: Appt[], doctorId: string, startMin: number, durationMin: number, ignoreId?: string): Appt | null {
  const end = startMin + durationMin;
  return (
    list.find((a) => a.id !== ignoreId && a.doctorId === doctorId && startMin < a.startMin + a.durationMin && a.startMin < end) ?? null
  );
}
export function hasRoomConflict(list: Appt[], room: string, startMin: number, durationMin: number, ignoreId?: string): Appt | null {
  const end = startMin + durationMin;
  return (
    list.find((a) => a.id !== ignoreId && a.room === room && room !== "Video" && startMin < a.startMin + a.durationMin && a.startMin < end) ?? null
  );
}

// --- week distribution (Mon–Sun of the current week; today = Fri 3 Jul 2026) ---
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEK_DATES = ["30 Jun", "1 Jul", "2 Jul", "3 Jul", "4 Jul", "5 Jul", "6 Jul"];
export const TODAY_WEEK_INDEX = 4; // Friday

// Spread the mock appointments across the week for the Week view. Today (Fri)
// keeps the full set; other days get a representative subset at shifted times.
export type WeekAppt = Appt & { dayIndex: number };

function shift(a: Appt, dayIndex: number, deltaMin: number, idSuffix: string): WeekAppt {
  const startMin = a.startMin + deltaMin;
  return { ...a, id: `${a.id}${idSuffix}`, startMin, timeLabel: fmtRange(startMin, a.durationMin), dayIndex };
}

export function buildWeek(selfOnly: string | null): WeekAppt[] {
  const base = selfOnly ? APPTS.filter((a) => a.doctorId === selfOnly) : APPTS;
  const out: WeekAppt[] = [];
  // Today (Friday) — full set
  base.forEach((a) => out.push({ ...a, dayIndex: TODAY_WEEK_INDEX }));
  // Monday & Tuesday & Wednesday & Thursday — subsets
  const pick = (idx: number[], day: number, delta: number, suffix: string) =>
    idx.forEach((i) => base[i % base.length] && out.push(shift(base[i % base.length], day, delta, suffix)));
  pick([0, 2, 5], 0, 30, "-mo");
  pick([1, 4, 7], 1, -30, "-tu");
  pick([3, 6], 2, 60, "-we");
  pick([0, 5, 8, 9], 3, 15, "-th");
  return out;
}
