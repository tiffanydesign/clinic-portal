import React, { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { PendingRequest, Decision, kindBadgeClass } from "./availabilityData";

function PendingCard({ req, onWithdraw }: { req: PendingRequest; onWithdraw: () => void }) {
  const unresolvedConflicts = req.conflicts.filter((c) => !c.resolved);
  return (
    <div className="border border-amber-200 bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${kindBadgeClass(req.kind)}`}>{req.kind}</span>
        <span className="text-[11px] text-gray-400">{req.submittedAt}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-2">{req.summary}</p>
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-amber-50 text-amber-700 border-amber-200">Pending Approval</span>
        <button onClick={onWithdraw} className="text-xs font-bold text-slate-600 hover:underline">Withdraw</button>
      </div>
      {unresolvedConflicts.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-red-600">
          <AlertTriangle className="w-3 h-3" /> {unresolvedConflicts.length} booking{unresolvedConflicts.length === 1 ? "" : "s"} affected
        </div>
      )}
    </div>
  );
}

function DecisionRow({ d }: { d: Decision }) {
  const pillClass = d.result === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200";
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${kindBadgeClass(d.kind)}`}>{d.kind}</span>
        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${pillClass}`}>{d.result}</span>
      </div>
      <p className="text-xs text-gray-700 font-medium">{d.summary}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">by {d.by} · {d.at}</p>
      {d.rejectionReason && <p className="text-[11px] text-red-600 mt-1 italic">"{d.rejectionReason}"</p>}
    </div>
  );
}

export function PendingRequestsSection({ pending, decisions, onWithdraw }: {
  pending: PendingRequest[];
  decisions: Decision[];
  onWithdraw: (req: PendingRequest) => void;
}) {
  const [showDecisions, setShowDecisions] = useState(false);
  const recentDecisions = decisions.slice(0, 5);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-gray-800">Pending Requests</h3>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">{pending.length}</span>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-4">No pending requests.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {pending.map((req) => <PendingCard key={req.id} req={req} onWithdraw={() => onWithdraw(req)} />)}
        </div>
      )}

      <button onClick={() => setShowDecisions((v) => !v)} className="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-700 pt-3 border-t border-gray-100">
        Recent decisions
        <ChevronDown className={`w-4 h-4 transition-transform ${showDecisions ? "rotate-180" : ""}`} />
      </button>
      {showDecisions && (
        recentDecisions.length === 0 ? (
          <p className="text-sm text-gray-400 italic mt-3">No decisions yet.</p>
        ) : (
          <div className="mt-2">{recentDecisions.map((d) => <DecisionRow key={d.id} d={d} />)}</div>
        )
      )}
    </div>
  );
}
