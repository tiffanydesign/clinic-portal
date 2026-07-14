// Canonical patient registry — the single source of truth for patient
// identity (name, DOB/age, contact info) across the whole app. PatientsPage,
// the Dashboard's appointment model, and the Patient Record module all read
// from here instead of independently re-declaring the same people, so
// editing a patient's details in one place keeps every page in sync.

export type PatientStatus = 'Active' | 'Inactive' | 'New' | 'Pending Onboarding';
export type Group = 'VIP' | 'Corporate' | 'Insurance' | 'Walk-in' | '—';
export type Flag = 'Urgent' | 'Follow-up' | 'Watch' | 'No flag';
export type ReviewStatus = 'Results Pending' | 'Awaiting Sign-off' | 'Follow-up Due' | 'Up to Date';

export type Patient = {
  id: string;
  name: string;
  patientId: string;
  avatar: string;
  dob: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  phone: string;
  email: string;
  group: Group;
  clinician: string | null;
  nurse: string | null;
  status: PatientStatus;
  lastVisit: string;
  nextAppt: string | null;
  consent: 'Signed' | 'Pending' | 'Not Sent' | 'N/A';
  payment: 'Paid' | 'Partial' | 'Unpaid' | 'N/A';
  checkIn: 'Checked In' | 'Waiting' | 'Not Arrived' | 'Completed';
  journeyStep: string | null;
  flag: Flag;
  reviewStatus?: ReviewStatus;
  notesCount?: number;
  // A clinically material safety flag (allergy, contraindication, ...) —
  // present only for patients where it matters, never a placeholder.
  alert?: string;
};

