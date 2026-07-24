import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, MapPin, XCircle, Clock, Stethoscope, LogIn } from "lucide-react";
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
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

// Video appointments never reach this queue at all (see groupFor in
// receptionDashboardData.ts) — every row here is always in-person, so there's
// no room/format branching left to do.
function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

// A single FAILING gate only — a cleared gate is never rendered at all (see
// GatesRow below), so this no longer needs an "ok" branch. Plain text + a
// small icon, never a bordered/tinted chip: a gate is information to glance
// at, not a control to press, so it must never read as a button candidate
// next to the row's real ActionPill.
function GateBadge({ label, amount }: { label: string; amount?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-label font-bold text-danger-ink whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" /> {label}{amount ? ` ${amount}` : ""}
    </span>
  );
}

// Only the gates still blocking check-in get a badge at all — a cleared
// gate simply disappears (no third "Ready to check in" state either: once
// both clear, the row's own ActionPill already becomes "Check In", which
// already announces readiness on its own). `flex-nowrap` keeps 1-2 badges
// on a single row; `overflow-hidden` is the safety net if the rare
// both-failing case still can't fit at the narrowest column width.
function GatesRow({ appt }: { appt: Appt }) {
  if (appt.status === "Booked") return null; // not arrived yet — nothing to gate
  const failing: { key: string; label: string; amount?: string }[] = [];
  if (!paymentOk(appt)) failing.push({ key: "payment", label: "Payment", amount: appt.balance });
  if (!consentOk(appt)) failing.push({ key: "consent", label: "Consent" });
  if (failing.length === 0) return null;
  return (
    <div className="flex flex-nowrap items-center gap-3 overflow-hidden">
      {failing.map((g) => <GateBadge key={g.key} label={g.label} amount={g.amount} />)}
    </div>
  );
}

function ConfirmCheckInModal({ appt, onCancel, onConfirm }: { appt: Appt; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open
      onClose={onCancel}
      title={`Check in ${appt.patient.name}?`}
      size="confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} className="bg-success-ink hover:bg-success-ink">Check In</Button>
        </>
      }
    >
      <p className="text-body text-ink-soft leading-relaxed">This will notify the nurse.</p>
    </Modal>
  );
}

// Soft tint + border, exactly the calendar grid's own STATUS_STYLE language
// (bg-{tone}/10, border-{tone}/30, text-{tone}-ink, a resting shadow for
// depth — see apptBlockClass in dashboardData.ts) rather than an opaque
// solid fill: the row's action now reads as "the same visual family as an
// appointment block", still unmistakably distinct from GateBadge's plain
// text above (this has an edge and a fill, GateBadge has neither) without
// resorting to a heavy, saturated button colour. Semantic tone stays per
// action (payment/consent/check-in/arrived already carry distinct meaning
// elsewhere in the product's "one colour, one meaning" law).
const PILL_TONE: Record<"blue" | "amber" | "emerald" | "sky", string> = {
  blue: "bg-info/10 border-info/30 text-info-ink hover:bg-info/20",
  amber: "bg-warning/10 border-warning/30 text-warning-ink hover:bg-warning/20",
  emerald: "bg-success/10 border-success/30 text-success-ink hover:bg-success/20",
  sky: "bg-info/10 border-info/30 text-info-ink hover:bg-info/20",
};

