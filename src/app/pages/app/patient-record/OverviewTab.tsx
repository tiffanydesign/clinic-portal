import React from "react";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { AdminOverview } from "./AdminOverview";
import { ReceptionOverview } from "./ReceptionOverview";
import { ClinicianOverview } from "./ClinicianOverview";

export function OverviewTab() {
  const { patient, role } = usePatientOutletContext();
  if (role === "Reception") return <ReceptionOverview patient={patient} />;
  if (role === "Clinician") return <ClinicianOverview patient={patient} />;
  // Admin (Nurse never sees this tab)
  return <AdminOverview patient={patient} />;
}

export function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border border-divider rounded-card bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-divider flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
