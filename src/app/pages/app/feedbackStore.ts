// In-memory external store bridging SubmitFeedbackModal (any non-Admin role)
// and FeedbackAdminPage — a submission needs to actually land in the Admin
// list, not just show a toast, since there's no backend here.
import { useSyncExternalStore } from "react";
import { MOCK_DATA, FeedbackItem, Source, FeedbackType, Urgency, Status, ChangeHistoryEntry, HistoryKind } from "./feedbackData";

let items: FeedbackItem[] = [...MOCK_DATA];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useFeedbackList(): FeedbackItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items
  );
}

export type NewFeedbackInput = {
  source: Source;
  type: FeedbackType;
  subject: string;
  description: string;
  urgency?: Urgency;
  isAnonymous: boolean;
  authorName: string;
  authorRole: string;
};

export function addFeedback(input: NewFeedbackInput): FeedbackItem {
  const newItem: FeedbackItem = {
    id: `local-${items.length + 1}-${Math.round(performance.now())}`,
    source: input.source,
    type: input.type,
    title: input.subject,
    body: input.description,
    urgency: input.urgency,
    isAnonymous: input.isAnonymous,
    authorName: input.authorName,
    authorRole: input.authorRole,
    timeAgo: "Just now",
    receivedHoursAgo: 0,
    status: "New" as Status,
    changeHistory: [{ time: "Just now", label: "Received", kind: "received" }],
  };
  items = [newItem, ...items];
  emit();
  return newItem;
}

// STATUS_LABELS/KINDS keep the append-only history entry consistent with
// whatever transition the Admin just made from the detail panel's dropdown.
const STATUS_KIND: Record<Status, HistoryKind> = {
  "New": "received",
  "In Review": "in_review",
  "Resolved": "resolved",
  "Archived": "archived",
  "Addressed": "addressed",
};

function appendHistory(f: FeedbackItem, entry: ChangeHistoryEntry): FeedbackItem {
  return { ...f, changeHistory: [...f.changeHistory, entry] };
}

export function changeStatus(id: string, newStatus: Status, actor: string) {
  items = items.map((f) => {
    if (f.id !== id) return f;
    const updated = { ...f, status: newStatus };
    return appendHistory(updated, { time: "Just now", label: `Marked ${newStatus}`, by: actor, kind: STATUS_KIND[newStatus] });
  });
  emit();
}

export function toggleFlag(id: string, actor: string) {
  items = items.map((f) => {
    if (f.id !== id) return f;
    const next = !f.flagged;
    const updated = { ...f, flagged: next };
    return appendHistory(updated, { time: "Just now", label: next ? "Flagged for follow-up" : "Unflagged", by: actor, kind: next ? "flagged" : "unflagged" });
  });
  emit();
}

export function addInternalNote(id: string, text: string, actor: string) {
  items = items.map((f) => {
    if (f.id !== id) return f;
    const notes = f.internalNotes || [];
    const updated = { ...f, internalNotes: [{ author: actor, time: "Just now", text }, ...notes] };
    return appendHistory(updated, { time: "Just now", label: "Internal note added", by: actor, kind: "note" });
  });
  emit();
}
