import React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PatientRecord } from "./patientRecordData";
import { Card, Field } from "./OverviewTab";

function AlertRow({ label, severity }: { label: string; severity: "critical" | "high" | "info" }) {
  const cls = severity === "critical" ? "bg-red-50 border-red-200 text-red-700" : severity === "high" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-gray-50 border-gray-200 text-gray-600";
  return (
    <div className={`flex items-center gap-2 border rounded px-3 py-2 text-sm font-medium ${cls}`}>
      <ShieldAlert className="w-4 h-4 shrink-0" /> {label}
    </div>
  );
}

export function AdminOverview({ patient }: { patient: PatientRecord }) {
  const navigate = useNavigate();

  return (
    <div className="p-8 grid grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* left column */}
      <div className="space-y-6">
        <Card title="Patient Summary">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registered" value={patient.registeredDate} />
            <Field label="Patient Group" value={patient.group} />
            <Field label="Preferred Language" value={patient.preferredLanguage} />
            <Field label="Nationality" value={patient.nationality} />
            <div className="col-span-2">
              <Field label="Emergency Contact" value={`${patient.emergencyContact.name} (${patient.emergencyContact.relation}) · ${patient.emergencyContact.phone}`} />
            </div>
          </div>
        </Card>

        <Card title="Flags & Alerts">
          {patient.medicalAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No active medical alerts.</p>
          ) : (
            <div className="space-y-2">
              {patient.medicalAlerts.map((a) => <AlertRow key={a.label} label={a.label} severity={a.severity} />)}
            </div>
          )}
        </Card>

        <Card title="Recent Visits">
          {patient.recentVisits.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No visits recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {patient.recentVisits.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{v.type}</div>
                    <div className="text-xs text-gray-500">{v.date} · {v.clinician}</div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{v.resultStatus}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* right column */}
      <div className="space-y-6">
        <Card title="Assigned Team" action={<button onClick={() => toast("Reassign (demo)")} className="text-xs font-bold text-slate-600 hover:underline">Reassign</button>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">{(patient.clinician ?? "—").split(" ").map((w) => w[0]).slice(-2).join("")}</div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clinician</div>
                <div className="text-sm font-bold text-gray-800 truncate">{patient.clinician ?? "Unassigned"}</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{(patient.nurse ?? "—").split(" ").map((w) => w[0]).slice(-2).join("")}</div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nurse</div>
                <div className="text-sm font-bold text-gray-800 truncate">{patient.nurse ?? "Unassigned"}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Health Snapshot">
          {patient.biomarkers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No results on file yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {patient.biomarkers.map((b) => (
                  <div key={b.label} className="border border-gray-200 rounded p-2.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{b.label}</div>
                    <div className={`text-sm font-bold ${b.flag === "high" ? "text-red-600" : b.flag === "low" ? "text-orange-600" : "text-gray-800"}`}>{b.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">From latest results.</p>
            </>
          )}
        </Card>

        <Card title="Billing Summary" action={<button onClick={() => navigate("/billing")} className="text-xs font-bold text-slate-600 hover:underline">View billing</button>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Spent" value={patient.billing.totalSpent} />
            <Field label="Outstanding Balance" value={<span className={patient.billing.outstanding === "₺0" ? "text-emerald-600" : "text-red-600"}>{patient.billing.outstanding}</span>} />
          </div>
        </Card>

        <Card title="Activity">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
              <span className="text-gray-600">Checked in for Body Scan · <span className="text-gray-400">today, 07:52</span></span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
              <span className="text-gray-600">Consent signed for Body Scan · <span className="text-gray-400">1 Jul</span></span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
              <span className="text-gray-600">Appointment booked: 10 Jul Consultation · <span className="text-gray-400">28 Jun</span></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
