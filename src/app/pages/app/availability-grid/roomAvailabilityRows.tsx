// Rooms tab data: derives grid rows from the real Room + Appt models (no
// separate mock, unlike the People tab) — so this tab's numbers can never
// drift from Clinic Settings > Rooms or the Dashboard's Utilisation KPI.
//
// The mock appointment set (APPTS) only covers a single real day, so every
// weekday column reuses that same day's booking pattern (the same
// repeating-week stand-in documented in roomAvailability.ts); Sat/Sun show
// as Closed. This is a view-layer limitation of the mock data, not a change
// to the room/appointment data model.
import React from "react";
import type { Appt } from "../dashboard/dashboardData";
import { DAY_START_HOUR, DAY_END_HOUR } from "../dashboard/dashboardData";
import type { Room } from "../clinic-settings/roomsData";
import { roomBookedRanges, roomUtilisationPct } from "../clinic-settings/roomAvailability";
import type { RoomBlock } from "../clinic-settings/roomBlocksData";
import { roomBlockedRangesOnDate, roomBlocksOnDate, mergeMinuteRanges, blockReasonAbbrev } from "../clinic-settings/roomBlocksData";
import type { GridCell, GridRow } from "./types";

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Inverts a room's booked + blocked ranges against the clinic's open window
// to get this-day's free slots, then formats them the same way the People
// tab's shift-time primary text is formatted. Blocked time counts the same
// as booked time here — it isn't available either — so "free" always means
// "actually bookable right now".
function freeSlotSummary(roomId: string, appts: Appt[], blockedRanges: [number, number][]): { lines: string[]; freeRatio: number; freeHours: number; isFull: boolean } {
  const openStart = DAY_START_HOUR * 60;
  const openEnd = DAY_END_HOUR * 60;
  const booked = mergeMinuteRanges([...roomBookedRanges(roomId, appts), ...blockedRanges]);

  const gaps: [number, number][] = [];
  let cursor = openStart;
  for (const [s, e] of booked) {
    if (s > cursor) gaps.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < openEnd) gaps.push([cursor, openEnd]);

  const freeMinutes = gaps.reduce((sum, [s, e]) => sum + (e - s), 0);
  const openMinutes = openEnd - openStart;
  const freeHours = Math.round((freeMinutes / 60) * 10) / 10;
  const freeRatio = openMinutes > 0 ? freeMinutes / openMinutes : 0;

  if (gaps.length === 0) return { lines: [], freeRatio: 0, freeHours: 0, isFull: true };

  const parts = gaps.map(([s, e]) => `${fmt(s)}–${fmt(e)}`);
  const joined = `Free ${parts.join(", ")}`;
  const summary = joined.length > 28 ? `${gaps.length} free slot${gaps.length === 1 ? "" : "s"}` : joined;
  return { lines: [summary], freeRatio, freeHours, isFull: false };
}

function dayToCell(room: Room, dateISO: string, isWeekend: boolean, appts: Appt[], blocks: RoomBlock[], onClick: (e: React.MouseEvent) => void): GridCell {
  if (isWeekend) return { status: "off", offLabel: "Closed" };

  const blockedRanges = roomBlockedRangesOnDate(blocks, room.id, dateISO);
  const wholeWindowBlocked = blockedRanges.some(([s, e]) => s <= DAY_START_HOUR * 60 && e >= DAY_END_HOUR * 60);
  if (wholeWindowBlocked) {
    const reasons = roomBlocksOnDate(blocks, room.id, dateISO).map((b) => blockReasonAbbrev(b.reason));
    return { status: "blocked", blockedLabel: `Blocked · ${reasons[0] ?? "Maintenance"}`, onClick };
  }

  const { lines, freeRatio, freeHours, isFull } = freeSlotSummary(room.id, appts, blockedRanges);
  if (isFull) return { status: "full", onClick };
  const cell: GridCell = { status: "normal", freeRatio, freeHours, lines, onClick };
  if (blockedRanges.length > 0) {
    const reasons = roomBlocksOnDate(blocks, room.id, dateISO).map((b) => blockReasonAbbrev(b.reason));
    cell.blocked = [{ label: `🔧 ${reasons[0] ?? "Maintenance"}` }];
  }
  return cell;
}

function RoomRowHeader({ room }: { room: Room }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-sm font-bold text-ink truncate">{room.name}</div>
      <span className="text-label font-medium text-ink-muted">{room.type}</span>
    </div>
  );
}

// dates: one ISO date per grid column, in display order (matches AvailabilityPage's DAYS).
// Weekend detection stays positional (last 2 of 7 columns) — unchanged from
// before this feature — rather than derived from the ISO dates: the app's
// display labels (Mon..Sun) and its real ANCHOR_DATE are already a day off
// from each other elsewhere (a pre-existing mismatch, out of this feature's
// scope), so real date math here would silently shift which columns render
// as Closed. `dates` exists only to match room blocks to a column.
function isWeekendCol(dayIndex: number, dayCount: number): boolean {
  return dayIndex === dayCount - 2 || dayIndex === dayCount - 1;
}

export function buildRoomRows(
  rooms: Room[],
  appts: Appt[],
  blocks: RoomBlock[],
  dates: string[],
  onCellClick: (room: Room, dayIndex: number, e: React.MouseEvent) => void
): GridRow[] {
  return rooms.map((room) => ({
    id: room.id,
    header: <RoomRowHeader room={room} />,
    utilPct: roomUtilisationPct(room, appts, blocks),
    cells: dates.map((iso, i) => dayToCell(room, iso, isWeekendCol(i, dates.length), appts, blocks, (e) => onCellClick(room, i, e))),
  }));
}
