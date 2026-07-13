import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  bookingLabel, leaveDateLabel, kindBadgeClass,
  BookedAppt, LeaveItem,
} from "./availabilityData";
import { useAvailabilityStore, availabilityActions } from "./availabilityStore";
import { RejectReasonModal } from "./RejectReasonModal";

// Weekly Hours and Date Override both apply instantly now (see
// availabilityStore.ts) — Leave is the only request kind that still needs a
// real Admin decision, so this queue only ever shows Leave.
const EMPLOYEE_NAME = "Dr. Claudia Reis";

function ConflictList({ conflicts, onResolve }: { conflicts: BookedAppt[]; onResolve: (index: number) => void }) {
  return (
    <div className="space-y-2 mt-3">
      {conflicts.map((c, i) => (
        <div key={i} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${c.resolved ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <span className={`text-sm font-medium ${c.resolved ? "text-emerald-700 line-through" : "text-red-700"}`}>{bookingLabel(c)}</span>
          {c.resolved ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">Resolved</span>
          ) : (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => { onResolve(i); toast.success("Appointment rescheduled (demo)."); }} className="px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-300 bg-white rounded hover:bg-slate-50">Reschedule</button>
              <button onClick={() => { onResolve(i); toast.success("Appointment cancelled (demo)."); }} className="px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-300 bg-white rounded hover:bg-red-50">Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CardShell({ submittedAt, conflicts, onResolve, onApprove, onReject, children }: {
  submittedAt: string;
  conflicts: BookedAppt[];
  onResolve: (index: number) => void;
  onApprove: () => void;
  onReject: () => void;
  children: React.ReactNode;
}) {
  const unresolved = conflicts.filter((c) => !c.resolved).length;
  const approveDisabled = unresolved > 0;

  return (
    <div className="border border-gray-300 rounded-lg bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${kindBadgeClass("Leave")}`}>Leave</span>
          <span className="text-sm font-bold text-gray-800">{EMPLOYEE_NAME}</span>
        </div>
        <span className="text-xs text-gray-400">{submittedAt}</span>
      </div>

      {children}

      {conflicts.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mt-4 mb-1 text-xs font-bold text-red-600 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" /> {conflicts.length} affected booking{conflicts.length === 1 ? "" : "s"}
          </div>
          <ConflictList conflicts={conflicts} onResolve={onResolve} />
        </>
      )}

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
        <button onClick={onReject} className="px-4 py-2 border border-red-300 bg-white text-red-600 text-sm font-bold rounded hover:bg-red-50 transition-colors">Reject</button>
        <div title={approveDisabled ? "Resolve all affected bookings before approving" : undefined}>
          <button
            onClick={onApprove}
            disabled={approveDisabled}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${approveDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export function AvailabilityApprovalPage() {
  const store = useAvailabilityStore();
  const [rejectTarget, setRejectTarget] = useState<{ id: string } | null>(null);

  const pendingLeaves = store.leaves.filter((l): l is LeaveItem & { status: "Pending" } => l.status === "Pending");

  const confirmReject = (reason: string) => {
    if (!rejectTarget) return;
    availabilityActions.decideLeave(rejectTarget.id, "Rejected", reason);
    toast.error("Request rejected. Employee notified (demo).");
    setRejectTarget(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Leave requests awaiting your decision. Weekly hours and date overrides apply instantly and never need approval.</p>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="border border-gray-300 rounded-lg bg-white p-10 text-center text-gray-400 italic">No pending requests.</div>
      ) : (
        <div className="space-y-5">
          {pendingLeaves.map((l) => (
            <CardShell
              key={l.id}
              submittedAt={l.submittedAt}
              conflicts={l.conflicts}
              onResolve={(i) => availabilityActions.resolveConflict(l.id, i)}
              onApprove={() => { availabilityActions.decideLeave(l.id, "Approved"); toast.success("Request approved. Employee notified (demo)."); }}
              onReject={() => setRejectTarget({ id: l.id })}
            >
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Dates</div><div className="text-gray-800 font-medium">{leaveDateLabel(l)}</div></div>
                <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</div><div className="text-gray-800 font-medium">{l.duration}</div></div>
                <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reason</div><div className="text-gray-800 font-medium">{l.reason === "Other" ? l.reasonOther ?? "Other" : l.reason}</div></div>
              </div>
            </CardShell>
          ))}
        </div>
      )}

      {store.decisions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recently decided</h2>
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {store.decisions.slice(0, 5).map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shrink-0 ${kindBadgeClass(d.kind)}`}>{d.kind}</span>
                  <span className="text-sm text-gray-700 truncate">{d.summary}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${d.result === "Approved" ? "text-emerald-600" : "text-red-600"}`}>{d.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectTarget && <RejectReasonModal onCancel={() => setRejectTarget(null)} onConfirm={confirmReject} />}
    </div>
  );
}
