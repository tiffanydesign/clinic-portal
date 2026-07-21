import React from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { formStatusPillType } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";

export function SignedFormsTab() {
  const { patient, role } = usePatientOutletContext();

  if (patient.signedForms.length === 0) {
    return <div className="p-4 text-center text-ink-muted italic">No forms on file.</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="border border-divider rounded-card bg-surface overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-page border-b border-divider text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Form Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Signed Date</th>
              <th className="px-4 py-3 font-semibold">Signed By</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {patient.signedForms.map((f) => {
              const unsigned = f.status !== "Signed";
              return (
                <tr key={f.id} className="hover:bg-surface-page">
                  <td className="px-4 py-3 font-medium text-ink">
                    <span className="flex items-center gap-2">
                      {unsigned && <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />}
                      {f.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{f.type}</td>
                  <td className="px-4 py-3 text-ink-muted font-mono text-xs">{f.version}</td>
                  <td className="px-4 py-3"><StatusPill status={f.status} type={formStatusPillType(f.status)} /></td>
                  <td className="px-4 py-3 text-ink-soft">{f.signedDate ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{f.signedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {f.status === "Signed" && (
                        <button onClick={() => toast("Opening signed PDF (demo)")} className="px-2.5 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface-page rounded-control hover:bg-surface-hover">View PDF</button>
                      )}
                      {role === "Admin" && f.status === "Signed" && (
                        <button onClick={() => toast("Downloading PDF (demo)")} className="px-2.5 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-page">Download</button>
                      )}
                      {role === "Admin" && unsigned && (
                        <button onClick={() => toast("Form resent (demo)")} className="px-2.5 py-1 text-xs font-bold text-white bg-ink rounded-control hover:bg-surface-sunken">Resend Form</button>
                      )}
                      {role === "Reception" && unsigned && (
                        <button onClick={() => toast("Form sent to patient app")} className="px-2.5 py-1 text-xs font-bold text-white bg-ink rounded-control hover:bg-surface-sunken">Send Form</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
