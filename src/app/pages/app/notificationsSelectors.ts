// Single source of truth for "which notifications does this role have, and
// how many are unread" — used by both NotificationsPage and the AppShell
// bell indicator so the two counts can never drift apart.

import { useMemo } from "react";
import type { Role } from "../../context/AppContext";
import {
  NotificationItem, staticNotificationsForRole,
  pendingRequestNotifications, decisionNotifications, scheduleChangeNotifications,
} from "./notificationsData";
import { useAvailabilityStore, getPendingRequests } from "./availability/availabilityStore";
import { useReadIds } from "./notificationsStore";

export function useNotificationItems(role: Role): NotificationItem[] {
  const store = useAvailabilityStore();

  const liveItems = useMemo(() => {
    if (role === "Admin") return [...pendingRequestNotifications(getPendingRequests(store)), ...scheduleChangeNotifications(store.scheduleChangeLog)];
    if (role === "Clinician") return decisionNotifications(store.decisions);
    return [];
  }, [role, store]);

  return useMemo(() => [...liveItems, ...staticNotificationsForRole(role)], [liveItems, role]);
}

export function useUnreadNotificationCount(role: Role): number {
  const items = useNotificationItems(role);
  const readIds = useReadIds();
  return useMemo(() => items.filter((n) => !readIds.has(n.id)).length, [items, readIds]);
}
