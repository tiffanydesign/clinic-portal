import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, MapPin, CheckCircle2, XCircle, Clock, Stethoscope, LogIn, Plus } from "lucide-react";
import { toast } from "sonner";
import { Appt } from "./dashboardData";
import { JourneyProgressChip } from "./journey/JourneyProgress";
import { StartTransactionModal } from "../../../components/StartTransactionModal";
import { Stat } from "../../../components/stat";
import {
  QueueGroup, GROUP_LABEL, groupQueue, primaryActionFor,
  consentOk, paymentOk, isLate, isReadOnlyInClinic,
} from "./receptionDashboardData";
import { markArrived, checkIn, recordPayment } from "./appointmentsStore";

// Video appointments never reach this queue at all (see groupFor in
// receptionDashboardData.ts) — every row here is always in-person, so there's
// no room/format branching left to do.
function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

// Small unified gate badge — one consistent pill for each of the two gates
// (payment, consent), green ✓ when cleared and red ✗ when still blocking.
// The two together read as a compact status pair, never a duplicate.
function GateBadge({ ok, label, amount }: { ok: boolean; label: string; amount?: string }) {
  const cls = ok
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-red-50 border-red-200 text-red-700";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border whitespace-nowrap ${cls}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}{!ok && amount ? ` ${amount}` : ""}
    </span>
  );
}

// Exactly one badge per gate — a cleared patient collapses to a single green
// "Ready" pill; anyone still blocked shows their payment + consent state as
// two distinct pills, never the same gate twice.
function GatesRow({ appt }: { appt: Appt }) {
  if (appt.status === "Booked") return null; // not arrived yet — nothing to gate
  const cOk = consentOk(appt);
  const pOk = paymentOk(appt);
  if (cOk && pOk) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md border bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" /> Ready to check in
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <GateBadge ok={pOk} label="Payment" amount={appt.balance} />
      <GateBadge ok={cOk} label="Consent" />
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

// One compact pill shape for every action in this column — same height,
// same rounded-full form, same soft tint treatment as the row's own gate
// badges (GateBadge, "Ready to check in" above). Only the accent color
// tells the four actions apart, so Take Payment / Sign Consent / Check In /
// Mark Arrived read as one consistent control language instead of three
// heavyweight solid buttons next to one lightweight badge.
const PILL_TONE: Record<"blue" | "amber" | "emerald" | "sky", string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200",
};

