import React, { useMemo, useState } from "react";
import { X, AlertTriangle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  APPTS, Appt, CLINICIANS, NURSES, ROOMS, NEW_APPT_TYPES, DURATION_DEFAULTS,
  DURATION_OPTIONS, TimeBlock, clockToMin, fmtRange, minToClock,
  hasClinicianConflict, hasRoomConflict, DAY_START_HOUR, DAY_END_HOUR,
} from "./scheduleData";

// Shared modal chrome (matches the portal's existing dialog language).
export function ModalShell({ title, subtitle, onClose, children, footer, width = "max-w-lg" }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 w-full ${width} max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95`} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-gray-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 shrink-0">{footer}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 bg-white outline-none focus:border-slate-500";

// time options in 15-min steps across the working day
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = DAY_START_HOUR * 60; m <= DAY_END_HOUR * 60; m += 15) out.push(minToClock(m));
  return out;
})();

// unique patients from the mock set for the search picker
const PATIENTS = Array.from(new Map(APPTS.map((a) => [a.patient.name, a.patient])).values());

export function NewAppointmentModal({ onClose, onCreate, currentAppts, defaults }: {
  onClose: () => void;
  onCreate: (a: Appt) => void;
  currentAppts: Appt[];
  defaults?: { doctorId?: string; room?: string; startMin?: number };
}) {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [type, setType] = useState(NEW_APPT_TYPES[0]);
  const [time, setTime] = useState(minToClock(defaults?.startMin ?? 9 * 60));
  const [duration, setDuration] = useState(DURATION_DEFAULTS[NEW_APPT_TYPES[0]] ?? 30);
  const [doctorId, setDoctorId] = useState(defaults?.doctorId ?? CLINICIANS[0].id);
  const [nurse, setNurse] = useState("");
  const [room, setRoom] = useState(defaults?.room ?? "");
  const [notes, setNotes] = useState("");

  const startMin = clockToMin(time);
  const doctor = CLINICIANS.find((c) => c.id === doctorId)!;
  const clinicianConflict = useMemo(() => hasClinicianConflict(currentAppts, doctorId, startMin, duration), [currentAppts, doctorId, startMin, duration]);
  const roomConflict = useMemo(() => (room ? hasRoomConflict(currentAppts, room, startMin, duration) : null), [currentAppts, room, startMin, duration]);

  const onTypeChange = (t: string) => {
    setType(t);
    if (DURATION_DEFAULTS[t]) setDuration(DURATION_DEFAULTS[t]);
  };

  const patient = PATIENTS.find((p) => p.name === patientName);
  const canCreate = Boolean(patient) && !clinicianConflict;

  const create = () => {
    if (!patient) { toast.error("Select a patient."); return; }
    if (clinicianConflict) { toast.error("Resolve the scheduling conflict first."); return; }
    const isVideo = type === "Consultation (video)";
    const newAppt: Appt = {
      id: `NEW-${startMin}-${doctorId}`,
      patient,
      type: (type === "7-Omics Package" ? "Body Scan" : type) as Appt["type"],
      isVideo,
      startMin,
      durationMin: duration,
      timeLabel: fmtRange(startMin, duration),
      doctorId,
      doctor: doctor.name,
      nurse: nurse || undefined,
      room: isVideo ? "Video" : room || "Room 1",
      status: "Booked",
      consent: "Not Sent",
      payment: "Unpaid",
      amount: "₺0",
      balance: "₺0",
      currentStep: 0,
      forms: [{ name: "Clinic Consent", status: "Not Sent" }],
      prep: { sample: "Pending", scan: "Scheduled" },
      previousVisit: "—",
    };
    onCreate(newAppt);
    toast.success(`Appointment created for ${patient.name}.`);
    onClose();
  };

  return (
    <ModalShell
      title="New Appointment"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={create} disabled={!canCreate} className={`px-6 py-2 rounded text-sm font-bold text-white ${canCreate ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}>Create Appointment</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Patient" required>
          <input list="patient-list" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Search name or ID…" className={inputCls} />
          <datalist id="patient-list">{PATIENTS.map((p) => <option key={p.name} value={p.name} />)}</datalist>
          <button onClick={() => navigate("/patients/new")} className="mt-1.5 text-xs font-bold text-slate-600 hover:underline flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Register new patient</button>
        </Field>

        <Field label="Appointment Type" required>
          <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={inputCls}>
            {NEW_APPT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Date"><input value="3 Jul 2026" readOnly className={`${inputCls} bg-gray-50`} /></Field>
          <Field label="Time"><select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls}>{TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Duration"><select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>{DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}</select></Field>
        </div>

        <Field label="Assign Clinician" required>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>
            {CLINICIANS.map((c) => <option key={c.id} value={c.id}>{c.name}{c.onLeave ? " (on leave)" : ""}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assign Nurse">
            <select value={nurse} onChange={(e) => setNurse(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {NURSES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Room">
            <select value={room} onChange={(e) => setRoom(e.target.value)} disabled={type === "Consultation (video)"} className={`${inputCls} ${type === "Consultation (video)" ? "bg-gray-50 text-gray-400" : ""}`}>
              <option value="">{type === "Consultation (video)" ? "Video (no room)" : "— None —"}</option>
              {ROOMS.map((r) => {
                const busy = hasRoomConflict(currentAppts, r.id, startMin, duration);
                return <option key={r.id} value={r.id} disabled={Boolean(busy)}>{r.label} · {r.kind}{busy ? " (busy)" : ""}</option>;
              })}
            </select>
          </Field>
        </div>

        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>

        {(clinicianConflict || roomConflict) && (
          <div className="space-y-1.5">
            {clinicianConflict && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {doctor.name} has a conflicting appointment at this time ({clinicianConflict.timeLabel}).
              </div>
            )}
            {roomConflict && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium rounded px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {room} is occupied at this time — choose another room.
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

const BLOCK_REASONS = ["Break", "Admin Time", "Meeting", "Unavailable", "Other"];

export function BlockTimeModal({ onClose, onCreate, doctorId }: { onClose: () => void; onCreate: (b: TimeBlock) => void; doctorId: string }) {
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [reason, setReason] = useState(BLOCK_REASONS[0]);
  const [note, setNote] = useState("");

  const startMin = clockToMin(start);
  const durationMin = clockToMin(end) - startMin;
  const valid = durationMin > 0;

  const submit = () => {
    if (!valid) { toast.error("End time must be after start time."); return; }
    onCreate({ id: `BLK-${startMin}`, doctorId, startMin, durationMin, reason, note: note || undefined });
    toast.success(`Time blocked: ${reason}, ${fmtRange(startMin, durationMin)}.`);
    onClose();
  };

  return (
    <ModalShell
      title="Block Time"
      subtitle="Mark a period as unavailable on your calendar."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={!valid} className={`px-6 py-2 rounded text-sm font-bold text-white ${valid ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}>Block Time</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Date"><input value="3 Jul 2026" readOnly className={`${inputCls} bg-gray-50`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Time"><select value={start} onChange={(e) => setStart(e.target.value)} className={inputCls}>{TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="End Time"><select value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls}>{TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <Field label="Reason"><select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>{BLOCK_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
        <Field label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>
        {!valid && <p className="text-xs text-red-600 font-medium">End time must be after start time.</p>}
      </div>
    </ModalShell>
  );
}
