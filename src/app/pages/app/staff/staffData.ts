// Shared types, mock data, and style helpers for the Staff Management module.

export type StaffRole = "Admin" | "Clinician" | "Nurse" | "Receptionist";
export type StaffStatus = "Active" | "On Leave" | "Inactive";
export type TodayStatus = "On Duty" | "Off" | "On Leave";

export type Staff = {
  id: string; // Employee ID, used as the route param
  name: string;
  avatar: string; // initials
  role: StaffRole;
  email: string;
  phone: string;
  status: StaffStatus;
  leaveRange?: string; // shown in tooltip when On Leave
  today: TodayStatus;
  todayNote?: string;
  patients: number | null; // Clinician & Nurse only
  workload: number | null; // percentage, Clinician & Nurse only
  nextShift: string;
  lastActive: string;
  lastActiveDays: number; // for the > 7 days red highlight
  joined: string;
  specialisation?: string;
  licenseNumber?: string;
};

// The demo session is signed in as Ayşe Hançer (Admin) — she cannot deactivate herself.
export const CURRENT_ADMIN_ID = "EMP-001";

export const MOCK_STAFF: Staff[] = [
  // Clinicians
  { id: "EMP-003", name: "Dr. Ebru Reis", avatar: "ER", role: "Clinician", email: "ebru@phenome.com", phone: "+90 532 555 0103", status: "Active", today: "On Duty", patients: 24, workload: 82, nextShift: "Today, 8:30", lastActive: "2h ago", lastActiveDays: 0, joined: "15 Mar 2025", specialisation: "Preventive Medicine & Genomics", licenseNumber: "TC-2026-44821" },
  { id: "EMP-004", name: "Dr. Emre Yalçın", avatar: "EY", role: "Clinician", email: "emre@phenome.com", phone: "+90 532 555 0104", status: "Active", today: "On Duty", patients: 18, workload: 65, nextShift: "Today, 9:00", lastActive: "1h ago", lastActiveDays: 0, joined: "02 Apr 2025", specialisation: "Longevity Medicine", licenseNumber: "TC-2026-45102" },
  { id: "EMP-005", name: "Dr. Kaan Öztürk", avatar: "KO", role: "Clinician", email: "kaan@phenome.com", phone: "+90 532 555 0105", status: "Active", today: "On Duty", patients: 21, workload: 78, nextShift: "Today, 10:00", lastActive: "30min ago", lastActiveDays: 0, joined: "20 Apr 2025", specialisation: "Sports & Metabolic Health", licenseNumber: "TC-2026-45333" },
  { id: "EMP-006", name: "Dr. Onur Şimşek", avatar: "OS", role: "Clinician", email: "onur@phenome.com", phone: "+90 532 555 0106", status: "On Leave", leaveRange: "1 – 5 Jul 2026", today: "Off", patients: 15, workload: 58, nextShift: "Mon, 9:00", lastActive: "2 days ago", lastActiveDays: 2, joined: "11 May 2025", specialisation: "Cardiometabolic Health", licenseNumber: "TC-2026-45890" },
  // Nurses
  { id: "EMP-007", name: "Berna Koç", avatar: "BK", role: "Nurse", email: "berna@phenome.com", phone: "+90 532 555 0107", status: "Active", today: "On Duty", patients: 14, workload: 71, nextShift: "Today, 8:00", lastActive: "45min ago", lastActiveDays: 0, joined: "01 Jun 2025" },
  { id: "EMP-008", name: "Aylin Demir", avatar: "AD", role: "Nurse", email: "aylin@phenome.com", phone: "+90 532 555 0108", status: "Active", today: "On Duty", patients: 12, workload: 63, nextShift: "Today, 8:00", lastActive: "1h ago", lastActiveDays: 0, joined: "01 Jun 2025" },
  { id: "EMP-009", name: "Selin Yılmaz", avatar: "SY", role: "Nurse", email: "selin@phenome.com", phone: "+90 532 555 0109", status: "Active", today: "Off", todayNote: "Day Off", patients: 10, workload: 55, nextShift: "Tomorrow, 8:00", lastActive: "Yesterday", lastActiveDays: 1, joined: "15 Jun 2025" },
  // Receptionists
  { id: "EMP-010", name: "Elif Yıldız", avatar: "EY", role: "Receptionist", email: "elif@phenome.com", phone: "+90 532 555 0110", status: "Active", today: "On Duty", patients: null, workload: null, nextShift: "Today, 7:30", lastActive: "20min ago", lastActiveDays: 0, joined: "10 Feb 2025" },
  { id: "EMP-011", name: "Deniz Arslan", avatar: "DA", role: "Receptionist", email: "deniz@phenome.com", phone: "+90 532 555 0111", status: "Active", today: "On Duty", patients: null, workload: null, nextShift: "Today, 7:30", lastActive: "1h ago", lastActiveDays: 0, joined: "10 Feb 2025" },
  { id: "EMP-012", name: "Zeynep Kaya", avatar: "ZK", role: "Receptionist", email: "zeynep@phenome.com", phone: "+90 532 555 0112", status: "Inactive", today: "Off", patients: null, workload: null, nextShift: "—", lastActive: "14 days ago", lastActiveDays: 14, joined: "05 Jan 2025" },
  // Admin — the clinic has exactly one Admin account, ever.
  { id: "EMP-001", name: "Ayşe Hançer", avatar: "AH", role: "Admin", email: "ayse@phenome.com", phone: "+90 532 555 0101", status: "Active", today: "On Duty", patients: null, workload: null, nextShift: "Today, 8:00", lastActive: "Now", lastActiveDays: 0, joined: "01 Jan 2025" },
  // Imported via Staff Management's "Import Staff" flow, not yet activated —
  // treated as Inactive until they complete account setup.
  // (Deliberately distinct emails from the /register whitelist demo data, which
  // reuses existing active staff like berna@phenome.com for its own scenarios.)
  { id: "EMP-013", name: "Melis Aydın", avatar: "MA", role: "Nurse", email: "melis@phenome.com", phone: "+90 532 555 0113", status: "Inactive", today: "Off", patients: 0, workload: 0, nextShift: "—", lastActive: "Never · Not activated", lastActiveDays: 0, joined: "4 Jul 2026" },
  { id: "EMP-014", name: "Kerem Uslu", avatar: "KU", role: "Receptionist", email: "kerem@phenome.com", phone: "+90 532 555 0114", status: "Inactive", today: "Off", patients: null, workload: null, nextShift: "—", lastActive: "Never · Not activated", lastActiveDays: 0, joined: "4 Jul 2026" },
];

