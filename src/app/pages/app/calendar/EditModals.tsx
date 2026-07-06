import React, { useState } from "react";
import { toast } from "sonner";
import { ModalShell, Field } from "./CreateModals";
import {
  Appt, ApptOverride, CLINICIANS, NURSES, ROOMS, APPT_TYPES, DURATION_OPTIONS,
  clockToMin, minToClock, fmtRange,
} from "./scheduleData";

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 bg-white outline-none focus:border-slate-500";

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = 8 * 60; m <= 19 * 60; m += 15) out.push(minToClock(m));
  return out;
})();

export function EditAppointmentModal({ appt, onClose, onApply }: { appt: Appt; onClose: () => void; onApply: (ov: ApptOverride) => void }) {
  const [type, setType] = useState(appt.type);
  const [time, setTime] = useState(minToClock(appt.startMin));
  const [duration, setDuration] = useState(appt.durationMin);
  const [notes, setNotes] = useState("");

  const apply = () => {
    onApply({ startMin: clockToMin(time), durationMin: duration });
    toast.success("Appointment updated.");
    onClose();
  };
  return (
    <ModalShell title="Edit Appointment" subtitle={appt.patient.name} onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Save Changes</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Appointment Type"><select value={type} onChange={(e) => setType(e.target.value as Appt["type"])} className={inputCls}>{APPT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Time"><select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls}>{TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Duration"><select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>{DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}</select></Field>
        </div>
        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>
      </div>
    </ModalShell>
  );
}

export function ReassignModal({ appt, onClose, onApply }: { appt: Appt; onClose: () => void; onApply: (ov: ApptOverride) => void }) {
  const [doctorId, setDoctorId] = useState(appt.doctorId);
  const [nurse, setNurse] = useState(appt.nurse ?? "");
  const [room, setRoom] = useState(appt.room);

  const apply = () => {
    const doctor = CLINICIANS.find((c) => c.id === doctorId)!;
    onApply({ doctorId, doctor: doctor.name, room });
    toast.success(`Reassigned to ${doctor.name}.`);
    onClose();
  };
  return (
    <ModalShell title="Reassign Staff" subtitle={appt.patient.name} onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Reassign</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Clinician"><select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>{CLINICIANS.map((c) => <option key={c.id} value={c.id}>{c.name}{c.onLeave ? " (on leave)" : ""}</option>)}</select></Field>
        <Field label="Nurse"><select value={nurse} onChange={(e) => setNurse(e.target.value)} className={inputCls}><option value="">— None —</option>{NURSES.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="Room"><select value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls}>{ROOMS.map((r) => <option key={r.id} value={r.id}>{r.label} · {r.kind}</option>)}</select></Field>
      </div>
    </ModalShell>
  );
}

export function RescheduleModal({ appt, onClose, onApply }: { appt: Appt; onClose: () => void; onApply: (ov: ApptOverride) => void }) {
  const [time, setTime] = useState(minToClock(appt.startMin));
  const apply = () => {
    onApply({ startMin: clockToMin(time) });
    toast.success(`Rescheduled to ${minToClock(clockToMin(time))}.`);
    onClose();
  };
  return (
    <ModalShell title="Reschedule" subtitle={appt.patient.name} width="max-w-md" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Reschedule</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Date"><input value="3 Jul 2026" readOnly className={`${inputCls} bg-gray-50`} /></Field>
        <Field label="New Time"><select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls}>{TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
      </div>
    </ModalShell>
  );
}

const CANCEL_REASONS = ["Patient request", "Clinic rescheduling", "Clinician unavailable", "No longer needed", "Other"];

export function CancelModal({ appt, onClose, onConfirm }: { appt: Appt; onClose: () => void; onConfirm: () => void }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const confirm = () => {
    onConfirm();
    toast.error(`Appointment cancelled — ${reason}.`);
    onClose();
  };
  return (
    <ModalShell title="Cancel Appointment" subtitle={appt.patient.name} width="max-w-md" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Keep Appointment</button>
        <button onClick={confirm} className="px-6 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700">Cancel Appointment</button>
      </>
    }>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">This will cancel {appt.patient.name}&#39;s {appt.timeLabel} appointment. Select a reason:</p>
        <Field label="Cancellation Reason"><select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>{CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
      </div>
    </ModalShell>
  );
}

// Generic confirm dialog used by drag-to-reschedule / drag-to-reassign / resize.
export function ConfirmDialog({ title, message, confirmLabel, onClose, onConfirm }: {
  title: string; message: string; confirmLabel: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <ModalShell title={title} width="max-w-sm" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">{confirmLabel}</button>
      </>
    }>
      <p className="text-sm text-gray-600">{message}</p>
    </ModalShell>
  );
}

export const _fmtRange = fmtRange;
