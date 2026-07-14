// Shared types, mock data, and role/permission helpers for the Patient Record
// module (/patients/:patientId). Layers richer clinical/operational data on
// top of the roster already defined in PatientsPage.tsx.

import type { Role } from "../../../context/AppContext";
import { MOCK_PATIENTS, Patient as RosterPatient } from "../patientsData";

export type TabKey = "overview" | "results" | "journeys" | "signed-forms" | "notes" | "appointments";

// Tab visibility mirrors the defaults configured in Staff Management ->
// Permissions; a real backend would resolve this per-staff-member instead of
// per-role, but the role default is what every seeded account currently has.
export const ROLE_TABS: Record<Role, TabKey[]> = {
  Admin: ["overview", "results", "journeys", "signed-forms", "notes", "appointments"],
  Reception: ["overview", "journeys", "signed-forms", "appointments"],
  Nurse: ["journeys", "signed-forms", "appointments"],
  Clinician: ["overview", "results", "journeys", "notes", "appointments"],
};

export const TAB_LABEL: Record<TabKey, string> = {
  overview: "Overview",
  results: "Results",
  journeys: "Journeys",
  "signed-forms": "Signed Forms",
  notes: "Clinician Notes",
  appointments: "Appointments",
};

export const DEFAULT_TAB: Record<Role, TabKey> = {
  Admin: "overview",
  Reception: "overview",
  Nurse: "journeys",
  Clinician: "overview",
};

// --- extended clinical/operational types ---

export type MedicalAlert = { label: string; severity: "critical" | "high" | "info" };

export type Visit = { date: string; type: string; clinician: string; resultStatus: string };

export type JourneyStepStatus = "Completed" | "In Progress" | "Pending";
export type JourneyStep = {
  name: string;
  status: JourneyStepStatus;
  by?: string;
  at?: string;
  notes?: string[];
  attachments?: string[];
};
export type JourneyStatus = "Active" | "Completed" | "Not Started";
export type Journey = {
  id: string;
  name: string;
  status: JourneyStatus;
  steps: JourneyStep[];
  startedAt?: string;
  completedAt?: string;
  assignedNurse?: string;
  assignedClinician?: string;
};

export type FormStatus = "Signed" | "Pending Signature" | "Not Sent" | "Expired";
export type SignedForm = {
  id: string;
  name: string;
  type: string;
  version: string;
  status: FormStatus;
  signedDate?: string;
  signedBy?: string;
};

export type ClinicianNote = {
  id: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
  body: string;
  diagnosisTags: string[];
  attachments: string[];
  editable: boolean; // author + within the edit window
};

export type RecordAppt = {
  id: string;
  dateLabel: string;
  type: string;
  clinician: string;
  room: string;
  status: string;
  isVideo?: boolean;
};

export type PatientRecord = RosterPatient & {
  dob: string;
  nationality: string;
  preferredLanguage: string;
  registeredDate: string;
  emergencyContact: { name: string; relation: string; phone: string };
  medicalAlerts: MedicalAlert[];
  recentVisits: Visit[];
  billing: { totalSpent: string; outstanding: string };
  biomarkers: { label: string; value: string; flag?: "high" | "low" | "normal" }[];
  activeDiagnoses: string[];
  medications: string[];
  journeys: Journey[];
  signedForms: SignedForm[];
  clinicianNotes: ClinicianNote[];
  appointmentsUpcoming: RecordAppt[];
  appointmentsPrevious: RecordAppt[];
};

// --- Ece Yıldırım: the fully-detailed reference record ---

