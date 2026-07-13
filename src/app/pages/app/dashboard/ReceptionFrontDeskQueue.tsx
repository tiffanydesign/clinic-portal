import React, { useState } from "react";
import { CreditCard, Send, Video, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Appt, statusPillType } from "./dashboardData";
import { StatusPill } from "./DashboardShared";
import { StartTransactionModal } from "../../../components/StartTransactionModal";
import { sortQueue, primaryActionFor, consentOk, paymentOk, readyForCheckout, CounterFilter } from "./receptionDashboardData";

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

const FILTER_LABEL: Record<CounterFilter, string> = {
  awaiting: "Awaiting Action",
  ready: "Ready to Check In",
  "in-clinic": "In Clinic",
  unpaid: "Unpaid Today",
};

function GateChip({ ok, label, onClick }: { ok: boolean; label: string; onClick?: () => void }) {
  const pill = (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {label} {ok ? "✓" : "✗"}
    </span>
  );
  if (ok || !onClick) return pill;
  return (
    <button onClick={onClick} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
      {pill}
    </button>
  );
}

function TakePaymentPopover({ onStartTransaction, onSendLink, onClose }: {
  onStartTransaction: () => void;
  onSendLink: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-56">
        <button onClick={onStartTransaction} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-500 shrink-0" /> Start Transaction
        </button>
        <button onClick={onSendLink} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Send className="w-4 h-4 text-slate-500 shrink-0" /> Send Payment Link
        </button>
      </div>
    </>
  );
}

function QueueRow({ appt, onOpen, onMarkArrived, onCheckIn, onStartTransaction }: {
  appt: Appt;
  onOpen: (id: string) => void;
  onMarkArrived: (id: string) => void;
  onCheckIn: (id: string) => void;
  onStartTransaction: (appt: Appt) => void;
}) {
  const [paymentPopoverOpen, setPaymentPopoverOpen] = useState(false);
  const action = primaryActionFor(appt);
  const settled = appt.status === "Completed" || appt.status === "Cancelled" || appt.status === "No Show";

  const sendForm = () => toast.success(`${action.kind === "send-form" ? action.label : "Form"} sent to ${appt.patient.name}.`);

  let actionButton: React.ReactNode = null;
  if (action.kind === "take-payment") {
    actionButton = (
      <button onClick={() => setPaymentPopoverOpen(true)} className="px-3 py-1.5 text-[11px] font-bold rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 shrink-0">
        <CreditCard className="w-3.5 h-3.5" /> Take Payment
      </button>
    );
  } else if (action.kind === "send-form") {
    actionButton = (
      <button onClick={sendForm} className="px-3 py-1.5 text-[11px] font-bold rounded bg-amber-500 text-white hover:bg-amber-600 shrink-0">
        {action.label}
      </button>
    );
  } else if (action.kind === "check-in") {
    actionButton = (
      <button onClick={() => onCheckIn(appt.id)} className="px-3 py-1.5 text-[11px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 shrink-0">
        Check In
      </button>
    );
  } else if (action.kind === "mark-arrived") {
    actionButton = (
      <button onClick={() => onMarkArrived(appt.id)} className="px-3 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shrink-0">
        Mark Arrived
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${settled ? "opacity-60" : "hover:bg-gray-50"}`}>
      <span className="text-xs font-bold text-gray-500 w-11 shrink-0 tabular-nums">{appt.timeLabel.slice(0, 5)}</span>
      <button onClick={() => onOpen(appt.id)} className="min-w-0 flex-1 text-left">
        <div className={`text-sm font-bold text-gray-800 truncate ${appt.status === "Completed" ? "line-through" : ""}`}>{appt.patient.name}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
          {appt.isVideo ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
          {typeLabel(appt)}
        </div>
      </button>
      <div className="shrink-0 text-right">
        <StatusPill status={appt.status} type={statusPillType(appt.status)} />
        {readyForCheckout(appt) && (
          <div className="text-[10px] font-medium text-gray-400 mt-1 whitespace-nowrap">Awaiting nurse checkout</div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <GateChip ok={consentOk(appt)} label="Consent" onClick={consentOk(appt) ? undefined : sendForm} />
        <GateChip ok={paymentOk(appt)} label="Payment" onClick={paymentOk(appt) ? undefined : () => setPaymentPopoverOpen(true)} />
      </div>
      <div className="relative shrink-0">
        {actionButton}
        {paymentPopoverOpen && (
          <TakePaymentPopover
            onStartTransaction={() => { setPaymentPopoverOpen(false); onStartTransaction(appt); }}
            onSendLink={() => { setPaymentPopoverOpen(false); toast.success("Payment link sent."); }}
            onClose={() => setPaymentPopoverOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// The Reception Dashboard's single Front Desk Queue: every appointment today,
// exactly one row each, sorted by how much the front desk needs to act on it
// — not a set of role-sliced cards a person has to cross-reference by hand.
export function ReceptionFrontDeskQueue({ appts, activeFilter, onClearFilter, onOpen, onMarkArrived, onCheckIn }: {
  appts: Appt[];
  activeFilter: CounterFilter | null;
  onClearFilter: () => void;
  onOpen: (id: string) => void;
  onMarkArrived: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const [transactionAppt, setTransactionAppt] = useState<Appt | null>(null);
  const sorted = sortQueue(appts);

  return (
    <div className="border border-gray-300 rounded-xl bg-white shadow-sm">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">Front Desk Queue</h3>
        {activeFilter && (
          <button onClick={onClearFilter} className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors">
            Filtered · {FILTER_LABEL[activeFilter]} <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          No patients match this filter.{" "}
          <button onClick={onClearFilter} className="font-bold text-slate-600 hover:underline">Clear filter</button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((appt) => (
            <QueueRow
              key={appt.id}
              appt={appt}
              onOpen={onOpen}
              onMarkArrived={onMarkArrived}
              onCheckIn={onCheckIn}
              onStartTransaction={setTransactionAppt}
            />
          ))}
        </div>
      )}

      {transactionAppt && (
        <StartTransactionModal
          patient={transactionAppt.patient.name}
          service={typeLabel(transactionAppt)}
          amountDue={transactionAppt.balance}
          onClose={() => setTransactionAppt(null)}
          onComplete={() => { setTransactionAppt(null); toast.success(`Payment collected for ${transactionAppt.patient.name}.`); }}
        />
      )}
    </div>
  );
}
