// In-memory store for scanners and room TVs. Payment Terminals are handled by
// the separate paymentTerminalsStore; deviceView.ts merges the two for the
// unified Devices page. Every mutation writes an audit entry.
import { useSyncExternalStore } from "react";
import { Device, DeviceKind, SEED_DEVICES, makeDeviceId } from "./devicesData";
import { logAudit, AUDIT_ACTOR } from "./auditStore";
import { roomName } from "./roomsStore";

let devices: Device[] = [...SEED_DEVICES];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const roomLabel = (id: string | null) => (id ? roomName(id) : "Unassigned");

// --- reads ---
export function useDevices(): Device[] {
  return useSyncExternalStore(subscribe, () => devices);
}
export function getDevicesSnapshot(): Device[] {
  return devices;
}
export function isDeviceCodeTaken(code: string, exceptId?: string): boolean {
  const c = code.trim().toLowerCase();
  return devices.some((d) => d.id !== exceptId && d.shortCode.trim().toLowerCase() === c);
}

// --- mutations ---
export type NewDeviceInput = { type: DeviceKind; model: string; shortCode: string; label: string; roomId: string | null };

export function addDevice(input: NewDeviceInput): Device {
  const device: Device = {
    id: makeDeviceId(),
    type: input.type,
    model: input.model.trim(),
    shortCode: input.shortCode.trim(),
    label: input.label.trim() || input.shortCode.trim(),
    roomId: input.roomId,
    status: "online",
    lastSeen: "Just now",
    addedBy: AUDIT_ACTOR,
    addedOn: "Today",
  };
  devices = [device, ...devices];
  logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: device.id, action: "Added device", detail: `${device.label} · ${device.type} · assigned to ${roomLabel(device.roomId)}` });
  emit();
  return device;
}

export function updateDevice(id: string, patch: Partial<Pick<Device, "label" | "model" | "notes">>): void {
  const before = devices.find((d) => d.id === id);
  if (!before) return;
  devices = devices.map((d) => (d.id === id ? { ...d, ...patch } : d));
  const after = devices.find((d) => d.id === id)!;
  if (before.label !== after.label) logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Renamed device", before: before.label, after: after.label });
  if (before.model !== after.model) logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Changed model", before: before.model, after: after.model });
  if (before.notes !== after.notes) logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Edited notes", detail: after.notes || "Cleared notes" });
  emit();
}

export function reassignDevice(id: string, roomId: string | null): void {
  const before = devices.find((d) => d.id === id);
  if (!before || before.roomId === roomId) return;
  devices = devices.map((d) => (d.id === id ? { ...d, roomId } : d));
  logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Reassigned room", before: roomLabel(before.roomId), after: roomLabel(roomId) });
  emit();
}

// Deactivating a room orphans its devices back to Unassigned. Returns the
// labels of everything unassigned so the page can name them in the toast.
export function unassignDevicesInRoom(roomId: string): string[] {
  const affected = devices.filter((d) => d.roomId === roomId && !d.retired);
  if (affected.length === 0) return [];
  devices = devices.map((d) => (d.roomId === roomId && !d.retired ? { ...d, roomId: null } : d));
  affected.forEach((d) => logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: d.id, action: "Auto-unassigned", detail: `Room ${roomName(roomId)} was deactivated` }));
  emit();
  return affected.map((d) => d.label);
}

export function retireDevice(id: string): void {
  const d = devices.find((x) => x.id === id);
  if (!d) return;
  devices = devices.map((x) => (x.id === id ? { ...x, retired: true, status: "offline", roomId: null } : x));
  logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Retired device", detail: d.label });
  emit();
}
export function restoreDevice(id: string): void {
  const d = devices.find((x) => x.id === id);
  if (!d) return;
  devices = devices.map((x) => (x.id === id ? { ...x, retired: false } : x));
  logAudit({ actor: AUDIT_ACTOR, entityType: "device", entityId: id, action: "Restored device", detail: d.label });
  emit();
}
