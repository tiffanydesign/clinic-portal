import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Appt, ApptStatusTone, Patient, apptStatusTone, formsSigned } from "./dashboardData";

// Shared building blocks for the Appointment Drawer's redesigned hierarchy:
// patient identity + allergy alert, the top status-gate card, the enlarged
// journey stepper, and compact label/value rows for the lower-weight detail
// sections. Kept out of AppointmentDrawer.tsx itself so each role body there
// stays readable as pure composition of these pieces.

// Compact "label, then value right after it" row — replaces the old
// edge-to-edge justify-between layout, which stretched a short value all the
// way to the row's far edge and left a wide gap of nothing in between.
export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2.5 py-1 text-sm">
      <span className="w-[88px] shrink-0 text-ink-muted font-semibold text-xs">{label}</span>
      <span className="font-medium text-ink-soft min-w-0 truncate">{value}</span>
    </div>
  );
}

export function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 border-b border-divider">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-label font-bold text-ink-muted uppercase tracking-wider">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

// Safety information has to be the first thing anyone sees, so this renders
// via DrawerShell's `banner` slot — directly under the identity header,
// above every other section, never buried below static contact details.
export function AllergyBanner({ alert }: { alert: string }) {
  return (
    <div className="flex items-center gap-2 bg-danger/10 border-b border-danger/30 px-5 py-2.5 text-sm font-bold text-danger-ink shrink-0">
      <AlertTriangle className="w-4 h-4 shrink-0" /> Allergy: {alert}
    </div>
  );
}

