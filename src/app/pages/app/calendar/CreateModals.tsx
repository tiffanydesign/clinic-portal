import React, { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { X, AlertTriangle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { FilterSelect } from "../../../components/FilterSelect";
import { ClinicianAvailabilitySelect } from "./ClinicianAvailabilitySelect";
import {
  APPTS, Appt, CLINICIANS, NURSES, ROOMS, NEW_APPT_TYPES, DURATION_DEFAULTS,
  TimeBlock, clockToMin, fmtRange, minToClock,
  hasClinicianConflict, hasRoomConflict, hasNurseConflict, DAY_START_HOUR, DAY_END_HOUR,
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

// The room a slot needs, driven entirely by appointment type — video visits
// need no physical room at all. Feeds both the auto-assignment and the
// available-time-slot filter below.
function roomKindForType(type: string): string | null {
  if (type === "Consultation (video)") return null;
  if (type === "Body Scan" || type === "7-Omics Package") return "Scan Room";
  if (type === "Sample Collection") return "Sample Room";
  return "Consult Room"; // Consultation (in-person), Follow-up
}

// Today plus the next 13 days — only "today" carries real conflict data in
// this prototype (APPTS models a single day), so every other date shows every
// slot as open.
const TODAY_DATE = new Date(2026, 6, 3);
const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = addDays(TODAY_DATE, i);
  return { value: format(d, "d MMM yyyy"), label: i === 0 ? `Today · ${format(d, "EEE d MMM")}` : format(d, "EEE, d MMM") };
});

export function NewAppointmentModal({ onClose, onCreate, currentAppts, defaults }: {
  onClose: () => void;
  onCreate: (a: Appt) => void;
  currentAppts: Appt[];
  defaults?: { doctorId?: string; room?: string; startMin?: number };
}) {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [type, setType] = useState(NEW_APPT_TYPES[0]);
  const [manualDate, setManualDate] = useState(DATE_OPTIONS[0].value);
  const [manualTime, setManualTime] = useState<string | null>(defaults?.startMin != null ? minToClock(defaults.startMin) : null);
  const [manualDoctorId, setManualDoctorId] = useState<string | null>(defaults?.doctorId ?? null);
  const [notes, setNotes] = useState("");

  const patient = PATIENTS.find((p) => p.name === patientName);
  const duration = DURATION_DEFAULTS[type] ?? 30;
  const roomKind = roomKindForType(type);
  const dateIsToday = manualDate === DATE_OPTIONS[0].value;
  // Every conflict check below is skipped for any date other than today,
  // since this prototype only models appointments for the single mocked day
  // — every other date is genuinely wide open.
  const conflicts = dateIsToday ? currentAppts : [];

  // Only a slot where at least one clinician, one correctly-typed room (if
  // the visit needs one), and one nurse are all free gets offered — auto-
  // assignment below is guaranteed to succeed for anything the Time select
  // shows, which is what lets the old per-field conflict banners go away.
  const availableTimeOptions = useMemo(() => {
    return TIME_OPTIONS.filter((t) => {
      const startMin = clockToMin(t);
      if (startMin + duration > DAY_END_HOUR * 60) return false;
      const clinicianOk = CLINICIANS.some((c) => !c.onLeave && !hasClinicianConflict(conflicts, c.id, startMin, duration));
      const roomOk = roomKind === null || ROOMS.some((r) => r.kind === roomKind && !hasRoomConflict(conflicts, r.id, startMin, duration));
      const nurseOk = NURSES.some((n) => !hasNurseConflict(conflicts, n, startMin, duration));
      return clinicianOk && roomOk && nurseOk;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, duration, roomKind, dateIsToday]);

  const time = manualTime && availableTimeOptions.includes(manualTime) ? manualTime : (availableTimeOptions[0] ?? TIME_OPTIONS[0]);
  const startMin = clockToMin(time);

  const clinicianOptions = useMemo(
    () => CLINICIANS.map((c) => ({ ...c, available: !c.onLeave && !hasClinicianConflict(conflicts, c.id, startMin, duration) })),
    [conflicts, startMin, duration]
  );
  const availableClinicianIds = clinicianOptions.filter((c) => c.available).map((c) => c.id);
  const doctorId = manualDoctorId && availableClinicianIds.includes(manualDoctorId) ? manualDoctorId : (availableClinicianIds[0] ?? CLINICIANS[0].id);
  const doctor = CLINICIANS.find((c) => c.id === doctorId)!;

  const availableRooms = useMemo(
    () => (roomKind === null ? [] : ROOMS.filter((r) => r.kind === roomKind && !hasRoomConflict(conflicts, r.id, startMin, duration))),
    [conflicts, roomKind, startMin, duration]
  );
  const room = roomKind === null ? "Video" : (availableRooms[0]?.id ?? "");

  const availableNurses = useMemo(
    () => NURSES.filter((n) => !hasNurseConflict(conflicts, n, startMin, duration)),
    [conflicts, startMin, duration]
  );
  const nurse = availableNurses[0] ?? "";

  const canCreate = Boolean(patient) && availableTimeOptions.length > 0;

  const create = () => {
    if (!patient) { toast.error("Select a patient."); return; }
    if (availableTimeOptions.length === 0) { toast.error("No available time slot for this date."); return; }
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
      room,
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
          <FilterSelect value={type} onChange={setType} options={NEW_APPT_TYPES} className="w-full" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <FilterSelect value={manualDate} onChange={setManualDate} options={DATE_OPTIONS} className="w-full" />
          </Field>
          <Field label="Time" required>
            <FilterSelect
              value={time}
              onChange={setManualTime}
              disabled={availableTimeOptions.length === 0}
              className="w-full"
              options={
                availableTimeOptions.length === 0
                  ? [{ value: time, label: "No slots available" }]
                  : availableTimeOptions.map((t) => ({ value: t, label: fmtRange(clockToMin(t), duration) }))
              }
            />
          </Field>
        </div>

        <Field label="Assign Clinician">
          <ClinicianAvailabilitySelect
            value={doctorId}
            onChange={setManualDoctorId}
            options={clinicianOptions.map((c) => ({
              id: c.id,
              name: c.name,
              available: c.available,
              reason: c.onLeave ? "On leave" : "Already booked at this time",
            }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nurse">
            <div className={`${inputCls} bg-gray-50 text-gray-700 flex items-center justify-between`}>
              <span>{nurse || "—"}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 ml-2">Auto</span>
            </div>
          </Field>
          <Field label="Room">
            <div className={`${inputCls} bg-gray-50 text-gray-700 flex items-center justify-between`}>
              <span>{roomKind === null ? "Video call" : (ROOMS.find((r) => r.id === room)?.label ?? "—")}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 ml-2">Auto</span>
            </div>
          </Field>
        </div>

        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>

        {availableTimeOptions.length === 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> No available time slots on this date for this appointment type — try another date.
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
          <Field label="Start Time"><FilterSelect value={start} onChange={setStart} options={TIME_OPTIONS} className="w-full" /></Field>
          <Field label="End Time"><FilterSelect value={end} onChange={setEnd} options={TIME_OPTIONS} className="w-full" /></Field>
        </div>
        <Field label="Reason"><FilterSelect value={reason} onChange={setReason} options={BLOCK_REASONS} className="w-full" /></Field>
        <Field label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} placeholder="Optional…" /></Field>
        {!valid && <p className="text-xs text-red-600 font-medium">End time must be after start time.</p>}
      </div>
    </ModalShell>
  );
}
