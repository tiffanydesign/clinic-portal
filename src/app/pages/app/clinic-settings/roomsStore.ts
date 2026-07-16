// In-memory store for clinic rooms — the single source of truth behind both
// the Rooms admin page and the Calendar's room columns / booking pickers.
// Mutations write an audit entry and notify subscribers so the calendar
// updates the instant an admin adds, reorders, or deactivates a room.
import { useSyncExternalStore } from "react";
import { Room, RoomType, RoomStatus, SEED_ROOMS, makeRoomId } from "./roomsData";
import { logAudit, AUDIT_ACTOR } from "./auditStore";

let rooms: Room[] = [...SEED_ROOMS].sort((a, b) => a.sortOrder - b.sortOrder);
const listeners = new Set<() => void>();

function emit() {
  // Keep the array sorted by sortOrder and re-numbered 0..n-1 so callers can
  // rely on both the order and contiguous sortOrder values.
  rooms = [...rooms].sort((a, b) => a.sortOrder - b.sortOrder).map((r, i) => ({ ...r, sortOrder: i }));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// --- reads ---
export function useRooms(): Room[] {
  return useSyncExternalStore(subscribe, () => rooms);
}

// Active rooms in sort order — every admin-facing room picker (device
// assignment, etc.) consumes this. Filtering happens in the hook body (not
// getSnapshot) so the snapshot reference stays stable.
export function useActiveRooms(): Room[] {
  return useRooms().filter((r) => r.status === "active");
}

export function getRoomsSnapshot(): Room[] {
  return rooms;
}
export function getActiveRoomsSnapshot(): Room[] {
  return rooms.filter((r) => r.status === "active");
}

// Active rooms minus "Changing Room" type — what the calendar's columns,
// booking pickers, and by-room breakdowns consume. Changing rooms are purely
// an admin-defined config (e.g. for tagging where a device physically sits)
// and were never meant to be scheduled into or shown as a schedule column.
export function useSchedulableRooms(): Room[] {
  return useActiveRooms().filter((r) => r.type !== "Changing Room");
}
export function getSchedulableRoomsSnapshot(): Room[] {
  return getActiveRoomsSnapshot().filter((r) => r.type !== "Changing Room");
}

// Display resolver for anywhere an appointment's raw `room` id is shown as
// text: returns the current name, an "(inactive)" suffix for deactivated
// rooms (history still reads correctly), and falls back to the id itself for
// legacy/non-room values like "Video".
export function roomName(id: string): string {
  const r = rooms.find((x) => x.id === id);
  if (!r) return id;
  return r.status === "inactive" ? `${r.name} (inactive)` : r.name;
}

// Case-insensitive uniqueness check for the Name field (drawer validation).
export function isRoomNameTaken(name: string, exceptId?: string): boolean {
  const n = name.trim().toLowerCase();
  return rooms.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === n);
}

// --- mutations (callers validate uniqueness first via isRoomNameTaken) ---
export type NewRoomInput = { name: string; type: RoomType; notes?: string };

export function addRoom(input: NewRoomInput): Room {
  const room: Room = {
    id: makeRoomId(input.name),
    name: input.name.trim(),
    type: input.type,
    status: "active",
    sortOrder: rooms.length,
    notes: input.notes?.trim() || undefined,
  };
  rooms = [...rooms, room];
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: room.id, action: "Added room", detail: `${room.name} · ${room.type}` });
  emit();
  return room;
}

export function updateRoom(id: string, patch: Partial<Pick<Room, "name" | "type" | "notes">>): void {
  const before = rooms.find((r) => r.id === id);
  if (!before) return;
  rooms = rooms.map((r) => (r.id === id ? { ...r, ...patch, name: patch.name?.trim() ?? r.name, notes: patch.notes !== undefined ? patch.notes.trim() || undefined : r.notes } : r));
  const after = rooms.find((r) => r.id === id)!;
  if (before.name !== after.name) logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: id, action: "Renamed room", before: before.name, after: after.name });
  if (before.type !== after.type) logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: id, action: "Changed type", before: before.type, after: after.type });
  if (before.notes !== after.notes) logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: id, action: "Edited notes", detail: after.notes || "Cleared notes" });
  emit();
}

export function reorderRoom(id: string, dir: "up" | "down"): void {
  const ordered = [...rooms].sort((a, b) => a.sortOrder - b.sortOrder);
  const i = ordered.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ordered.length) return;
  const swappedWith = ordered[j].name;
  [ordered[i].sortOrder, ordered[j].sortOrder] = [ordered[j].sortOrder, ordered[i].sortOrder];
  rooms = ordered;
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: id, action: `Moved ${dir}`, detail: `Swapped order with ${swappedWith}` });
  emit();
}

// Flip active/inactive. The deactivation guard (blocking on open bookings) and
// the device-orphaning side effect are orchestrated by the page; the store
// only records the status change once the caller has cleared the guard.
export function setRoomStatus(id: string, status: RoomStatus): void {
  const room = rooms.find((r) => r.id === id);
  if (!room || room.status === status) return;
  rooms = rooms.map((r) => (r.id === id ? { ...r, status } : r));
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: id, action: status === "inactive" ? "Deactivated room" : "Reactivated room", detail: room.name });
  emit();
}
