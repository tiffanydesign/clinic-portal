import React from "react";
import { LeaveItem, overrideStatusPillClass, leaveDateLabel } from "./availabilityData";

export function LeaveRequestsSection({ leaves, onNew }: { leaves: LeaveItem[]; onNew: () => void }) {
  const upcoming = [...leaves].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));

  return (
    <div className="bg-surface border border-divider rounded-card p-6 shadow-sm">
      <h3 className="text-base font-bold text-ink mb-2">Leave</h3>
      <p className="text-sm text-ink-muted mb-6">Upcoming leave and vacation time.</p>

      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-muted italic mb-6">No upcoming leave.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {upcoming.map((l) => (
            <div key={l.id} className="flex justify-between items-start border-b border-divider pb-4 last:border-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-ink">{leaveDateLabel(l)}</span>
                  <span className={`px-1.5 py-0.5 text-overline rounded-control border ${overrideStatusPillClass(l.status)}`}>{l.status}</span>
                </div>
                <div className="text-xs text-ink-soft">{l.duration} · {l.reason === "Other" ? l.reasonOther ?? "Other" : l.reason}</div>
                {l.status === "Rejected" && l.rejectionReason && <div className="text-label text-danger-ink mt-1 italic">"{l.rejectionReason}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onNew} className="w-full py-2.5 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-page transition-colors">
        New Leave Request
      </button>
    </div>
  );
}
