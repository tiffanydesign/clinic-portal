import React from "react";
import { LeaveItem, statusPillClass } from "./availabilityData";

export function LeaveRequestsSection({ leaves, locked, onNew }: { leaves: LeaveItem[]; locked: boolean; onNew: () => void }) {
  const upcoming = leaves.filter((l) => l.status === "Approved" || l.status === "Pending");

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-2">Leave requests</h3>
      <p className="text-sm text-gray-500 mb-6">Upcoming approved leave and vacation time.</p>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-6">No upcoming leave.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {upcoming.map((l) => (
            <div key={l.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{l.date}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${statusPillClass(l.status)}`}>{l.status}</span>
                </div>
                <div className="text-xs text-gray-600">{l.fullDay ? "Full day" : `${l.startTime} - ${l.endTime}`}</div>
                {l.reason && <div className="text-xs text-gray-400 mt-0.5">{l.reason}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNew}
        disabled={locked}
        title={locked ? "Withdraw your pending request before submitting new leave." : undefined}
        className={`w-full py-2.5 border rounded text-sm font-bold transition-colors ${locked ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed" : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"}`}
      >
        New Leave Request
      </button>
    </div>
  );
}
