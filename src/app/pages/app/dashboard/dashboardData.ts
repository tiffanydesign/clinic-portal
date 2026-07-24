// Shared types, mock data, and helpers for the role-aware Dashboard.
// One /dashboard route renders four completely different experiences based on
// the current role from AppContext. Keep patient / staff names consistent with
// the Staff and Patients modules.

import type { Role } from "../../../context/AppContext";
import { MOCK_PATIENTS, Group } from "../patientsData";

// --- Timeline geometry (Today's Schedule calendar widget) ---
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 19;
// 90px/hour (was 68, originally 60) — widened again so a densely-packed
// Scan/Sample hour (4-5 real-world 10-20 min visits back to back, see
// APPTS A-18..A-36) still renders each block as a legible sliver instead of
// a barely-there line, without pushing the always-visible 08:00-19:00 day
// so tall it stops being a single glance.
export const HOUR_PX = 90;
export const NOW_MINUTES = 9 * 60 + 14; // 09:14 red "now" line

export const TODAY_LABEL = "Friday, 3 July 2026";
export const TODAY_SHORT = "Fri, 3 Jul";

export function minToClock(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// Greeting name shown per role in the page header.
export const ROLE_GREETING: Record<Role, string> = {
  Admin: "Ayşe",
  Reception: "Elif",
  Nurse: "Berna",
  Clinician: "Dr. Reis",
};

// --- Appointment model ---
export type ApptStatus =
  | "Booked"
  | "Arrived"
  | "Checked In"
  | "In Clinic"
  | "Completed"
  | "No Show"
  | "Cancelled";

export type ApptType =
  | "Body Scan"
  | "Consultation (in-person)"
  | "Consultation (video)"
  | "Follow-up"
  | "Sample Collection";

export type FormStatus = "Signed" | "Pending" | "Not Sent";
export type PaymentStatus = "Paid" | "Unpaid";
export type ConsentStatus = "Signed" | "Pending" | "Not Sent";

export type Patient = {
  name: string;
  route: string;
  avatar: string;
  patientId: string;
  group: Group;
  dob: string;
  age: number;
  sex: "Female" | "Male" | "Other";
  phone: string;
  email: string;
  // A clinically material safety flag (allergy, contraindication, ...) —
  // undefined for the overwhelming majority of patients; surfaced only when
  // present, never a placeholder like "None".
  alert?: string;
};

export type Appt = {
  id: string;
  patient: Patient;
  type: ApptType;
  isVideo: boolean;
  startMin: number; // minutes from midnight
  durationMin: number;
  timeLabel: string; // e.g. "08:00 – 08:45"
  doctorId: string;
  doctor: string;
  nurse?: string;
  room: string;
  status: ApptStatus;
  consent: ConsentStatus;
  payment: PaymentStatus;
  amount: string; // e.g. "₺4,800"
  balance: string; // e.g. "₺0"
  checkInTime?: string;
  arrivedTime?: string;
  waitMinutes?: number;
  // Journey step index into journey/journeyTemplates.ts's CANONICAL_STATIONS
  currentStep: number;
  forms: { name: string; status: FormStatus }[];
  prep: { sample: "Collected" | "Pending"; scan: "Completed" | "Scheduled" };
  previousVisit?: string;
  // Booked same-day, walk-in-style, rather than pre-scheduled — drives the
  // Reception dashboard's optional "Walk-ins" KPI card only.
  isWalkIn?: boolean;
};

// Every form must be Signed for consent to be considered cleared — the same
// rule Reception's check-in gate already uses (canCheckIn below), now
// exposed as its own helper so the drawer's status-gate card and the gate
// logic can never silently disagree about what "consent cleared" means.
export function formsSigned(appt: Appt): boolean {
  return appt.forms.every((f) => f.status === "Signed");
}

// Looks the patient up in the canonical roster (patientsData.ts) so name,
// DOB, age, and contact info can only ever be edited in one place — the
// route is derived from the same roster entry's real patientId, so every
// appointment card correctly deep-links to its own patient's record instead
// of a single hardcoded stand-in.
function P(patientId: string): Patient {
  const p = MOCK_PATIENTS.find((x) => x.patientId === patientId);
  if (!p) throw new Error(`Unknown patientId in dashboardData.APPTS: ${patientId}`);
  return {
    name: p.name,
    route: `/patients/${p.patientId}`,
    avatar: p.avatar,
    patientId: p.patientId,
    group: p.group,
    dob: p.dob,
    age: p.age,
    sex: p.sex === "M" ? "Male" : p.sex === "F" ? "Female" : "Other",
    phone: p.phone,
    email: p.email,
    alert: p.alert,
  };
}

const NO_FORMS_ISSUE = [
  { name: "Clinic Consent", status: "Signed" as FormStatus },
  { name: "Data Privacy Notice", status: "Signed" as FormStatus },
];

// Invariant: no single doctorId, nurse, or room may have two appointments
// whose [startMin, startMin+durationMin) ranges overlap — every calendar
// surface (Admin/Reception's room & clinician grid, the Nurse/Clinician
// dashboards' own single-column timelines) assumes a resource is never in
// two places at once. During the 09:30–12:00 peak, three doctors are each
// mid-session at once, which genuinely needs three nurses to cover without
// a clash — hence three nurses (Berna Koç, Aylin Demir, Selin Yılmaz) rather
// than two. When adding or reshuffling an appointment, re-check this per
// doctorId/nurse/room before assuming a slot is free.
export const APPTS: Appt[] = [
  {
    id: "A-01",
    patient: P("PH-2026-0042"),
    type: "Body Scan", isVideo: false, startMin: 480, durationMin: 90, timeLabel: "08:00 – 09:30",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    checkInTime: "07:52", currentStep: 4, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "18 Mar 2026",
  },
  {
    id: "A-02",
    patient: P("PH-2026-0015"),
    type: "Consultation (in-person)", isVideo: false, startMin: 510, durationMin: 60, timeLabel: "08:30 – 09:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Room 2",
    // At the final journey step (Check Out) — her consultation is done and
    // she's ready for Reception to check her out, demoing that row state.
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    checkInTime: "08:20", currentStep: 11, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "02 May 2026",
  },
  {
    id: "A-03",
    patient: P("PH-2026-0063"),
    type: "Sample Collection", isVideo: false, startMin: 510, durationMin: 75, timeLabel: "08:30 – 09:45",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Completed", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    checkInTime: "08:10", currentStep: 11, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "20 Apr 2026",
  },
  {
    id: "A-04",
    patient: P("PH-2026-0051"),
    type: "Body Scan", isVideo: false, startMin: 570, durationMin: 90, timeLabel: "09:30 – 11:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan B",
    status: "Arrived", consent: "Pending", payment: "Paid", amount: "₺4,800", balance: "₺0",
    arrivedTime: "08:58", waitMinutes: 16, currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Scan Safety Checklist", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "30 May 2026",
  },
  {
    id: "A-05",
    patient: P("PH-2026-0038"),
    type: "Consultation (in-person)", isVideo: false, startMin: 585, durationMin: 60, timeLabel: "09:45 – 10:45",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Room 1",
    status: "Arrived", consent: "Signed", payment: "Unpaid", amount: "₺2,400", balance: "₺2,400",
    arrivedTime: "08:55", waitMinutes: 19, currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "12 Apr 2026",
  },
  {
    id: "A-06",
    patient: P("PH-2026-0088"),
    type: "Follow-up", isVideo: false, startMin: 570, durationMin: 60, timeLabel: "09:30 – 10:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Room 3",
    status: "Arrived", consent: "Signed", payment: "Paid", amount: "₺1,500", balance: "₺0",
    arrivedTime: "09:05", waitMinutes: 9, currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "30 Jun 2026", isWalkIn: true,
  },
  // Video consultations (A-07, A-11, A-13) run ~60 min each, same as any
  // other appointment type, and obey the same per-doctorId non-overlap
  // invariant above — a video slot is still real time on that doctor's
  // calendar, just without a physical room. Dr. Reis's (EMP-003) Blocked
  // Time entry in availabilityStore.ts (BT-2, today 14:00–15:00) sits
  // deliberately in her one real gap between these and her 15:00 in-person
  // appointment — moving any of these three times must re-check that gap.
  {
    id: "A-07",
    patient: P("PH-2026-0044"),
    type: "Consultation (video)", isVideo: true, startMin: 720, durationMin: 60, timeLabel: "12:00 – 13:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", room: "Video",
    // Booked, not "Checked In": her slot is hours away from the demo clock
    // (09:14) — a "Checked In" status here would mean she checked in before
    // it ever happened.
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,000", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "15 Apr 2026",
  },
  {
    id: "A-08",
    patient: P("PH-2026-0029"),
    type: "Body Scan", isVideo: false, startMin: 630, durationMin: 90, timeLabel: "10:30 – 12:00",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan A",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    checkInTime: "09:12", currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "28 May 2026",
  },
  {
    id: "A-09",
    patient: P("PH-2026-0071"),
    type: "Sample Collection", isVideo: false, startMin: 645, durationMin: 75, timeLabel: "10:45 – 12:00",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 2",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    // Check-in must fall on or before the demo clock (09:14) for "Checked
    // In" to be a fact that's already happened, regardless of how early
    // relative to his own slot.
    checkInTime: "09:00", currentStep: 4, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "10 Jun 2026",
  },
  {
    id: "A-10",
    patient: P("PH-2026-0104"),
    type: "Consultation (in-person)", isVideo: false, startMin: 660, durationMin: 60, timeLabel: "11:00 – 12:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Room 2",
    // Booked, not "In Clinic": her check-in time (09:40) is still ahead of
    // the demo clock (09:14) — Dr. Reis can only have one active session at
    // a time (A-01), and this one hasn't started yet.
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "01 Apr 2026",
  },
  {
    id: "A-11",
    patient: P("PH-2026-0055"),
    type: "Consultation (video)", isVideo: true, startMin: 720, durationMin: 60, timeLabel: "12:00 – 13:00",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", room: "Video",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,000", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-12",
    patient: P("PH-2026-0105"),
    type: "Body Scan", isVideo: false, startMin: 720, durationMin: 90, timeLabel: "12:00 – 13:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Berna Koç", room: "Scan B",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺4,800", balance: "₺4,800",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Not Sent" },
      { name: "Scan Safety Checklist", status: "Not Sent" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—", isWalkIn: true,
  },
  {
    id: "A-13",
    patient: P("PH-2026-0042"),
    type: "Follow-up", isVideo: true, startMin: 780, durationMin: 60, timeLabel: "13:00 – 14:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", room: "Video",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,500", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "18 Mar 2026",
  },
  {
    id: "A-14",
    patient: P("PH-2026-0063"),
    type: "Consultation (in-person)", isVideo: false, startMin: 840, durationMin: 60, timeLabel: "14:00 – 15:00",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Berna Koç", room: "Room 1",
    // A partial deposit can still be a real ledger fact even though "Partial"
    // is no longer its own payment status — any non-zero balance is Unpaid.
    status: "Booked", consent: "Signed", payment: "Unpaid", amount: "₺2,400", balance: "₺1,200",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "20 Apr 2026",
  },
  {
    id: "A-15",
    patient: P("PH-2026-0101"),
    type: "Consultation (in-person)", isVideo: false, startMin: 900, durationMin: 45, timeLabel: "15:00 – 15:45",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Room 2",
    // Neither gate cleared yet — exercises the Front Desk Queue's
    // both-red state, with Take Payment as her next step (payment-first).
    status: "Arrived", consent: "Pending", payment: "Unpaid", amount: "₺3,200", balance: "₺3,200",
    arrivedTime: "09:00", waitMinutes: 14, currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-16",
    patient: P("PH-2026-0102"),
    type: "Body Scan", isVideo: false, startMin: 930, durationMin: 60, timeLabel: "15:30 – 16:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Arrived", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    arrivedTime: "09:10", waitMinutes: 4, currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "05 May 2026",
  },
  {
    id: "A-17",
    patient: P("PH-2026-0103"),
    type: "Consultation (in-person)", isVideo: false, startMin: 780, durationMin: 60, timeLabel: "13:00 – 14:00",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Aylin Demir", room: "Room 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "22 Mar 2026",
  },

  // --- Realistic Scan/Sample turnover (A-18..A-36) ---------------------------
  // Real body-composition scans and blood draws run 10-20 min, not the 45-90
  // min slots above (those model a fuller diagnostic package) — this block
  // adds four back-to-back-booked hours so By Room view shows what a real
  // Scan/Sample room looks like: 4-5 short visits stacked in one hour, never
  // overlapping the same doctor/nurse/room as anything else in this file.
  // Verified free windows used: Dr. Reis 14:00-15:00 & 16:00-19:00, Dr. Yalçın
  // 14:00-19:00, Dr. Öztürk 16:30-19:00, Berna Koç 15:45(945)-19:00, Aylin
  // Demir 14:00-15:30 & 16:30-19:00, Selin Yılmaz free from 12:00 onward.
  {
    id: "A-18", patient: P("PH-2026-0038"),
    type: "Sample Collection", isVideo: false, startMin: 840, durationMin: 12, timeLabel: "14:00 – 14:12",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "12 Apr 2026",
  },
  {
    id: "A-19", patient: P("PH-2026-0071"),
    type: "Sample Collection", isVideo: false, startMin: 852, durationMin: 12, timeLabel: "14:12 – 14:24",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "10 Jun 2026",
  },
  {
    id: "A-20", patient: P("PH-2026-0106"),
    type: "Sample Collection", isVideo: false, startMin: 864, durationMin: 12, timeLabel: "14:24 – 14:36",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "—",
  },
  {
    id: "A-21", patient: P("PH-2026-0108"),
    type: "Sample Collection", isVideo: false, startMin: 876, durationMin: 12, timeLabel: "14:36 – 14:48",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺900", balance: "₺900",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "24 Jun 2026",
  },
  {
    id: "A-22", patient: P("PH-2026-0110"),
    type: "Sample Collection", isVideo: false, startMin: 888, durationMin: 12, timeLabel: "14:48 – 15:00",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Selin Yılmaz", room: "Lab 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "1 Jul 2026",
  },
  {
    id: "A-23", patient: P("PH-2026-0015"),
    type: "Sample Collection", isVideo: false, startMin: 840, durationMin: 10, timeLabel: "14:00 – 14:10",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Lab 2",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "02 May 2026",
  },
  {
    id: "A-24", patient: P("PH-2026-0088"),
    type: "Sample Collection", isVideo: false, startMin: 850, durationMin: 15, timeLabel: "14:10 – 14:25",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Lab 2",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "30 Jun 2026",
  },
  {
    id: "A-25", patient: P("PH-2026-0104"),
    type: "Sample Collection", isVideo: false, startMin: 865, durationMin: 10, timeLabel: "14:25 – 14:35",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Lab 2",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "01 Apr 2026",
  },
  {
    id: "A-26", patient: P("PH-2026-0105"),
    type: "Sample Collection", isVideo: false, startMin: 875, durationMin: 15, timeLabel: "14:35 – 14:50",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Lab 2",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺900", balance: "₺900",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "—",
  },
  {
    id: "A-27", patient: P("PH-2026-0109"),
    type: "Sample Collection", isVideo: false, startMin: 890, durationMin: 10, timeLabel: "14:50 – 15:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Lab 2",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Completed" }, previousVisit: "22 Jun 2026",
  },
  {
    id: "A-28", patient: P("PH-2026-0051"),
    type: "Body Scan", isVideo: false, startMin: 960, durationMin: 15, timeLabel: "16:00 – 16:15",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺1,200", balance: "₺1,200",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Scan Safety Checklist", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "30 May 2026",
  },
  {
    id: "A-29", patient: P("PH-2026-0029"),
    type: "Body Scan", isVideo: false, startMin: 975, durationMin: 17, timeLabel: "16:15 – 16:32",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "28 May 2026",
  },
  {
    id: "A-30", patient: P("PH-2026-0103"),
    type: "Body Scan", isVideo: false, startMin: 992, durationMin: 15, timeLabel: "16:32 – 16:47",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "22 Mar 2026",
  },
  {
    id: "A-31", patient: P("PH-2026-0044"),
    type: "Body Scan", isVideo: false, startMin: 1007, durationMin: 13, timeLabel: "16:47 – 17:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "15 Apr 2026",
  },
  {
    id: "A-32", patient: P("PH-2026-0101"),
    type: "Body Scan", isVideo: false, startMin: 1020, durationMin: 12, timeLabel: "17:00 – 17:12",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺1,200", balance: "₺1,200",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Pending" },
      { name: "Scan Safety Checklist", status: "Pending" },
      { name: "Data Privacy Notice", status: "Signed" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-33", patient: P("PH-2026-0102"),
    type: "Body Scan", isVideo: false, startMin: 1032, durationMin: 12, timeLabel: "17:12 – 17:24",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "05 May 2026",
  },
  {
    id: "A-34", patient: P("PH-2026-0055"),
    type: "Body Scan", isVideo: false, startMin: 1044, durationMin: 12, timeLabel: "17:24 – 17:36",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-35", patient: P("PH-2026-0106"),
    type: "Body Scan", isVideo: false, startMin: 1056, durationMin: 12, timeLabel: "17:36 – 17:48",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-36", patient: P("PH-2026-0108"),
    type: "Body Scan", isVideo: false, startMin: 1068, durationMin: 12, timeLabel: "17:48 – 18:00",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,200", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE, prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "24 Jun 2026",
  },
];

export function getAppt(id: string | undefined): Appt | undefined {
  return APPTS.find((a) => a.id === id);
}

// A patient can have more than one appointment on the books today (e.g. a
// Body Scan plus a same-day follow-up) — this picks the single one worth
// surfacing a journey-progress chip for: whichever is actually in progress,
// else the earliest still-booked one, else the most recently completed.
// Used anywhere a roster/patient-identity view (not an appointment-identity
// view) needs to show "where is this patient's journey right now."
export function primaryApptForPatient(appts: Appt[], patientId: string): Appt | undefined {
  const mine = appts.filter((a) => a.patient.patientId === patientId);
  if (mine.length === 0) return undefined;
  const active = mine.find((a) => a.status === "Arrived" || a.status === "Checked In" || a.status === "In Clinic");
  if (active) return active;
  const upcoming = mine.filter((a) => a.status === "Booked").sort((a, b) => a.startMin - b.startMin)[0];
  if (upcoming) return upcoming;
  return mine.find((a) => a.status === "Completed") ?? mine[0];
}

// A Reception check-in is only enabled when consent is signed AND payment settled.
export function canCheckIn(a: Appt): boolean {
  const paymentOk = a.payment === "Paid";
  return formsSigned(a) && paymentOk;
}

export function checkInBlockReason(a: Appt): string | null {
  const consentOk = formsSigned(a);
  const paymentOk = a.payment === "Paid";
  if (!consentOk && !paymentOk) return "Complete consent and payment to enable check-in";
  if (!consentOk) return "Awaiting consent — collect required signatures";
  if (!paymentOk) return "Awaiting payment — settle balance to enable check-in";
  return null;
}

// --- Calendar block styling by status ---
// One semantic colour per status, expressed as a tonal tint PLUS a thin
// border in the same hue (never a heavier 2px stripe) — the border is what
// lets a block read as a distinct object on the grid even at a glance, while
// staying exactly the same fill/border language whether it's a full block or
// an aggregated micro-pill. A small leading status dot (colour-coded)
// carries the status next to the patient name; the name itself is always
// plain ink — colour lives in the fill/border/dot, never the text, so a
// dense hour of different-status pills never turns into a wall of coloured
// text. Same five-hue language as StatusPill everywhere else in the
// product: blue = booked/info, amber = waiting, emerald = a gate passed,
// orange = happening right now, gray = settled/inactive, red = blocked.
type StatusStyle = { fill: string; border: string; dot: string };

const STATUS_STYLE: Record<ApptStatus, StatusStyle> = {
  Booked: { fill: "bg-info/10", border: "border-info/30", dot: "bg-info" },
  Arrived: { fill: "bg-warning/10", border: "border-warning/30", dot: "bg-warning" },
  "Checked In": { fill: "bg-success/10", border: "border-success/30", dot: "bg-success" },
  "In Clinic": { fill: "bg-warning/10", border: "border-warning/30", dot: "bg-warning" },
  Completed: { fill: "bg-surface-sunken", border: "border-divider", dot: "bg-ink-muted" },
  "No Show": { fill: "bg-danger/10", border: "border-danger/30", dot: "bg-danger" },
  Cancelled: { fill: "bg-surface-sunken line-through", border: "border-divider", dot: "bg-surface-sunken" },
};

export function apptBlockClass(status: ApptStatus): string {
  // A resting shadow (not just on hover) is what makes a block read as an
  // object sitting on the grid rather than a flat tinted rectangle — this is
  // the single biggest lever for the calendar's perceived depth.
  return `${STATUS_STYLE[status].fill} border ${STATUS_STYLE[status].border} rounded-card shadow-[0_1px_2px_rgba(15,23,42,0.06)]`;
}

// Micro-pill tint: identical tonal fill + thin border as apptBlockClass,
// just without the shadow/radius — a pill this small (18-20px tall) reads
// cleaner flat, but the colour language must match the regular block exactly.
export function apptMicroPillClass(status: ApptStatus): string {
  return `${STATUS_STYLE[status].fill} border ${STATUS_STYLE[status].border}`;
}

// The small leading dot every calendar/timeline block renders before the
// patient name, replacing the old left-border stripe. "In Clinic" is the
// only status that's genuinely happening *right now*, so it alone pulses.
export function apptStatusDotClass(status: ApptStatus): string {
  return `${STATUS_STYLE[status].dot}${status === "In Clinic" ? " animate-pulse" : ""}`;
}

export function statusPillType(status: ApptStatus): "default" | "success" | "warning" | "error" {
  if (status === "Checked In" || status === "Completed") return "success";
  if (status === "In Clinic" || status === "Arrived") return "warning";
  if (status === "No Show" || status === "Cancelled") return "error";
  return "default";
}

export type ApptStatusTone = "blue" | "amber" | "emerald" | "orange" | "gray" | "red";

// Same per-status hue language as the calendar's own STATUS_STYLE above
// (Booked=blue, Arrived=amber, Checked In=emerald, In Clinic=orange,
// Completed/Cancelled=gray, No Show=red), exposed as a named tone for the
// Appointment Drawer's bold status pill — so a patient's status reads as
// the same color wherever it appears, calendar block or drawer.
export function apptStatusTone(status: ApptStatus): ApptStatusTone {
  switch (status) {
    case "Booked": return "blue";
    case "Arrived": return "amber";
    case "Checked In": return "emerald";
    case "In Clinic": return "orange";
    case "No Show": return "red";
    default: return "gray"; // Completed, Cancelled
  }
}

// --- Shared block-geometry math for every time-grid calendar surface ---
// A block's rendered height should read the appointment's real duration, but
// never render so short that a name + type clips to nothing. We raise short
// appointments up to `floorPx`, but only as far as the next appointment in
// the same column actually starts — so a tightly-booked day never produces
// two blocks that visually overlap. `gapMin` is the caller-computed minutes
// until the next item in the same column (undefined if there isn't one).
// `hourPx` defaults to the shared HOUR_PX but a caller with its own taller
// row height (see DayGrid's HOUR_PX override) passes its own.
export function blockHeightPx(durationMin: number, gapMin?: number, floorPx = 30, hourPx = HOUR_PX): number {
  const pxPerMin = hourPx / 60;
  const natural = durationMin * pxPerMin;
  const ceiling = gapMin != null ? gapMin * pxPerMin : Infinity;
  return Math.min(Math.max(natural, floorPx), ceiling) - 2;
}

// Minutes until the next item starts in the same column, for `blockHeightPx`.
// `items` must already be the column's own appointments (any order).
export function gapToNext(items: { startMin: number }[], startMin: number): number | undefined {
  const later = items.map((i) => i.startMin).filter((s) => s > startMin).sort((a, b) => a - b);
  return later.length ? later[0] - startMin : undefined;
}

// --- Dense-hour aggregation (aggregate block) --------------------------------
// A real Scan/Sample room can run 4-6 back-to-back 10-20 min visits in one
// hour (see APPTS A-18..A-36). Rendering every one of those as its own
// absolutely-positioned block breaks down two ways: the grid reads as noise,
// and blockHeightPx's floorPx (30px minimum, so a name is never unreadably
// thin) has no awareness of the containing hour's own boundary — the LAST
// short item in a column with nothing booked after it gets floored to 30px
// regardless of how little real time is left in that hour, so its block
// visually bleeds past the hour line into the next hour's empty space.
//
// The fix is all-or-nothing per hour, not "show a couple, chip the rest": a
// clock hour with `maxIndividual` items or fewer renders each one normally;
// crossing that threshold replaces EVERY item in that hour with a single
// aggregate block — same rounded-card shape, sized to the hour itself, so
// the grid stays visually uniform no matter how dense that hour actually is
// (a "+2 more" sliver next to two full-size blocks read as visual noise in
// its own right, which is the thing this replaces).
export type OverflowGroup<T> = { hourStartMin: number; items: T[] };

// A "visible" (non-aggregated) item carries its hour-bucket membership
// alongside the item itself, so the renderer can tell a genuinely sparse
// hour (bucketSize 1 — size by real duration/gap as always, letting a long
// appointment span past its starting hour) apart from a packed one
// (bucketSize > 1 — see equalDivisionTop/Height below).
export type VisibleItem<T> = { item: T; bucketSize: number; bucketIndex: number; hourStartMin: number };

export function clusterColumnByHour<T>(
  items: T[],
  getStartMin: (item: T) => number,
  maxIndividual = 2
): { visible: VisibleItem<T>[]; overflow: OverflowGroup<T>[] } {
  const byHour = new Map<number, T[]>();
  for (const item of items) {
    const hourIndex = Math.floor((getStartMin(item) - DAY_START_HOUR * 60) / 60);
    const bucket = byHour.get(hourIndex);
    if (bucket) bucket.push(item);
    else byHour.set(hourIndex, [item]);
  }
  const visible: VisibleItem<T>[] = [];
  const overflow: OverflowGroup<T>[] = [];
  for (const [hourIndex, bucket] of byHour) {
    const sorted = [...bucket].sort((a, b) => getStartMin(a) - getStartMin(b));
    const hourStartMin = DAY_START_HOUR * 60 + hourIndex * 60;
    if (sorted.length <= maxIndividual) {
      sorted.forEach((item, bucketIndex) => visible.push({ item, bucketSize: sorted.length, bucketIndex, hourStartMin }));
    } else {
      overflow.push({ hourStartMin, items: sorted });
    }
  }
  visible.sort((a, b) => getStartMin(a.item) - getStartMin(b.item));
  overflow.sort((a, b) => a.hourStartMin - b.hourStartMin);
  return { visible, overflow };
}

// Equal-division layout for a packed hour's visible tier (bucketSize > 1):
// every item sharing that clock hour gets an identical height (the hour
// divided evenly, minus a small gap) and stacks from the hour's own top
// edge — guaranteeing consistent sizing and zero overflow no matter how
// many items (up to maxIndividual) share it, instead of each block's real
// duration/gap-to-next producing visibly mismatched sizes right at the
// density boundary (a 4-item hour looking nothing like a 3-item one).
// `hourPx` must match whatever HOUR_PX the caller's grid actually uses.
export function equalDivisionTop(hourStartMin: number, bucketIndex: number, bucketSize: number, hourPx = HOUR_PX): number {
  const hourTopPx = ((hourStartMin - DAY_START_HOUR * 60) / 60) * hourPx;
  return hourTopPx + bucketIndex * (hourPx / bucketSize);
}
export function equalDivisionHeight(bucketSize: number, hourPx = HOUR_PX): number {
  return hourPx / bucketSize - 2;
}
