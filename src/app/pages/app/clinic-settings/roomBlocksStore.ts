// In-memory store for room blocks (maintenance/cleaning/equipment-fault
// unavailability windows) — mirrors roomsStore.ts's shape exactly: a plain
// array behind useSyncExternalStore, mutations write an audit entry and
// notify subscribers so every consumer (Rooms tab grid, Clinic Settings room
// detail, Calendar's By-Room view, the booking room picker) updates the
// instant a block is added, edited, or removed.
import { useSyncExternalStore } from "react";
import { RoomBlock, RoomBlockReason, makeRoomBlockId, TODAY_ISO } from "./roomBlocksData";
import { logAudit, AUDIT_ACTOR } from "./auditStore";

export { TODAY_ISO };

let blocks: RoomBlock[] = [];
const listeners = new Set<() => void>();

function emit() {
  blocks = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// --- reads ---
export function useRoomBlocks(): RoomBlock[] {
  return useSyncExternalStore(subscribe, () => blocks);
}

export function getRoomBlocksSnapshot(): RoomBlock[] {
  return blocks;
}

// Filtering happens in the hook body (not getSnapshot) so the snapshot
// reference stays stable — same convention as roomsStore.ts's useActiveRooms.
export function useRoomBlocksFor(roomId: string): RoomBlock[] {
  return useRoomBlocks().filter((b) => b.roomId === roomId);
}

// Upcoming = ends today or later; past = fully ended before today. Room
// detail's Upcoming-blocks list shows the former by default, the latter only
// behind a "View past blocks" toggle.
export function upcomingBlocksForRoom(roomId: string): RoomBlock[] {
  return getRoomBlocksSnapshot().filter((b) => b.roomId === roomId && b.endDate >= TODAY_ISO);
}
export function pastBlocksForRoom(roomId: string): RoomBlock[] {
  return getRoomBlocksSnapshot()
    .filter((b) => b.roomId === roomId && b.endDate < TODAY_ISO)
    .sort((a, b) => b.startDate.localeCompare(a.startDate)); // most recent first
}

// --- mutations ---
export type NewRoomBlockInput = {
  roomId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startMin?: number;
  endMin?: number;
  reason: RoomBlockReason;
  note?: string;
};

function describeBlock(input: Pick<RoomBlock, "startDate" | "endDate" | "allDay" | "reason">): string {
  const dateLabel = input.startDate === input.endDate ? input.startDate : `${input.startDate} – ${input.endDate}`;
  return `${dateLabel} · ${input.allDay ? "All day" : "Partial day"} · ${input.reason}`;
}

export function addRoomBlock(input: NewRoomBlockInput): RoomBlock {
  const block: RoomBlock = {
    id: makeRoomBlockId(),
    ...input,
    note: input.note?.trim() || undefined,
    createdBy: AUDIT_ACTOR,
    createdAt: Date.now(),
  };
  blocks = [...blocks, block];
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: block.roomId, action: "Blocked room", detail: describeBlock(block) });
  emit();
  return block;
}

export type RoomBlockPatch = Partial<Pick<RoomBlock, "startDate" | "endDate" | "allDay" | "startMin" | "endMin" | "reason" | "note">>;

export function updateRoomBlock(id: string, patch: RoomBlockPatch): void {
  const before = blocks.find((b) => b.id === id);
  if (!before) return;
  blocks = blocks.map((b) => (b.id === id ? { ...b, ...patch, note: patch.note !== undefined ? patch.note.trim() || undefined : b.note } : b));
  const after = blocks.find((b) => b.id === id)!;
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: after.roomId, action: "Updated room block", detail: describeBlock(after) });
  emit();
}

export function removeRoomBlock(id: string): void {
  const block = blocks.find((b) => b.id === id);
  if (!block) return;
  blocks = blocks.filter((b) => b.id !== id);
  logAudit({ actor: AUDIT_ACTOR, entityType: "room", entityId: block.roomId, action: "Removed room block", detail: describeBlock(block) });
  emit();
}
