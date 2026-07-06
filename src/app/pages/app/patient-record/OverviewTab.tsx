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
    <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}
