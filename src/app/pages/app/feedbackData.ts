// Shared types, mock data, and style helpers for the Feedback module —
// consumed by both the staff-facing SubmitFeedbackModal and the Admin
// FeedbackAdminPage, so a submission from one renders correctly in the other.

export type Source = "Patient" | "Clinician" | "Nurse" | "Receptionist";
export type FeedbackType = "Visit Feedback" | "Complaint" | "Suggestion" | "System Issue" | "Incident Report" | "Compliment" | "Other";
export type Status = "New" | "In Review" | "Resolved" | "Archived";
export type Urgency = "Low" | "Medium" | "High";

export type FeedbackItem = {
  id: string;
  source: Source;
  type: FeedbackType;
  title: string;
  body: string;
  rating?: number; // 1-5, Patient-sourced only
  urgency?: Urgency; // staff-sourced only (collected by SubmitFeedbackModal)
  isAnonymous?: boolean; // staff-sourced only
  authorName: string; // real identity — always retained internally, even when isAnonymous
  authorRole?: string;
  patientName?: string;
  clinician?: string;
  nurse?: string;
  visitDate?: string;
  timeAgo: string;
  status: Status;
  flagged?: boolean;
  internalNotes?: { author: string; time: string; text: string }[];
};

export const MOCK_DATA: FeedbackItem[] = [
  { id: "1", source: "Patient", type: "Visit Feedback", rating: 5, title: "Excellent care during my body scan", body: "The entire process was smooth. The nurse was very polite and the doctor explained everything clearly. I felt completely taken care of.", patientName: "Mackenzie Messineo", clinician: "Dr. Claudia", visitDate: "1 Jul 2026", timeAgo: "2 hours ago", authorName: "Mackenzie Messineo", status: "New" },
  { id: "2", source: "Patient", type: "Complaint", rating: 2, title: "Waited over 40 minutes past appointment time", body: "I arrived on time but was left waiting in the reception area for almost 45 minutes with no updates. This is unacceptable.", patientName: "Penny Pelargonium", clinician: "Dr. Higgs", visitDate: "1 Jul 2026", timeAgo: "5 hours ago", authorName: "Penny Pelargonium", status: "New", flagged: true },
  { id: "3", source: "Patient", type: "Visit Feedback", rating: 4, title: "Very thorough consultation, minor wait", body: "The doctor was great and answered all my questions. I just wish the initial check-in process was a bit faster.", patientName: "Riley Guarana", clinician: "Dr. Claudia", visitDate: "30 Jun 2026", timeAgo: "1 day ago", authorName: "Riley Guarana", status: "In Review" },
  { id: "4", source: "Nurse", type: "Suggestion", title: "iPad freezes when updating journey checklist", body: "Several times today, the ward iPad app froze while I was trying to mark a patient's journey step as complete. Please look into this.", urgency: "Medium", authorName: "Berna Koç", authorRole: "Nurse", timeAgo: "1 day ago", status: "In Review", internalNotes: [{ author: "System Admin", time: "1 day ago", text: "Engineering team notified, ticket #2847" }] },
  { id: "5", source: "Patient", type: "Compliment", rating: 5, title: "Berna was incredibly attentive throughout", body: "The nurse Berna made sure I was comfortable the entire time. Huge thanks to her!", patientName: "Arysse Arcerola", nurse: "Berna Koç", visitDate: "29 Jun 2026", timeAgo: "2 days ago", authorName: "Arysse Arcerola", status: "Resolved" },
  { id: "6", source: "Receptionist", type: "System Issue", title: "Payment terminal disconnects intermittently", body: "We keep losing connection to the main payment terminal at desk 2. We've had to restart it 3 times today.", urgency: "High", authorName: "Elif Yıldız", authorRole: "Receptionist", timeAgo: "3 days ago", status: "In Review" },
  { id: "7", source: "Clinician", type: "Incident Report", title: "Patient reported dizziness after blood draw", body: "Patient felt lightheaded immediately after the blood draw procedure. We provided juice and observed them for 30 minutes until symptoms cleared.", urgency: "High", authorName: "Dr. Chad Okonkwo", authorRole: "Clinician", timeAgo: "3 days ago", status: "Resolved", internalNotes: [{ author: "Admin Sarah", time: "2 days ago", text: "Followed up with patient by phone, no further issues reported." }] },
  { id: "8", source: "Patient", type: "Visit Feedback", rating: 3, title: "Good results explanation but facility felt rushed", body: "The doctor explained my test results well, but the clinic felt very busy and chaotic today.", patientName: "Bob Bromelain", clinician: "Dr. Adobe", visitDate: "27 Jun 2026", timeAgo: "4 days ago", authorName: "Bob Bromelain", status: "Archived" },
  { id: "9", source: "Nurse", type: "Suggestion", title: "Need a way to message clinician when patient is ready", body: "Currently we have to walk down the hall to tell the doctor the patient is in the room. A simple ping button in the app would save time.", urgency: "Low", authorName: "Aylin Demir", authorRole: "Nurse", timeAgo: "5 days ago", status: "New" },
  { id: "10", source: "Patient", type: "Visit Feedback", rating: 5, title: "Life-changing health insights", body: "The digital twin visualization was amazing. I finally understand my health metrics clearly.", patientName: "Dylan Daniel", clinician: "Dr. Felix", visitDate: "25 Jun 2026", timeAgo: "6 days ago", authorName: "Dylan Daniel", status: "Resolved" },
  // Anonymous submission demo — real identity is retained (so Admin can still
  // escalate a serious issue through other channels) but never surfaced in
  // any Admin-facing display: list card, detail panel, or export.
  { id: "11", source: "Nurse", type: "Suggestion", title: "Rotate weekend on-call assignments more evenly", body: "The same two nurses have covered almost every weekend on-call shift this quarter. A rotating schedule posted a month ahead would help people plan around it.", urgency: "Medium", isAnonymous: true, authorName: "Selin Yılmaz", authorRole: "Nurse", timeAgo: "6 days ago", status: "New" },
];

export const SOURCE_COLORS: Record<string, string> = {
  "Patient": "bg-blue-500",
  "Clinician": "bg-purple-500",
  "Nurse": "bg-emerald-500",
  "Receptionist": "bg-orange-500"
};

export const TYPE_COLORS: Record<string, string> = {
  "Visit Feedback": "bg-blue-50 text-blue-700 border-blue-200",
  "Complaint": "bg-red-50 text-red-700 border-red-200",
  "Suggestion": "bg-blue-50 text-blue-700 border-blue-200",
  "System Issue": "bg-orange-50 text-orange-700 border-orange-200",
  "Incident Report": "bg-red-50 text-red-700 border-red-200",
  "Compliment": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Other": "bg-gray-100 text-gray-600 border-gray-300"
};

export const STATUS_PILLS: Record<string, string> = {
  "New": "bg-blue-600 text-white border-transparent",
  "In Review": "bg-orange-100 text-orange-800 border-orange-300",
  "Resolved": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Archived": "bg-gray-100 text-gray-600 border-gray-300"
};

export const URGENCY_COLORS: Record<Urgency, string> = {
  Low: "bg-gray-100 text-gray-600 border-gray-300",
  Medium: "bg-orange-50 text-orange-700 border-orange-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

export function submitterDisplayName(f: Pick<FeedbackItem, "isAnonymous" | "authorName">): string {
  return f.isAnonymous ? "Anonymous" : f.authorName;
}
