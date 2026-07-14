import React from "react";
import { AlertTriangle, Check, CheckCircle2 } from "lucide-react";
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
      <span className="w-[88px] shrink-0 text-gray-400 font-semibold text-xs">{label}</span>
      <span className="font-medium text-gray-700 min-w-0 truncate">{value}</span>
    </div>
  );
}

export function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
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
    <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 shrink-0">
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
      <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-sm mt-0.5">
        {patient.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-800 truncate">{patient.name}</div>
        <div className="text-xs text-gray-500">{patient.age}y · {patient.sex}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-gray-400 font-semibold truncate">
            {patient.patientId}{patient.group !== "—" ? ` · ${patient.group}` : ""}
          </span>
          <button onClick={onOpenRecord} className="text-[11px] font-bold text-slate-600 hover:underline shrink-0 ml-auto">
            View Record →
          </button>
        </div>
      </div>
    </div>
  );
}

const TONE_CLASS: Record<ApptStatusTone, string> = {
  blue: "bg-blue-50 border-blue-300 text-blue-800",
  amber: "bg-amber-50 border-amber-300 text-amber-800",
  emerald: "bg-emerald-50 border-emerald-300 text-emerald-800",
  orange: "bg-orange-50 border-orange-300 text-orange-800",
  gray: "bg-gray-100 border-gray-300 text-gray-600",
  red: "bg-red-50 border-red-300 text-red-700",
};

