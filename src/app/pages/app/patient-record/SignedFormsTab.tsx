import React from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { formStatusPillType } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";

export function SignedFormsTab() {
  const { patient, role } = usePatientOutletContext();

  if (patient.signedForms.length === 0) {
    return <div className="p-8 text-center text-gray-400 italic">No forms on file.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
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
          <tbody className="divide-y divide-gray-100">
            {patient.signedForms.map((f) => {
              const unsigned = f.status !== "Signed";
              return (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <span className="flex items-center gap-2">
                      {unsigned && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                      {f.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.type}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{f.version}</td>
                  <td className="px-4 py-3"><StatusPill status={f.status} type={formStatusPillType(f.status)} /></td>
                  <td className="px-4 py-3 text-gray-600">{f.signedDate ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{f.signedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {f.status === "Signed" && (
                        <button onClick={() => toast("Opening signed PDF (demo)")} className="px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-300 bg-slate-50 rounded hover:bg-slate-100">View PDF</button>
                      )}
                      {role === "Admin" && f.status === "Signed" && (
                        <button onClick={() => toast("Downloading PDF (demo)")} className="px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-300 bg-white rounded hover:bg-gray-50">Download</button>
                      )}
                      {role === "Admin" && unsigned && (
                        <button onClick={() => toast("Form resent (demo)")} className="px-2.5 py-1 text-xs font-bold text-white bg-slate-600 rounded hover:bg-slate-700">Resend Form</button>
                      )}
                      {role === "Reception" && unsigned && (
                        <button onClick={() => toast("Form sent to patient app")} className="px-2.5 py-1 text-xs font-bold text-white bg-slate-600 rounded hover:bg-slate-700">Send Form</button>
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
