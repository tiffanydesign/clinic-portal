// Shared types, mock data, and helpers for the role-aware Dashboard.
// One /dashboard route renders four completely different experiences based on
// the current role from AppContext. Keep patient / staff names consistent with
// the Staff and Patients modules.

import type { Role } from "../../../context/AppContext";

// --- Timeline geometry (Today's Schedule calendar widget) ---
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 19;
// 68px/hour (was 60) — the extra headroom is what lets a 20–30 min
// appointment block show a second line of detail instead of clipping to a
// bare name, without changing how much of the day is visible at once.
export const HOUR_PX = 68;
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
export type PaymentStatus = "Paid" | "Partial" | "Unpaid";
export type ConsentStatus = "Signed" | "Pending" | "Not Sent";

export type Patient = {
  name: string;
  route: string;
  avatar: string;
  dob: string;
  age: number;
  sex: "Female" | "Male";
  phone: string;
  email: string;
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
  // Journey step index into JOURNEY_STEPS_RECEPTION
  currentStep: number;
  forms: { name: string; status: FormStatus }[];
  prep: { sample: "Collected" | "Pending"; scan: "Completed" | "Scheduled" };
  previousVisit?: string;
};

export const JOURNEY_STEPS_ADMIN = ["Consent", "Changing", "Scan", "Sample", "Check Out"];
export const JOURNEY_STEPS_RECEPTION = [
  "Consent",
  "Changing Room",
  "Scan",
  "Blood Collection",
  "Consultation",
  "Test Kit",
];

function P(
  name: string,
  avatar: string,
  dob: string,
  age: number,
  sex: "Female" | "Male",
  phone: string,
  email: string
): Patient {
  return { name, route: "/patients/P-001", avatar, dob, age, sex, phone, email };
}

// Doctors with appointments today (Dr. Adobe Martinez is on leave 1–5 Jul).
export const DOCTOR_COLUMNS = [
  { id: "EMP-003", name: "Dr. Claudia Reis" },
  { id: "EMP-004", name: "Dr. Chad Okonkwo" },
  { id: "EMP-005", name: "Dr. Felix Andersen" },
];

const NO_FORMS_ISSUE = [
  { name: "Clinic Consent", status: "Signed" as FormStatus },
  { name: "Data Privacy Notice", status: "Signed" as FormStatus },
];

