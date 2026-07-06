import React from "react";
import { AlertTriangle } from "lucide-react";
import { PendingRequest, statusPillClass } from "./availabilityData";

export function PendingRequestCard({ request, onWithdraw }: { request: PendingRequest; onWithdraw: () => void }) {
  return (
    <div className="bg-white border border-amber-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusPillClass("Pending")}`}>
          Pending Approval
        </span>
        <span className="text-xs text-gray-400">{request.submittedAt}</span>
      </div>
      <div className="text-sm font-bold text-gray-800 mb-1">{request.type}</div>
      <p className="text-sm text-gray-600 mb-3">{request.summary}</p>

      {request.hasConflict && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">Contains booking conflicts. Waiting for administrator action.</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-4">Waiting for administrator approval.</p>

      <button onClick={onWithdraw} className="w-full py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        Withdraw Request
      </button>
    </div>
  );
}
