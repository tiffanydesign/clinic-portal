import React from "react";
import { useNavigate } from "react-router";
import {
  X, Video, FileText, CreditCard, CheckCircle2, Clock, Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Role } from "../../../context/AppContext";
import {
  Appt, canCheckIn, checkInBlockReason, relevantJourneySteps, formsSigned,
} from "./dashboardData";
import { roomName } from "../clinic-settings/roomsStore";
import { StatusPill } from "./DashboardShared";
import {
  KV, Block, AllergyBanner, PatientHeaderBody, StatusGateCard, JourneyStepperLarge,
  CondensedJourneyStrip, PrimaryActionButton, SecondaryChip,
} from "./AppointmentDrawerShared";

// Optional action handlers. When supplied (e.g. by the editable Calendar page),
// the drawer opens real modals; when omitted (e.g. the read-only Dashboard
// widget) the actions fall back to a demo toast. This keeps ONE shared drawer.
export type DrawerHandlers = {
  onEdit?: () => void;
  onReassign?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
};

// --- shared drawer shell ---

function DrawerShell({ title, subtitle, avatar, onClose, children, footer, banner, headerBody }: {
  title: string; subtitle?: string; avatar?: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode; banner?: React.ReactNode;
  headerBody?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-[500px] bg-white border-l border-gray-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between shrink-0 bg-gray-50">
          {headerBody ?? (
            <div className="flex items-center gap-3 min-w-0">
              {avatar && (
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-sm">{avatar}</div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-gray-800 truncate">{title}</div>
                {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
              </div>
            </div>
          )}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        {banner}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-gray-200 p-4 shrink-0 bg-white space-y-2.5">{footer}</div>}
      </div>
    </div>
  );
}

// resolve a handler or fall back to a demo toast
const use = (h: (() => void) | undefined, fallback: string) => h ?? (() => toast(fallback));

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

// Journey Today — every role's own current step (relevantJourneySteps
// dynamically narrows the 6 canonical steps to the ones that actually apply
// to this appointment's type). Admin/Reception get the condensed 3-item
// prev/current/next strip — they're clicking in from the calendar for
// at-a-glance context, not running the journey themselves — while Nurse and
// Clinician (who DO act on each station) keep the full station-by-station
// stepper.
function JourneyBlock({ appt, condensed }: { appt: Appt; condensed?: boolean }) {
  const { steps, current } = relevantJourneySteps(appt);
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3.5">Journey Today</h4>
      {condensed ? (
        <CondensedJourneyStrip steps={steps} current={current} />
      ) : (
        <JourneyStepperLarge appt={appt} steps={steps} current={current} />
      )}
    </div>
  );
}

// --- role bodies ---

function AdminBody({ appt }: { appt: Appt }) {
  return (
    <>
      <StatusGateCard appt={appt} />
      <div className="mt-1">
        <JourneyBlock appt={appt} condensed />
      </div>

      <Block title="Appointment">
        <KV label="Type" value={typeLabel(appt)} />
        <KV label="Time" value={appt.timeLabel} />
        <KV label="Duration" value={`${appt.durationMin} min`} />
        <KV label="Room" value={roomName(appt.room)} />
      </Block>
      <Block title="Assigned">
        <KV label="Clinician" value={appt.doctor} />
        <KV label="Nurse" value={appt.nurse ?? "—"} />
        <KV label="Room" value={roomName(appt.room)} />
      </Block>
      <Block title="Payment Detail">
        <KV label="Amount" value={appt.amount} />
        <KV label="Balance" value={appt.balance} />
      </Block>

      <PatientDetailsCollapsible patient={appt.patient} />
    </>
  );
}

function AdminFooter({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  return (
    <>
      <PrimaryActionButton label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
      <div className="flex flex-wrap gap-1.5">
        <SecondaryChip label="Edit Appointment" onClick={use(h.onEdit, "Edit appointment (demo)")} />
        <SecondaryChip label="Reassign Staff" onClick={use(h.onReassign, "Reassign staff (demo)")} />
        <SecondaryChip label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
      </div>
      <button
        onClick={h.onCancel ?? (() => { toast.error("Appointment cancelled (demo)"); onClose(); })}
        className="w-full text-center text-xs font-bold text-red-600 hover:text-red-700 py-1"
      >
        Cancel Appointment
      </button>
    </>
  );
}

// Collapsed by default — DOB/Phone/Email are static reference info an Admin
// rarely needs the instant a drawer opens; "View Record" in the header is
// the fast path to the full chart when they do.
function PatientDetailsCollapsible({ patient }: { patient: Appt["patient"] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
      >
        Patient Details
        <span className="text-gray-400">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-5 pb-3.5">
          <KV label="DOB" value={`${patient.dob} (${patient.age})`} />
          <KV label="Phone" value={patient.phone} />
          <KV label="Email" value={patient.email} />
        </div>
      )}
    </div>
  );
}

function ReceptionInner({ appt }: { appt: Appt }) {
  const payType = appt.payment === "Paid" ? "success" : "error";
  return (
    <>
      <StatusGateCard appt={appt} />
      <div className="mt-1">
        <JourneyBlock appt={appt} condensed />
      </div>

      <Block title="Appointment">
        <KV label="Type" value={typeLabel(appt)} />
        <KV label="Time" value={appt.timeLabel} />
        <KV label="Clinician" value={appt.doctor} />
      </Block>

      <Block title="Signed Forms">
        <div className="space-y-2">
          {appt.forms.map((f) => (
            <div key={f.name} className="flex items-center justify-between text-sm gap-3">
              <span className="text-gray-700 truncate">{f.name}</span>
              {f.status === "Signed" ? (
                <button onClick={() => toast("Opening signed form (demo)")} className="text-xs font-bold text-slate-600 hover:underline shrink-0">View Signed Form</button>
              ) : (
                <StatusPill status={f.status} type={f.status === "Pending" ? "warning" : "error"} />
              )}
            </div>
          ))}
        </div>
        {appt.forms.some((f) => f.status !== "Signed") && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => toast("Signing request sent to reception iPad")} className="flex-1 px-3 py-2 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700">Initialize Signing</button>
            <button onClick={() => toast("Form sent to patient app")} className="flex-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded hover:bg-gray-50">Send Form</button>
          </div>
        )}
      </Block>

      <Block title="Payment Detail">
        <div className="flex justify-between items-center mb-1">
          <StatusPill status={appt.payment} type={payType} />
          <span className="font-bold text-gray-800 text-sm">{appt.amount}</span>
        </div>
        {appt.balance !== "₺0" && <div className="text-xs text-red-600 font-medium text-right mb-2">Balance due: {appt.balance}</div>}
        {appt.payment !== "Paid" && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => toast("Transaction started on Terminal #1")} className="flex-1 px-3 py-2 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 flex items-center justify-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Start Transaction</button>
            <button onClick={() => toast("Payment link sent to patient")} className="flex-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded hover:bg-gray-50">Send Payment Link</button>
          </div>
        )}
      </Block>

      <PatientDetailsCollapsible patient={appt.patient} />
    </>
  );
}

