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
import type { GridCell, GridRow } from "./types";

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Inverts a room's booked ranges against the clinic's open window to get
// this-day's free slots, then formats them the same way the People tab's
// shift-time primary text is formatted.
function freeSlotSummary(roomId: string, appts: Appt[]): { lines: string[]; freeRatio: number; freeHours: number; isFull: boolean } {
  const openStart = DAY_START_HOUR * 60;
  const openEnd = DAY_END_HOUR * 60;
  const booked = roomBookedRanges(roomId, appts);

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

function dayToCell(room: Room, dayIndex: number, appts: Appt[], onClick: (e: React.MouseEvent) => void): GridCell {
  const isWeekend = dayIndex === 5 || dayIndex === 6;
  if (isWeekend) return { status: "off", offLabel: "Closed" };

  const { lines, freeRatio, freeHours, isFull } = freeSlotSummary(room.id, appts);
  if (isFull) return { status: "full", onClick };
  return { status: "normal", freeRatio, freeHours, lines, onClick };
}

function RoomRowHeader({ room }: { room: Room }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-sm font-bold text-gray-800 truncate">{room.name}</div>
      <span className="text-[11px] font-medium text-gray-400">{room.type}</span>
    </div>
  );
}

export function buildRoomRows(
  rooms: Room[],
  appts: Appt[],
  dayCount: number,
  onCellClick: (room: Room, dayIndex: number, e: React.MouseEvent) => void
): GridRow[] {
  return rooms.map((room) => ({
    id: room.id,
    header: <RoomRowHeader room={room} />,
    utilPct: roomUtilisationPct(room, appts),
    cells: Array.from({ length: dayCount }, (_, i) => dayToCell(room, i, appts, (e) => onCellClick(room, i, e))),
  }));
}
