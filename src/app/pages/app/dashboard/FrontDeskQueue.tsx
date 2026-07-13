import React, { useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, MapPin, CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Appt, JOURNEY_STEPS_RECEPTION } from "./dashboardData";
import { StartTransactionModal } from "../../../components/StartTransactionModal";
import {
  QueueGroup, GROUP_LABEL, groupQueue, primaryActionFor,
  consentOk, paymentOk, isLate, ChipId,
} from "./receptionDashboardData";
import { markArrived, checkIn, recordPayment } from "./appointmentsStore";

// Video appointments never reach this queue at all (see groupFor in
// receptionDashboardData.ts) — every row here is always in-person, so there's
// no room/format branching left to do.
function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}
function journeyStepLabel(a: Appt): string | null {
  return JOURNEY_STEPS_RECEPTION[a.currentStep] ?? null;
}

const FILTER_LABEL: Record<ChipId, string> = {
  "in-clinic": "In Clinic",
  unpaid: "Unpaid",
};

// Each gate always renders — done (green check) or not (red X) — so a
// patient with one gate cleared shows a clear green/red pair rather than a
// single red chip that leaves the cleared gate unstated. Uses the same
// CheckCircle2/XCircle icon pair as the combined badge below, never the
// unicode ✗ glyph (renders slanted in some fonts).
function GateChip({ ok, label, amount }: { ok: boolean; label: string; amount?: string }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded border bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap min-h-[32px]">
        <CheckCircle2 className="w-3.5 h-3.5" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded border bg-red-50 border-red-200 text-red-700 whitespace-nowrap min-h-[32px]">
      <XCircle className="w-3.5 h-3.5" /> {label}{amount ? ` ${amount}` : ""}
    </span>
  );
}

function GatesCell({ appt }: { appt: Appt }) {
  if (appt.status === "Booked") return null; // not arrived yet — nothing to gate
  const cOk = consentOk(appt);
  const pOk = paymentOk(appt);
  if (cOk && pOk) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1.5 rounded border bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" /> Consent &amp; payment complete
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <GateChip ok={pOk} label="Payment" amount={pOk ? undefined : appt.balance} />
      <GateChip ok={cOk} label="Consent" />
    </div>
  );
}

function ConfirmCheckInModal({ appt, onCancel, onConfirm }: { appt: Appt; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Check in {appt.patient.name}?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">This will notify the nurse.</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
            Check In
          </button>
        </div>
      </div>
    </div>
  );
}