function ReceptionFooter({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  const checkedIn = appt.status === "Checked In" || appt.status === "In Clinic";
  const enabled = canCheckIn(appt);
  const blockReason = checkInBlockReason(appt);
  return (
    <>
      {/* Once checked in, there's nothing left for Reception to trigger here —
          Check Out is the nurse's own action at the end of the patient's
          journey (see journeyEngine.ts's final "checkout" milestone), never a
          Reception button. */}
      {!checkedIn && (
        <PrimaryActionButton
          label="Check In"
          disabled={!enabled}
          reason={blockReason ?? undefined}
          onClick={() => { toast.success(`${appt.patient.name} checked in.`); onClose(); }}
        />
      )}
      <div className="flex flex-wrap gap-1.5">
        <SecondaryChip label="Edit Appointment" onClick={use(h.onEdit, "Edit (demo)")} />
        <SecondaryChip label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
        <SecondaryChip label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
        <SecondaryChip label="Contact Patient" onClick={() => toast("Contact patient (demo)")} />
      </div>
      <button
        onClick={h.onCancel ?? (() => { toast.error("Appointment cancelled (demo)"); onClose(); })}
        className="w-full text-center text-xs font-bold text-red-600 hover:text-red-700 py-1"
      >
        Cancel
      </button>
    </>
  );
}

function NurseBody({ appt }: { appt: Appt }) {
  return (
    <>
      <StatusGateCard appt={appt} showPayment={false} />
      <div className="mt-1">
        <JourneyBlock appt={appt} />
      </div>

      <Block title="Appointment">
        <KV label="Type" value={typeLabel(appt)} />
        <KV label="Time" value={appt.timeLabel} />
        <KV label="Clinician" value={appt.doctor} />
      </Block>
      <Block title="Preparation">
        <KV label="Sample" value={appt.prep.sample} />
        <KV label="Room" value={`${roomName(appt.room)} · In Use`} />
      </Block>
    </>
  );
}

function NurseFooter({ appt, nav }: { appt: Appt; nav: (r: string) => void }) {
  return (
    <>
      <PrimaryActionButton label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
      <div className="flex flex-wrap gap-1.5">
        <SecondaryChip icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Mark Journey Step" onClick={() => toast("Journey step marked (demo)")} />
        <SecondaryChip icon={<FileText className="w-3.5 h-3.5" />} label="View Signed Forms Status" onClick={() => toast("Signed forms status (demo)")} />
      </div>
      <p className="text-xs text-gray-400 text-center">Complete detailed journey work in the Patient Record.</p>
    </>
  );
}

function PrepRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="flex items-center gap-2 text-gray-700">
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-orange-400" />}
        {label}
      </span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-600" : "text-orange-600"}`}>{detail}</span>
    </div>
  );
}

