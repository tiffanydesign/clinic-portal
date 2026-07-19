import React, { useState } from "react";
import { useNavigate } from "react-router";
import { X, ArrowRight, ArrowLeft, UserPlus, CheckCircle2, AlertTriangle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Patient } from "../patientsData";
import { createPatient, findByPhone, findByEmail, logDuplicateOverride, NewPatientInput } from "../patientsStore";
import { DiscardDialog } from "../../../components/DiscardDialog";

// The single Register Patient surface for the whole portal (Patients list,
// Reception dashboard, and modal-over-modal from the booking flow).
//
// Two steps, per spec: Personal -> Contact. Contact is where phone/email live,
// which is what makes the duplicate check possible at all — the previous shell
// collected neither, so nothing could be deduped.
//
// `mode` drives what happens on success:
//   - "standalone" : show the success step (Book first appointment / View record / Done)
//   - "embedded"   : return the patient to the caller immediately and close, so
//                    the booking flow underneath can select it without the
//                    operator seeing a success page they'd only dismiss.

type Mode = "standalone" | "embedded";
type Step = 1 | 2 | "done";

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500";
const labelCls = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2";

function StepDots({ step }: { step: 1 | 2 }) {
  const dot = (n: 1 | 2, label: string) => {
    const active = step === n;
    const done = step > n;
    return (
      <div className={`flex items-center font-bold text-sm ${active || done ? "text-blue-700" : "text-gray-400"}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${active || done ? "bg-blue-100" : "bg-gray-100"}`}>
          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
        </div>
        {label}
      </div>
    );
  };
  return (
    <div className="flex items-center justify-center gap-4 mb-2">
      {dot(1, "Personal")}
      <div className="w-12 h-px bg-gray-200" />
      {dot(2, "Contact")}
    </div>
  );
}