export const APPTS: Appt[] = [
  {
    id: "A-01",
    patient: P("Mackenzie Messineo", "MM", "12 Feb 1988", 38, "Female", "+90 532 111 2201", "mackenzie@example.com"),
    type: "Body Scan", isVideo: false, startMin: 480, durationMin: 45, timeLabel: "08:00 – 08:45",
    doctorId: "EMP-003", doctor: "Dr. Claudia Reis", nurse: "Berna Koç", room: "Scan A",
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    checkInTime: "07:52", currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "18 Mar 2026",
  },
  {
    id: "A-02",
    patient: P("Arysse Arcerola", "AA", "03 Sep 1979", 46, "Female", "+90 532 111 2202", "arysse@example.com"),
    type: "Consultation (in-person)", isVideo: false, startMin: 510, durationMin: 30, timeLabel: "08:30 – 09:00",
    doctorId: "EMP-005", doctor: "Dr. Felix Andersen", nurse: "Aylin Demir", room: "Room 2",
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    checkInTime: "08:20", currentStep: 4, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "02 May 2026",
  },
  {
    id: "A-03",
    patient: P("Gustavo Propolis", "GP", "27 Jul 1965", 60, "Male", "+90 532 111 2203", "gustavo@example.com"),
    type: "Sample Collection", isVideo: false, startMin: 510, durationMin: 20, timeLabel: "08:30 – 08:50",
    doctorId: "EMP-004", doctor: "Dr. Chad Okonkwo", nurse: "Berna Koç", room: "Lab 1",
    status: "Completed", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    checkInTime: "08:10", currentStep: 5, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "20 Apr 2026",
  },
  {
    id: "A-04",
    patient: P("Riley Guarana", "RG", "15 Nov 1992", 33, "Male", "+90 532 111 2204", "riley@example.com"),
    type: "Body Scan", isVideo: false, startMin: 540, durationMin: 45, timeLabel: "09:00 – 09:45",
    doctorId: "EMP-003", doctor: "Dr. Claudia Reis", nurse: "Aylin Demir", room: "Scan B",
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
    patient: P("Penny Pelargonium", "PP", "08 Jun 1984", 41, "Female", "+90 532 111 2205", "penny@example.com"),
    type: "Consultation (in-person)", isVideo: false, startMin: 540, durationMin: 30, timeLabel: "09:00 – 09:30",
    doctorId: "EMP-004", doctor: "Dr. Chad Okonkwo", nurse: "Berna Koç", room: "Room 1",
    status: "Arrived", consent: "Signed", payment: "Unpaid", amount: "₺2,400", balance: "₺2,400",
    arrivedTime: "08:55", waitMinutes: 19, currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "12 Apr 2026",
  },
  {
    id: "A-06",
    patient: P("Oliver Folate", "OF", "21 Jan 1976", 49, "Male", "+90 532 111 2206", "oliver@example.com"),
    type: "Follow-up", isVideo: false, startMin: 555, durationMin: 20, timeLabel: "09:15 – 09:35",
    doctorId: "EMP-005", doctor: "Dr. Felix Andersen", nurse: "Aylin Demir", room: "Room 3",
    status: "Arrived", consent: "Signed", payment: "Paid", amount: "₺1,500", balance: "₺0",
    arrivedTime: "09:05", waitMinutes: 9, currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "30 Jun 2026",
  },
  {
    id: "A-07",
    patient: P("Sophia Ascorbic", "SA", "30 Mar 1990", 35, "Female", "+90 532 111 2207", "sophia@example.com"),
    type: "Consultation (video)", isVideo: true, startMin: 565, durationMin: 30, timeLabel: "09:25 – 09:55",
    doctorId: "EMP-003", doctor: "Dr. Claudia Reis", room: "Video",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺2,000", balance: "₺0",
    checkInTime: "09:10", currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "15 Apr 2026",
  },
  {
    id: "A-08",
    patient: P("Bob Bromelain", "BB", "17 Oct 1970", 55, "Male", "+90 532 111 2208", "bob@example.com"),
    type: "Body Scan", isVideo: false, startMin: 570, durationMin: 45, timeLabel: "09:30 – 10:15",
    doctorId: "EMP-005", doctor: "Dr. Felix Andersen", nurse: "Aylin Demir", room: "Scan A",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    checkInTime: "09:12", currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "28 May 2026",
  },
  {
    id: "A-09",
    patient: P("Dylan Daniel", "DD", "05 Dec 1995", 30, "Male", "+90 532 111 2209", "dylan@example.com"),
    type: "Sample Collection", isVideo: false, startMin: 600, durationMin: 20, timeLabel: "10:00 – 10:20",
    doctorId: "EMP-004", doctor: "Dr. Chad Okonkwo", nurse: "Berna Koç", room: "Lab 2",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    checkInTime: "09:48", currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "10 Jun 2026",
  },
  {
    id: "A-10",
    patient: P("Cynthia Riboflavin", "CY", "14 Aug 1982", 43, "Female", "+90 532 111 2210", "cynthia@example.com"),
    type: "Consultation (in-person)", isVideo: false, startMin: 600, durationMin: 30, timeLabel: "10:00 – 10:30",
    doctorId: "EMP-003", doctor: "Dr. Claudia Reis", nurse: "Berna Koç", room: "Room 2",
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    checkInTime: "09:40", currentStep: 4, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "01 Apr 2026",
  },
  {
    id: "A-11",
    patient: P("Noah Nac", "NN", "22 Feb 2000", 26, "Male", "+90 532 111 2211", "noah@example.com"),
    type: "Consultation (video)", isVideo: true, startMin: 630, durationMin: 30, timeLabel: "10:30 – 11:00",
    doctorId: "EMP-004", doctor: "Dr. Chad Okonkwo", room: "Video",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,000", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-12",
    patient: P("Benny Selenium", "BS", "09 May 1968", 58, "Male", "+90 532 111 2212", "benny@example.com"),
    type: "Body Scan", isVideo: false, startMin: 660, durationMin: 45, timeLabel: "11:00 – 11:45",
    doctorId: "EMP-005", doctor: "Dr. Felix Andersen", nurse: "Aylin Demir", room: "Scan B",
    status: "Booked", consent: "Pending", payment: "Unpaid", amount: "₺4,800", balance: "₺4,800",
    currentStep: 0,
    forms: [
      { name: "Clinic Consent", status: "Not Sent" },
      { name: "Scan Safety Checklist", status: "Not Sent" },
    ],
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-13",
    patient: P("Mackenzie Messineo", "MM", "12 Feb 1988", 38, "Female", "+90 532 111 2201", "mackenzie@example.com"),
    type: "Follow-up", isVideo: true, startMin: 690, durationMin: 20, timeLabel: "11:30 – 11:50",
    doctorId: "EMP-003", doctor: "Dr. Claudia Reis", room: "Video",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺1,500", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "18 Mar 2026",
  },
  {
    id: "A-14",
    patient: P("Gustavo Propolis", "GP", "27 Jul 1965", 60, "Male", "+90 532 111 2213", "gustavo@example.com"),
    type: "Consultation (in-person)", isVideo: false, startMin: 840, durationMin: 30, timeLabel: "14:00 – 14:30",
    doctorId: "EMP-005", doctor: "Dr. Felix Andersen", nurse: "Berna Koç", room: "Room 1",
    status: "Booked", consent: "Signed", payment: "Partial", amount: "₺2,400", balance: "₺1,200",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "20 Apr 2026",
  },
];

