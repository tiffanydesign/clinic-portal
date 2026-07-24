// Conflict detection for a proposed (not-yet-saved) Room Block, checked
// against the REAL shared appointment store (dashboard/appointmentsStore.ts)
// — not the tiny 2-entry demo mock staff Blocked Time uses
// (availability/availabilityData.ts's BOOKED_APPOINTMENTS), which has no
// relationship to actual room bookings.
//
// The mock appointment set only models one real day (TODAY_ISO, matching
// scheduleData.ts's ANCHOR_DATE) — a block whose date range doesn't include
// today correctly finds zero conflicts and saves immediately, the same way
// CreateModals.tsx's own date picker already treats every non-today date as
// wide open. This is expected demo behavior, not a gap to work around.
import type { Appt, ApptStatus } from "../dashboard/dashboardData";
import { TODAY_ISO } from "./roomBlocksData";

const OPEN_STATUSES: ApptStatus[] = ["Booked", "Arrived", "Checked In", "In Clinic"];

export type RoomBlockDraft = {
  startDate: string;
  endDate: string;
  allDay: boolean;
  startMin?: number;
  endMin?: number;
};

export function roomBlockConflicts(roomId: string, draft: RoomBlockDraft, appts: Appt[]): Appt[] {
  if (TODAY_ISO < draft.startDate || TODAY_ISO > draft.endDate) return [];
  const start = draft.allDay ? 0 : draft.startMin!;
  const end = draft.allDay ? 24 * 60 : draft.endMin!;
  return appts
    .filter((a) => a.room === roomId && OPEN_STATUSES.includes(a.status) && a.startMin < end && start < a.startMin + a.durationMin)
    .sort((a, b) => a.startMin - b.startMin);
}

export function roomBlockConflictLabel(a: Appt): string {
  return `${a.timeLabel} – ${a.patient.name} (${a.type})`;
}
