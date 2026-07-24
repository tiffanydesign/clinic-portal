// Data helpers for the Calendar Schedule view. Reuses the appointment model and
// the 14 mock appointments from the Dashboard so the shared drawer stays
// consistent, and adds calendar-specific structures (clinician/room columns,
// blocked time, week distribution, appointment types, conflict detection).

import {
  APPTS, Appt, ApptType, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, apptMicroPillClass, apptStatusDotClass, blockHeightPx, gapToNext, statusPillType,
  clusterColumnByHour, equalDivisionTop, equalDivisionHeight,
} from "../dashboard/dashboardData";
import { MOCK_STAFF } from "../staff/staffData";

export {
  APPTS, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, NOW_MINUTES,
  apptBlockClass, apptMicroPillClass, apptStatusDotClass, blockHeightPx, gapToNext, statusPillType,
  clusterColumnByHour, equalDivisionTop, equalDivisionHeight,
};
export type { Appt, ApptType };
export type { OverflowGroup, VisibleItem } from "../dashboard/dashboardData";

export const CLINICIAN_SELF_ID = "EMP-003"; // signed-in clinician (Dr. Ebru Reis)
export const NURSE_SELF_NAME = "Berna Koç"; // signed-in nurse

export type Clinician = { id: string; name: string; short: string; avatar: string; onLeave?: boolean };

// Derived from staffData.MOCK_STAFF (the canonical staff registry) — only
// the schedule-specific fields (`short`, `onLeave`) live here, so renaming a
// clinician only ever needs to happen in one place.
const CLINICIAN_SHORT: Record<string, string> = {
  "EMP-003": "Dr. Reis",
  "EMP-004": "Dr. Yalçın",
  "EMP-005": "Dr. Öztürk",
  "EMP-006": "Dr. Şimşek",
};
export const CLINICIANS: Clinician[] = MOCK_STAFF
  .filter((s) => s.role === "Clinician")
  .map((s) => ({ id: s.id, name: s.name, short: CLINICIAN_SHORT[s.id] ?? s.name, avatar: s.avatar, onLeave: s.status === "On Leave" }));

export const NURSES = MOCK_STAFF.filter((s) => s.role === "Nurse" && s.status === "Active").map((s) => s.name);

// Rooms are no longer hardcoded here — they live in the Clinic Settings rooms
// store (the single source of truth an admin manages). Calendar columns,
// booking pickers, and by-room breakdowns consume useSchedulableRooms() —
// active rooms minus "Changing Room" type, which is an admin-config-only
// room type never meant to appear as a schedule column or booking location.
// roomName() resolves a raw appointment `room` id to its current display name
// (with an "(inactive)" suffix for history). These re-exports keep calendar
// imports local.
export { useActiveRooms, getActiveRoomsSnapshot, useSchedulableRooms, getSchedulableRoomsSnapshot, roomName } from "../clinic-settings/roomsStore";
export type { Room, RoomType } from "../clinic-settings/roomsData";

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

// --- blocked time (clinician "Block Time", or a Room Block rendered into
//     the same column-keyed shape when the grid is grouped By Room) ---
export type TimeBlock = {
  id: string;
  doctorId?: string; // present for kind "staff" (default); absent for "room"
  kind?: "staff" | "room";
  roomId?: string; // present for kind "room"
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
export function hasNurseConflict(list: Appt[], nurseName: string, startMin: number, durationMin: number, ignoreId?: string): Appt | null {
  const end = startMin + durationMin;
  return (
    list.find((a) => a.id !== ignoreId && a.nurse === nurseName && startMin < a.startMin + a.durationMin && a.startMin < end) ?? null
  );
}

// The one day (and containing week) the mock appointment data actually
// models. The Schedule page's date picker lets staff navigate to any date,
// but only this anchor day/week has real appointments — every other date
// renders as a legitimately empty schedule rather than fabricating data.
export const ANCHOR_DATE = new Date(2026, 6, 3); // Fri 3 Jul 2026
