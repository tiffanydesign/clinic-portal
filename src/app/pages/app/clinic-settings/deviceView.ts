// The unified read model for the Devices page. Scanners + TVs come from
// devicesStore; Payment Terminals come from the untouched paymentTerminalsStore
// (so the Reception flow is unaffected). Both are projected into one DeviceView
// shape here, plus the cross-store helpers the page needs (global short-code
// uniqueness, display-status derivation, semantic status styling).
import { useMemo } from "react";
import { Device, DeviceType, DeviceStatus } from "./devicesData";
import { useDevices, getDevicesSnapshot, reassignDevice } from "./devicesStore";
import { Terminal } from "../paymentTerminalsData";
import { useTerminals, getTerminalsSnapshot, updateTerminal } from "../paymentTerminalsStore";
import { logAudit, AUDIT_ACTOR } from "./auditStore";
import { roomName } from "./roomsStore";

export type DeviceView = {
  id: string;
  source: "device" | "terminal";
  type: DeviceType;
  model: string;
  shortCode: string;
  label: string;
  roomId: string | null;
  status: DeviceStatus;
  lastSeen: string;
  notes?: string;
  addedBy?: string;
  addedOn?: string;
  retired?: boolean;
  assignedDesk?: string; // terminal only — its physical front-desk position
  terminal?: Terminal; // passthrough so the detail drawer can show Stripe state
};

function deviceToView(d: Device): DeviceView {
  return {
    id: d.id,
    source: "device",
    type: d.type,
    model: d.model,
    shortCode: d.shortCode,
    label: d.label,
    roomId: d.roomId,
    status: d.status,
    lastSeen: d.lastSeen,
    notes: d.notes,
    addedBy: d.addedBy,
    addedOn: d.addedOn,
    retired: d.retired,
  };
}

function terminalToView(t: Terminal): DeviceView {
  return {
    id: t.id,
    source: "terminal",
    type: "Payment Terminal",
    model: t.model,
    shortCode: t.shortCode,
    label: t.label,
    roomId: t.roomId ?? null,
    status: t.status,
    lastSeen: t.lastSeen,
    assignedDesk: t.assignedTo,
    terminal: t,
  };
}

// One list, scanners/TVs first then terminals, each source already in its own
// store order. Retired devices are included; the page filters them out by
// default and reveals them via the status filter.
export function useDeviceViews(): DeviceView[] {
  const devices = useDevices();
  const terminals = useTerminals();
  return useMemo(() => [...devices.map(deviceToView), ...terminals.map(terminalToView)], [devices, terminals]);
}

// Short codes share one namespace across scanners, TVs and terminals.
export function isShortCodeTaken(code: string, exceptId?: string): boolean {
  const c = code.trim().toLowerCase();
  return (
    getDevicesSnapshot().some((d) => d.id !== exceptId && d.shortCode.trim().toLowerCase() === c) ||
    getTerminalsSnapshot().some((t) => t.id !== exceptId && t.shortCode.trim().toLowerCase() === c)
  );
}

export type DeviceDisplayStatus = DeviceStatus;
export function displayStatus(v: DeviceView): DeviceDisplayStatus {
  return v.status;
}

// Fixed clinic semantic colors: green = online/active, amber = needs attention,
// gray = offline.
export const DEVICE_STATUS_META: Record<DeviceDisplayStatus, { label: string; dot: string; text: string; chip: string }> = {
  online: { label: "Online", dot: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  offline: { label: "Offline", dot: "bg-gray-400", text: "text-gray-500", chip: "bg-gray-100 border-gray-200 text-gray-500" },
  "needs-attention": { label: "Needs attention", dot: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-50 border-amber-200 text-amber-700" },
};

export function deviceIcon(type: DeviceType): "scan" | "tv" | "terminal" {
  return type === "Scan Device" ? "scan" : type === "TV" ? "tv" : "terminal";
}

// Reassign a device's room across either store, logging one audit entry.
// Devices log internally; terminals don't, so we log here for those.
export function reassignDeviceView(v: DeviceView, roomId: string | null): void {
  if (v.roomId === roomId) return;
  if (v.source === "device") {
    reassignDevice(v.id, roomId);
  } else {
    updateTerminal(v.id, { roomId });
    logAudit({
      actor: AUDIT_ACTOR,
      entityType: "device",
      entityId: v.id,
      action: "Reassigned room",
      before: v.roomId ? roomName(v.roomId) : "Unassigned",
      after: roomId ? roomName(roomId) : "Unassigned",
    });
  }
}
