// Room utilisation methodology — the single source of truth shared by the
// Admin Dashboard's Utilisation KPI card and the Availability page's Rooms
// tab (row-end weekly utilisation %). Both must read through these functions
// so the two figures can never drift apart.
//
// Methodology: booked minutes ÷ open minutes, where "open" is the clinic's
// whole-day operating window (DAY_START_HOUR..DAY_END_HOUR from
// dashboardData.ts — no per-room opening-hours field exists on the Room
// model). The mock appointment data (APPTS) only covers a single real day;
// "this week's utilisation" is presented as that same day's ratio held
// constant across the week (a repeating-week stand-in), since extending an
// identical daily ratio across N days doesn't change the ratio. This is a
// pure view-layer convenience, not a change to the appointment/room data
// model or business rules.
import type { Appt, ApptStatus } from "../dashboard/dashboardData";
import { DAY_START_HOUR, DAY_END_HOUR } from "../dashboard/dashboardData";
import type { Room } from "./roomsData";
import type { RoomBlock } from "./roomBlocksData";
import { TODAY_ISO, roomBlockedMinutesOnDate } from "./roomBlocksData";

// Statuses that represent real, occupied room time. Cancelled/No Show never
// happened, so they can't count as "booked" — same reasoning as
// roomsData.ts's own OPEN_STATUSES, just inclusive of Completed since a
// finished visit still occupied the room for its duration.
const COUNTED_STATUSES: ApptStatus[] = ["Booked", "Arrived", "Checked In", "In Clinic", "Completed"];

export function clinicOpenMinutesPerDay(): number {
  return (DAY_END_HOUR - DAY_START_HOUR) * 60;
}

export function roomBookedMinutesToday(roomId: string, appts: Appt[]): number {
  return appts
    .filter((a) => a.room === roomId && COUNTED_STATUSES.includes(a.status))
    .reduce((sum, a) => sum + a.durationMin, 0);
}

// Merged, sorted [start, end) minute ranges (minutes from midnight) a room is
// occupied today — the Availability page's Rooms tab inverts this against
// the open window to get free-slot text; roomBookedMinutesToday could be
// derived from this too, but stays separate to keep that call site untouched.
export function roomBookedRanges(roomId: string, appts: Appt[]): [number, number][] {
  const ranges = appts
    .filter((a) => a.room === roomId && COUNTED_STATUSES.includes(a.status))
    .map((a) => [a.startMin, a.startMin + a.durationMin] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

// A room blocked for maintenance/cleaning/etc. isn't open time it's simply
// not using — it was never available to book, so it comes out of the
// denominator entirely rather than counting as unbooked-but-open time (which
// would understate utilisation for a room that's legitimately offline).
// `blocks` defaults to none so any call site that hasn't been updated yet
// still compiles and behaves exactly as before.
function openMinutesFor(room: Room, blocks: RoomBlock[]): number {
  return Math.max(0, clinicOpenMinutesPerDay() - roomBlockedMinutesOnDate(blocks, room.id, TODAY_ISO));
}

// A single room's utilisation for the week, as a rounded percentage.
export function roomUtilisationPct(room: Room, appts: Appt[], blocks: RoomBlock[] = []): number {
  const open = openMinutesFor(room, blocks);
  if (open <= 0) return 0;
  return Math.round((roomBookedMinutesToday(room.id, appts) / open) * 100);
}

// Aggregate utilisation across a room set (the Rooms tab's `rooms`, and the
// Dashboard KPI's implicit "all schedulable rooms") — booked minutes summed
// over open minutes summed, not an average of per-room percentages, so a
// handful of heavily-used rooms can't be diluted by many idle ones.
export function clinicUtilisationPct(rooms: Room[], appts: Appt[], blocks: RoomBlock[] = []): number {
  const open = rooms.reduce((sum, r) => sum + openMinutesFor(r, blocks), 0);
  if (open <= 0) return 0;
  const booked = rooms.reduce((sum, r) => sum + roomBookedMinutesToday(r.id, appts), 0);
  return Math.round((booked / open) * 100);
}