// `fullWidth`: the row's CTA now sits on its own bottom bar (never sharing
// a line with the name/doctor/room info column — a narrow ~320-380px
// sidebar column genuinely can't fit both), so the button gets the whole
// card's width and a taller h-11 (44px) touch target instead of squeezing
// into a shrink-0 slot beside the info text.
function ActionPill({ onClick, tone, icon, label, fullWidth }: {
  onClick: () => void; tone: keyof typeof PILL_TONE; icon?: React.ReactNode; label: string; fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-4 rounded-full border text-label font-bold whitespace-nowrap shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors touch-extend ${
        fullWidth ? "w-full h-11" : "shrink-0 h-9"
      } ${PILL_TONE[tone]}`}
    >
      {icon}{label}
    </button>
  );
}

function ActionCell({ appt, onSignConsent, onTakePayment, onCheckIn, onMarkArrived, fullWidth }: {
  appt: Appt;
  onSignConsent: () => void;
  onTakePayment: () => void;
  onCheckIn: () => void;
  onMarkArrived: () => void;
  fullWidth?: boolean;
}) {
  const action = primaryActionFor(appt);

  if (action.kind === "take-payment") {
    return <ActionPill fullWidth={fullWidth} onClick={onTakePayment} tone="blue" icon={<CreditCard className="w-3.5 h-3.5" />} label="Take Payment" />;
  }
  if (action.kind === "sign-consent") {
    return <ActionPill fullWidth={fullWidth} onClick={onSignConsent} tone="amber" label="Sign Consent" />;
  }
  if (action.kind === "check-in") {
    return <ActionPill fullWidth={fullWidth} onClick={onCheckIn} tone="emerald" label="Check In" />;
  }
  if (action.kind === "mark-arrived") {
    return <ActionPill fullWidth={fullWidth} onClick={onMarkArrived} tone="sky" icon={<LogIn className="w-3.5 h-3.5" />} label="Mark Arrived" />;
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
    // Card is a vertical stack, not a 3-way horizontal split: [time + info]
    // on top, a full-width CTA bar below (when actionable). A ~320-380px
    // sidebar column can't fit a doctor name, room, AND a pill button on one
    // line without crushing the middle column into word-wrap — see the
    // truncate/min-w-0 on every detail line below, which is what actually
    // stops "Dr. Emre Yalçın" from wrapping onto 3 lines. A just-arrived
    // selection gets a blue ring; everything else is a plain white card.
    <div
      ref={rowRef}
      className={`rounded-card border px-3.5 py-3 flex flex-col gap-3 transition-colors animate-in fade-in duration-200 ${
        selected ? "border-info ring-2 ring-info bg-info/10" : "border-divider bg-surface hover:border-divider"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Left: time — late is carried by the small clock glyph alone
            (amber), not a separate LATE chip and not the time text itself,
            which stays the row's normal ink colour either way. */}
        <div className="w-11 shrink-0 flex flex-col items-start pt-0.5">
          <span className="inline-flex items-center gap-1 text-data font-bold tabular-nums text-ink-soft">
            {late && <Clock className="w-3 h-3 shrink-0 text-warning-ink" />}
            {appt.timeLabel.slice(0, 5)}
          </span>
        </div>

        {/* Core: name + stacked details (+ gates for actionable rows).
            flex-1 min-w-0 lets this column actually shrink; every line
            inside it is `min-w-0 truncate` on its own too — a flex child's
            default min-width is its content's min-content size, which for
            text is "as wide as the longest unbreakable word", not zero, so
            without this a squeezed name/doctor line word-wraps instead of
            clipping (this was the exact "Dr. / Emre / Yalçın" 3-line bug). */}
        <button onClick={() => onOpen(appt.id)} className="flex-1 min-w-0 text-left">
          <div className="text-label font-bold text-ink leading-tight truncate">{appt.patient.name}</div>
          <div className="flex items-center gap-1.5 min-w-0 text-label text-ink-muted mt-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
            <span className="min-w-0 truncate">{typeLabel(appt)} · {appt.room}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 text-label text-ink-muted mt-1">
            <Stethoscope className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
            <span className="min-w-0 truncate">{appt.doctor}</span>
          </div>
          {readOnly ? (
            <div className="inline-flex items-center gap-1.5 mt-2 max-w-full text-label font-bold px-2 py-1 rounded-control border bg-surface-page border-divider text-ink-muted whitespace-nowrap overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" /> In clinic ·{" "}
              <JourneyProgressChip appt={appt} />
            </div>
          ) : (
            <div className="mt-2">
              <GatesRow appt={appt} />
            </div>
          )}
        </button>
      </div>

      {/* Bottom: single next-step control, full width — a taller (h-11,
          44px) touch target than a shrink-0 slot beside the info column
          could ever give it. */}
      {!readOnly && (
        <ActionCell
          fullWidth
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
    <div className="flex items-center justify-center px-4 py-6">
      <span className="text-body text-ink-muted">{message}</span>
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

// Queue-group count rides in the Stat family's T4 `pill` tier, sitting to
// the right of the label on the same line — the tab supplies the visible
// label, the pill supplies the number. `min-w-0` + `truncate` on the label
// span (missing in an earlier inline version, which is what let four tabs
// force this ~320px column wider than its card) let the label itself clip
// with an ellipsis under pressure instead of the row ever overflowing.
function QueueTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 px-2 py-1.5 rounded-control transition-all flex items-center justify-center gap-1.5 ${active ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
    >
      <span className="min-w-0 truncate text-label font-bold">{label}</span>
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
export function FrontDeskQueue({ appts, tab, onTabChange, unpaidOnly = false, onOpen }: {
  appts: Appt[];
  tab: QueueGroup;
  onTabChange: (g: QueueGroup) => void;
  unpaidOnly?: boolean;
  onOpen: (id: string) => void;
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
    <div className="h-full rounded-card bg-surface flex flex-col">
      <div className="border-b border-divider shrink-0">
        <div className="h-11 px-4 flex items-center gap-2">
          <h3 className="font-bold text-ink text-section">Front Desk Queue</h3>
        </div>
        <div className="px-3 pb-3">
          <div className="flex bg-surface-hover p-0.5 rounded-card border border-divider">
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
