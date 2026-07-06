import React from "react";
import { ShieldAlert, Pill } from "lucide-react";
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

export function ClinicianOverview({ patient }: { patient: PatientRecord }) {
  return (
    <div className="p-8 grid grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* left column */}
      <div className="space-y-6">
        <Card title="Patient Summary">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Age / Sex" value={`${patient.age} · ${patient.sex}`} />
            <Field label="Group" value={patient.group} />
            <Field label="Nationality" value={patient.nationality} />
            <Field label="Preferred Language" value={patient.preferredLanguage} />
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
        <Card title="Assigned Team">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clinician</div>
              <div className="text-sm font-bold text-gray-800">{patient.clinician ?? "Unassigned"}</div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nurse</div>
              <div className="text-sm font-bold text-gray-800">{patient.nurse ?? "Unassigned"}</div>
            </div>
          </div>
        </Card>

        <Card title="Clinical Snapshot">
          {patient.biomarkers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No results on file yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {patient.biomarkers.map((b) => (
                <div key={b.label} className="border border-gray-200 rounded p-2.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{b.label}</div>
                  <div className={`text-sm font-bold ${b.flag === "high" ? "text-red-600" : b.flag === "low" ? "text-orange-600" : "text-gray-800"}`}>{b.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Active Diagnoses</div>
              {patient.activeDiagnoses.length === 0 ? <span className="text-sm text-gray-400 italic">None</span> : (
                <div className="space-y-1">{patient.activeDiagnoses.map((d) => <div key={d} className="text-sm font-medium text-gray-800">{d}</div>)}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Pill className="w-3 h-3" /> Current Medications</div>
              {patient.medications.length === 0 ? <span className="text-sm text-gray-400 italic">None</span> : (
                <div className="space-y-1">{patient.medications.map((m) => <div key={m} className="text-sm font-medium text-gray-800">{m}</div>)}</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