function BigPill({ tone, children }: { tone: ApptStatusTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-extrabold tracking-wide whitespace-nowrap ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

function GateBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-3.5 flex flex-col items-center text-center gap-1.5 min-w-0">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

// The drawer's most prominent element: Status / Payment / Consent as three
// side-by-side blocks, placed directly under the patient header — the three
// operational facts that matter most at a glance ("is this person okay, or
// stuck on payment/consent?"). Payment is omitted for Nurse/Clinician, who
// don't need the money picture. Either red state (Unpaid, consent not
// cleared) puts a red border around the whole card, not just its own block,
// so an at-a-glance scan down a list of open drawers still catches it.
export function StatusGateCard({ appt, showPayment = true }: { appt: Appt; showPayment?: boolean }) {
  const consentOk = formsSigned(appt);
  const hasAlert = (showPayment && appt.payment === "Unpaid") || !consentOk;

  return (
    <div className={`mx-5 mt-4 rounded-xl border bg-white shadow-sm shrink-0 ${hasAlert ? "border-red-300" : "border-gray-200"}`}>
      <div className={`grid divide-x divide-gray-100 ${showPayment ? "grid-cols-3" : "grid-cols-2"}`}>
        <GateBlock label="Status">
          <BigPill tone={apptStatusTone(appt.status)}>{appt.status.toUpperCase()}</BigPill>
        </GateBlock>

        {showPayment && (
          <GateBlock label="Payment">
            {appt.payment === "Paid" ? (
              <BigPill tone="emerald"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</BigPill>
            ) : (
              <>
                <BigPill tone="red"><AlertTriangle className="w-3.5 h-3.5" /> UNPAID</BigPill>
                <span className="text-[11px] font-bold text-red-600">{appt.balance} due</span>
              </>
            )}
          </GateBlock>
        )}

        <GateBlock label="Consent">
          {consentOk ? (
            <BigPill tone="emerald"><CheckCircle2 className="w-3.5 h-3.5" /> SIGNED</BigPill>
          ) : (
            <BigPill tone="red"><AlertTriangle className="w-3.5 h-3.5" /> PENDING</BigPill>
          )}
        </GateBlock>
      </div>
    </div>
  );
}

// A real timing reference for the current journey step, built only from
// fields the Appt model actually has (check-in time, arrival + wait) — the
// model has no per-step timestamps, so this deliberately doesn't invent a
// fake "in this step for N minutes" figure it can't back with real data.
function journeyTimingCaption(appt: Appt): string | null {
  if (appt.status === "In Clinic" && appt.checkInTime) return `Checked in at ${appt.checkInTime}`;
  if (appt.status === "Arrived" && appt.arrivedTime) {
    return appt.waitMinutes != null ? `Arrived ${appt.arrivedTime} · waiting ${appt.waitMinutes} min` : `Arrived ${appt.arrivedTime}`;
  }
  if (appt.status === "Checked In" && appt.checkInTime) return `Checked in at ${appt.checkInTime}`;
  return null;
}

// Enlarged journey stepper: bigger circles, readable (not tiny-uppercase)
// labels, a solid checkmark for completed steps, and a pulsing ring on the
// current one — the same current-step "ping" language already used by the
// Nurse dashboard's own Patient Journey card (PatientJourneyCard.tsx),
// just reapplied to a horizontal row so the two surfaces read as the same
// visual system.
export function JourneyStepperLarge({ appt, steps, current }: { appt: Appt; steps: string[]; current: number }) {
  const caption = journeyTimingCaption(appt);
  return (
    <div>
      <div className="relative pt-1">
        <div className="absolute top-[18px] left-4 right-4 h-0.5 bg-gray-200" />
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const done = i < current;
            const isCurrent = i === current;
            return (
              <div key={step} className="flex flex-col items-center flex-1 min-w-0 px-0.5">
                {done ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mb-2">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  <div className="relative w-7 h-7 shrink-0 flex items-center justify-center mb-2">
                    <div className="absolute inset-0 rounded-full bg-slate-400/30 motion-safe:animate-ping" />
                    <div className="relative w-7 h-7 rounded-full bg-white border-[3px] border-slate-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                    </div>
                  </div>
                ) : (
                  <div className="w-6 h-6 m-0.5 rounded-full border-2 border-gray-300 bg-white shrink-0 mb-2" />
                )}
                <span className={`text-[11px] font-bold text-center leading-tight truncate max-w-full ${isCurrent ? "text-slate-800" : done ? "text-gray-500" : "text-gray-400"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {caption && <p className="text-xs text-gray-500 font-medium mt-3 text-center">{caption}</p>}
    </div>
  );
}

// A 3-item window onto a journey's steps — the previous completed station,
// the one actually in progress right now (a green, pulsing "status ball" —
// deliberately its own color, not reused from JourneyStepperLarge's done/
// current styling above, so it reads as a distinct "at a glance" indicator
// rather than a shrunken copy of the full stepper), and the next station up.
// For roles that don't run the journey themselves (Admin/Reception clicking
// into an appointment from the calendar; Clinician's own dashboard preview
// of "where is this patient right now") — a full station-by-station history
// is more detail than the question they're actually asking.
export function CondensedJourneyStrip({ steps, current }: { steps: string[]; current: number }) {
  const indices = [current - 1, current, current + 1].filter((i) => i >= 0 && i < steps.length);
  return (
    <div className="relative pt-1">
      <div className="absolute top-[13px] left-4 right-4 h-0.5 bg-gray-200" />
      <div className="relative flex justify-between">
        {indices.map((i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0 px-1">
              {done ? (
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 mb-1.5">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              ) : isCurrent ? (
                <div className="relative w-6 h-6 shrink-0 flex items-center justify-center mb-1.5">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/50 motion-safe:animate-ping" />
                  <div className="relative w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
              ) : (
                <div className="w-5 h-5 m-0.5 rounded-full border-2 border-gray-300 bg-white shrink-0 mb-1.5" />
              )}
              <span className={`text-[10px] font-bold text-center leading-tight truncate max-w-full ${isCurrent ? "text-emerald-700" : "text-gray-400"}`}>
                {steps[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        className={`w-full py-3 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
          disabled ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" : "bg-slate-600 text-white hover:bg-slate-700"
        }`}
      >
        {icon}{label}
      </button>
      {disabled && reason && <p className="text-xs text-red-600 font-medium mt-2 text-center">{reason}</p>}
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
        danger ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" : "text-gray-700 border-gray-300 bg-white hover:bg-gray-50"
      }`}
    >
      {icon}{label}
    </button>
  );
}
