import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, UserPlus, CheckCircle2, AlertTriangle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Patient } from "../patientsData";
import { createPatient, findByPhone, findByEmail, logDuplicateOverride, NewPatientInput } from "../patientsStore";
import { DiscardDialog } from "../../../components/DiscardDialog";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

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

const inputCls = "w-full px-3 py-2 border border-divider rounded-control text-data outline-none focus:border-border-strong bg-surface";
const labelCls = "block text-label font-bold text-ink-soft uppercase tracking-wider mb-2";

function StepDots({ step }: { step: 1 | 2 }) {
  const dot = (n: 1 | 2, label: string) => {
    const active = step === n;
    const done = step > n;
    return (
      <div className={`flex items-center font-bold text-data ${active || done ? "text-info-ink" : "text-ink-muted"}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${active || done ? "bg-info/15" : "bg-surface-hover"}`}>
          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
        </div>
        {label}
      </div>
    );
  };
  return (
    <div className="flex items-center justify-center gap-4 mb-2">
      {dot(1, "Personal")}
      <div className="w-12 h-px bg-surface-sunken" />
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
      <Modal
        open
        onClose={onClose}
        title="Patient registered"
        size="form"
        footer={
          <div className="flex justify-between gap-3 w-full">
            <Button variant="secondary" onClick={() => { navigate(`/patients/${created.patientId}`); onClose(); }}>
              View patient record
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>Done</Button>
              <Button variant="primary" onClick={() => { onBookFirst?.(created); onClose(); }}>
                <CalendarPlus className="w-4 h-4" /> Book first appointment
              </Button>
            </div>
          </div>
        }
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-success-ink" />
          </div>
          <div className="text-section font-bold text-ink">{created.name}</div>
          <div className="text-label text-ink-muted mt-0.5">{created.patientId} · {created.phone || created.email}</div>
          <p className="text-body text-ink-muted mt-3">Registered and searchable in the patient list.</p>
        </div>
      </Modal>
    );
  }

  // --- duplicate gate ---
  if (duplicate) {
    return (
      <Modal
        open
        onClose={requestClose}
        title="Possible duplicate"
        size="form"
        footer={
          <div className="flex justify-between gap-3 w-full">
            <Button variant="ghost" onClick={() => setDuplicate(null)}>Back</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { const d = duplicate; setDuplicate(null); commit(d); }}>Register anyway</Button>
              <Button variant="primary" onClick={useExisting}>Use existing patient</Button>
            </div>
          </div>
        }
      >
        <div className="flex gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="w-5 h-5 text-warning-ink shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-body font-semibold text-warning-ink">
              A patient with this {duplicate.email.trim().toLowerCase() === email.trim().toLowerCase() ? "email address" : "phone number"} already exists: {duplicate.name} ({duplicate.patientId})
            </p>
            <p className="text-label text-warning-ink/80 mt-1">{duplicate.phone} · {duplicate.email || "no email on file"}</p>
          </div>
        </div>
      </Modal>
    );
  }

  // --- form ---
  return (
    <Modal
      open
      onClose={requestClose}
      title="New Patient"
      size="form"
      footer={
        <div className="flex justify-between gap-3 w-full">
          {step === 2 ? (
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
          ) : <span />}
          {step === 1 ? (
            <Button variant="primary" onClick={goStep2} disabled={!step1Valid} disabledReason="Enter first and last name">
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} disabled={!step2Valid} disabledReason="Enter a valid email address">
              <UserPlus className="w-4 h-4" /> Add Patient
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <StepDots step={step as 1 | 2} />

        {step === 1 ? (
          <>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className={labelCls}>Title</label>
                <select value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}>
                  <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
                </select>
              </div>
              <div className="col-span-4">
                <label className={labelCls}>First Name <span className="text-danger-ink">*</span></label>
                <Input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                {errors.firstName && <p className="text-label text-danger-ink font-medium mt-1">{errors.firstName}</p>}
              </div>
              <div className="col-span-5">
                <label className={labelCls}>Last Name <span className="text-danger-ink">*</span></label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                {errors.lastName && <p className="text-label text-danger-ink font-medium mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Sex</label>
                <select value={sex} onChange={(e) => setSex(e.target.value as Patient["sex"])} className={inputCls}>
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
              <label className={labelCls}>Email <span className="text-danger-ink">*</span></label>
              <Input
                autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              {errors.email
                ? <p className="text-label text-danger-ink font-medium mt-1">{errors.email}</p>
                : <p className="text-label text-ink-muted mt-1">Checked against existing patients.</p>}
            </div>
            <div>
              <label className={labelCls}>Mobile Phone</label>
              <Input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5XX XXX XXXX"
              />
            </div>
          </div>
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
    </Modal>
  );
}
