// Append-only audit trail for Rooms & Devices changes. Every mutating action
// (create / edit / reorder / deactivate a room; add / reassign / pair / unpair
// / retire a device) writes one entry here, surfaced per-entity in the detail
// drawers' Activity section. In-memory only — same useSyncExternalStore shape
// as the other prototype stores.
import { useSyncExternalStore } from "react";

export type AuditEntityType = "room" | "device";

export type AuditEntry = {
  id: string;
  ts: number; // epoch ms, for stable ordering
  timeLabel: string; // pre-rendered ("Just now", "2 days ago", "28 Jun")
  actor: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string; // short verb phrase, e.g. "Reassigned room"
  detail?: string; // optional human sentence
  before?: string; // optional structured change
  after?: string;
};

// The signed-in admin — the only role that can reach these surfaces, so every
// entry is attributed to them in the prototype.
export const AUDIT_ACTOR = "Ayşe Hançer";

const SEED_AUDIT: AuditEntry[] = [
  { id: "au-seed-1", ts: Date.now() - 1000 * 60 * 60 * 24 * 6, timeLabel: "6 days ago", actor: "Kerem Uslu", entityType: "room", entityId: "Room 3", action: "Edited room", detail: "Marked wheelchair accessible in notes" },
  { id: "au-seed-2", ts: Date.now() - 1000 * 60 * 60 * 24 * 5, timeLabel: "5 days ago", actor: AUDIT_ACTOR, entityType: "room", entityId: "Room 4", action: "Deactivated room", detail: "Out of service — being refurbished" },
  { id: "au-seed-3", ts: Date.now() - 1000 * 60 * 60 * 24 * 3, timeLabel: "3 days ago", actor: AUDIT_ACTOR, entityType: "device", entityId: "dv-tv-01", action: "Paired TV", detail: "Paired with Phenome TV app" },
  { id: "au-seed-4", ts: Date.now() - 1000 * 60 * 60 * 24 * 2, timeLabel: "2 days ago", actor: "Kerem Uslu", entityType: "device", entityId: "dv-scn-03", action: "Reassigned room", before: "Scan A", after: "Scan B" },
  { id: "au-seed-5", ts: Date.now() - 1000 * 60 * 60 * 5, timeLabel: "5 hours ago", actor: AUDIT_ACTOR, entityType: "device", entityId: "dv-tv-02", action: "Went offline", detail: "No heartbeat received" },
];

let entries: AuditEntry[] = [...SEED_AUDIT];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Whole feed (stable reference between mutations, so it's safe as a snapshot).
// Callers that want a single entity filter in their own render body.
export function useAuditFeed(): AuditEntry[] {
  return useSyncExternalStore(subscribe, () => entries);
}

export function getAuditFor(entityId: string): AuditEntry[] {
  return entries.filter((e) => e.entityId === entityId);
}

export type AuditInput = Omit<AuditEntry, "id" | "ts" | "timeLabel"> & { timeLabel?: string };

export function logAudit(input: AuditInput): void {
  const ts = Date.now();
  const entry: AuditEntry = {
    id: `au-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    ts,
    timeLabel: input.timeLabel ?? "Just now",
    ...input,
  };
  entries = [entry, ...entries];
  emit();
}
