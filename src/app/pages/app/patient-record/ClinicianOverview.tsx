import React from "react";
import { ShieldAlert, Pill } from "lucide-react";
import { PatientRecord } from "./patientRecordData";
import { Card, Field } from "./OverviewTab";

function AlertRow({ label, severity }: { label: string; severity: "critical" | "high" | "info" }) {
  const cls = severity === "critical" ? "bg-danger/10 border-danger/30 text-danger-ink" : severity === "high" ? "bg-warning/10 border-warning/30 text-warning-ink" : "bg-surface-page border-divider text-ink-soft";
  return (
    <div className={`flex items-center gap-2 border rounded-control px-3 py-2 text-sm font-medium ${cls}`}>
      <ShieldAlert className="w-4 h-4 shrink-0" /> {label}
    </div>
  );
}

export function ClinicianOverview({ patient }: { patient: PatientRecord }) {
  return (
    <div className="px-4 py-4 grid grid-cols-2 gap-5">
      {/* left column */}
      <div className="space-y-3">
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
            <p className="text-sm text-ink-muted italic">No active medical alerts.</p>
          ) : (
            <div className="space-y-2">
              {patient.medicalAlerts.map((a) => <AlertRow key={a.label} label={a.label} severity={a.severity} />)}
            </div>
          )}
        </Card>

        <Card title="Recent Visits">
          {patient.recentVisits.length === 0 ? (
            <p className="text-sm text-ink-muted italic">No visits recorded yet.</p>
          ) : (
            <div className="divide-y divide-divider">
              {patient.recentVisits.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-bold text-ink">{v.type}</div>
                    <div className="text-xs text-ink-muted">{v.date} · {v.clinician}</div>
                  </div>
                  <span className="text-xs font-medium text-ink-muted">{v.resultStatus}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* right column */}
      <div className="space-y-3">
        <Card title="Assigned Team">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-divider rounded-control p-3">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider">Clinician</div>
              <div className="text-sm font-bold text-ink">{patient.clinician ?? "Unassigned"}</div>
            </div>
            <div className="border border-divider rounded-control p-3">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider">Nurse</div>
              <div className="text-sm font-bold text-ink">{patient.nurse ?? "Unassigned"}</div>
            </div>
          </div>
        </Card>

        <Card title="Clinical Snapshot">
          {patient.biomarkers.length === 0 ? (
            <p className="text-sm text-ink-muted italic">No results on file yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {patient.biomarkers.map((b) => (
                <div key={b.label} className="border border-divider rounded-control p-2.5">
                  <div className="text-label font-bold text-ink-muted uppercase tracking-wider">{b.label}</div>
                  <div className={`text-sm font-bold ${b.flag === "high" ? "text-danger-ink" : b.flag === "low" ? "text-warning-ink" : "text-ink"}`}>{b.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-divider">
            <div>
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1.5">Active Diagnoses</div>
              {patient.activeDiagnoses.length === 0 ? <span className="text-sm text-ink-muted italic">None</span> : (
                <div className="space-y-1">{patient.activeDiagnoses.map((d) => <div key={d} className="text-sm font-medium text-ink">{d}</div>)}</div>
              )}
            </div>
            <div>
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1.5 flex items-center gap-1"><Pill className="w-3 h-3" /> Current Medications</div>
              {patient.medications.length === 0 ? <span className="text-sm text-ink-muted italic">None</span> : (
                <div className="space-y-1">{patient.medications.map((m) => <div key={m} className="text-sm font-medium text-ink">{m}</div>)}</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
