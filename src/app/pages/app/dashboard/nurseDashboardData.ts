// Mock data and types for the redesigned, single-focus Nurse Dashboard.
// Unlike the shared multi-role dashboard (KPI bar + calendar + queue panels),
// this page has its own dedicated model built around one question: what does
// this nurse do right now, and who's next — not a KPI/metrics summary.

export type JourneyStep = {
  label: string;
  completedTime?: string; // set once the step is done
  status?: string; // shown only while this step is current, e.g. "In progress · 12 min"
  detail?: string; // action-oriented guidance, shown only while this step is current
  action?: string; // primary button label while this step is current
};

export type CurrentPatient = {
  name: string;
  age: string; // "34 · F"
  appointment: string; // "Body Scan · 08:00 · Dr. Claudia Reis · Room 3"
  patientRoute: string;
  currentStepIndex: number;
  steps: JourneyStep[];
};

export type ScheduleStatus = "in-progress" | "upcoming" | "cancelled";

export type ScheduleItem = {
  time: string;
  name: string;
  type: string;
  doctor: string;
  room: string;
  duration: string;
  status: ScheduleStatus;
};

export type QueueItem = {
  name: string;
  time: string;
  type: string;
};

export type CompletedItem = {
  name: string;
  type: string;
  time: string;
};

export const INITIAL_CURRENT_PATIENT: CurrentPatient = {
  name: "Mackenzie Messineo",
  age: "34 · F",
  appointment: "Body Scan · 08:00 · Dr. Claudia Reis · Room 3",
  patientRoute: "/patients/P-001",
  currentStepIndex: 2,
  steps: [
    { label: "Pickup", completedTime: "07:45" },
    { label: "Changing Room", completedTime: "07:52" },
    { label: "Scan", status: "In progress · 12 min", detail: "Body scan underway · Room 3 · est. 15 min remaining", action: "Mark Scan Complete" },
    { label: "Sample Collection", status: "Next up", detail: "Collect blood sample now · Lab 1 · 2 tubes required", action: "Mark Sample Collected" },
    { label: "Consultation", status: "Next up", detail: "Review results with Dr. Claudia Reis · Room 3", action: "Mark Consultation Complete" },
    { label: "Check Out", status: "Final step", detail: "Discharge patient and close out the journey", action: "Mark Check-Out Complete" },
  ],
};

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { time: "08:00", name: "Mackenzie Messineo", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "in-progress" },
  { time: "08:30", name: "Gustavo Propolis", type: "Consultation", doctor: "Dr. Chad Okonkwo", room: "Room 1", duration: "20 min", status: "upcoming" },
  { time: "09:00", name: "Penny Pelargonium", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "cancelled" },
  { time: "09:15", name: "Cynthia Riboflavin", type: "Check-in", doctor: "Dr. Chad Okonkwo", room: "Room 2", duration: "10 min", status: "upcoming" },
  { time: "10:00", name: "Dylan Daniel", type: "Vitals", doctor: "Dr. Claudia Reis", room: "Room 1", duration: "15 min", status: "upcoming" },
  { time: "10:30", name: "Amara Chen", type: "Body Scan", doctor: "Dr. Claudia Reis", room: "Room 3", duration: "45 min", status: "upcoming" },
  { time: "11:00", name: "Noah Kimura", type: "Blood Draw", doctor: "Lab 1", room: "Lab 1", duration: "10 min", status: "upcoming" },
  { time: "14:00", name: "Gustavo Propolis", type: "Follow-up", doctor: "Dr. Chad Okonkwo", room: "Room 1", duration: "20 min", status: "upcoming" },
];

export const INITIAL_UP_NEXT: QueueItem[] = [
  { name: "Gustavo Propolis", time: "08:30", type: "Consultation" },
  { name: "Cynthia Riboflavin", time: "09:15", type: "Check-in" },
  { name: "Dylan Daniel", time: "10:00", type: "Vitals" },
  { name: "Amara Chen", time: "10:30", type: "Body Scan" },
  { name: "Noah Kimura", time: "11:00", type: "Blood Draw" },
];

export const INITIAL_COMPLETED_TODAY: CompletedItem[] = [
  { name: "Sophia Lindqvist", type: "Consultation", time: "07:40" },
  { name: "Marco Duarte", type: "Body Scan", time: "07:55" },
  { name: "Elena Popescu", type: "Check-in", time: "08:10" },
];

// Every visit follows the same six-stage journey in this demo, regardless of
// appointment type — matching the simplification the rest of the dashboard
// mock data already makes (one shared JOURNEY_STEPS_RECEPTION template).
export function buildPatientFromQueueItem(item: QueueItem): CurrentPatient {
  return {
    name: item.name,
    age: "—",
    appointment: `${item.type} · ${item.time}`,
    patientRoute: "/patients/P-001",
    currentStepIndex: 0,
    steps: [
      { label: "Pickup", status: "In progress · just started", detail: `Bring ${item.name} in from the waiting area`, action: "Mark Pickup Complete" },
      { label: "Changing Room", detail: "Confirm patient is changed and ready", action: "Mark Changing Room Complete" },
      { label: "Scan", detail: "Begin body scan", action: "Mark Scan Complete" },
      { label: "Sample Collection", detail: "Collect required sample", action: "Mark Sample Collected" },
      { label: "Consultation", detail: "Hand off to clinician for consultation", action: "Mark Consultation Complete" },
      { label: "Check Out", detail: "Discharge patient and close out the journey", action: "Mark Check-Out Complete" },
    ],
  };
}
