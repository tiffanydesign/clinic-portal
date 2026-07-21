import React, { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { PendingRequest, Decision, kindBadgeClass } from "./availabilityData";

function PendingCard({ req, onWithdraw }: { req: PendingRequest; onWithdraw: () => void }) {
  const unresolvedConflicts = req.conflicts.filter((c) => !c.resolved);
  return (
    <div className="border border-warning/30 bg-surface rounded-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 text-overline rounded-control border ${kindBadgeClass(req.kind)}`}>{req.kind}</span>
        <span className="text-label text-ink-muted">{req.submittedAt}</span>
      </div>
      <p className="text-sm font-medium text-ink mb-2">{req.summary}</p>
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 text-overline rounded-control border bg-warning/10 text-warning-ink border-warning/30">Pending Approval</span>
        <button onClick={onWithdraw} className="text-xs font-bold text-ink-soft hover:underline">Withdraw</button>
      </div>
      {unresolvedConflicts.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-label font-bold text-danger-ink">
          <AlertTriangle className="w-3 h-3" /> {unresolvedConflicts.length} booking{unresolvedConflicts.length === 1 ? "" : "s"} affected
        </div>
      )}
    </div>
  );
}

function DecisionRow({ d }: { d: Decision }) {
  const pillClass = d.result === "Approved" ? "bg-success/10 text-success-ink border-success/30" : "bg-danger/10 text-danger-ink border-danger/30";
  return (
    <div className="py-2.5 border-b border-divider last:border-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`px-1.5 py-0.5 text-overline rounded-control border ${kindBadgeClass(d.kind)}`}>{d.kind}</span>
        <span className={`px-1.5 py-0.5 text-overline rounded-control border ${pillClass}`}>{d.result}</span>
      </div>
      <p className="text-xs text-ink-soft font-medium">{d.summary}</p>
      <p className="text-label text-ink-muted mt-0.5">by {d.by} · {d.at}</p>
      {d.rejectionReason && <p className="text-label text-danger-ink mt-1 italic">"{d.rejectionReason}"</p>}
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
    <div className="bg-surface border border-divider rounded-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-ink">Pending Requests</h3>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 bg-warning/15 text-warning-ink text-label font-bold rounded-full">{pending.length}</span>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-ink-muted italic mb-4">No pending requests.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {pending.map((req) => <PendingCard key={req.id} req={req} onWithdraw={() => onWithdraw(req)} />)}
        </div>
      )}

      <button onClick={() => setShowDecisions((v) => !v)} className="w-full flex items-center justify-between text-xs font-bold text-ink-muted hover:text-ink-soft pt-3 border-t border-divider">
        Recent decisions
        <ChevronDown className={`w-4 h-4 transition-transform ${showDecisions ? "rotate-180" : ""}`} />
      </button>
      {showDecisions && (
        recentDecisions.length === 0 ? (
          <p className="text-sm text-ink-muted italic mt-3">No decisions yet.</p>
        ) : (
          <div className="mt-2">{recentDecisions.map((d) => <DecisionRow key={d.id} d={d} />)}</div>
        )
      )}
    </div>
  );
}
