// Shared notifications feed. Static entries are hand-authored per the same
// event categories already promised on the Profile page's Notification
// Preferences table (Appointment updates / Result updates / Approval
// requests) — role-tagged there, and role-tagged here the same way, so a
// role only ever sees the kinds their own preferences page says they get.
// Availability-workflow entries (pending requests needing Admin's decision,
// decisions on a Clinician's own submitted requests) are synthesized live
// from availabilityStore.ts rather than duplicated as static mock, so this
// page can never drift out of sync with My Availability / Approval.

import type { Role } from "../../context/AppContext";
import { PendingRequest, Decision } from "./availability/availabilityData";
import type { ScheduleChangeLogItem } from "./availability/availabilityStore";

export type NotificationKind = "appointment" | "result" | "approval" | "payment" | "system";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  text: string;
  time: string;
  roles: Role[];
  actionRoute?: string;
};

export const KIND_LABEL: Record<NotificationKind, string> = {
  appointment: "Appointments",
  result: "Results",
  approval: "Approval",
  payment: "Payments",
  system: "System",
};

// Hand-authored, static — everything that isn't derived from a live store.
export const STATIC_NOTIFICATIONS: NotificationItem[] = [
  { id: "N-01", kind: "appointment", text: "Appointment cancelled: Amara Chen, 10:30 Body Scan (by Deniz Arslan)", time: "08:52", roles: ["Admin", "Reception", "Clinician", "Nurse"], actionRoute: "/calendar/schedule" },
  { id: "N-02", kind: "appointment", text: "Appointment rescheduled: Bob Bromelain, 3 Jul → 8 Jul", time: "08:30", roles: ["Admin", "Reception", "Clinician", "Nurse"], actionRoute: "/calendar/schedule" },
  { id: "N-03", kind: "appointment", text: "Noah Kimura marked as No Show for 08:00 appointment (auto-flagged)", time: "08:22", roles: ["Admin", "Reception"], actionRoute: "/calendar/schedule" },
  { id: "N-04", kind: "result", text: "New Genetic Panel result ready for review: Arysse Arcerola", time: "07:40", roles: ["Admin", "Clinician"], actionRoute: "/patients/P-001/results" },
  { id: "N-05", kind: "result", text: "Dr. Claudia signed off Blood Panel report for Arysse Arcerola", time: "08:58", roles: ["Admin", "Nurse"], actionRoute: "/patients/P-001/results" },
  { id: "N-06", kind: "result", text: "Metabolic Panel overdue 5 days: Arysse Arcerola", time: "Yesterday", roles: ["Admin", "Clinician"], actionRoute: "/patients/P-001/results" },
  { id: "N-07", kind: "payment", text: "Payment of ₺4,800 received from Penny Pelargonium (Card)", time: "09:05", roles: ["Admin", "Reception"], actionRoute: "/billing" },
  { id: "N-08", kind: "payment", text: "Refund of ₺1,200 issued to Dylan Daniel (by Ayşe Hançer)", time: "08:05", roles: ["Admin", "Reception"], actionRoute: "/billing" },
  { id: "N-09", kind: "system", text: "Automated reminders sent to 6 patients for today's appointments", time: "08:18", roles: ["Admin", "Reception"] },
  { id: "N-10", kind: "system", text: "New patient registered: Noah Nac (by Elif Yıldız)", time: "08:45", roles: ["Admin", "Reception"] },
];

export function staticNotificationsForRole(role: Role): NotificationItem[] {
  return STATIC_NOTIFICATIONS.filter((n) => n.roles.includes(role));
}

// --- Availability-workflow entries, derived from the live store ---

// Admin: one entry per request still awaiting their own decision.
export function pendingRequestNotifications(pending: PendingRequest[]): NotificationItem[] {
  return pending.map((p) => ({
    id: `avail-pending-${p.id}`,
    kind: "approval",
    text: `Dr. Claudia Reis submitted a ${p.kind} request: ${p.summary}`,
    time: p.submittedAt,
    roles: ["Admin"],
    actionRoute: "/approval",
  }));
}

// Clinician: one entry per decision made on something they submitted.
export function decisionNotifications(decisions: Decision[]): NotificationItem[] {
  return decisions.map((d) => ({
    id: `avail-decision-${d.id}`,
    kind: "approval",
    text: `Your ${d.kind} request was ${d.result.toLowerCase()}${d.rejectionReason ? ` — "${d.rejectionReason}"` : ""}: ${d.summary}`,
    time: d.at,
    roles: ["Clinician"],
    actionRoute: "/approval",
  }));
}

// Admin: read-only trail of Weekly Hours changes that already took effect
// (no approval involved — see availabilityStore's directSaveSchedule).
// Deliberately kind "system", not "approval": there is nothing to decide,
// only to be aware of. Never appears in the Needs Your Action card.
export function scheduleChangeNotifications(log: ScheduleChangeLogItem[]): NotificationItem[] {
  return log.map((entry) => ({
    id: `avail-schedule-${entry.id}`,
    kind: "system",
    text: `Dr. Claudia Reis updated their weekly hours: ${entry.summary}`,
    time: entry.at,
    roles: ["Admin"],
    actionRoute: "/calendar/team-availability",
  }));
}
