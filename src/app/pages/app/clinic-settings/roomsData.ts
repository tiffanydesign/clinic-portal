// Canonical Room model + seed data for the clinic's physical rooms. This is
// the single source of truth that drives BOTH the Clinic Settings > Rooms
// admin surface and the Calendar's room columns / booking pickers (which used
// to hardcode a 7-room list in scheduleData.ts).
//
// Room `id` is stable and never changes — the seed ids are deliberately the
// same strings the legacy calendar used ("Scan A", "Room 1", ...) so every
// existing appointment's `room` field still resolves. New rooms added by an
// admin get a generated slug id; their display name is resolved through
// roomName() so a later rename never orphans a booking.

import type { Appt, ApptStatus } from "../dashboard/dashboardData";

export type RoomType = "Scan Room" | "Consult Room" | "Sample Room" | "Changing Room" | "Other";
export type RoomStatus = "active" | "inactive";

export type Room = {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  sortOrder: number;
  notes?: string;
};

// Order matters: this is the order the New Room drawer's Type <select> offers,
// and the grouping order used by the Calendar's room columns.
export const ROOM_TYPES: RoomType[] = ["Changing Room", "Scan Room", "Consult Room", "Sample Room", "Other"];

// Seed rooms. The seven active rooms reproduce the legacy calendar exactly
// (same ids, same order); "Room 4" is a pre-deactivated example so the
// inactive state is visible without an admin having to deactivate one first.
export const SEED_ROOMS: Room[] = [
  { id: "Scan A", name: "Scan A", type: "Scan Room", status: "active", sortOrder: 0, notes: "3T MRI · whole-body protocol" },
  { id: "Scan B", name: "Scan B", type: "Scan Room", status: "active", sortOrder: 1, notes: "CT + DEXA" },
  { id: "Room 1", name: "Room 1", type: "Consult Room", status: "active", sortOrder: 2 },
  { id: "Room 2", name: "Room 2", type: "Consult Room", status: "active", sortOrder: 3 },
  { id: "Room 3", name: "Room 3", type: "Consult Room", status: "active", sortOrder: 4, notes: "Wheelchair accessible" },
  { id: "Lab 1", name: "Lab 1", type: "Sample Room", status: "active", sortOrder: 5, notes: "Phlebotomy" },
  { id: "Lab 2", name: "Lab 2", type: "Sample Room", status: "active", sortOrder: 6, notes: "Phlebotomy" },
  { id: "Room 4", name: "Room 4", type: "Consult Room", status: "inactive", sortOrder: 7, notes: "Out of service — being refurbished" },
  // Six changing rooms feeding the Patient Journey's "Changing Room" station
  // (see journeyEngine.ts) — patients change into a gown here before Scan.
  { id: "Changing 1", name: "Changing 1", type: "Changing Room", status: "active", sortOrder: 8, notes: "Locker + gown, ground floor" },
  { id: "Changing 2", name: "Changing 2", type: "Changing Room", status: "active", sortOrder: 9, notes: "Locker + gown, ground floor" },
  { id: "Changing 3", name: "Changing 3", type: "Changing Room", status: "active", sortOrder: 10, notes: "Locker + gown, ground floor" },
  { id: "Changing 4", name: "Changing 4", type: "Changing Room", status: "active", sortOrder: 11, notes: "Locker + gown, 1st floor · wheelchair accessible" },
  { id: "Changing 5", name: "Changing 5", type: "Changing Room", status: "active", sortOrder: 12, notes: "Locker + gown, 1st floor" },
  { id: "Changing 6", name: "Changing 6", type: "Changing Room", status: "inactive", sortOrder: 13, notes: "Out of service — lock replacement" },
];

// Statuses that mean a booking is still going to happen (or is happening) and
// would be disrupted if its room were deactivated. Settled/void appointments
// (Completed / Cancelled / No Show) never block a deactivation.
export const OPEN_STATUSES: ApptStatus[] = ["Booked", "Arrived", "Checked In", "In Clinic"];

// Pure helper (takes the appt list as an argument so the store stays free of
// any appointment-data coupling): the still-open bookings a room deactivation
// would strand, newest-time first for the blocking dialog's list.
export function roomOpenBookings(roomId: string, appts: Appt[]): Appt[] {
  return appts
    .filter((a) => a.room === roomId && OPEN_STATUSES.includes(a.status))
    .sort((a, b) => a.startMin - b.startMin);
}

// Slugify a new room's name into a collision-resistant stable id. Kept
// human-ish for debuggability but suffixed with a short time key so two rooms
// that briefly share a name (before the uniqueness check) can't collide.
export function makeRoomId(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `room-${base || "x"}-${Date.now().toString(36).slice(-4)}`;
}