const MACKENZIE: PatientRecord = {
  ...(MOCK_PATIENTS.find((p) => p.patientId === "PH-2026-0042") as RosterPatient),
  nationality: "Turkish",
  preferredLanguage: "English",
  registeredDate: "18 Mar 2025",
  emergencyContact: { name: "Zeynep Yıldırım", relation: "Sister", phone: "+90 532 111 9900" },
  medicalAlerts: [{ label: "Allergy: Penicillin", severity: "critical" }],
  recentVisits: [
    { date: "1 Jul 2026", type: "Consultation", clinician: "Dr. Ebru Reis", resultStatus: "Reviewed" },
    { date: "18 Mar 2026", type: "Body Scan", clinician: "Dr. Ebru Reis", resultStatus: "Reviewed" },
    { date: "2 Jan 2026", type: "Follow-up", clinician: "Dr. Ebru Reis", resultStatus: "Reviewed" },
    { date: "10 Oct 2025", type: "Sample Collection", clinician: "Berna Koç", resultStatus: "Reviewed" },
    { date: "18 Mar 2025", type: "Registration", clinician: "—", resultStatus: "N/A" },
  ],
  billing: { totalSpent: "₺18,000", outstanding: "₺0" },
  biomarkers: [
    { label: "Vitamin D", value: "22 ng/mL", flag: "low" },
    { label: "Resting HR", value: "58 bpm", flag: "normal" },
    { label: "Fasting Glucose", value: "94 mg/dL", flag: "normal" },
    { label: "LDL Cholesterol", value: "132 mg/dL", flag: "high" },
  ],
  activeDiagnoses: ["Vitamin D Insufficiency"],
  medications: ["Vitamin D3 2000 IU daily"],
  journeys: [
    {
      id: "J-7OMICS",
      name: "7-Omics Premium Journey",
      status: "Active",
      startedAt: "1 Jul 2026",
      assignedNurse: "Berna Koç",
      assignedClinician: "Dr. Ebru Reis",
      steps: [
        { name: "Consent", status: "Completed", by: "Elif Yıldız", at: "1 Jul, 07:52" },
        { name: "Changing Room", status: "Completed", by: "Berna Koç", at: "1 Jul, 08:00" },
        { name: "Scan", status: "In Progress", by: "Berna Koç", at: "1 Jul, 08:10" },
        { name: "Sample Collection", status: "Pending" },
        { name: "Consultation", status: "Pending" },
        { name: "Home Test Kit", status: "Pending" },
      ],
    },
    {
      id: "J-INITIAL",
      name: "Initial Consultation Journey",
      status: "Completed",
      startedAt: "18 Mar 2025",
      completedAt: "18 Mar 2025",
      assignedNurse: "Berna Koç",
      assignedClinician: "Dr. Ebru Reis",
      steps: [
        { name: "Consent", status: "Completed", by: "Elif Yıldız", at: "18 Mar 2025, 09:00" },
        { name: "Consultation", status: "Completed", by: "Dr. Ebru Reis", at: "18 Mar 2025, 09:30" },
        { name: "Test Kit", status: "Completed", by: "Berna Koç", at: "18 Mar 2025, 10:00" },
      ],
    },
  ],
  signedForms: [
    { id: "F-1", name: "Informed Consent — Body Scan", type: "Consent", version: "v2.1", status: "Signed", signedDate: "1 Jul 2026", signedBy: "Ece Yıldırım" },
    { id: "F-2", name: "Privacy Agreement", type: "Agreement", version: "v1.4", status: "Signed", signedDate: "15 Jun 2026", signedBy: "Ece Yıldırım" },
    { id: "F-3", name: "Genetic Testing Consent", type: "Consent", version: "v1.0", status: "Pending Signature" },
  ],
  clinicianNotes: [
    {
      id: "N-3", authorId: "EMP-003", author: "Dr. Ebru Reis", authorAvatar: "ER", timestamp: "3 Jul 2026, 09:20",
      body: "Reviewed body scan results with patient. Vitamin D remains low despite supplementation — recommend increasing to 4000 IU and re-testing in 8 weeks.",
      diagnosisTags: ["Vitamin D Insufficiency"], attachments: [], editable: true,
    },
    {
      id: "N-2", authorId: "EMP-003", author: "Dr. Ebru Reis", authorAvatar: "ER", timestamp: "1 Jul 2026, 10:15",
      body: "Follow-up consultation. Patient reports improved energy levels. LDL slightly elevated; discussed dietary adjustments, no medication change at this time.",
      diagnosisTags: ["LDL Elevation"], attachments: ["lipid_panel_1jul.pdf"], editable: false,
    },
    {
      id: "N-1", authorId: "EMP-003", author: "Dr. Ebru Reis", authorAvatar: "ER", timestamp: "18 Mar 2025, 09:45",
      body: "Initial consultation completed. Patient in good general health. Baseline body scan and bloodwork ordered as part of the 7-Omics Premium package.",
      diagnosisTags: [], attachments: [], editable: false,
    },
  ],
  appointmentsUpcoming: [
    { id: "A-01", dateLabel: "3 Jul 2026, 08:00", type: "Body Scan", clinician: "Dr. Ebru Reis", room: "Scan A", status: "In Clinic" },
    { id: "A-13", dateLabel: "10 Jul 2026, 09:00", type: "Consultation", clinician: "Dr. Ebru Reis", room: "Room 1", status: "Booked" },
  ],
  appointmentsPrevious: [
    { id: "A-P1", dateLabel: "1 Jul 2026, 09:00", type: "Consultation", clinician: "Dr. Ebru Reis", room: "Room 1", status: "Completed" },
    { id: "A-P2", dateLabel: "15 Jun 2026, 10:00", type: "Registration", clinician: "—", room: "Front Desk", status: "Completed" },
  ],
};

