import React, { useEffect, useState } from "react";
import {
  AlertTriangle, CalendarDays, Clock, FileText, ChevronRight, Check, X,
  Inbox, CheckCircle2, CalendarClock, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  bookingLabel, leaveDateLabel, kindBadgeClass,
  BookedAppt, LeaveItem, LeaveReason,
} from "./availabilityData";
import { useAvailabilityStore, availabilityActions } from "./availabilityStore";
import { RejectReasonModal } from "./RejectReasonModal";

// Weekly Hours and Date Override both apply instantly now (see
// availabilityStore.ts) — Leave is the only request kind that still needs a
// real Admin decision, so this queue only ever shows Leave. Every pending
// leave in the demo is submitted by the signed-in clinician.
const EMPLOYEE_NAME = "Dr. Ebru Reis";
const EMPLOYEE_ROLE = "Clinician";
const EMPLOYEE_INITIALS = "ER";

type PendingLeave = LeaveItem & { status: "Pending" };

const reasonText = (l: Pick<LeaveItem, "reason" | "reasonOther">) =>
  l.reason === "Other" ? l.reasonOther ?? "Other" : l.reason;

// Per-reason accent so the queue is scannable at a glance.
function reasonBadgeClass(reason: LeaveReason): string {
  switch (reason) {
    case "Annual Leave": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Sick Leave": return "bg-red-50 text-red-700 border-red-200";
    case "Conference / Training": return "bg-violet-50 text-violet-700 border-violet-200";
    case "Personal":
    case "Other":
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

const unresolvedCount = (l: LeaveItem) => l.conflicts.filter((c) => !c.resolved).length;

// --- Overview tiles ---

function OverviewTile({ icon: Icon, value, label, iconClass }: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 min-w-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-800 tabular-nums leading-none">{value}</div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

// --- Queue row ---

function QueueRow({ leave, active, onOpen }: { leave: PendingLeave; active: boolean; onOpen: () => void }) {
  const conflicts = unresolvedCount(leave);
  return (
    <button
      onClick={onOpen}
      className={`group w-full text-left flex items-center gap-4 px-4 py-3.5 transition-colors ${
        active ? "bg-slate-50" : "hover:bg-gray-50"
      }`}
    >
      <span className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {EMPLOYEE_INITIALS}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800 truncate">{EMPLOYEE_NAME}</span>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shrink-0 ${kindBadgeClass("Leave")}`}>Leave</span>
        </span>
        <span className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{leaveDateLabel(leave)} · {leave.duration}</span>
          <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border shrink-0 ${reasonBadgeClass(leave.reason)}`}>{reasonText(leave)}</span>
        </span>
      </span>
      {conflicts > 0 && (
        <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold shrink-0">
          <AlertTriangle className="w-3 h-3" /> {conflicts}
        </span>
      )}
      <span className="text-xs text-gray-400 shrink-0 tabular-nums hidden md:block">{leave.submittedAt}</span>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
    </button>
  );
}

// --- Conflict resolution list (reused inside the drawer) ---

function ConflictList({ conflicts, onResolve }: { conflicts: BookedAppt[]; onResolve: (index: number) => void }) {
  return (
    <div className="space-y-2 mt-3">
      {conflicts.map((c, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2.5 ${c.resolved ? "bg-emerald-50 border-emerald-200" : "bg-white border-red-200"}`}>
          <div className="flex items-start justify-between gap-3">
            <span className={`text-sm font-medium ${c.resolved ? "text-emerald-700 line-through" : "text-gray-700"}`}>{bookingLabel(c)}</span>
            {c.resolved && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0 mt-0.5">Resolved</span>}
          </div>
          {!c.resolved && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => { onResolve(i); toast.success("Appointment rescheduled (demo)."); }} className="px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-300 bg-white rounded hover:bg-slate-50">Reschedule</button>
              <button onClick={() => { onResolve(i); toast.success("Appointment cancelled (demo)."); }} className="px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-300 bg-white rounded hover:bg-red-50">Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Detail drawer ---

function DetailRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-gray-800 font-medium mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function LeaveDrawer({ leave, onClose, onApprove, onReject, onResolve }: {
  leave: PendingLeave;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onResolve: (index: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unresolved = unresolvedCount(leave);
  const approveDisabled = unresolved > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Leave request detail"
        className="absolute right-0 inset-y-0 w-full sm:max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${kindBadgeClass("Leave")}`}>Leave request</span>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 -mt-1 -mr-2 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="w-11 h-11 rounded-full bg-slate-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{EMPLOYEE_INITIALS}</span>
            <div className="min-w-0">
              <div className="text-base font-bold text-gray-900 truncate">{EMPLOYEE_NAME}</div>
              <div className="text-xs text-gray-500">{EMPLOYEE_ROLE}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <DetailRow icon={CalendarDays} label="Dates">{leaveDateLabel(leave)}</DetailRow>
          <DetailRow icon={Clock} label="Duration">{leave.duration}</DetailRow>
          <DetailRow icon={FileText} label="Reason">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${reasonBadgeClass(leave.reason)}`}>{reasonText(leave)}</span>
          </DetailRow>
          <DetailRow icon={CalendarClock} label="Submitted">{leave.submittedAt}</DetailRow>

          {/* Conflicts */}
          {leave.conflicts.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                {leave.conflicts.length} affected booking{leave.conflicts.length === 1 ? "" : "s"}
              </div>
              <p className="text-xs text-red-700/80 mt-1">Reschedule or cancel each booking before this request can be approved.</p>
              <ConflictList conflicts={leave.conflicts} onResolve={onResolve} />
            </div>
          )}
        </div>

        {/* Sticky footer — actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          {approveDisabled && (
            <p className="text-[11px] text-amber-600 font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Resolve {unresolved} booking{unresolved === 1 ? "" : "s"} to approve
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-300 bg-white text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={onApprove}
              disabled={approveDisabled}
              title={approveDisabled ? "Resolve all affected bookings before approving" : undefined}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                approveDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Check className="w-4 h-4" /> Approve
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AvailabilityApprovalPage() {
  const store = useAvailabilityStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string } | null>(null);

  const pendingLeaves = store.leaves.filter((l): l is PendingLeave => l.status === "Pending");

  // Selected request, re-derived from the store so conflict resolution and
  // decisions flow straight into the open drawer.
  const selected = selectedId ? pendingLeaves.find((l) => l.id === selectedId) ?? null : null;

  // Overview counts.
  const awaiting = pendingLeaves.length;
  const needsAttention = pendingLeaves.filter((l) => unresolvedCount(l) > 0).length;
  const decidedCount = store.decisions.length;

  const approve = (id: string) => {
    availabilityActions.decideLeave(id, "Approved");
    toast.success("Request approved. Employee notified (demo).");
    setSelectedId(null);
  };

  const confirmReject = (reason: string) => {
    if (!rejectTarget) return;
    availabilityActions.decideLeave(rejectTarget.id, "Rejected", reason);
    toast.error("Request rejected. Employee notified (demo).");
    setRejectTarget(null);
    setSelectedId(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      {/* L1 — Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Leave requests awaiting your decision. Weekly hours and date overrides apply instantly and never need approval.</p>
      </div>

      {/* L2 — Overview */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <OverviewTile icon={Inbox} value={awaiting} label="Awaiting decision" iconClass="bg-amber-50 text-amber-600" />
        <OverviewTile
          icon={needsAttention > 0 ? AlertTriangle : CheckCircle2}
          value={needsAttention}
          label="Needs attention"
          iconClass={needsAttention > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
        />
        <OverviewTile icon={ClipboardList} value={decidedCount} label="Decided" iconClass="bg-slate-100 text-slate-600" />
      </div>

      {/* L3 — Pending queue */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending requests</h2>
        {awaiting > 0 && <span className="text-xs font-medium text-gray-400">{awaiting} total</span>}
      </div>

      {awaiting === 0 ? (
        <div className="border border-gray-200 rounded-xl bg-white py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-gray-700">You're all caught up</div>
          <p className="text-xs text-gray-500 mt-1">No leave requests need your decision right now.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 overflow-hidden shadow-sm">
          {pendingLeaves.map((l) => (
            <QueueRow key={l.id} leave={l} active={selectedId === l.id} onOpen={() => setSelectedId(l.id)} />
          ))}
        </div>
      )}

      {/* Recently decided */}
      {store.decisions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Recently decided</h2>
          <div className="border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 overflow-hidden">
            {store.decisions.slice(0, 5).map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${d.result === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {d.result === "Approved" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shrink-0 ${kindBadgeClass(d.kind)}`}>{d.kind}</span>
                  <span className="text-sm text-gray-700 truncate">{d.summary}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${d.result === "Approved" ? "text-emerald-600" : "text-red-600"}`}>{d.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <LeaveDrawer
          leave={selected}
          onClose={() => setSelectedId(null)}
          onApprove={() => approve(selected.id)}
          onReject={() => setRejectTarget({ id: selected.id })}
          onResolve={(i) => availabilityActions.resolveConflict(selected.id, i)}
        />
      )}

      {rejectTarget && <RejectReasonModal onCancel={() => setRejectTarget(null)} onConfirm={confirmReject} />}
    </div>
  );
}
