// Shared types, mock data, and style helpers for the Feedback module —
// consumed by both the staff-facing SubmitFeedbackModal and the Admin
// FeedbackAdminPage, so a submission from one renders correctly in the other.

export type Source = "Patient" | "Clinician" | "Nurse" | "Receptionist" | "Google Review";
export type FeedbackType = "Visit Feedback" | "Complaint" | "Suggestion" | "System Issue" | "Incident Report" | "Compliment" | "Other" | "Google Review";
export type Status = "New" | "In Review" | "Resolved" | "Archived" | "Addressed";
export type Urgency = "Low" | "Medium" | "High";

export type HistoryKind = "received" | "in_review" | "resolved" | "archived" | "flagged" | "unflagged" | "note" | "synced" | "addressed";

export type ChangeHistoryEntry = {
  time: string;
  label: string;
  by?: string; // omitted for system-generated events (Received, Synced from Google)
  kind: HistoryKind;
};

export type FeedbackItem = {
  id: string;
  source: Source;
  type: FeedbackType;
  title: string;
  body: string;
  rating?: number; // 1-5 — Patient and Google Review sourced
  urgency?: Urgency; // staff-sourced only (collected by SubmitFeedbackModal)
  isAnonymous?: boolean; // staff-sourced only
  authorName: string; // real identity — always retained internally, even when isAnonymous
  authorRole?: string;
  patientName?: string;
  clinician?: string;
  nurse?: string;
  visitDate?: string;
  timeAgo: string;
  receivedHoursAgo: number; // drives overdue calculation for the New tab
  status: Status;
  flagged?: boolean;
  internalNotes?: { author: string; time: string; text: string }[];
  changeHistory: ChangeHistoryEntry[];
  reviewUrl?: string; // Google Review source only — placeholder deep link to Google Business
};

export const CURRENT_ADMIN_NAME = "Ayşe Hançer";

