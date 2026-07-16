// Tiny external store for notification read-state, following the same
// useSyncExternalStore pattern as availabilityStore.ts. Read-state is kept
// separate from the notification content itself (static + store-derived)
// so "mark as read" works uniformly across both sources.

import { useSyncExternalStore } from "react";

let readIds = new Set<string>(["N-05", "N-07", "N-09", "N-10"]);
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function markRead(id: string) {
  if (readIds.has(id)) return;
  readIds = new Set(readIds).add(id);
  emit();
}

export function markAllRead(ids: string[]) {
  readIds = new Set([...readIds, ...ids]);
  emit();
}

export function markUnread(id: string) {
  if (!readIds.has(id)) return;
  const next = new Set(readIds);
  next.delete(id);
  readIds = next;
  emit();
}

export function useReadIds(): Set<string> {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => readIds
  );
}