export const ROLE_GROUP_ORDER: StaffRole[] = ["Clinician", "Nurse", "Receptionist", "Admin"];

export const ROLE_GROUP_LABEL: Record<StaffRole, string> = {
  Clinician: "Clinicians",
  Nurse: "Nurses",
  Receptionist: "Receptionists",
  Admin: "Admins",
};

export function getStaff(id: string | undefined): Staff | undefined {
  return MOCK_STAFF.find((s) => s.id === id);
}

// --- Style helpers (match the pill language used across the portal) ---

export function rolePillClass(role: StaffRole): string {
  switch (role) {
    case "Admin": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Clinician": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Nurse": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Receptionist": return "bg-orange-50 text-orange-700 border-orange-200";
  }
}

export function statusPillClass(status: StaffStatus): string {
  switch (status) {
    case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "On Leave": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Inactive": return "bg-gray-50 text-gray-500 border-gray-200";
  }
}

export function workloadColor(pct: number): { bar: string; text: string } {
  if (pct < 60) return { bar: "bg-emerald-500", text: "text-emerald-700" };
  if (pct <= 85) return { bar: "bg-orange-500", text: "text-orange-600" };
  return { bar: "bg-red-500", text: "text-red-600" };
}

export function todayDotClass(today: TodayStatus): string {
  switch (today) {
    case "On Duty": return "bg-emerald-500";
    case "Off": return "bg-red-400";
    case "On Leave": return "bg-amber-400";
  }
}

// --- Workload tab: patient assignment mock (Dr. Ebru Reis) ---

export type AssignedPatient = {
  name: string;
  patientRoute: string;
  since: string;
  lastVisit: string;
  nextAppt: string;
  journeyStatus: "Active" | "Completed" | "None";
  complexity: "Low" | "Medium" | "High";
};

export const ASSIGNED_PATIENTS: AssignedPatient[] = [
  { name: "Ece Yıldırım", patientRoute: "/patients/PH-2026-0042", since: "18 Mar 2025", lastVisit: "1 Jul", nextAppt: "3 Jul · Scan", journeyStatus: "Active", complexity: "High" },
  { name: "Tarkan Solmaz", patientRoute: "/patients/PH-2026-0051", since: "02 Apr 2025", lastVisit: "30 Jun", nextAppt: "3 Jul · Scan", journeyStatus: "Active", complexity: "Medium" },
  { name: "Derya Toprak", patientRoute: "/patients/PH-2026-0044", since: "15 Apr 2025", lastVisit: "30 Jun", nextAppt: "5 Jul · Consult", journeyStatus: "Active", complexity: "Low" },
  { name: "Hakan Bulut", patientRoute: "/patients/PH-2026-0063", since: "20 Apr 2025", lastVisit: "2 Jul", nextAppt: "—", journeyStatus: "Completed", complexity: "Medium" },
  { name: "Gül Korkmaz", patientRoute: "/patients/PH-2026-0015", since: "05 May 2025", lastVisit: "2 Jul", nextAppt: "10 Jul · Consult", journeyStatus: "Active", complexity: "High" },
  { name: "Cem Polat", patientRoute: "/patients/PH-2026-0088", since: "12 May 2025", lastVisit: "30 Jun", nextAppt: "—", journeyStatus: "Active", complexity: "Medium" },
  { name: "Serkan Çetin", patientRoute: "/patients/PH-2026-0029", since: "28 May 2025", lastVisit: "1 Jul", nextAppt: "8 Jul · Scan", journeyStatus: "Active", complexity: "Low" },
  { name: "Burak Kocaman", patientRoute: "/patients/PH-2026-0071", since: "10 Jun 2025", lastVisit: "1 Jul", nextAppt: "—", journeyStatus: "None", complexity: "Low" },
];

export const APPOINTMENT_DISTRIBUTION = [
  { type: "Body Scan", count: 12, fill: "#475569" },
  { type: "Consultation (in-person)", count: 8, fill: "#3b82f6" },
  { type: "Consultation (video)", count: 6, fill: "#8b5cf6" },
  { type: "Follow-up", count: 4, fill: "#f59e0b" },
  { type: "Sample Collection", count: 2, fill: "#10b981" },
];

export const WEEKLY_TREND = [
  { week: "W22", appointments: 6 },
  { week: "W23", appointments: 7 },
  { week: "W24", appointments: 8 },
  { week: "W25", appointments: 7 },
  { week: "W26", appointments: 9 },
  { week: "W27", appointments: 10 },
  { week: "W28", appointments: 9 },
  { week: "W29", appointments: 11 },
];

export const CAPACITY_THRESHOLD = 12;

export const OTHER_CLINICIANS = ["Dr. Emre Yalçın", "Dr. Kaan Öztürk", "Dr. Onur Şimşek"];
