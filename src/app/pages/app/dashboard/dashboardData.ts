// Shared types, mock data, and helpers for the role-aware Dashboard.
// One /dashboard route renders four completely different experiences based on
// the current role from AppContext. Keep patient / staff names consistent with
// the Staff and Patients modules.

import type { Role } from "../../../context/AppContext";
import { MOCK_PATIENTS, Group } from "../patientsData";

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
  sex: "Female" | "Male";
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
  // Journey step index into JOURNEY_STEPS_RECEPTION
  currentStep: number;
  forms: { name: string; status: FormStatus }[];
  prep: { sample: "Collected" | "Pending"; scan: "Completed" | "Scheduled" };
  previousVisit?: string;
  // Booked same-day, walk-in-style, rather than pre-scheduled — drives the
  // Reception dashboard's optional "Walk-ins" KPI card only.
  isWalkIn?: boolean;
};

export const JOURNEY_STEPS_RECEPTION = [
  "Consent",
  "Changing Room",
  "Scan",
  "Blood Collection",
  "Consultation",
  "Test Kit",
];

// Which of the 6 canonical steps actually apply to a given appointment type —
// e.g. a Body Scan never touches Blood Collection, a Consultation never
// touches Changing Room/Scan. `currentStep` still indexes the full
// JOURNEY_STEPS_RECEPTION list, so relevantJourneySteps() below re-bases it
// against whichever subset applies, rather than assuming the index lines up.
const TYPE_STEP_SUBSET: Partial<Record<ApptType, string[]>> = {
  "Body Scan": ["Consent", "Changing Room", "Scan", "Test Kit"],
  "Sample Collection": ["Consent", "Blood Collection", "Test Kit"],
  "Consultation (in-person)": ["Consent", "Consultation", "Test Kit"],
  "Consultation (video)": ["Consent", "Consultation"],
  "Follow-up": ["Consent", "Consultation"],
};

// Dynamic, type-aware journey steps for the Appointment Drawer's stepper.
// Falls back to the full 6-step list whenever the appointment's actual
// current step isn't part of the type's expected subset — e.g. a Sample
// Collection visit that happens to be sitting in "Scan" — rather than
// silently misrepresenting a real record to fit a heuristic.
export function relevantJourneySteps(appt: Appt): { steps: string[]; current: number } {
  const full = JOURNEY_STEPS_RECEPTION;
  const currentName = full[appt.currentStep];
  const subset = TYPE_STEP_SUBSET[appt.type];
  if (subset && currentName && subset.includes(currentName)) {
    return { steps: subset, current: subset.indexOf(currentName) };
  }
  return { steps: full, current: Math.min(appt.currentStep, full.length - 1) };
}

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
    sex: p.sex === "M" ? "Male" : "Female",
    phone: p.phone,
    email: p.email,
    alert: p.alert,
  };
}

const NO_FORMS_ISSUE = [
  { name: "Clinic Consent", status: "Signed" as FormStatus },
  { name: "Data Privacy Notice", status: "Signed" as FormStatus },
];

export const APPTS: Appt[] = [
  {
    id: "A-01",
    patient: P("PH-2026-0042"),
    type: "Body Scan", isVideo: false, startMin: 480, durationMin: 90, timeLabel: "08:00 – 09:30",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Berna Koç", room: "Scan A",
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺4,800", balance: "₺0",
    checkInTime: "07:52", currentStep: 2, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "18 Mar 2026",
  },
  {
    id: "A-02",
    patient: P("PH-2026-0015"),
    type: "Consultation (in-person)", isVideo: false, startMin: 510, durationMin: 60, timeLabel: "08:30 – 09:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Room 2",
    // At the final journey step (Test Kit) — her consultation is done and
    // she's ready for Reception to check her out, demoing that row state.
    status: "In Clinic", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    checkInTime: "08:20", currentStep: 5, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "02 May 2026",
  },
  {
    id: "A-03",
    patient: P("PH-2026-0063"),
    type: "Sample Collection", isVideo: false, startMin: 510, durationMin: 75, timeLabel: "08:30 – 09:45",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Berna Koç", room: "Lab 1",
    status: "Completed", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    checkInTime: "08:10", currentStep: 5, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "20 Apr 2026",
  },
  {
    id: "A-04",
    patient: P("PH-2026-0051"),
    type: "Body Scan", isVideo: false, startMin: 570, durationMin: 90, timeLabel: "09:30 – 11:00",
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Scan B",
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
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Berna Koç", room: "Room 1",
    status: "Arrived", consent: "Signed", payment: "Unpaid", amount: "₺2,400", balance: "₺2,400",
    arrivedTime: "08:55", waitMinutes: 19, currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "12 Apr 2026",
  },
  {
    id: "A-06",
    patient: P("PH-2026-0088"),
    type: "Follow-up", isVideo: false, startMin: 570, durationMin: 60, timeLabel: "09:30 – 10:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Room 3",
    status: "Arrived", consent: "Signed", payment: "Paid", amount: "₺1,500", balance: "₺0",
    arrivedTime: "09:05", waitMinutes: 9, currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Collected", scan: "Completed" }, previousVisit: "30 Jun 2026", isWalkIn: true,
  },
  {
    id: "A-07",
    patient: P("PH-2026-0044"),
    type: "Consultation (video)", isVideo: true, startMin: 720, durationMin: 30, timeLabel: "12:00 – 12:30",
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
    checkInTime: "09:12", currentStep: 1, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "28 May 2026",
  },
  {
    id: "A-09",
    patient: P("PH-2026-0071"),
    type: "Sample Collection", isVideo: false, startMin: 645, durationMin: 75, timeLabel: "10:45 – 12:00",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Berna Koç", room: "Lab 2",
    status: "Checked In", consent: "Signed", payment: "Paid", amount: "₺900", balance: "₺0",
    // Check-in must fall on or before the demo clock (09:14) for "Checked
    // In" to be a fact that's already happened, regardless of how early
    // relative to his own slot.
    checkInTime: "09:00", currentStep: 2, forms: NO_FORMS_ISSUE,
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
    type: "Consultation (video)", isVideo: true, startMin: 720, durationMin: 30, timeLabel: "12:00 – 12:30",
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", room: "Video",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,000", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Scheduled" }, previousVisit: "—",
  },
  {
    id: "A-12",
    patient: P("PH-2026-0105"),
    type: "Body Scan", isVideo: false, startMin: 720, durationMin: 90, timeLabel: "12:00 – 13:30",
    doctorId: "EMP-005", doctor: "Dr. Kaan Öztürk", nurse: "Aylin Demir", room: "Scan B",
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
    type: "Follow-up", isVideo: true, startMin: 750, durationMin: 20, timeLabel: "12:30 – 12:50",
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
    doctorId: "EMP-003", doctor: "Dr. Ebru Reis", nurse: "Aylin Demir", room: "Room 2",
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
    doctorId: "EMP-004", doctor: "Dr. Emre Yalçın", nurse: "Berna Koç", room: "Room 1",
    status: "Booked", consent: "Signed", payment: "Paid", amount: "₺2,400", balance: "₺0",
    currentStep: 0, forms: NO_FORMS_ISSUE,
    prep: { sample: "Pending", scan: "Completed" }, previousVisit: "22 Mar 2026",
  },
];

export function getAppt(id: string | undefined): Appt | undefined {
  return APPTS.find((a) => a.id === id);
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
  // A resting shadow (not just on hover) is what makes a block read as an
  // object sitting on the grid rather than a flat tinted rectangle — this is
  // the single biggest lever for the calendar's perceived depth.
  return `${STATUS_STYLE[status].card} rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.06)]`;
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
