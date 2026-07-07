// In-memory external store bridging SubmitFeedbackModal (any non-Admin role)
// and FeedbackAdminPage — a submission needs to actually land in the Admin
// list, not just show a toast, since there's no backend here.
import { useSyncExternalStore } from "react";
import { MOCK_DATA, FeedbackItem, Source, FeedbackType, Urgency, Status } from "./feedbackData";

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
  urgency: Urgency;
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
    status: "New" as Status,
  };
  items = [newItem, ...items];
  emit();
  return newItem;
}

export function updateFeedback(id: string, patch: Partial<FeedbackItem>) {
  items = items.map((f) => (f.id === id ? { ...f, ...patch } : f));
  emit();
}