export const MOCK_DATA: FeedbackItem[] = [
  { id: "1", source: "Patient", type: "Visit Feedback", rating: 5, title: "Excellent care during my body scan", body: "The entire process was smooth. The nurse was very polite and the doctor explained everything clearly. I felt completely taken care of.", patientName: "Ece Yıldırım", clinician: "Dr. Ebru Reis", visitDate: "1 Jul 2026", timeAgo: "2 hours ago", receivedHoursAgo: 2, authorName: "Ece Yıldırım", status: "New",
    changeHistory: [{ time: "2 hours ago", label: "Received", kind: "received" }] },
  { id: "2", source: "Patient", type: "Complaint", rating: 2, title: "Waited over 40 minutes past appointment time", body: "I arrived on time but was left waiting in the reception area for almost 45 minutes with no updates. This is unacceptable.", patientName: "Aslı Kutlu", clinician: "Dr. Emre Yalçın", visitDate: "1 Jul 2026", timeAgo: "5 hours ago", receivedHoursAgo: 5, authorName: "Aslı Kutlu", status: "New", flagged: true,
    changeHistory: [
      { time: "5 hours ago", label: "Received", kind: "received" },
      { time: "4 hours ago", label: "Flagged for follow-up", by: CURRENT_ADMIN_NAME, kind: "flagged" },
    ] },
  { id: "3", source: "Patient", type: "Visit Feedback", rating: 4, title: "Very thorough consultation, minor wait", body: "The doctor was great and answered all my questions. I just wish the initial check-in process was a bit faster.", patientName: "Tarkan Solmaz", clinician: "Dr. Ebru Reis", visitDate: "30 Jun 2026", timeAgo: "1 day ago", receivedHoursAgo: 24, authorName: "Tarkan Solmaz", status: "In Review",
    changeHistory: [
      { time: "1 day ago", label: "Received", kind: "received" },
      { time: "20 hours ago", label: "Marked In Review", by: CURRENT_ADMIN_NAME, kind: "in_review" },
    ] },
  { id: "4", source: "Nurse", type: "Suggestion", title: "iPad freezes when updating journey checklist", body: "Several times today, the ward iPad app froze while I was trying to mark a patient's journey step as complete. Please look into this.", urgency: "Medium", authorName: "Berna Koç", authorRole: "Nurse", timeAgo: "1 day ago", receivedHoursAgo: 24, status: "In Review", internalNotes: [{ author: CURRENT_ADMIN_NAME, time: "1 day ago", text: "Engineering team notified, ticket #2847" }],
    changeHistory: [
      { time: "1 day ago", label: "Received", kind: "received" },
      { time: "22 hours ago", label: "Marked In Review", by: CURRENT_ADMIN_NAME, kind: "in_review" },
      { time: "20 hours ago", label: "Internal note added", by: CURRENT_ADMIN_NAME, kind: "note" },
    ] },
  { id: "5", source: "Patient", type: "Compliment", rating: 5, title: "Berna was incredibly attentive throughout", body: "The nurse Berna made sure I was comfortable the entire time. Huge thanks to her!", patientName: "Gül Korkmaz", nurse: "Berna Koç", visitDate: "29 Jun 2026", timeAgo: "2 days ago", receivedHoursAgo: 48, authorName: "Gül Korkmaz", status: "Resolved",
    changeHistory: [
      { time: "2 days ago", label: "Received", kind: "received" },
      { time: "1 day ago", label: "Marked Resolved", by: CURRENT_ADMIN_NAME, kind: "resolved" },
    ] },
  { id: "6", source: "Receptionist", type: "System Issue", title: "Payment terminal disconnects intermittently", body: "We keep losing connection to the main payment terminal at desk 2. We've had to restart it 3 times today.", urgency: "High", authorName: "Elif Yıldız", authorRole: "Receptionist", timeAgo: "3 days ago", receivedHoursAgo: 72, status: "In Review",
    changeHistory: [
      { time: "3 days ago", label: "Received", kind: "received" },
      { time: "2 days ago", label: "Marked In Review", by: CURRENT_ADMIN_NAME, kind: "in_review" },
    ] },
  { id: "7", source: "Clinician", type: "Incident Report", title: "Patient reported dizziness after blood draw", body: "Patient felt lightheaded immediately after the blood draw procedure. We provided juice and observed them for 30 minutes until symptoms cleared.", urgency: "High", authorName: "Dr. Emre Yalçın", authorRole: "Clinician", timeAgo: "3 days ago", receivedHoursAgo: 72, status: "Resolved", internalNotes: [{ author: CURRENT_ADMIN_NAME, time: "2 days ago", text: "Followed up with patient by phone, no further issues reported." }],
    changeHistory: [
      { time: "3 days ago", label: "Received", kind: "received" },
      { time: "3 days ago", label: "Marked In Review", by: CURRENT_ADMIN_NAME, kind: "in_review" },
      { time: "2 days ago", label: "Internal note added", by: CURRENT_ADMIN_NAME, kind: "note" },
      { time: "2 days ago", label: "Marked Resolved", by: CURRENT_ADMIN_NAME, kind: "resolved" },
    ] },
  { id: "8", source: "Patient", type: "Visit Feedback", rating: 3, title: "Good results explanation but facility felt rushed", body: "The doctor explained my test results well, but the clinic felt very busy and chaotic today.", patientName: "Serkan Çetin", clinician: "Dr. Onur Şimşek", visitDate: "27 Jun 2026", timeAgo: "4 days ago", receivedHoursAgo: 96, authorName: "Serkan Çetin", status: "Archived",
    changeHistory: [
      { time: "4 days ago", label: "Received", kind: "received" },
      { time: "3 days ago", label: "Marked Resolved", by: CURRENT_ADMIN_NAME, kind: "resolved" },
      { time: "1 day ago", label: "Archived", by: CURRENT_ADMIN_NAME, kind: "archived" },
    ] },
  { id: "9", source: "Nurse", type: "Suggestion", title: "Need a way to message clinician when patient is ready", body: "Currently we have to walk down the hall to tell the doctor the patient is in the room. A simple ping button in the app would save time.", urgency: "Low", authorName: "Aylin Demir", authorRole: "Nurse", timeAgo: "5 days ago", receivedHoursAgo: 120, status: "New",
    changeHistory: [{ time: "5 days ago", label: "Received", kind: "received" }] },
  { id: "10", source: "Patient", type: "Visit Feedback", rating: 5, title: "Life-changing health insights", body: "The digital twin visualization was amazing. I finally understand my health metrics clearly.", patientName: "Burak Kocaman", clinician: "Dr. Kaan Öztürk", visitDate: "25 Jun 2026", timeAgo: "6 days ago", receivedHoursAgo: 144, authorName: "Burak Kocaman", status: "Resolved",
    changeHistory: [
      { time: "6 days ago", label: "Received", kind: "received" },
      { time: "5 days ago", label: "Marked Resolved", by: CURRENT_ADMIN_NAME, kind: "resolved" },
    ] },
  // Anonymous submission demo — real identity is retained (so Admin can still
  // escalate a serious issue through other channels) but never surfaced in
  // any Admin-facing display: list card, detail panel, or export.
  { id: "11", source: "Nurse", type: "Suggestion", title: "Rotate weekend on-call assignments more evenly", body: "The same two nurses have covered almost every weekend on-call shift this quarter. A rotating schedule posted a month ahead would help people plan around it.", urgency: "Medium", isAnonymous: true, authorName: "Selin Yılmaz", authorRole: "Nurse", timeAgo: "6 days ago", receivedHoursAgo: 144, status: "New",
    changeHistory: [{ time: "6 days ago", label: "Received", kind: "received" }] },
  // Google Review sync demo — external, read-only reviews pulled from Google
  // Business. Never editable in-line; Admin can only mark Addressed/Flagged
  // and add internal notes, plus jump to Google Business to reply.
  { id: "google-1", source: "Google Review", type: "Google Review", rating: 5, title: "Amazing experience, the staff were so professional and the results were incredibly detailed.", body: "Amazing experience, the staff were so professional and the results were incredibly detailed.", authorName: "Fatma S.", timeAgo: "1 day ago", receivedHoursAgo: 24, status: "Addressed", reviewUrl: "https://business.google.com/reviews",
    changeHistory: [
      { time: "1 day ago", label: "Synced from Google", kind: "synced" },
      { time: "12 hours ago", label: "Marked Addressed", by: CURRENT_ADMIN_NAME, kind: "addressed" },
    ] },
  { id: "google-2", source: "Google Review", type: "Google Review", rating: 3, title: "Good service but the waiting time was longer than expected.", body: "Good service but the waiting time was longer than expected.", authorName: "Ahmet K.", timeAgo: "3 days ago", receivedHoursAgo: 72, status: "New", flagged: true, reviewUrl: "https://business.google.com/reviews",
    changeHistory: [
      { time: "3 days ago", label: "Synced from Google", kind: "synced" },
      { time: "2 days ago", label: "Flagged for follow-up", by: CURRENT_ADMIN_NAME, kind: "flagged" },
    ] },
  { id: "google-3", source: "Google Review", type: "Google Review", rating: 5, title: "Life-changing health insights. Highly recommend Phenome.", body: "Life-changing health insights. Highly recommend Phenome.", authorName: "Hülya T.", timeAgo: "5 days ago", receivedHoursAgo: 120, status: "New", reviewUrl: "https://business.google.com/reviews",
    changeHistory: [{ time: "5 days ago", label: "Synced from Google", kind: "synced" }] },
];