function ClinicianBody({ appt, nav }: { appt: Appt; nav: (r: string) => void }) {
  const formsOk = formsSigned(appt);
  return (
    <>
      <StatusGateCard appt={appt} showPayment={false} />
      <div className="mt-1">
        <JourneyBlock appt={appt} />
      </div>

      <Block title="Appointment">
        <KV label="Type" value={typeLabel(appt)} />
        <KV label="Format" value={appt.isVideo ? "Video" : "In-person"} />
        <KV label="Time" value={appt.timeLabel} />
      </Block>
      <Block title="Preparation">
        <PrepRow ok={formsOk} label="Signed Forms" detail={formsOk ? "Signed" : "Pending"} />
        <PrepRow ok={appt.prep.sample === "Collected"} label="Sample Status" detail={appt.prep.sample} />
        <PrepRow ok={appt.prep.scan === "Completed"} label="Scan Status" detail={appt.prep.scan} />
        <div className="flex items-center justify-between text-sm py-1 mt-1 border-t border-gray-100 pt-2">
          <span className="text-gray-500">Previous Visit</span>
          <span className="flex items-center gap-2"><span className="text-gray-700 text-xs">{appt.previousVisit}</span><button onClick={() => nav(appt.patient.route)} className="text-xs font-bold text-slate-600 hover:underline">View summary</button></span>
        </div>
      </Block>
    </>
  );
}

function ClinicianFooter({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  return (
    <>
      {appt.isVideo ? (
        <PrimaryActionButton icon={<Video className="w-4 h-4" />} label="Join Video Call" onClick={() => toast.success("Joining video call (demo)")} />
      ) : (
        <PrimaryActionButton label="Start Consultation" onClick={() => toast.success("Consultation started (demo)")} />
      )}
      <div className="flex flex-wrap gap-1.5">
        <SecondaryChip label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
        <SecondaryChip label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
        <SecondaryChip label="Mark No Show" onClick={() => { toast.error("Marked as no show (demo)"); onClose(); }} />
      </div>
    </>
  );
}

// Minimal read-only drawer for a Clinician viewing another clinician's
// appointment through the clinic overlay: no patient identity, no actions.
function OverlayReadOnly({ appt, onClose }: { appt: Appt; onClose: () => void }) {
  return (
    <DrawerShell
      title="Appointment"
      onClose={onClose}
      banner={
        <div className="flex items-center gap-2 bg-gray-100 border-b border-gray-200 px-5 py-2.5 text-xs font-medium text-gray-500">
          <Lock className="w-3.5 h-3.5" /> Read-only — another clinician&#39;s appointment
        </div>
      }
    >
      <Block title="Details">
        <KV label="Time" value={appt.timeLabel} />
        <KV label="Booked by" value={appt.doctor} />
        <KV label="Room" value={roomName(appt.room)} />
      </Block>
    </DrawerShell>
  );
}

// --- exported drawer ---

export function AppointmentDrawer({ appt, role, basePath = "/dashboard", readOnlyOverlay = false, handlers = {} }: {
  appt: Appt; role: Role; basePath?: string; readOnlyOverlay?: boolean; handlers?: DrawerHandlers;
}) {
  const navigate = useNavigate();
  const onClose = () => navigate(basePath);
  const nav = (r: string) => navigate(r);

  if (readOnlyOverlay) return <OverlayReadOnly appt={appt} onClose={onClose} />;

  const banner = appt.patient.alert ? <AllergyBanner alert={appt.patient.alert} /> : undefined;
  const headerBody = <PatientHeaderBody patient={appt.patient} onOpenRecord={() => nav(appt.patient.route)} />;

  if (role === "Reception") {
    return (
      <DrawerShell
        title={appt.patient.name}
        headerBody={headerBody}
        onClose={onClose}
        banner={banner}
        footer={<ReceptionFooter appt={appt} nav={nav} onClose={onClose} h={handlers} />}
      >
        <ReceptionInner appt={appt} />
      </DrawerShell>
    );
  }

  if (role === "Nurse") {
    return (
      <DrawerShell title={appt.patient.name} headerBody={headerBody} onClose={onClose} banner={banner} footer={<NurseFooter appt={appt} nav={nav} />}>
        <NurseBody appt={appt} />
      </DrawerShell>
    );
  }

  if (role === "Clinician") {
    return (
      <DrawerShell title={appt.patient.name} headerBody={headerBody} onClose={onClose} banner={banner} footer={<ClinicianFooter appt={appt} nav={nav} onClose={onClose} h={handlers} />}>
        <ClinicianBody appt={appt} nav={nav} />
      </DrawerShell>
    );
  }

  return (
    <DrawerShell title={appt.patient.name} headerBody={headerBody} onClose={onClose} banner={banner} footer={<AdminFooter appt={appt} nav={nav} onClose={onClose} h={handlers} />}>
      <AdminBody appt={appt} />
    </DrawerShell>
  );
}
