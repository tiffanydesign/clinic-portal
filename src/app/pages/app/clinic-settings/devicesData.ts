// Model + seed data for non-terminal clinic devices (scanners and room TVs).
// Payment Terminals are NOT modelled here — they stay in the untouched
// paymentTerminalsStore and are merged into the unified DeviceView at read
// time (deviceView.ts), so the Reception Start-Transaction flow is unaffected.

export type DeviceType = "Scan Device" | "TV" | "Payment Terminal";
// devicesStore only ever holds these two; "Payment Terminal" exists on the
// unified DeviceType for the merged view + Add-device type picker.
export type DeviceKind = "Scan Device" | "TV";

export type DeviceStatus = "online" | "offline" | "needs-attention";

export type Device = {
  id: string;
  type: DeviceKind;
  model: string;
  shortCode: string;
  label: string;
  roomId: string | null; // null = Unassigned
  status: DeviceStatus;
  lastSeen: string;
  notes?: string;
  addedBy: string;
  addedOn: string;
  retired?: boolean;
};

export const DEVICE_TYPES: DeviceType[] = ["Scan Device", "TV", "Payment Terminal"];

// Short-code format hint shown under the Add-device field, per type.
export const SHORT_CODE_HINT: Record<DeviceType, string> = {
  "Scan Device": "e.g. SCN-02",
  TV: "e.g. TV-01",
  "Payment Terminal": "e.g. PT-03",
};

// 8 seed devices: 3 scanners + 5 TVs, covering online / offline /
// needs-attention, one two-device room (Scan B), and one Unassigned spare.
// Combined with the 4 seed Payment Terminals this is 12 devices, 2 of which
// need attention (dv-scn-03 here + terminal t3).
export const SEED_DEVICES: Device[] = [
  { id: "dv-scn-01", type: "Scan Device", model: "Siemens MAGNETOM Bridge", shortCode: "SCN-01", label: "MRI Console", roomId: "Scan A", status: "online", lastSeen: "Just now", addedBy: "Kerem Uslu", addedOn: "2 Jun 2026", notes: "Primary acquisition console" },
  { id: "dv-scn-02", type: "Scan Device", model: "GE Lunar iDXA", shortCode: "SCN-02", label: "DEXA Controller", roomId: "Scan B", status: "online", lastSeen: "4 min ago", addedBy: "Kerem Uslu", addedOn: "2 Jun 2026" },
  { id: "dv-scn-03", type: "Scan Device", model: "GE Vivid E95", shortCode: "SCN-03", label: "Ultrasound Cart", roomId: "Scan B", status: "needs-attention", lastSeen: "3 hours ago", addedBy: "Ayşe Hançer", addedOn: "18 Jun 2026", notes: "Firmware update pending" },
  { id: "dv-tv-01", type: "TV", model: "Samsung QM43C", shortCode: "TV-01", label: "Room 1 Display", roomId: "Room 1", status: "online", lastSeen: "Just now", addedBy: "Ayşe Hançer", addedOn: "10 Jun 2026" },
  { id: "dv-tv-02", type: "TV", model: "LG 43UR640S", shortCode: "TV-02", label: "Room 2 Display", roomId: "Room 2", status: "offline", lastSeen: "5 hours ago", addedBy: "Ayşe Hançer", addedOn: "10 Jun 2026", notes: "No heartbeat since this morning" },
  { id: "dv-tv-03", type: "TV", model: "Samsung QM43C", shortCode: "TV-03", label: "Room 3 Display", roomId: "Room 3", status: "online", lastSeen: "Just now", addedBy: "Kerem Uslu", addedOn: "26 Jun 2026" },
  { id: "dv-tv-04", type: "TV", model: "Samsung QM55C", shortCode: "TV-04", label: "Lab 1 Display", roomId: "Lab 1", status: "online", lastSeen: "Just now", addedBy: "Kerem Uslu", addedOn: "8 Jun 2026" },
  { id: "dv-tv-05", type: "TV", model: "LG 43UR640S", shortCode: "TV-05", label: "Spare Display", roomId: null, status: "offline", lastSeen: "—", addedBy: "Ayşe Hançer", addedOn: "1 Jul 2026", notes: "In storage — spare unit" },
];

export function makeDeviceId(): string {
  return `dv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}
