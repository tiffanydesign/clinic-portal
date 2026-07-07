import React, { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  describeScheduleLines, fmtSlots, bookingLabel, leaveDateLabel, kindBadgeClass,
  BookedAppt, OverrideItem, LeaveItem,
} from "./availabilityData";
import { useAvailabilityStore, availabilityActions } from "./availabilityStore";
import { RejectReasonModal } from "./RejectReasonModal";

// This prototype tracks a single mock staff member's availability (the same
// store the Clinician/Nurse "My Availability" page reads and writes), so the
// employee shown here is fixed rather than looked up per-request.
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

function CardShell({ kind, submittedAt, conflicts, onResolve, onApprove, onReject, children }: {
  kind: "Schedule Change" | "Date Override" | "Leave";
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
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${kindBadgeClass(kind)}`}>{kind}</span>
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

function BeforeAfter({ before, after }: { before: React.ReactNode; after: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Before</div>
        {before}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">After</div>
        {after}
      </div>
    </div>
  );
}

export function AvailabilityApprovalPage() {
  const store = useAvailabilityStore();
  const [rejectTarget, setRejectTarget] = useState<{ kind: "schedule" | "override" | "leave"; id?: string } | null>(null);

  const hasAny = store.scheduleRequest !== null || store.overrides.some((o) => o.status === "Pending") || store.leaves.some((l) => l.status === "Pending");

  const confirmReject = (reason: string) => {
    if (!rejectTarget) return;
    if (rejectTarget.kind === "schedule") availabilityActions.decideScheduleChange("Rejected", reason);
    if (rejectTarget.kind === "override") availabilityActions.decideOverride(rejectTarget.id!, "Rejected", reason);
    if (rejectTarget.kind === "leave") availabilityActions.decideLeave(rejectTarget.id!, "Rejected", reason);
    toast.error("Request rejected. Employee notified (demo).");
    setRejectTarget(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Availability change requests awaiting your decision.</p>
      </div>

      {!hasAny ? (
        <div className="border border-gray-300 rounded-lg bg-white p-10 text-center text-gray-400 italic">No pending requests.</div>
      ) : (
        <div className="space-y-5">
          {store.scheduleRequest && (
            <CardShell
              kind="Schedule Change"
              submittedAt={store.scheduleRequest.submittedAt}
              conflicts={store.scheduleRequest.conflicts}
              onResolve={(i) => availabilityActions.resolveConflict("schedule", store.scheduleRequest!.id, i)}
              onApprove={() => { availabilityActions.decideScheduleChange("Approved"); toast.success("Request approved. Employee notified (demo)."); }}
              onReject={() => setRejectTarget({ kind: "schedule" })}
            >
              <BeforeAfter
                before={<div className="space-y-0.5">{describeScheduleLines(store.savedSchedule).map((l) => <div key={l.day} className="text-xs text-gray-600"><span className="font-bold text-gray-700">{l.day}</span> {l.text}</div>)}</div>}
                after={<div className="space-y-0.5">{describeScheduleLines(store.scheduleRequest.draftSchedule).map((l) => <div key={l.day} className="text-xs text-gray-700"><span className="font-bold text-blue-700">{l.day}</span> {l.text}</div>)}</div>}
              />
              {store.scheduleRequest.draftTimezone !== store.savedTimezone && (
                <p className="text-xs text-gray-500 mt-2">Timezone: {store.savedTimezone} <ArrowRight className="w-3 h-3 inline mx-1" /> {store.scheduleRequest.draftTimezone}</p>
              )}
            </CardShell>
          )}

          {store.overrides.filter((o): o is OverrideItem & { status: "Pending" } => o.status === "Pending").map((o) => {
            const template = store.savedSchedule[o.dayOfWeek];
            return (
              <CardShell
                key={o.id}
                kind="Date Override"
                submittedAt={o.submittedAt ?? "Just now"}
                conflicts={o.conflicts ?? []}
                onResolve={(i) => availabilityActions.resolveConflict("override", o.id, i)}
                onApprove={() => { availabilityActions.decideOverride(o.id, "Approved"); toast.success("Request approved. Employee notified (demo)."); }}
                onReject={() => setRejectTarget({ kind: "override", id: o.id })}
              >
                <p className="text-sm font-bold text-gray-800 mb-2">{o.date} <span className="text-gray-400 font-normal">({o.dayOfWeek})</span></p>
                <BeforeAfter
                  before={<div className="text-xs text-gray-600">{template.active ? fmtSlots(template.slots) : "Unavailable"}</div>}
                  after={<div className="text-xs text-gray-700">{o.pendingAction === "delete" ? "Remove override (revert to template)" : fmtSlots(o.slots)}</div>}
                />
              </CardShell>
            );
          })}

          {store.leaves.filter((l): l is LeaveItem & { status: "Pending" } => l.status === "Pending").map((l) => (
            <CardShell
              key={l.id}
              kind="Leave"
              submittedAt={l.submittedAt}
              conflicts={l.conflicts}
              onResolve={(i) => availabilityActions.resolveConflict("leave", l.id, i)}
              onApprove={() => { availabilityActions.decideLeave(l.id, "Approved"); toast.success("Request approved. Employee notified (demo)."); }}
              onReject={() => setRejectTarget({ kind: "leave", id: l.id })}
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