function ActionPill({ onClick, tone, icon, label }: {
  onClick: () => void; tone: keyof typeof PILL_TONE; icon?: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${PILL_TONE[tone]}`}
    >
      {icon}{label}
    </button>
  );
}

function ActionCell({ appt, onSignConsent, onTakePayment, onCheckIn, onMarkArrived }: {
  appt: Appt;
  onSignConsent: () => void;
  onTakePayment: () => void;
  onCheckIn: () => void;
  onMarkArrived: () => void;
}) {
  const action = primaryActionFor(appt);

  if (action.kind === "take-payment") {
    return <ActionPill onClick={onTakePayment} tone="blue" icon={<CreditCard className="w-3.5 h-3.5" />} label="Take Payment" />;
  }
  if (action.kind === "sign-consent") {
    return <ActionPill onClick={onSignConsent} tone="amber" label="Sign Consent" />;
  }
  if (action.kind === "check-in") {
    return <ActionPill onClick={onCheckIn} tone="emerald" label="Check In" />;
  }
  if (action.kind === "mark-arrived") {
    return <ActionPill onClick={onMarkArrived} tone="sky" icon={<LogIn className="w-3.5 h-3.5" />} label="Mark Arrived" />;
  }
  return null;
}

function QueueRow({ appt, readOnly, selected, onOpen, onMarkArrived }: {
  appt: Appt;
  readOnly?: boolean;
  selected?: boolean;
  onOpen: (id: string) => void;
  onMarkArrived: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);
  const late = isLate(appt);
  const rowRef = useRef<HTMLDivElement>(null);

  // When this row becomes the freshly-arrived selection (from Mark Arrived
  // on the Upcoming tab), scroll it into view so the front desk lands right
  // on the patient they just marked, ready for the next step.
  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    // One standardized card per row: consistent padding, rounded corners,
    // time on the left, patient + stacked details in the middle, the single
    // next-step control vertically centered on the right. A just-arrived
    // selection gets a blue ring; everything else is a plain white card.
    <div
      ref={rowRef}
      className={`rounded-xl border px-3.5 py-3 flex items-center gap-3 transition-colors animate-in fade-in duration-200 ${
        selected ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50/50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Left: time + optional LATE badge */}
      <div className="w-11 shrink-0 flex flex-col items-start gap-1 pt-0.5">
        <span className="text-sm font-bold text-gray-700 tabular-nums">{appt.timeLabel.slice(0, 5)}</span>
        {late && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200 rounded px-1 py-0.5 leading-none">
            <Clock className="w-2.5 h-2.5" /> LATE
          </span>
        )}
      </div>

      {/* Core: name + stacked details (+ gates for actionable rows) */}
      <button onClick={() => onOpen(appt.id)} className="flex-1 min-w-0 text-left">
        <div className="text-[15px] font-bold text-gray-900 leading-tight">{appt.patient.name}</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span>{typeLabel(appt)} · {appt.room}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <Stethoscope className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span>{appt.doctor}</span>
        </div>
        {readOnly ? (
          <div className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold px-2 py-1 rounded-md border bg-gray-50 border-gray-200 text-gray-500 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> In clinic ·{" "}
            <JourneyProgressChip appt={appt} />
          </div>
        ) : (
          <div className="mt-2">
            <GatesRow appt={appt} />
          </div>
        )}
      </button>

      {/* Right: single next-step control */}
      {!readOnly && (
        <ActionCell
          appt={appt}
          onSignConsent={() => navigate(`/consent-sign/${appt.id}`)}
          onTakePayment={() => setTransactionOpen(true)}
          onCheckIn={() => setConfirmCheckIn(true)}
          onMarkArrived={() => onMarkArrived(appt.id)}
        />
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

function EmptyGroup({ group, unpaidOnly }: { group: QueueGroup; unpaidOnly?: boolean }) {
  const message = unpaidOnly ? "No unpaid patients right now."
    : group === "all" ? "No one in the queue around now."
    : group === "needs-action" ? "Nothing needs action right now."
    : group === "upcoming" ? "No upcoming appointments."
    : "No one in clinic right now.";
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <span className="text-sm text-gray-400">{message}</span>
    </div>
  );
}

// A row's own status — not which tab it's being viewed through — decides
// whether it renders read-only. "All" mixes every status in one list, so
// each row carries its own answer rather than switching on the tab.
function QueueList({ group, appts, unpaidOnly, selectedId, onOpen, onMarkArrived }: {
  group: QueueGroup;
  appts: Appt[];
  unpaidOnly?: boolean;
  selectedId: string | null;
  onOpen: (id: string) => void;
  onMarkArrived: (id: string) => void;
}) {
  if (appts.length === 0) return <EmptyGroup group={group} unpaidOnly={unpaidOnly} />;
  return (
    <div className="p-3 space-y-2.5">
      {appts.map((appt) => (
        <QueueRow
          key={appt.id}
          appt={appt}
          readOnly={isReadOnlyInClinic(appt)}
          selected={appt.id === selectedId}
          onOpen={onOpen}
          onMarkArrived={onMarkArrived}
        />
      ))}
    </div>
  );
}

// Queue-group count rides in the Stat family's T4 `pill` tier — the tab
// supplies the visible label, the pill supplies the number.
function QueueTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2.5 py-1.5 text-[11px] font-bold rounded-md transition-all whitespace-nowrap text-center inline-flex items-center justify-center gap-1.5 ${active ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
    >
      {label}
      <Stat stat={{ id: `queue-${label}`, label, kind: "count", variant: "pill", value: String(count) }} />
    </button>
  );
}

// The Reception Dashboard's single work surface: every non-settled
// appointment today, exactly one row each, grouped by how much the front
// desk needs to act on it. Tab selection is controlled from the parent (the
// header Stat Strip drives it too, see ReceptionDashboardBody) so both
// controls stay in sync; `unpaidOnly` narrows the active tab down to unpaid
// rows only, the one Stat Strip filter with no matching QueueGroup of its
// own. Marking a Booked patient Arrived flips them into Needs Action — so
// the tab auto-switches there and the just-arrived row is selected (blue
// ring + scrolled into view), landing the front desk on their next step
// without hunting for the patient again.
export function FrontDeskQueue({ appts, tab, onTabChange, unpaidOnly = false, onOpen, onAdd }: {
  appts: Appt[];
  tab: QueueGroup;
  onTabChange: (g: QueueGroup) => void;
  unpaidOnly?: boolean;
  onOpen: (id: string) => void;
  onAdd?: () => void;
}) {
  const grouped = groupQueue(appts);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleMarkArrived = (id: string) => {
    markArrived(id);
    onTabChange("needs-action");
    setSelectedId(id);
  };

  const selectTab = (g: QueueGroup) => {
    onTabChange(g);
    setSelectedId(null); // a manual tab change is a fresh look, not a follow-up on a just-arrived patient
  };

  const listAppts = unpaidOnly ? grouped[tab].filter((a) => !paymentOk(a)) : grouped[tab];

  return (
    <div className="h-full border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col">
      <div className="border-b border-gray-200 shrink-0">
        <div className="h-11 px-4 flex items-center gap-2">
          <h3 className="font-bold text-gray-800 text-sm">Front Desk Queue</h3>
          {onAdd && (
            <button
              onClick={onAdd}
              title="Register patient"
              aria-label="Register patient"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-3 pb-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            {(["all", "needs-action", "upcoming", "in-clinic"] as QueueGroup[]).map((g) => (
              <QueueTab key={g} label={GROUP_LABEL[g]} count={grouped[g].length} active={tab === g} onClick={() => selectTab(g)} />
            ))}
          </div>
        </div>
      </div>

      <QueueList group={tab} appts={listAppts} unpaidOnly={unpaidOnly} selectedId={selectedId} onOpen={onOpen} onMarkArrived={handleMarkArrived} />
    </div>
  );
}
