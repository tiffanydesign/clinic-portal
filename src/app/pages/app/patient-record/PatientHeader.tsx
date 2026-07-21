import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, Phone, Mail, MoreHorizontal, Flag as FlagIcon, X } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "../../../context/AppContext";
import { PatientRecord, statusPillClass, flagIndicator } from "./patientRecordData";

function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-ink-soft">{children}</div>
    </div>
  );
}

function AdminActions({ patient }: { patient: PatientRecord }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 relative">
      <button onClick={() => toast("Edit Patient (demo)")} className="px-4 py-2 bg-surface border border-divider rounded-control text-sm font-bold text-ink-soft hover:bg-surface-page shadow-sm transition-colors">
        Edit Patient
      </button>
      <button onClick={() => setMenuOpen((o) => !o)} className="p-2 border border-divider rounded-control text-ink-muted hover:bg-surface-page shadow-sm">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-divider rounded-control shadow-lg py-1 w-48">
            {["Assign Staff", "Change Status", "Export Record"].map((label) => (
              <button key={label} onClick={() => { toast(`${label} (demo)`); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-surface-page">{label}</button>
            ))}
            <div className="border-t border-divider my-1" />
            <button onClick={() => { toast.error("Delete patient (demo)"); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-danger-ink hover:bg-danger/10">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

function ReceptionActions() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => toast("Contact patient (demo)")} className="px-4 py-2 bg-surface border border-divider rounded-control text-sm font-bold text-ink-soft hover:bg-surface-page shadow-sm transition-colors">
        Contact Patient
      </button>
      <button onClick={() => navigate("/calendar/schedule")} className="px-4 py-2 btn-primary rounded-control text-sm font-bold transition-colors">
        + New Appointment
      </button>
    </div>
  );
}

function ClinicianActions({ flag, onSetFlag }: { flag: PatientRecord["flag"]; onSetFlag: (f: PatientRecord["flag"]) => void }) {
  const [open, setOpen] = useState(false);
  const options: PatientRecord["flag"][] = ["Urgent", "Follow-up", "Watch", "No flag"];
  return (
    <div className="flex items-center gap-2 relative">
      <button onClick={() => toast.success("Consultation started (demo)")} className="px-4 py-2 btn-primary rounded-control text-sm font-bold transition-colors">
        Start Consultation
      </button>
      <button onClick={() => setOpen((o) => !o)} title="Set flag" className="p-2 border border-divider rounded-control text-ink-muted hover:bg-surface-page shadow-sm">
        <FlagIcon className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-divider rounded-control shadow-lg py-1 w-40">
            {options.map((f) => (
              <button key={f} onClick={() => { onSetFlag(f); setOpen(false); toast.success(`Flag set: ${f}`); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-page ${flag === f ? "font-bold text-ink-soft" : "text-ink-soft"}`}>{f}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PatientHeader({ patient, role, backTo, flag, onSetFlag }: {
  patient: PatientRecord; role: Role; backTo: string; flag: PatientRecord["flag"]; onSetFlag: (f: PatientRecord["flag"]) => void;
}) {
  const flagInfo = flagIndicator(flag);

  return (
    <div className="bg-surface border-b border-divider shrink-0 z-20 relative">
      <div className="px-6 pt-3">
        <Link to={backTo} className="flex items-center text-sm font-bold text-ink-muted hover:text-ink transition-colors w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Link>
      </div>

      <div className="px-6 pb-5 pt-3">
        <div className="flex items-start gap-5">
          {/* avatar + status */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-20 h-20 rounded-full bg-surface-hover text-ink-soft flex items-center justify-center text-2xl font-bold shadow-sm">
              {patient.avatar}
            </div>
            <span className={`px-2 py-0.5 border rounded-control text-overline whitespace-nowrap ${statusPillClass(patient.status)}`}>
              {patient.status}
            </span>
          </div>

          {/* main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-ink truncate">{patient.name}</h1>
              {flagInfo && <span title={flagInfo.label} className="text-lg leading-none">{flagInfo.emoji}</span>}
              <span className="text-sm text-ink-muted font-mono ml-1">{patient.patientId}</span>
            </div>
            <div className="text-sm text-ink-soft mb-1.5">
              DOB {patient.dob} · Age {patient.age} · {patient.sex === "F" ? "Female" : patient.sex === "M" ? "Male" : "Other"}
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {patient.phone}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {patient.email}</span>
            </div>
          </div>

          {/* right info block */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 shrink-0 mr-4">
            <InfoLine label="Assigned Clinician">{patient.clinician ?? "Unassigned"}</InfoLine>
            <InfoLine label="Assigned Nurse">{patient.nurse ?? "—"}</InfoLine>
            <InfoLine label="Last Visit">{patient.lastVisit}</InfoLine>
            <InfoLine label="Next Appointment">{patient.nextAppt ?? "None"}</InfoLine>
          </div>

          {/* role actions */}
          <div className="shrink-0">
            {role === "Admin" && <AdminActions patient={patient} />}
            {role === "Reception" && <ReceptionActions />}
            {role === "Clinician" && <ClinicianActions flag={flag} onSetFlag={onSetFlag} />}
            {role === "Nurse" && <div className="text-xs text-ink-muted italic px-2">Read-only</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
