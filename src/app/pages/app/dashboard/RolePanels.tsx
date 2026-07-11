import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle, Flag, Video, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Section, StatusPill, LiveDot } from "./DashboardShared";
import {
  APPTS, Appt, NOW_MINUTES,
} from "./dashboardData";
import { StartTransactionModal } from "../../../components/StartTransactionModal";

const CLINICIAN_ID = "EMP-003";

function openDrawer(nav: ReturnType<typeof useNavigate>, id: string) {
  nav(`/dashboard/appointment/${id}`);
}

// ============================ ADMIN ============================

export function AdminPanels() {
  const nav = useNavigate();

  // Sorted most-overdue-first — Admin scanning this section only cares
  // which one has been sitting the longest, not the ones still on track.
  const results = [
    { patient: "Oliver Folate", test: "Comprehensive Blood", days: 2, doctor: "Dr. Claudia Reis" },
    { patient: "Arysse Arcerola", test: "Genetic Panel", days: 5, doctor: "Dr. Felix Andersen" },
    { patient: "Gustavo Propolis", test: "Hormone Screen", days: 1, doctor: "Dr. Chad Okonkwo" },
    { patient: "Cynthia Riboflavin", test: "Lipid Panel", days: 3, doctor: "Dr. Claudia Reis" },
    { patient: "Dylan Daniel", test: "Metabolic Panel", days: 2, doctor: "Dr. Felix Andersen" },
  ].sort((a, b) => b.days - a.days);

  // Wait reasons reflect the nurse's own patient-journey stations (mirrors
  // the Nurse Dashboard's station vocabulary) rather than Reception-gate
  // concerns like payment/consent, since this tracks in-clinic nurse wait
  // time, not the check-in gate. Sorted longest-wait-first so Admin can spot
  // "is anything backed up" without reading every row.
  const waiting = [
    { patient: "Penny Pelargonium", checkIn: "08:40", wait: 34, step: "Waiting for Body Scan", nurse: "Berna Koç" },
    { patient: "Riley Guarana", checkIn: "08:52", wait: 22, step: "Waiting for Machine 1", nurse: "Aylin Demir" },
    { patient: "Oliver Folate", checkIn: "08:56", wait: 18, step: "Waiting for Sample Collection", nurse: "Aylin Demir" },
    { patient: "Bob Bromelain", checkIn: "09:08", wait: 6, step: "Waiting for Consultation", nurse: "Aylin Demir" },
  ].sort((a, b) => b.wait - a.wait);

  const waitColor = (m: number) => (m > 30 ? "text-red-600" : m > 15 ? "text-orange-600" : "text-gray-800");

  return (
    <div className="flex gap-4 h-full min-h-0">
      <Section title="Results Queue" className="flex-1 min-w-0 h-full" action={<button onClick={() => nav("/patients")} className="text-xs font-bold text-slate-600 hover:underline">View all patients →</button>}>
        <div className="divide-y divide-gray-100">
          {results.map((r) => (
            <button key={r.patient} onClick={() => nav("/patients/P-001/results")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left gap-2">
              <span className="min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">{r.patient}</span>
                <span className="text-xs text-gray-400 truncate block">{r.test} · {r.doctor.replace("Dr. ", "")}</span>
              </span>
              {r.days > 3 ? (
                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 shrink-0"><AlertTriangle className="w-3 h-3" /> {r.days}d overdue</span>
              ) : (
                <span className="text-xs text-gray-400 shrink-0">{r.days}d</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title={<>Waiting Room <LiveDot /></>} className="flex-1 min-w-0 h-full">
        <div className="divide-y divide-gray-100">
          {waiting.map((w) => (
            <div key={w.patient} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{w.patient}</div>
                <div className="text-xs text-gray-400 truncate">In {w.checkIn} · {w.step} · {w.nurse}</div>
              </div>
              <div className={`text-sm font-bold shrink-0 ${waitColor(w.wait)}`}>{w.wait}m</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ============================ RECEPTION ============================

export function ReceptionPanels() {
  const nav = useNavigate();
  const arrivals = [...APPTS].sort((a, b) => a.startMin - b.startMin).slice(0, 6);
  const queue = APPTS.filter((a) => a.status === "Arrived");
  const payments = APPTS.filter((a) => a.balance !== "₺0");
  const [transactionAppt, setTransactionAppt] = useState<Appt | null>(null);

  const consentOk = (a: Appt) => a.forms.every((f) => f.status === "Signed");
  const arrivalPill = (a: Appt) =>
    a.status === "Checked In" || a.status === "In Clinic" ? <StatusPill status="Checked In" type="success" /> :
    a.status === "Arrived" ? <StatusPill status="Arrived" type="warning" /> :
    <StatusPill status="Booked" />;

  return (
    <div className="flex gap-4 h-full min-h-0">
      <Section title="Arrivals" className="flex-1 min-w-0 h-full">
        <div className="divide-y divide-gray-100">
          {arrivals.map((a) => (
            <button key={a.id} onClick={() => openDrawer(nav, a.id)} className="w-full px-4 py-2.5 hover:bg-gray-50 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800 truncate">{a.timeLabel.slice(0, 5)} · {a.patient.name}</span>
                {arrivalPill(a)}
              </div>
              <div className="flex gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${consentOk(a) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}>Consent {consentOk(a) ? "✓" : "!"}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${a.payment === "Paid" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>Payment {a.payment === "Paid" ? "✓" : "!"}</span>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Check-in Queue" className="flex-1 min-w-0 h-full">
        <div className="divide-y divide-gray-100">
          {queue.map((a) => {
            const ready = consentOk(a) && a.payment === "Paid";
            const reason = !consentOk(a) ? "Awaiting consent" : a.payment !== "Paid" ? "Awaiting payment" : "Ready";
            return (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{a.patient.name}</div>
                  <div className="text-xs text-gray-400">Arrived {a.arrivedTime}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ready ? "bg-emerald-50 text-emerald-700" : reason === "Awaiting payment" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>{reason}</span>
                  <button
                    disabled={!ready}
                    onClick={() => toast.success(`${a.patient.name} checked in.`)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded ${ready ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"}`}
                  >
                    Check In
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Outstanding Payments" className="flex-1 min-w-0 h-full">
        <div className="divide-y divide-gray-100">
          {payments.map((a) => (
            <div key={a.id} className="px-4 py-2.5 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-1.5">
                <button onClick={() => nav("/billing")} className="text-sm font-medium text-gray-800 hover:underline truncate">{a.patient.name}</button>
                <span className="text-sm font-bold text-gray-800">{a.balance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{a.type.replace(" (in-person)", "").replace(" (video)", "")} · {a.payment}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setTransactionAppt(a)} className="px-2.5 py-1 text-[10px] font-bold text-slate-700 border border-slate-300 bg-slate-50 rounded hover:bg-slate-100">Start Transaction</button>
                  <button onClick={() => toast("Payment link sent")} className="px-2.5 py-1 text-[10px] font-bold text-gray-700 border border-gray-300 bg-white rounded hover:bg-gray-50">Send Link</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {transactionAppt && (
        <StartTransactionModal
          patient={transactionAppt.patient.name}
          service={transactionAppt.type.replace(" (in-person)", "").replace(" (video)", "")}
          amountDue={transactionAppt.balance}
          onClose={() => setTransactionAppt(null)}
          onComplete={() => { setTransactionAppt(null); toast.success(`Payment collected for ${transactionAppt.patient.name}.`); }}
        />
      )}
    </div>
  );
}

// Nurse now has its own dedicated single-focus dashboard — see
// NurseDashboardPage.tsx — rather than a panel in this shared layout.

// ============================ CLINICIAN ============================

export function ClinicianPanels() {
  const nav = useNavigate();

  const myPatients = [
    { patient: "Mackenzie Messineo", status: "Results Pending", type: "warning" as const },
    { patient: "Arysse Arcerola", status: "Awaiting Sign-off", type: "error" as const },
    { patient: "Cynthia Riboflavin", status: "Follow-up Due", type: "default" as const },
  ];

  const reviewQueue = [
    { patient: "Arysse Arcerola", test: "Genetic Panel", submitted: "28 Jun", sla: true },
    { patient: "Oliver Folate", test: "Comprehensive Blood", submitted: "01 Jul", sla: false },
    { patient: "Cynthia Riboflavin", test: "Lipid Panel", submitted: "02 Jul", sla: false },
    { patient: "Mackenzie Messineo", test: "Metabolic Panel", submitted: "02 Jul", sla: false },
    { patient: "Dylan Daniel", test: "Hormone Screen", submitted: "03 Jul", sla: false },
  ];

  // Dr. Claudia Reis's consultations & videos today.
  const consultations = APPTS
    .filter((a) => a.doctorId === CLINICIAN_ID && a.type !== "Body Scan")
    .sort((a, b) => a.startMin - b.startMin);

  const prepReady = (a: Appt) => a.forms.every((f) => f.status === "Signed") && a.prep.sample === "Collected" && a.prep.scan === "Completed";
  const joinable = (a: Appt) => a.isVideo && a.startMin - NOW_MINUTES <= 15 && a.startMin - NOW_MINUTES >= -a.durationMin;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <Section title="My Patients" className="flex-1 min-h-0">
        <div className="divide-y divide-gray-100">
          {myPatients.map((p) => (
            <button key={p.patient} onClick={() => nav("/patients/P-001")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <Flag className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">{p.patient}</span>
              </span>
              <StatusPill status={p.status} type={p.type} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Review Queue" className="flex-1 min-h-0">
        <div className="divide-y divide-gray-100">
          {reviewQueue.map((r) => (
            <div key={r.patient} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{r.patient}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  {r.test} · {r.submitted}
                  {r.sla && <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
                </div>
              </div>
              <button onClick={() => nav("/patients/P-001/results")} className="px-3 py-1.5 text-[11px] font-bold text-slate-700 border border-slate-300 bg-slate-50 rounded hover:bg-slate-100 shrink-0">Review</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Today's Consultations" className="flex-1 min-h-0">
        <div className="divide-y divide-gray-100">
          {consultations.map((a) => {
            const ready = prepReady(a);
            return (
              <div key={a.id} onClick={() => openDrawer(nav, a.id)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left gap-2 cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  {a.isVideo ? <Video className="w-4 h-4 text-slate-500 shrink-0" /> : <MapPin className="w-4 h-4 text-gray-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{a.timeLabel.slice(0, 5)} · {a.patient.name}</div>
                    <div className={`text-xs font-medium ${ready ? "text-emerald-600" : "text-orange-600"}`}>{ready ? "Ready" : "Not Ready"}</div>
                  </div>
                </div>
                {a.isVideo && (
                  <button
                    disabled={!joinable(a)}
                    onClick={(e) => { e.stopPropagation(); toast.success("Joining video call (demo)"); }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded shrink-0 flex items-center gap-1 ${joinable(a) ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"}`}
                  >
                    <Video className="w-3 h-3" /> Join
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