// Fixed width across all four variants so the action column reads as one
// consistent control regardless of label length — no button visibly bigger
// or smaller than its neighbors. Red is reserved for the gate chips above;
// Take Payment gets its own blue so neither action button competes with
// that "still blocked" signal.
function ActionCell({ appt, onSignConsent, onTakePayment, onCheckIn }: {
  appt: Appt;
  onSignConsent: () => void;
  onTakePayment: () => void;
  onCheckIn: () => void;
}) {
  const action = primaryActionFor(appt);
  const base = "w-[148px] justify-center px-3.5 py-2 text-[12px] font-bold rounded shrink-0 min-h-[44px] flex items-center gap-1.5 transition-colors";

  if (action.kind === "take-payment") {
    return <button onClick={onTakePayment} className={`${base} bg-blue-600 text-white hover:bg-blue-700`}><CreditCard className="w-3.5 h-3.5" /> Take Payment</button>;
  }
  if (action.kind === "sign-consent") {
    return <button onClick={onSignConsent} className={`${base} bg-amber-500 text-white hover:bg-amber-600`}>Sign Consent</button>;
  }
  if (action.kind === "check-in") {
    return <button onClick={onCheckIn} className={`${base} bg-emerald-600 text-white hover:bg-emerald-700`}>Check In</button>;
  }
  if (action.kind === "mark-arrived") {
    return <button onClick={() => markArrived(appt.id)} className={`${base} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Mark Arrived</button>;
  }
  return null;
}

function QueueRow({ appt, readOnly, onOpen }: {
  appt: Appt;
  readOnly?: boolean;
  onOpen: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);
  const step = journeyStepLabel(appt);
  const late = isLate(appt);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 min-h-[56px] transition-colors hover:bg-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="w-11 shrink-0">
        <div className="text-xs font-bold text-gray-500 tabular-nums">{appt.timeLabel.slice(0, 5)}</div>
        {late && <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">Late</div>}
      </div>

      <button onClick={() => onOpen(appt.id)} className="min-w-0 flex-1 text-left">
        <div className="text-base font-semibold text-gray-900 truncate">{appt.patient.name}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {typeLabel(appt)} · {appt.doctor} · {appt.room}
        </div>
      </button>

      {readOnly ? (
        <span className="text-xs text-gray-400 shrink-0">With {appt.doctor}{step ? ` · ${step}` : ""}</span>
      ) : (
        <>
          <GatesCell appt={appt} />

          <ActionCell
            appt={appt}
            onSignConsent={() => navigate(`/consent-sign/${appt.id}`)}
            onTakePayment={() => setTransactionOpen(true)}
            onCheckIn={() => setConfirmCheckIn(true)}
          />
        </>
      )}

      {transactionOpen && (
        <StartTransactionModal
          patient={appt.patient.name}
          service={typeLabel(appt)}
          amountDue={appt.balance}
          onClose={() => setTransactionOpen(false)}
          onComplete={() => {
            setTransactionOpen(false);
            recordPayment(appt.id);
            toast.success(`Payment collected for ${appt.patient.name}.`);
          }}
        />
      )}

      {confirmCheckIn && (
        <ConfirmCheckInModal
          appt={appt}
          onCancel={() => setConfirmCheckIn(false)}
          onConfirm={() => {
            checkIn(appt.id);
            toast.success(`${appt.patient.name} checked in. Nurse notified.`);
            setConfirmCheckIn(false);
          }}
        />
      )}
    </div>
  );
}

function InlineEmptyRow({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 min-h-[48px]">
      <span className="text-sm text-gray-400">No patients.</span>
      <button onClick={onClear} className="text-xs font-bold text-slate-600 hover:underline">Clear filter</button>
    </div>
  );
}

function GroupSection({ group, appts, collapsed, onToggleCollapse, onOpen }: {
  group: QueueGroup;
  appts: Appt[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpen: (id: string) => void;
}) {
  if (appts.length === 0) return null;
  const collapsible = group === "in-clinic";
  // "Needs Action" carries a deliberate amber left-edge — the one reserved
  // use of a side accent in this system, marking the single highest-triage
  // group the front desk should see first, not decoration.
  const edgeClass = group === "needs-action" ? "border-l-[3px] border-amber-400" : "";

  return (
    <div>
      <button
        onClick={collapsible ? onToggleCollapse : undefined}
        className={`w-full sticky top-0 z-10 bg-white/95 backdrop-blur-[2px] px-4 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider ${collapsible ? "cursor-pointer hover:text-gray-600" : ""}`}
      >
        <span>{GROUP_LABEL[group]} ({appts.length})</span>
        {collapsible && (collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />)}
      </button>
      {!(collapsible && collapsed) && (
        <div className="divide-y divide-gray-100">
          {appts.map((appt) => (
            <div key={appt.id} className={edgeClass}>
              <QueueRow appt={appt} readOnly={group === "in-clinic"} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// The Reception Dashboard's single work surface: every non-settled
// appointment today, exactly one row each, grouped by how much the front
// desk needs to act on it. Merges what used to be two competing lists
// (AwaitingCheckInCard + the old Front Desk Queue) into one — a patient
// only ever appears once, with one obvious next action. No Check Out
// anywhere: that's the nurse's own step (see journeyEngine.ts).
export function FrontDeskQueue({ appts, activeFilter, onClearFilter, onOpen }: {
  appts: Appt[];
  activeFilter: ChipId | null;
  onClearFilter: () => void;
  onOpen: (id: string) => void;
}) {
  const [inClinicCollapsed, setInClinicCollapsed] = useState(true);
  const grouped = groupQueue(appts);
  const totalRows = grouped["needs-action"].length + grouped["ready-upcoming"].length + grouped["in-clinic"].length;

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm h-full flex flex-col overflow-hidden">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">Front Desk Queue</h3>
        {activeFilter && (
          <button onClick={onClearFilter} className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors">
            Filtered · {FILTER_LABEL[activeFilter]} <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {totalRows === 0 ? (
          <InlineEmptyRow onClear={onClearFilter} />
        ) : (
          <div className="pb-2">
            <GroupSection group="needs-action" appts={grouped["needs-action"]} onOpen={onOpen} />
            <GroupSection group="ready-upcoming" appts={grouped["ready-upcoming"]} onOpen={onOpen} />
            <GroupSection
              group="in-clinic"
              appts={grouped["in-clinic"]}
              collapsed={inClinicCollapsed}
              onToggleCollapse={() => setInClinicCollapsed((v) => !v)}
              onOpen={onOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