export function RegisterPatientModal({
  mode = "standalone",
  prefillName = "",
  onClose,
  onRegistered,
  onBookFirst,
}: {
  mode?: Mode;
  /** Seeds the name fields — used by "Register '{search}' as new patient". */
  prefillName?: string;
  onClose: () => void;
  /** Always fired on success (both modes) so callers can react. */
  onRegistered?: (p: Patient) => void;
  /** standalone only — success step's primary action. */
  onBookFirst?: (p: Patient) => void;
}) {
  const navigate = useNavigate();

  const [first = "", ...restName] = prefillName.trim().split(/\s+/);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(restName.join(" "));
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<Patient["sex"] | "">("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<Patient | null>(null);
  const [duplicate, setDuplicate] = useState<Patient | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Unsaved-changes guard. The prefilled name came from the caller's search
  // box, not from typing here, so it isn't counted as an edit to lose.
  const seededLast = restName.join(" ");
  const dirty =
    firstName !== first || lastName !== seededLast ||
    title !== "Mr" || !!dob || !!sex || !!phone.trim() || !!email.trim();

  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  // Only name (step 1) and email (step 2) are required; DOB, sex and phone are
  // optional so a walk-in can be registered in seconds.
  const step1Valid = firstName.trim() && lastName.trim();
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const step2Valid = emailValid;

  const goStep2 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const buildInput = (): NewPatientInput => ({
    firstName, lastName, email,
    title,
    dob: dob || undefined,
    sex: sex || undefined,
    phone: phone.trim() || undefined,
  });

  // Registers for real, then routes by mode. Shared by the normal path and by
  // "Register anyway" on the duplicate gate.
  const commit = (dupeOverride?: Patient) => {
    const p = createPatient(buildInput());
    if (dupeOverride) logDuplicateOverride(dupeOverride, p.name);
    onRegistered?.(p);
    if (mode === "embedded") {
      toast.success(`Patient registered · ${p.name}`);
      onClose();
      return;
    }
    setCreated(p);
    setStep("done");
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Required";
    else if (!emailValid) e.email = "Enter a valid email address";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Duplicate gate keyed on email — it's the required identity field now that
    // phone is optional. (A phone match still surfaces too, for the common case
    // where both were entered.)
    const existing = findByEmail(email) ?? (phone.trim() ? findByPhone(phone) : undefined);
    if (existing) { setDuplicate(existing); return; }
    commit();
  };

  const useExisting = () => {
    if (!duplicate) return;
    onRegistered?.(duplicate);
    toast.success(`Using existing patient · ${duplicate.name}`);
    onClose();
  };

  // --- success step (standalone only) ---
  if (step === "done" && created) {
    return (
      <Shell onClose={onClose} title="Patient registered">
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-gray-900">{created.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{created.patientId} · {created.phone || created.email}</div>
          <p className="text-sm text-gray-500 mt-3">Registered and searchable in the patient list.</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between gap-3">
          <button
            onClick={() => { navigate(`/patients/${created.patientId}`); onClose(); }}
            className="min-h-11 px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            View patient record
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="min-h-11 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              Done
            </button>
            <button
              onClick={() => { onBookFirst?.(created); onClose(); }}
              className="min-h-11 px-5 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" /> Book first appointment
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // --- duplicate gate ---
  if (duplicate) {
    return (
      <Shell onClose={requestClose} title="Possible duplicate">
        <div className="p-6">
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                A patient with this {duplicate.email.trim().toLowerCase() === email.trim().toLowerCase() ? "email address" : "phone number"} already exists: {duplicate.name} ({duplicate.patientId})
              </p>
              <p className="text-xs text-amber-700/80 mt-1">{duplicate.phone} · {duplicate.email || "no email on file"}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between gap-3">
          <button onClick={() => setDuplicate(null)} className="min-h-11 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800">
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => { const d = duplicate; setDuplicate(null); commit(d); }}
              className="min-h-11 px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
            >
              Register anyway
            </button>
            <button
              onClick={useExisting}
              className="min-h-11 px-5 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors shadow-sm"
            >
              Use existing patient
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // --- form ---
  return (
    <Shell onClose={requestClose} title="Register New Patient">
      <div className="p-6 space-y-6 overflow-y-auto">
        <StepDots step={step as 1 | 2} />

        {step === 1 ? (
          <>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className={labelCls}>Title</label>
                <select value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} bg-white`}>
                  <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
                </select>
              </div>
              <div className="col-span-4">
                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                <input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                {errors.firstName && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.firstName}</p>}
              </div>
              <div className="col-span-5">
                <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                {errors.lastName && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sex</label>
                <select value={sex} onChange={(e) => setSex(e.target.value as Patient["sex"])} className={`${inputCls} bg-white`}>
                  <option value="">Select sex…</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email <span className="text-red-500">*</span></label>
              <input
                autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" className={inputCls}
              />
              {errors.email
                ? <p className="text-[11px] text-red-600 font-medium mt-1">{errors.email}</p>
                : <p className="text-[11px] text-gray-400 mt-1">Checked against existing patients.</p>}
            </div>
            <div>
              <label className={labelCls}>Mobile Phone</label>
              <input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5XX XXX XXXX" className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between gap-3">
        {step === 2 ? (
          <button onClick={() => setStep(1)} className="min-h-11 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : <span />}
        {step === 1 ? (
          <button
            onClick={goStep2}
            disabled={!step1Valid}
            className={`min-h-11 px-5 py-2 rounded text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2 ${
              step1Valid ? "bg-slate-600 hover:bg-slate-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!step2Valid}
            className={`min-h-11 px-5 py-2 rounded text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2 ${
              step2Valid ? "bg-slate-600 hover:bg-slate-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
        )}
      </div>

      {confirmDiscard && (
        <DiscardDialog
          title="Discard this registration?"
          message="The patient details you've entered will be lost."
          confirmLabel="Discard"
          onKeepEditing={() => setConfirmDiscard(false)}
          onDiscard={() => { setConfirmDiscard(false); onClose(); }}
        />
      )}
    </Shell>
  );
}

// z-[60] so this can sit over the booking modal (z-50) as a modal-over-modal
// without the booking flow having to unmount — that's what preserves its
// already-filled fields.
function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
