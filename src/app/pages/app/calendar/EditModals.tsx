import React, { useState } from "react";
import { toast } from "sonner";
import { ModalShell, Field } from "./CreateModals";
import { FilterSelect } from "../../../components/FilterSelect";
import {
  Appt, ApptOverride, CLINICIANS, NURSES, useSchedulableRooms, roomName, APPT_TYPES, DURATION_OPTIONS,
  clockToMin, minToClock, fmtRange,
} from "./scheduleData";
import { useRoomBlocks } from "../clinic-settings/roomBlocksStore";
import { roomBlockedRangesOnDate, TODAY_ISO } from "../clinic-settings/roomBlocksData";

const inputCls = "w-full px-3 py-2 border border-divider rounded-control text-sm text-ink bg-surface outline-none focus:border-border-strong";

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
        <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Save Changes</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Appointment Type">
          <FilterSelect value={type} onChange={(v) => setType(v as Appt["type"])} options={APPT_TYPES} className="w-full" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Time">
            <FilterSelect
              value={time}
              onChange={setTime}
              className="w-full"
              options={TIME_OPTIONS.map((t) => ({ value: t, label: fmtRange(clockToMin(t), duration) }))}
            />
          </Field>
          <Field label="Duration">
            <FilterSelect
              value={String(duration)}
              onChange={(v) => setDuration(Number(v))}
              className="w-full"
              options={DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
            />
          </Field>
        </div>
        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>
      </div>
    </ModalShell>
  );
}

export function ReassignModal({ appt, onClose, onApply }: { appt: Appt; onClose: () => void; onApply: (ov: ApptOverride) => void }) {
  const rooms = useSchedulableRooms();
  const roomBlocks = useRoomBlocks();
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
        <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Reassign</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Clinician"><select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>{CLINICIANS.map((c) => <option key={c.id} value={c.id}>{c.name}{c.onLeave ? " (on leave)" : ""}</option>)}</select></Field>
        <Field label="Nurse"><select value={nurse} onChange={(e) => setNurse(e.target.value)} className={inputCls}><option value="">— None —</option>{NURSES.map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="Room">
          <select value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls}>
            {!rooms.some((r) => r.id === room) && <option value={room}>{roomName(room)}</option>}
            {rooms.map((r) => {
              // Hard block, not a soft warning — a room genuinely under
              // maintenance can't be physically used, unlike a clinician
              // double-booking, which stays a same-list conflict elsewhere.
              const apptEnd = appt.startMin + appt.durationMin;
              const overlapping = roomBlockedRangesOnDate(roomBlocks, r.id, TODAY_ISO).find(([s, e]) => appt.startMin < e && s < apptEnd);
              return (
                <option key={r.id} value={r.id} disabled={!!overlapping}>
                  {r.name} · {r.type}{overlapping ? ` — Blocked until ${minToClock(overlapping[1])}` : ""}
                </option>
              );
            })}
          </select>
        </Field>
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
        <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
        <button onClick={apply} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Reschedule</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Date"><input value="3 Jul 2026" readOnly className={`${inputCls} bg-surface-page`} /></Field>
        <Field label="New Time">
          <FilterSelect
            value={time}
            onChange={setTime}
            className="w-full"
            options={TIME_OPTIONS.map((t) => ({ value: t, label: fmtRange(clockToMin(t), appt.durationMin) }))}
          />
        </Field>
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
        <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Keep Appointment</button>
        <button onClick={confirm} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-danger-ink hover:bg-danger-ink">Cancel Appointment</button>
      </>
    }>
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">This will cancel {appt.patient.name}&#39;s {appt.timeLabel} appointment. Select a reason:</p>
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
        <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">{confirmLabel}</button>
      </>
    }>
      <p className="text-sm text-ink-soft">{message}</p>
    </ModalShell>
  );
}

export const _fmtRange = fmtRange;