export function getAppt(id: string | undefined): Appt | undefined {
  return APPTS.find((a) => a.id === id);
}

// A Reception check-in is only enabled when consent is signed AND payment settled.
export function canCheckIn(a: Appt): boolean {
  const consentOk = a.forms.every((f) => f.status === "Signed");
  const paymentOk = a.payment === "Paid";
  return consentOk && paymentOk;
}

export function checkInBlockReason(a: Appt): string | null {
  const consentOk = a.forms.every((f) => f.status === "Signed");
  const paymentOk = a.payment === "Paid";
  if (!consentOk && !paymentOk) return "Complete consent and payment to enable check-in";
  if (!consentOk) return "Awaiting consent — collect required signatures";
  if (!paymentOk) return "Awaiting payment — settle balance to enable check-in";
  return null;
}

// --- Calendar block styling by status ---
// One semantic colour per status, expressed as a fully-bordered tinted card
// (never a one-sided accent stripe) plus a small leading status dot that
// calendar renderers place next to the patient name. Same five-hue language
// as StatusPill everywhere else in the product: blue = booked/info, amber =
// waiting, emerald = a gate passed, orange = happening right now, gray =
// settled/inactive, red = blocked.
type StatusStyle = { card: string; dot: string; text: string };

const STATUS_STYLE: Record<ApptStatus, StatusStyle> = {
  Booked: { card: "bg-blue-50/70 border border-blue-200/80", dot: "bg-blue-500", text: "text-blue-900" },
  Arrived: { card: "bg-amber-50/80 border border-amber-200", dot: "bg-amber-500", text: "text-amber-900" },
  "Checked In": { card: "bg-emerald-50/70 border border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-900" },
  "In Clinic": { card: "bg-orange-50/80 border border-orange-200", dot: "bg-orange-500", text: "text-orange-900" },
  Completed: { card: "bg-gray-50 border border-gray-200", dot: "bg-gray-400", text: "text-gray-600" },
  "No Show": { card: "bg-red-50/60 border border-dashed border-red-300", dot: "bg-red-400", text: "text-red-800" },
  Cancelled: { card: "bg-gray-50 border border-gray-200 line-through", dot: "bg-gray-300", text: "text-gray-400" },
};

export function apptBlockClass(status: ApptStatus): string {
  return `${STATUS_STYLE[status].card} rounded-lg`;
}

// The small leading dot every calendar/timeline block renders before the
// patient name, replacing the old left-border stripe. "In Clinic" is the
// only status that's genuinely happening *right now*, so it alone pulses.
export function apptStatusDotClass(status: ApptStatus): string {
  return `${STATUS_STYLE[status].dot}${status === "In Clinic" ? " animate-pulse" : ""}`;
}

export function apptTextClass(status: ApptStatus): string {
  return STATUS_STYLE[status].text;
}

export function statusPillType(status: ApptStatus): "default" | "success" | "warning" | "error" {
  if (status === "Checked In" || status === "Completed") return "success";
  if (status === "In Clinic" || status === "Arrived") return "warning";
  if (status === "No Show" || status === "Cancelled") return "error";
  return "default";
}

// --- Shared block-geometry math for every time-grid calendar surface ---
// A block's rendered height should read the appointment's real duration, but
// never render so short that a name + type clips to nothing. We raise short
// appointments up to `floorPx`, but only as far as the next appointment in
// the same column actually starts — so a tightly-booked day never produces
// two blocks that visually overlap. `gapMin` is the caller-computed minutes
// until the next item in the same column (undefined if there isn't one).
export function blockHeightPx(durationMin: number, gapMin?: number, floorPx = 30): number {
  const pxPerMin = HOUR_PX / 60;
  const natural = durationMin * pxPerMin;
  const ceiling = gapMin != null ? gapMin * pxPerMin : Infinity;
  return Math.max(natural, Math.min(floorPx, ceiling)) - 2;
}

// Minutes until the next item starts in the same column, for `blockHeightPx`.
// `items` must already be the column's own appointments (any order).
export function gapToNext(items: { startMin: number }[], startMin: number): number | undefined {
  const later = items.map((i) => i.startMin).filter((s) => s > startMin).sort((a, b) => a - b);
  return later.length ? later[0] - startMin : undefined;
}
