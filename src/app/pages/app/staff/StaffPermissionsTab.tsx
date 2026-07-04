import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getStaff } from "./staffData";

type PermRow = { key: string; label: string; note?: string };
type MatrixGroup = {
  id: string;
  title: string;
  columns: string[]; // e.g. ["View", "Edit"] or ["Access"]
  rows: PermRow[];
};

const GROUPS: MatrixGroup[] = [
  {
    id: "record",
    title: "Patient Record Access",
    columns: ["View", "Edit"],
    rows: [
      { key: "overview", label: "Overview", note: "Core patient info" },
      { key: "results", label: "Results", note: "Clinician can view; edit reserved for lab" },
      { key: "journeys", label: "Journeys" },
      { key: "signed-forms", label: "Signed Forms", note: "View only; forms managed by reception" },
      { key: "notes", label: "Clinician Notes", note: "Only own notes; others' notes read-only" },
      { key: "appointments", label: "Appointments" },
    ],
  },
  {
    id: "operations",
    title: "Clinic Operations",
    columns: ["Access"],
    rows: [
      { key: "cal-view-all", label: "Calendar — View all staff", note: "Can see clinic-wide calendar" },
      { key: "cal-edit-own", label: "Calendar — Edit own appointments" },
      { key: "cal-edit-others", label: "Calendar — Edit others' appointments", note: "Admin only by default" },
      { key: "patients-view-all", label: "Patient List — View all patients", note: "Clinician sees assigned only" },
      { key: "patients-create", label: "Patient List — Create new patient", note: "Reception & Admin only" },
      { key: "billing-view", label: "Billing — View" },
      { key: "billing-pay", label: "Billing — Process payment" },
    ],
  },
  {
    id: "data",
    title: "Data & Export",
    columns: ["Access"],
    rows: [
      { key: "export-patient", label: "Export patient data", note: "GDPR/KVKK sensitive" },
      { key: "export-reports", label: "Export reports", note: "Own patients only" },
      { key: "audit-log", label: "View audit log", note: "Admin only" },
      { key: "settings", label: "Access clinic settings", note: "Admin only" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    columns: ["Access"],
    rows: [
      { key: "msg-patients", label: "Send messages to patients" },
      { key: "payment-links", label: "Send payment links", note: "Reception only" },
      { key: "staff-contacts", label: "View staff contact details" },
    ],
  },
];

// Clinician role defaults, keyed "<group>:<row>:<column>"
const DEFAULTS: Record<string, boolean> = {
  "record:overview:View": true, "record:overview:Edit": true,
  "record:results:View": true, "record:results:Edit": false,
  "record:journeys:View": true, "record:journeys:Edit": true,
  "record:signed-forms:View": true, "record:signed-forms:Edit": false,
  "record:notes:View": true, "record:notes:Edit": true,
  "record:appointments:View": true, "record:appointments:Edit": true,
  "operations:cal-view-all:Access": true,
  "operations:cal-edit-own:Access": true,
  "operations:cal-edit-others:Access": false,
  "operations:patients-view-all:Access": false,
  "operations:patients-create:Access": false,
  "operations:billing-view:Access": false,
  "operations:billing-pay:Access": false,
  "data:export-patient:Access": false,
  "data:export-reports:Access": true,
  "data:audit-log:Access": false,
  "data:settings:Access": false,
  "communication:msg-patients:Access": true,
  "communication:payment-links:Access": false,
  "communication:staff-contacts:Access": true,
};

function PermToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-emerald-500" : "bg-gray-300"}`}
    >
      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${on ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

export function StaffPermissionsTab() {
  const { staffId } = useParams();
  const staff = getStaff(staffId);
  const [perms, setPerms] = useState<Record<string, boolean>>({ ...DEFAULTS });
  const [dirty, setDirty] = useState(false);

  const groupKeys = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const g of GROUPS) map[g.id] = g.rows.flatMap((r) => g.columns.map((c) => `${g.id}:${r.key}:${c}`));
    return map;
  }, []);

  if (!staff) return null;

  const setPerm = (key: string, value: boolean) => {
    setPerms((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleGroup = (groupId: string) => {
    const keys = groupKeys[groupId];
    const allOn = keys.every((k) => perms[k]);
    setPerms((prev) => {
      const next = { ...prev };
      keys.forEach((k) => { next[k] = !allOn; });
      return next;
    });
    setDirty(true);
  };

  const handleReset = () => {
    setPerms({ ...DEFAULTS });
    setDirty(true);
    toast("Permissions reset to the role default for review — save to apply.");
  };

  const handleSave = () => {
    setDirty(false);
    toast.success("Permissions saved.");
  };

  const handleCancel = () => {
    setPerms({ ...DEFAULTS });
    setDirty(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-28">
      {/* Heading */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Permissions for {staff.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Control what this staff member can view and do within the portal</p>
        </div>
        <button onClick={handleReset} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
          Reset to Role Default
        </button>
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => {
          const keys = groupKeys[group.id];
          const allOn = keys.every((k) => perms[k]);
          return (
            <div key={group.id} className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800">{group.title}</h3>
                <label className="flex items-center text-xs font-medium text-gray-500 cursor-pointer">
                  <span className="mr-2.5">{allOn ? "All on" : "Select all"}</span>
                  <PermToggle on={allOn} onChange={() => toggleGroup(group.id)} />
                </label>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-2.5 font-bold text-gray-500 text-xs uppercase tracking-wider">{group.id === "record" ? "Section" : "Operation"}</th>
                    {group.columns.map((c) => (
                      <th key={c} className="px-6 py-2.5 font-bold text-gray-500 text-xs uppercase tracking-wider w-[110px] text-center">{c}</th>
                    ))}
                    <th className="px-6 py-2.5 font-bold text-gray-500 text-xs uppercase tracking-wider w-[280px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.rows.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{row.label}</td>
                      {group.columns.map((c) => {
                        const key = `${group.id}:${row.key}:${c}`;
                        return (
                          <td key={c} className="px-6 py-3 text-center">
                            <PermToggle on={!!perms[key]} onChange={() => setPerm(key, !perms[key])} />
                          </td>
                        );
                      })}
                      <td className="px-6 py-3 text-xs text-gray-500">{row.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="mt-8 bg-white border border-gray-300 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Last updated: <span className="font-bold text-gray-700">28 Jun 2026</span> by Ayşe Hançer
        </div>
        <div className="flex items-center space-x-3">
          {dirty && (
            <span className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Unsaved changes
            </span>
          )}
          <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">Save Permissions</button>
        </div>
      </div>
    </div>
  );
}