export const MOCK_PATIENTS: Patient[] = [
  { id: "1", name: "Ece Yıldırım", patientId: "PH-2026-0042", avatar: "EY", dob: "12 Mar 1992", age: 34, sex: "F", phone: "+90 532 111 2233", email: "ece@example.com", group: "VIP", clinician: "Dr. Ebru Reis", nurse: "Berna Koç", status: "Active", lastVisit: "1 Jul", nextAppt: "3 Jul · Scan", consent: "Signed", payment: "Paid", checkIn: "Checked In", journeyStep: "Scan step", flag: "Watch", reviewStatus: "Results Pending", notesCount: 12, alert: "Penicillin allergy" },
  { id: "2", name: "Aslı Kutlu", patientId: "PH-2026-0038", avatar: "AK", dob: "14 May 1998", age: 28, sex: "F", phone: "+90 542 222 3344", email: "asli@example.com", group: "Corporate", clinician: "Dr. Emre Yalçın", nurse: "Aylin Demir", status: "Active", lastVisit: "28 Jun", nextAppt: "3 Jul · Consult", consent: "Signed", payment: "Unpaid", checkIn: "Waiting", journeyStep: null, flag: "Urgent", reviewStatus: "Awaiting Sign-off", notesCount: 5 },
  { id: "3", name: "Tarkan Solmaz", patientId: "PH-2026-0051", avatar: "TS", dob: "20 Sep 1983", age: 42, sex: "M", phone: "+90 552 333 4455", email: "tarkan@example.com", group: "Walk-in", clinician: "Dr. Ebru Reis", nurse: "Berna Koç", status: "Active", lastVisit: "30 Jun", nextAppt: "3 Jul · Scan", consent: "Pending", payment: "Unpaid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 2 },
  { id: "4", name: "Gül Korkmaz", patientId: "PH-2026-0015", avatar: "GK", dob: "03 Sep 1970", age: 55, sex: "F", phone: "+90 533 444 5566", email: "gul@example.com", group: "VIP", clinician: "Dr. Emre Yalçın", nurse: "Berna Koç", status: "Active", lastVisit: "2 Jul", nextAppt: "10 Jul · Consult", consent: "Signed", payment: "Paid", checkIn: "Completed", journeyStep: null, flag: "Follow-up", reviewStatus: "Results Pending", notesCount: 8 },
  { id: "5", name: "Hakan Bulut", patientId: "PH-2026-0063", avatar: "HB", dob: "27 Jul 1964", age: 61, sex: "M", phone: "+90 543 555 6677", email: "hakan@example.com", group: "Insurance", clinician: "Dr. Kaan Öztürk", nurse: "Aylin Demir", status: "Active", lastVisit: "2 Jul", nextAppt: null, consent: "N/A", payment: "N/A", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Awaiting Sign-off", notesCount: 15 },
  { id: "6", name: "Serkan Çetin", patientId: "PH-2026-0029", avatar: "SC", dob: "17 Oct 1987", age: 38, sex: "M", phone: "+90 553 666 7788", email: "serkan@example.com", group: "Corporate", clinician: "Dr. Onur Şimşek", nurse: null, status: "Active", lastVisit: "1 Jul", nextAppt: "8 Jul · Scan", consent: "Signed", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 4 },
  { id: "7", name: "Burak Kocaman", patientId: "PH-2026-0071", avatar: "BK", dob: "05 Dec 1980", age: 45, sex: "M", phone: "+90 534 777 8899", email: "burak@example.com", group: "Walk-in", clinician: "Dr. Onur Şimşek", nurse: "Aylin Demir", status: "Active", lastVisit: "1 Jul", nextAppt: null, consent: "N/A", payment: "N/A", checkIn: "Not Arrived", journeyStep: null, flag: "Follow-up", reviewStatus: "Follow-up Due", notesCount: 6 },
  { id: "8", name: "Derya Toprak", patientId: "PH-2026-0044", avatar: "DT", dob: "30 Mar 1995", age: 31, sex: "F", phone: "+90 544 888 9900", email: "derya@example.com", group: "VIP", clinician: "Dr. Emre Yalçın", nurse: "Berna Koç", status: "Active", lastVisit: "30 Jun", nextAppt: "5 Jul · Consult", consent: "Signed", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 3 },
  { id: "9", name: "Cem Polat", patientId: "PH-2026-0088", avatar: "CP", dob: "21 Jan 1976", age: 50, sex: "M", phone: "+90 554 999 0011", email: "cem@example.com", group: "Insurance", clinician: "Dr. Kaan Öztürk", nurse: null, status: "Active", lastVisit: "30 Jun", nextAppt: null, consent: "N/A", payment: "N/A", checkIn: "Not Arrived", journeyStep: null, flag: "Urgent", reviewStatus: "Results Pending", notesCount: 11 },
  { id: "10", name: "Ayla Şahin", patientId: "PH-2026-0092", avatar: "AS", dob: "14 Aug 1996", age: 29, sex: "F", phone: "+90 535 000 1122", email: "ayla@example.com", group: "—", clinician: null, nurse: null, status: "Pending Onboarding", lastVisit: "Never", nextAppt: null, consent: "Pending", payment: "Unpaid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", notesCount: 0 },
  { id: "11", name: "Umut Erdem", patientId: "PH-2026-0055", avatar: "UE", dob: "22 Feb 1990", age: 36, sex: "M", phone: "+90 545 111 2233", email: "umut@example.com", group: "Corporate", clinician: "Dr. Emre Yalçın", nurse: "Aylin Demir", status: "New", lastVisit: "Never", nextAppt: "7 Jul · Scan", consent: "Not Sent", payment: "Unpaid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", notesCount: 0 },
  { id: "12", name: "Tolga Aydoğan", patientId: "PH-2026-0033", avatar: "TA", dob: "09 May 1979", age: 47, sex: "M", phone: "+90 555 222 3344", email: "tolga@example.com", group: "Walk-in", clinician: "Dr. Kaan Öztürk", nurse: null, status: "Inactive", lastVisit: "20 May", nextAppt: null, consent: "N/A", payment: "N/A", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", notesCount: 1 },
  // The next five only ever appeared inside the Dashboard's mock appointment
  // list, never in this roster — added here so every named patient has one
  // real record instead of a dangling name string.
  { id: "13", name: "Sena Yavuz", patientId: "PH-2026-0101", avatar: "SY", dob: "19 Sep 1986", age: 39, sex: "F", phone: "+90 532 111 2215", email: "sena@example.com", group: "Walk-in", clinician: "Dr. Ebru Reis", nurse: "Aylin Demir", status: "Active", lastVisit: "Never", nextAppt: "3 Jul · Consult", consent: "Pending", payment: "Unpaid", checkIn: "Waiting", journeyStep: null, flag: "Urgent", reviewStatus: "Results Pending", notesCount: 0 },
  { id: "14", name: "Barış Güneş", patientId: "PH-2026-0102", avatar: "BG", dob: "02 Jan 1974", age: 52, sex: "M", phone: "+90 532 111 2216", email: "baris@example.com", group: "Insurance", clinician: "Dr. Kaan Öztürk", nurse: "Aylin Demir", status: "Active", lastVisit: "5 May", nextAppt: "3 Jul · Scan", consent: "Signed", payment: "Paid", checkIn: "Waiting", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 2 },
  { id: "15", name: "Nazlı Çakır", patientId: "PH-2026-0103", avatar: "NC", dob: "11 Nov 1993", age: 32, sex: "F", phone: "+90 532 111 2217", email: "nazli@example.com", group: "Corporate", clinician: "Dr. Emre Yalçın", nurse: "Berna Koç", status: "Active", lastVisit: "22 Mar", nextAppt: "3 Jul · Consult", consent: "Signed", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 1 },
  { id: "16", name: "Yasemin Kaplan", patientId: "PH-2026-0104", avatar: "YK", dob: "14 Aug 1982", age: 43, sex: "F", phone: "+90 532 111 2210", email: "yasemin@example.com", group: "VIP", clinician: "Dr. Ebru Reis", nurse: "Berna Koç", status: "Active", lastVisit: "1 Apr", nextAppt: "3 Jul · Consult", consent: "Signed", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "Follow-up", reviewStatus: "Follow-up Due", notesCount: 4 },
  { id: "17", name: "Volkan Turan", patientId: "PH-2026-0105", avatar: "VT", dob: "09 May 1968", age: 58, sex: "M", phone: "+90 532 111 2212", email: "volkan@example.com", group: "Walk-in", clinician: "Dr. Kaan Öztürk", nurse: "Aylin Demir", status: "New", lastVisit: "Never", nextAppt: "3 Jul · Scan", consent: "Not Sent", payment: "Unpaid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Results Pending", notesCount: 0 },
  // The next five only ever appeared in Billing / the Nurse dashboard / staff
  // rosters, never in either the Dashboard or this list — same reasoning.
  { id: "18", name: "Defne Korkut", patientId: "PH-2026-0106", avatar: "DK", dob: "15 Apr 1993", age: 33, sex: "F", phone: "+90 536 222 1144", email: "defne@example.com", group: "Insurance", clinician: "Dr. Ebru Reis", nurse: "Berna Koç", status: "Active", lastVisit: "28 Jun", nextAppt: null, consent: "Signed", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 2 },
  { id: "19", name: "Ozan Bilgin", patientId: "PH-2026-0107", avatar: "OB", dob: "06 Jun 1986", age: 40, sex: "M", phone: "+90 537 333 2255", email: "ozan@example.com", group: "Corporate", clinician: "Dr. Kaan Öztürk", nurse: null, status: "Inactive", lastVisit: "25 Jun", nextAppt: null, consent: "N/A", payment: "Paid", checkIn: "Not Arrived", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 1 },
  { id: "20", name: "Ceyda Aksu", patientId: "PH-2026-0108", avatar: "CA", dob: "25 Nov 1990", age: 35, sex: "F", phone: "+90 538 444 3366", email: "ceyda@example.com", group: "Walk-in", clinician: "Dr. Emre Yalçın", nurse: "Berna Koç", status: "Active", lastVisit: "24 Jun", nextAppt: null, consent: "Signed", payment: "Paid", checkIn: "Completed", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 3 },
  { id: "21", name: "Emir Tekin", patientId: "PH-2026-0109", avatar: "ET", dob: "08 Feb 1982", age: 44, sex: "M", phone: "+90 539 555 4477", email: "emir@example.com", group: "Insurance", clinician: "Dr. Kaan Öztürk", nurse: "Berna Koç", status: "Active", lastVisit: "22 Jun", nextAppt: null, consent: "Signed", payment: "Paid", checkIn: "Completed", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 1 },
  { id: "22", name: "İpek Sarıkaya", patientId: "PH-2026-0110", avatar: "IS", dob: "12 Dec 1995", age: 30, sex: "F", phone: "+90 530 666 5588", email: "ipek@example.com", group: "Corporate", clinician: "Dr. Ebru Reis", nurse: "Berna Koç", status: "Active", lastVisit: "1 Jul", nextAppt: null, consent: "Signed", payment: "Paid", checkIn: "Completed", journeyStep: null, flag: "No flag", reviewStatus: "Up to Date", notesCount: 0 },
];

export function getPatientByName(name: string): Patient | undefined {
  return MOCK_PATIENTS.find((p) => p.name === name);
}

export function getPatientById(patientId: string): Patient | undefined {
  return MOCK_PATIENTS.find((p) => p.patientId === patientId);
}
