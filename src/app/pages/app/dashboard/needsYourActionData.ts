// Merges the two request kinds that genuinely still need an Admin decision
// — Leave (from availabilityStore) and Refund (from billingData) — into one
// sorted, wait-time-aware list for the Dashboard's Needs Your Action card.
// Both counts must exactly match Approval Center / Billing's own counts, so
// this reads their live/shared data rather than duplicating it.

import { PendingRequest } from "../availability/availabilityData";
import { BillingRecord, refundPendingRecords } from "../billingData";

export type ActionItemKind = "Leave" | "Refund";

export type ActionItem = {
  id: string;
  kind: ActionItemKind;
  summary: string;
  waitHours: number;
  waitLabel: string;
  route: string;
};

function parseWaitHours(submittedAt: string): number {
  const m = submittedAt.match(/(\d+)\s*(h|d)/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return m[2].toLowerCase() === "d" ? n * 24 : n;
}

function waitLabel(hours: number): string {
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h waiting`;
  return `${Math.floor(hours / 24)}d waiting`;
}

export function leaveActionItems(pending: PendingRequest[]): ActionItem[] {
  return pending
    .filter((p) => p.kind === "Leave")
    .map((p) => {
      const waitHours = parseWaitHours(p.submittedAt);
      return {
        id: `leave-${p.id}`,
        kind: "Leave" as const,
        summary: `Dr. Ebru Reis — ${p.summary}`,
        waitHours,
        waitLabel: waitLabel(waitHours),
        route: "/approval",
      };
    });
}

export function refundActionItems(records: BillingRecord[] = refundPendingRecords()): ActionItem[] {
  return records.map((r) => {
    const waitHours = r.refundWaitHours ?? 0;
    return {
      id: `refund-${r.id}`,
      kind: "Refund" as const,
      summary: `${r.patientName} — ₺${r.totalAmount.toLocaleString()} refund`,
      waitHours,
      waitLabel: waitLabel(waitHours),
      route: "/billing",
    };
  });
}

export function needsYourActionItems(pending: PendingRequest[]): ActionItem[] {
  return [...leaveActionItems(pending), ...refundActionItems()].sort((a, b) => b.waitHours - a.waitHours);
}