export const SOURCE_COLORS: Record<string, string> = {
  "Patient": "bg-info",
  "Clinician": "bg-special",
  "Nurse": "bg-success",
  "Receptionist": "bg-warning",
  "Google Review": "bg-[#4285F4]",
};

export const TYPE_COLORS: Record<string, string> = {
  "Visit Feedback": "bg-info/10 text-info-ink border-info/30",
  "Complaint": "bg-danger/10 text-danger-ink border-danger/30",
  "Suggestion": "bg-info/10 text-info-ink border-info/30",
  "System Issue": "bg-warning/10 text-warning-ink border-warning/30",
  "Incident Report": "bg-danger/10 text-danger-ink border-danger/30",
  "Compliment": "bg-success/10 text-success-ink border-success/30",
  "Other": "bg-surface-hover text-ink-soft border-divider",
  "Google Review": "bg-info/10 text-info-ink border-info/30",
};

export const STATUS_PILLS: Record<string, string> = {
  "New": "bg-info-ink text-white border-transparent",
  "In Review": "bg-warning/15 text-warning-ink border-warning/30",
  "Resolved": "bg-success/15 text-success-ink border-success/30",
  "Archived": "bg-surface-hover text-ink-soft border-divider",
  "Addressed": "bg-success/15 text-success-ink border-success/30",
};

export const URGENCY_COLORS: Record<Urgency, string> = {
  Low: "bg-surface-hover text-ink-soft border-divider",
  Medium: "bg-warning/10 text-warning-ink border-warning/30",
  High: "bg-danger/10 text-danger-ink border-danger/30",
};

export const HISTORY_DOT_COLORS: Record<HistoryKind, string> = {
  received: "bg-info",
  in_review: "bg-warning",
  resolved: "bg-success",
  addressed: "bg-success",
  archived: "bg-ink-muted",
  flagged: "bg-danger",
  unflagged: "bg-ink-muted",
  note: "bg-ink-muted",
  synced: "bg-[#4285F4]",
};

export type TabKey = "All" | "New" | "In Review" | "Resolved" | "Flagged" | "Archived";
export const TAB_KEYS: TabKey[] = ["All", "New", "In Review", "Resolved", "Flagged", "Archived"];

export function matchesTab(f: FeedbackItem, tab: TabKey): boolean {
  if (tab === "All") return true;
  if (tab === "Flagged") return !!f.flagged;
  if (tab === "Resolved") return f.status === "Resolved" || f.status === "Addressed";
  return f.status === tab;
}

export function isOverdue(f: FeedbackItem): boolean {
  return f.status === "New" && f.receivedHoursAgo >= 48;
}

export function submitterDisplayName(f: Pick<FeedbackItem, "isAnonymous" | "authorName">): string {
  return f.isAnonymous ? "Anonymous" : f.authorName;
}