// --- lightweight synthesized record for every other roster patient ---

function synthesize(base: RosterPatient): PatientRecord {
  const hasJourney = base.journeyStep !== null;
  return {
    ...base,
    dob: "—",
    nationality: "—",
    preferredLanguage: "English",
    registeredDate: base.lastVisit === "Never" ? "—" : base.lastVisit,
    emergencyContact: { name: "—", relation: "—", phone: "—" },
    medicalAlerts: [],
    recentVisits: base.lastVisit !== "Never"
      ? [{ date: base.lastVisit, type: "Consultation", clinician: base.clinician ?? "—", resultStatus: "Reviewed" }]
      : [],
    billing: { totalSpent: "₺0", outstanding: base.payment === "Unpaid" ? "₺2,400" : "₺0" },
    biomarkers: [],
    activeDiagnoses: [],
    medications: [],
    journeys: hasJourney
      ? [{
          id: `J-${base.id}`,
          name: "Body Scan Journey",
          status: "Active",
          startedAt: base.lastVisit,
          assignedNurse: base.nurse ?? undefined,
          assignedClinician: base.clinician ?? undefined,
          steps: [
            { name: "Consent", status: "Completed" },
            { name: "Changing Room", status: "Completed" },
            { name: "Scan", status: "In Progress" },
            { name: "Consultation", status: "Pending" },
          ],
        }]
      : [],
    signedForms: [
      { id: `F-${base.id}-1`, name: "Privacy Agreement", type: "Agreement", version: "v1.4", status: base.consent === "Signed" ? "Signed" : base.consent === "Pending" ? "Pending Signature" : "Not Sent", signedDate: base.consent === "Signed" ? base.lastVisit : undefined, signedBy: base.consent === "Signed" ? base.name : undefined },
    ],
    clinicianNotes: [],
    appointmentsUpcoming: base.nextAppt ? [{ id: `A-${base.id}-U`, dateLabel: base.nextAppt, type: base.nextAppt.split("· ")[1] ?? "Consultation", clinician: base.clinician ?? "—", room: "—", status: "Booked" }] : [],
    appointmentsPrevious: base.lastVisit !== "Never" ? [{ id: `A-${base.id}-P`, dateLabel: base.lastVisit, type: "Consultation", clinician: base.clinician ?? "—", room: "—", status: "Completed" }] : [],
  };
}

const RECORDS: Record<string, PatientRecord> = {
  "PH-2026-0042": MACKENZIE,
};
MOCK_PATIENTS.forEach((p) => {
  if (!RECORDS[p.patientId]) RECORDS[p.patientId] = synthesize(p);
});

// Legacy placeholder links scattered across Dashboard/Calendar/Staff mocks
// point at "/patients/P-001"; alias it to the fully-detailed reference patient.
const LEGACY_ALIAS = "P-001";

export function getPatientRecord(idParam: string | undefined): PatientRecord {
  if (!idParam) return MACKENZIE;
  if (idParam === LEGACY_ALIAS) return MACKENZIE;
  if (RECORDS[idParam]) return RECORDS[idParam];
  const byInternalId = MOCK_PATIENTS.find((p) => p.id === idParam);
  if (byInternalId) return RECORDS[byInternalId.patientId];
  return MACKENZIE;
}

export function statusPillClass(status: PatientRecord["status"]): string {
  switch (status) {
    case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Inactive": return "bg-gray-50 text-gray-500 border-gray-200";
    case "New": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Pending Onboarding": return "bg-orange-50 text-orange-700 border-orange-200";
  }
}

export function flagIndicator(flag: PatientRecord["flag"]): { emoji: string; label: string } | null {
  switch (flag) {
    case "Urgent": return { emoji: "🔴", label: "Urgent" };
    case "Follow-up": return { emoji: "🟠", label: "Follow-up" };
    case "Watch": return { emoji: "🟡", label: "Watch" };
    default: return null;
  }
}

export function formStatusPillType(status: FormStatus): "success" | "warning" | "error" | "default" {
  if (status === "Signed") return "success";
  if (status === "Pending Signature") return "warning";
  if (status === "Not Sent") return "error";
  return "default";
}

export function journeyStatusPillType(status: JourneyStatus): "success" | "default" | "warning" {
  if (status === "Active") return "success";
  if (status === "Completed") return "default";
  return "warning";
}

export function journeyProgress(j: Journey): { done: number; total: number; currentIndex: number } {
  const total = j.steps.length;
  const done = j.steps.filter((s) => s.status === "Completed").length;
  const currentIndex = j.steps.findIndex((s) => s.status === "In Progress");
  return { done, total, currentIndex: currentIndex === -1 ? done : currentIndex };
}
