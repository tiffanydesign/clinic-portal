import React from "react";
import { LeaveItem, overrideStatusPillClass, leaveDateLabel } from "./availabilityData";

export function LeaveRequestsSection({ leaves, onNew }: { leaves: LeaveItem[]; onNew: () => void }) {
  const upcoming = [...leaves].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-2">Leave</h3>
      <p className="text-sm text-gray-500 mb-6">Upcoming leave and vacation time.</p>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-6">No upcoming leave.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {upcoming.map((l) => (
            <div key={l.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{leaveDateLabel(l)}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${overrideStatusPillClass(l.status)}`}>{l.status}</span>
                </div>
                <div className="text-xs text-gray-600">{l.duration} · {l.reason === "Other" ? l.reasonOther ?? "Other" : l.reason}</div>
                {l.status === "Rejected" && l.rejectionReason && <div className="text-[11px] text-red-600 mt-1 italic">"{l.rejectionReason}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onNew} className="w-full py-2.5 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        New Leave Request
      </button>
    </div>
  );
}
