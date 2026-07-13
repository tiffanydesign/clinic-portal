import React from "react";
import { useNavigate } from "react-router";
import {
  X, Video, FileText, CreditCard, CheckCircle2, Clock, ChevronRight, Check, Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { Role } from "../../../context/AppContext";
import {
  Appt, JOURNEY_STEPS_ADMIN, JOURNEY_STEPS_RECEPTION, canCheckIn,
  checkInBlockReason, statusPillType,
} from "./dashboardData";
import { StatusPill } from "./DashboardShared";

// Optional action handlers. When supplied (e.g. by the editable Calendar page),
// the drawer opens real modals; when omitted (e.g. the read-only Dashboard
// widget) the actions fall back to a demo toast. This keeps ONE shared drawer.
export type DrawerHandlers = {
  onEdit?: () => void;
  onReassign?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
};

// --- shared drawer primitives ---

function DrawerShell({ title, subtitle, avatar, onClose, children, footer, banner }: {
  title: string; subtitle?: string; avatar?: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode; banner?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-[400px] bg-white border-l border-gray-300 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between shrink-0 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            {avatar && (
              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-sm">{avatar}</div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-gray-800 truncate">{title}</div>
              {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        {banner}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-gray-200 p-4 shrink-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
}

function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline py-1 text-sm gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-right truncate">{value}</span>
    </div>
  );
}

export function JourneyDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="relative pt-1">
      <div className="absolute top-3 left-2 right-2 h-0.5 bg-gray-200" />
      <div className="relative flex justify-between">
        {steps.map((step, i) => {
          const past = i < current;
          const isCurrent = i === current;
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mb-1.5 ${past ? "bg-slate-500 border-slate-500" : isCurrent ? "bg-white border-slate-600 ring-4 ring-slate-100" : "bg-white border-gray-300"}`}>
                {past && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wide text-center leading-tight ${isCurrent ? "text-slate-800" : "text-gray-400"}`}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionLink({ label, onClick, danger, primary, icon }: { label: string; onClick: () => void; danger?: boolean; primary?: boolean; icon?: React.ReactNode }) {
  if (primary) {
    return (
      <button onClick={onClick} className="w-full py-2.5 bg-slate-600 text-white font-bold text-sm rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
        {icon}{label}
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2 text-sm font-medium rounded hover:bg-gray-50 transition-colors flex items-center justify-between ${danger ? "text-red-600" : "text-gray-700"}`}>
      <span className="flex items-center gap-2">{icon}{label}</span>
      <ChevronRight className="w-4 h-4 opacity-40" />
    </button>
  );
}

function ApptDetailsBlock({ appt }: { appt: Appt }) {
  return (
    <Block title="Appointment Details">
      <Row label="Type" value={<span className="flex items-center gap-1.5 justify-end">{appt.isVideo && <Video className="w-3.5 h-3.5 text-slate-500" />}{appt.type.replace(" (in-person)", "").replace(" (video)", "")}</span>} />
      <Row label="Time" value={appt.timeLabel} />
      <Row label="Duration" value={`${appt.durationMin} min`} />
      <Row label="Room" value={appt.room} />
      <div className="flex justify-between items-center py-1 text-sm">
        <span className="text-gray-500">Status</span>
        <StatusPill status={appt.status} type={statusPillType(appt.status)} />
      </div>
    </Block>
  );
}

// resolve a handler or fall back to a demo toast
const use = (h: (() => void) | undefined, fallback: string) => h ?? (() => toast(fallback));

// --- role bodies ---

function AdminBody({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  const payType = appt.payment === "Paid" ? "success" : appt.payment === "Partial" ? "warning" : "error";
  const consentType = appt.consent === "Signed" ? "success" : appt.consent === "Pending" ? "warning" : "error";
  return (
    <>
      <Block title="Patient Summary" action={<button onClick={() => nav(appt.patient.route)} className="text-xs font-bold text-slate-600 hover:underline">View Record</button>}>
        <Row label="DOB" value={`${appt.patient.dob} (${appt.patient.age})`} />
        <Row label="Sex" value={appt.patient.sex} />
        <Row label="Phone" value={appt.patient.phone} />
        <Row label="Email" value={appt.patient.email} />
      </Block>
      <ApptDetailsBlock appt={appt} />
      <Block title="Assigned Staff">
        <Row label="Clinician" value={appt.doctor} />
        <Row label="Nurse" value={appt.nurse ?? "—"} />
        <Row label="Room" value={appt.room} />
      </Block>
      <Block title="Payment">
        <div className="flex justify-between items-center">
          <StatusPill status={appt.payment} type={payType} />
          <span className="font-bold text-gray-800">{appt.amount}{appt.balance !== "₺0" ? ` · ${appt.balance} due` : ""}</span>
        </div>
      </Block>
      <Block title="Signed Forms">
        <StatusPill status={appt.consent} type={consentType} />
      </Block>
      <Block title="Journey Today">
        <JourneyDots steps={JOURNEY_STEPS_ADMIN} current={Math.min(appt.currentStep, JOURNEY_STEPS_ADMIN.length - 1)} />
      </Block>
      <div className="px-3 py-3 space-y-0.5">
        <ActionLink label="Edit Appointment" onClick={use(h.onEdit, "Edit appointment (demo)")} />
        <ActionLink label="Reassign Staff" onClick={use(h.onReassign, "Reassign staff (demo)")} />
        <ActionLink label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
        <ActionLink label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
        <ActionLink label="Cancel Appointment" danger onClick={h.onCancel ?? (() => { toast.error("Appointment cancelled (demo)"); onClose(); })} />
      </div>
    </>
  );
}

function ReceptionInner({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  const payType = appt.payment === "Paid" ? "success" : appt.payment === "Partial" ? "warning" : "error";
  return (
    <>
      <Block title="Patient Summary" action={<button onClick={() => nav(appt.patient.route)} className="text-xs font-bold text-slate-600 hover:underline">View Record</button>}>
        <Row label="DOB" value={`${appt.patient.dob} (${appt.patient.age})`} />
        <Row label="Sex" value={appt.patient.sex} />
        <Row label="Phone" value={appt.patient.phone} />
        <Row label="Email" value={appt.patient.email} />
        <Row label="Appointment" value={appt.type.replace(" (in-person)", "").replace(" (video)", "")} />
        <Row label="Clinician" value={appt.doctor} />
        <Row label="Time" value={appt.timeLabel} />
      </Block>

      <Block title="Journey Today">
        <JourneyDots steps={JOURNEY_STEPS_RECEPTION} current={appt.currentStep} />
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

      <Block title="Payment">
        <div className="flex justify-between items-center mb-1">
          <StatusPill status={appt.payment} type={payType} />
          <span className="font-bold text-gray-800">{appt.amount}</span>
        </div>
        {appt.balance !== "₺0" && <div className="text-xs text-red-600 font-medium text-right mb-2">Balance due: {appt.balance}</div>}
        {appt.payment !== "Paid" && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => toast("Transaction started on Terminal #1")} className="flex-1 px-3 py-2 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 flex items-center justify-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Start Transaction</button>
            <button onClick={() => toast("Payment link sent to patient")} className="flex-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded hover:bg-gray-50">Send Payment Link</button>
          </div>
        )}
      </Block>

      <div className="px-3 py-3 space-y-0.5">
        <ActionLink label="Edit Appointment" onClick={use(h.onEdit, "Edit (demo)")} />
        <ActionLink label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
        <ActionLink label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
        <ActionLink label="Contact Patient" onClick={() => toast("Contact patient (demo)")} />
        <ActionLink label="Cancel" danger onClick={h.onCancel ?? (() => { toast.error("Appointment cancelled (demo)"); onClose(); })} />
      </div>
    </>
  );
}

function NurseBody({ appt, nav }: { appt: Appt; nav: (r: string) => void }) {
  return (
    <>
      <Block title="Patient Summary" action={<button onClick={() => nav(appt.patient.route)} className="text-xs font-bold text-slate-600 hover:underline">View Record</button>}>
        <Row label="Age / Sex" value={`${appt.patient.age}y · ${appt.patient.sex}`} />
        <Row label="Appointment" value={appt.type.replace(" (in-person)", "").replace(" (video)", "")} />
        <Row label="Time" value={appt.timeLabel} />
        <Row label="Clinician" value={appt.doctor} />
      </Block>
      <Block title="Journey Today">
        <JourneyDots steps={JOURNEY_STEPS_RECEPTION} current={appt.currentStep} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded p-2"><span className="text-gray-600">Sample</span><div className="font-bold text-gray-800">{appt.prep.sample}</div></div>
          <div className="bg-gray-50 rounded p-2"><span className="text-gray-600">Room</span><div className="font-bold text-gray-800">{appt.room} · In Use</div></div>
        </div>
      </Block>
      <div className="px-3 py-3 space-y-0.5">
        <ActionLink label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
        <ActionLink label="Mark Journey Step" onClick={() => toast("Journey step marked (demo)")} icon={<CheckCircle2 className="w-4 h-4" />} />
        <ActionLink label="View Signed Forms Status" onClick={() => toast("Signed forms status (demo)")} icon={<FileText className="w-4 h-4" />} />
      </div>
      <p className="px-5 pb-4 text-xs text-gray-400">Complete detailed journey work in the Patient Record.</p>
    </>
  );
}

function ClinicianBody({ appt, nav, onClose, h }: { appt: Appt; nav: (r: string) => void; onClose: () => void; h: DrawerHandlers }) {
  const formsOk = appt.forms.every((f) => f.status === "Signed");
  const PrepRow = ({ ok, label, detail }: { ok: boolean; label: string; detail: string }) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="flex items-center gap-2 text-gray-700">
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-orange-400" />}
        {label}
      </span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-600" : "text-orange-600"}`}>{detail}</span>
    </div>
  );
  return (
    <>
      <Block title="Patient Summary" action={<button onClick={() => nav(appt.patient.route)} className="text-xs font-bold text-slate-600 hover:underline">View Record</button>}>
        <Row label="Age / Sex" value={`${appt.patient.age}y · ${appt.patient.sex}`} />
        <Row label="Appointment" value={appt.type.replace(" (in-person)", "").replace(" (video)", "")} />
        <Row label="Format" value={appt.isVideo ? "Video" : "In-person"} />
        <Row label="Time" value={appt.timeLabel} />
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
      <div className="px-4 py-4 space-y-2">
        {appt.isVideo ? (
          <ActionLink primary label="Join Video Call" icon={<Video className="w-4 h-4" />} onClick={() => toast.success("Joining video call (demo)")} />
        ) : (
          <ActionLink primary label="Start Consultation" onClick={() => toast.success("Consultation started (demo)")} />
        )}
        <div className="space-y-0.5 pt-1">
          <ActionLink label="Open Patient Record" onClick={() => nav(appt.patient.route)} />
          <ActionLink label="Reschedule" onClick={use(h.onReschedule, "Reschedule (demo)")} />
          <ActionLink label="Mark No Show" onClick={() => { toast.error("Marked as no show (demo)"); onClose(); }} />
        </div>
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
        <Row label="Time" value={appt.timeLabel} />
        <Row label="Booked by" value={appt.doctor} />
        <Row label="Room" value={appt.room} />
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

  if (role === "Reception") {
    const checkedIn = appt.status === "Checked In" || appt.status === "In Clinic";
    const enabled = canCheckIn(appt);
    const blockReason = checkInBlockReason(appt);
    // Once checked in, there's nothing left for Reception to trigger here —
    // Check Out is the nurse's own action at the end of the patient's
    // journey (see journeyEngine.ts's final "checkout" milestone), never a
    // Reception button.
    const footer = checkedIn ? undefined : (
      <>
        <button
          disabled={!enabled}
          onClick={() => { toast.success(`${appt.patient.name} checked in.`); onClose(); }}
          className={`w-full py-3 font-bold rounded transition-colors ${enabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"}`}
        >
          Check In
        </button>
        {!enabled && blockReason && <p className="text-xs text-red-600 font-medium mt-2 text-center">{blockReason}</p>}
      </>
    );
    return (
      <DrawerShell title={appt.patient.name} subtitle={`${appt.patient.age}y · ${appt.patient.sex}`} avatar={appt.patient.avatar} onClose={onClose} footer={footer}>
        <ReceptionInner appt={appt} nav={nav} onClose={onClose} h={handlers} />
      </DrawerShell>
    );
  }

  let body: React.ReactNode;
  if (role === "Admin") body = <AdminBody appt={appt} nav={nav} onClose={onClose} h={handlers} />;
  else if (role === "Nurse") body = <NurseBody appt={appt} nav={nav} />;
  else body = <ClinicianBody appt={appt} nav={nav} onClose={onClose} h={handlers} />;

  return (
    <DrawerShell title={appt.patient.name} subtitle={`${appt.patient.age}y · ${appt.patient.sex}`} avatar={appt.patient.avatar} onClose={onClose}>
      {body}
    </DrawerShell>
  );
}