// Patient identity header content: avatar, name, age/sex, then a second line
// pairing the patient ID + group tag with "View Record" — kept in the header
// itself (not a scrollable block) so it's always visible, and the deep-link
// to the full chart never disappears when static contact fields are folded
// into the collapsed Patient Details section further down.
export function PatientHeaderBody({ patient, onOpenRecord }: { patient: Patient; onOpenRecord: () => void }) {
  return (
    <div className="flex items-start gap-3 min-w-0 flex-1">
      <div className="w-11 h-11 rounded-full bg-surface-hover text-ink-soft font-bold flex items-center justify-center shrink-0 text-sm mt-0.5">
        {patient.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-ink truncate">{patient.name}</div>
        <div className="text-xs text-ink-muted">{patient.age}y · {patient.sex}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-label text-ink-muted font-semibold truncate">
            {patient.patientId}{patient.group !== "—" ? ` · ${patient.group}` : ""}
          </span>
          <button onClick={onOpenRecord} className="text-label font-bold text-ink-soft hover:underline shrink-0 ml-auto">
            View Record →
          </button>
        </div>
      </div>
    </div>
  );
}

const TONE_CLASS: Record<ApptStatusTone, string> = {
  blue: "bg-info/10 border-info/30 text-info-ink",
  amber: "bg-warning/10 border-warning/30 text-warning-ink",
  emerald: "bg-success/10 border-success/30 text-success-ink",
  orange: "bg-warning/10 border-warning/30 text-warning-ink",
  gray: "bg-surface-hover border-divider text-ink-soft",
  red: "bg-danger/10 border-danger/30 text-danger-ink",
};

function BigPill({ tone, children }: { tone: ApptStatusTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-label font-extrabold tracking-wide whitespace-nowrap ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

function GateBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-3.5 flex flex-col items-center text-center gap-1.5 min-w-0">
      <span className="text-label font-bold text-ink-muted uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

// The drawer's most prominent element: Status / Payment / Consent as
// side-by-side blocks, placed directly under the patient header — the
// operational facts that matter most at a glance ("is this person okay, or
// stuck on payment/consent?"). Payment is omitted for Nurse/Clinician, who
// don't need the money picture. Video consultations skip Payment and Consent
// entirely — there's no in-clinic consent form to sign or terminal to
// charge, so Status is the only fact that applies. Either red state (Unpaid,
// consent not cleared) puts a red border around the whole card, not just its
// own block, so an at-a-glance scan down a list of open drawers still
// catches it.
export function StatusGateCard({ appt, showPayment = true }: { appt: Appt; showPayment?: boolean }) {
  const consentOk = formsSigned(appt);
  const showPaymentBlock = showPayment && !appt.isVideo;
  const showConsentBlock = !appt.isVideo;
  const hasAlert = (showPaymentBlock && appt.payment === "Unpaid") || (showConsentBlock && !consentOk);
  const cols = 1 + (showPaymentBlock ? 1 : 0) + (showConsentBlock ? 1 : 0);

  return (
    <div className={`mx-5 mt-4 rounded-card border bg-surface shadow-sm shrink-0 ${hasAlert ? "border-danger/30" : "border-divider"}`}>
      <div className={`grid divide-x divide-divider ${cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        <GateBlock label="Status">
          <BigPill tone={apptStatusTone(appt.status)}>{appt.status.toUpperCase()}</BigPill>
        </GateBlock>

        {showPaymentBlock && (
          <GateBlock label="Payment">
            {appt.payment === "Paid" ? (
              <BigPill tone="emerald"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</BigPill>
            ) : (
              <>
                <BigPill tone="red"><AlertTriangle className="w-3.5 h-3.5" /> UNPAID</BigPill>
                <span className="text-label font-bold text-danger-ink">{appt.balance} due</span>
              </>
            )}
          </GateBlock>
        )}

        {showConsentBlock && (
          <GateBlock label="Consent">
            {consentOk ? (
              <BigPill tone="emerald"><CheckCircle2 className="w-3.5 h-3.5" /> SIGNED</BigPill>
            ) : (
              <BigPill tone="red"><AlertTriangle className="w-3.5 h-3.5" /> PENDING</BigPill>
            )}
          </GateBlock>
        )}
      </div>
    </div>
  );
}

// A real timing reference for the current journey step, built only from
// fields the Appt model actually has (check-in time, arrival + wait) — the
// model has no per-step timestamps, so this deliberately doesn't invent a
// fake "in this step for N minutes" figure it can't back with real data.
export function journeyTimingCaption(appt: Appt): string | null {
  if (appt.status === "In Clinic" && appt.checkInTime) return `Checked in at ${appt.checkInTime}`;
  if (appt.status === "Arrived" && appt.arrivedTime) {
    return appt.waitMinutes != null ? `Arrived ${appt.arrivedTime} · waiting ${appt.waitMinutes} min` : `Arrived ${appt.arrivedTime}`;
  }
  if (appt.status === "Checked In" && appt.checkInTime) return `Checked in at ${appt.checkInTime}`;
  return null;
}

// The old full-step-list dot stepper has been retired in favor of the
// unified Prev/Current/Next JourneyProgressStrip (see
// dashboard/journey/JourneyProgress.tsx) — kept out of this file so every
// journey-progress surface reads through one shared component instead of
// two independent renderers.

// The drawer's single primary call-to-action — full-width, filled. Every
// role body uses exactly one of these in its sticky footer.
export function PrimaryActionButton({ label, onClick, icon, disabled, reason }: {
  label: string; onClick: () => void; icon?: React.ReactNode; disabled?: boolean; reason?: string;
}) {
  return (
    <>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-3 font-bold text-sm rounded-card transition-colors flex items-center justify-center gap-2 ${
          disabled ? "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed" : "bg-ink text-white hover:bg-ink"
        }`}
      >
        {icon}{label}
      </button>
      {disabled && reason && <p className="text-xs text-danger-ink font-medium mt-2 text-center">{reason}</p>}
    </>
  );
}

// Compact secondary action — a small pill button rather than a full-width
// row with a trailing chevron, so 3-4 secondary actions fit on one wrapped
// line instead of stacking one-per-row and pushing the footer taller.
export function SecondaryChip({ label, onClick, icon, danger }: {
  label: string; onClick: () => void; icon?: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors flex items-center gap-1.5 ${
        danger ? "text-danger-ink border-danger/30 bg-danger/10 hover:bg-danger/15" : "text-ink-soft border-divider bg-surface hover:bg-surface-page"
      }`}
    >
      {icon}{label}
    </button>
  );
}
