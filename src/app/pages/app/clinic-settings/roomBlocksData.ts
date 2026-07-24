// Canonical RoomBlock model + pure date/range math. A room block marks a
// room unavailable (maintenance, cleaning, equipment fault) for a single day
// or a consecutive date range, either all day or a specific time window.
// Dates are stored as ISO ("YYYY-MM-DD") — the app already has multiple
// display date-string conventions across files (Availability's "D Mon
// YYYY", the calendar's "D Mon" week labels); ISO avoids adding a fourth and
// is trivially sortable/comparable. Each surface formats to its own
// convention at render time.
import { DAY_START_HOUR, DAY_END_HOUR } from "../dashboard/dashboardData";

// Mirrors scheduleData.ts's ANCHOR_DATE (Fri 3 Jul 2026) — the app's fixed
// "today" for this demo, not the real wall clock. Not imported directly to
// avoid a clinic-settings -> calendar dependency; calendar already depends
// on clinic-settings (rooms), not the other way around.
export const TODAY_ISO = "2026-07-03";

export type RoomBlockReason = "Maintenance" | "Cleaning" | "Equipment fault" | "Other";
export const ROOM_BLOCK_REASONS: RoomBlockReason[] = ["Maintenance", "Cleaning", "Equipment fault", "Other"];

// Short form for tight spaces (the Rooms tab grid chip, the calendar stripe label).
export function blockReasonAbbrev(reason: RoomBlockReason): string {
  if (reason === "Equipment fault") return "Equip. fault";
  return reason;
}

export type RoomBlock = {
  id: string;
  roomId: string;
  startDate: string; // ISO, inclusive
  endDate: string; // ISO, inclusive; === startDate for a single day
  allDay: boolean;
  startMin?: number; // minutes from midnight — required when !allDay
  endMin?: number; // required when !allDay
  reason: RoomBlockReason;
  note?: string; // required when reason === "Other"
  createdBy: string;
  createdAt: number; // epoch ms
};

export function makeRoomBlockId(): string {
  return `rb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- time helpers, in the calendar's 24h HH:MM convention (this feature
//     integrates with real Appt.startMin/durationMin and the booking room
//     picker, unlike staff Blocked Time's am/pm picker on the staff's own
//     schedule) — each feature's data file owns its own tiny copy of these,
//     matching scheduleData.ts's and availabilityData.ts's existing pattern. ---
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
export function minToClock(min: number): string {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}
export function clockToMin(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}
export const BLOCK_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = DAY_START_HOUR * 60; m <= DAY_END_HOUR * 60; m += 15) out.push(minToClock(m));
  return out;
})();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function formatBlockDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// The next 120 days from TODAY_ISO (unlike staff Blocked Time's workday-only
// horizon, a room block is legitimately planned for any day — cleaning and
// maintenance don't skip weekends). {value: ISO, label: display} for FilterSelect.
export function upcomingDays(): { value: string; label: string }[] {
  const [y, m, d] = TODAY_ISO.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  return Array.from({ length: 120 }, (_, i) => {
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const iso = isoOf(dt);
    return { value: iso, label: i === 0 ? `Today · ${formatBlockDate(iso)}` : formatBlockDate(iso) };
  });
}

// --- pure date/range math (no store dependency, so it's cheaply testable
//     and reusable by both the store's helpers and any UI that needs to
//     preview a not-yet-saved block) ---

export function blockCoversDate(block: RoomBlock, dateISO: string): boolean {
  return dateISO >= block.startDate && dateISO <= block.endDate;
}

// The [start,end) minute range this block occupies on a given date it
// covers, or null if it doesn't cover that date. All-day resolves to the
// clinic's whole operating window, matching how utilisation's "open minutes"
// is already defined (see roomAvailability.ts).
export function blockRangeOnDate(block: RoomBlock, dateISO: string): [number, number] | null {
  if (!blockCoversDate(block, dateISO)) return null;
  if (block.allDay) return [DAY_START_HOUR * 60, DAY_END_HOUR * 60];
  return [block.startMin!, block.endMin!];
}

export function mergeMinuteRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r] as [number, number]);
  }
  return out;
}

export function roomBlockedRangesOnDate(blocks: RoomBlock[], roomId: string, dateISO: string): [number, number][] {
  const ranges = blocks
    .filter((b) => b.roomId === roomId)
    .map((b) => blockRangeOnDate(b, dateISO))
    .filter((r): r is [number, number] => r !== null);
  return mergeMinuteRanges(ranges);
}

// The RoomBlock(s), if any, covering this room on this date — for surfaces
// that need the block record itself (reason, id) rather than just its
// minute range, e.g. the Rooms-tab grid cell's label/chip.
export function roomBlocksOnDate(blocks: RoomBlock[], roomId: string, dateISO: string): RoomBlock[] {
  return blocks.filter((b) => b.roomId === roomId && blockCoversDate(b, dateISO));
}

export function roomBlockedMinutesOnDate(blocks: RoomBlock[], roomId: string, dateISO: string): number {
  return roomBlockedRangesOnDate(blocks, roomId, dateISO).reduce((sum, [s, e]) => sum + (e - s), 0);
}

export function isRoomBlockedAt(blocks: RoomBlock[], roomId: string, dateISO: string, minute: number): boolean {
  return roomBlockedRangesOnDate(blocks, roomId, dateISO).some(([s, e]) => minute >= s && minute < e);
}

// Overlap check for a proposed [startMin, startMin+durationMin) window —
// what the booking room picker needs (a slot can straddle a block's edge
// without containing its exact start minute), vs isRoomBlockedAt's simpler
// single-point check for rendering "is this room blocked right now".
export function roomBlockedDuring(blocks: RoomBlock[], roomId: string, dateISO: string, startMin: number, durationMin: number): boolean {
  const end = startMin + durationMin;
  return roomBlockedRangesOnDate(blocks, roomId, dateISO).some(([s, e]) => startMin < e && s < end);
}

// The end of the block covering `minute`, for a "Blocked until HH:MM" label.
// Assumes minute is actually covered (blockedDuring/isRoomBlockedAt true).
export function roomBlockEndAt(blocks: RoomBlock[], roomId: string, dateISO: string, minute: number): number | null {
  const covering = roomBlockedRangesOnDate(blocks, roomId, dateISO).find(([s, e]) => minute >= s && minute < e);
  return covering ? covering[1] : null;
}

// Whether a block's own [startMin,endMin) fully covers the clinic's open
// window on a date it applies to — used to decide whether the Rooms-tab grid
// cell renders as a full "blocked" cell vs. a partial chip inside a normal
// cell. All-day blocks always cover the whole window by definition.
export function blockCoversWholeWindow(block: RoomBlock): boolean {
  if (block.allDay) return true;
  return block.startMin! <= DAY_START_HOUR * 60 && block.endMin! >= DAY_END_HOUR * 60;
}
