import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, FlaskConical, ShieldCheck, CreditCard, Settings, Bell } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { FilterSelect } from "../../components/FilterSelect";
import {
  NotificationItem, NotificationKind, KIND_LABEL,
  staticNotificationsForRole, pendingRequestNotifications, decisionNotifications,
} from "./notificationsData";
import { useAvailabilityStore, getPendingRequests } from "./availability/availabilityStore";
import { useReadIds, markRead, markAllRead } from "./notificationsStore";

const KIND_ICON: Record<NotificationKind, React.ReactNode> = {
  appointment: <Calendar className="w-4 h-4 text-slate-500" />,
  result: <FlaskConical className="w-4 h-4 text-blue-500" />,
  approval: <ShieldCheck className="w-4 h-4 text-amber-500" />,
  payment: <CreditCard className="w-4 h-4 text-emerald-500" />,
  system: <Settings className="w-4 h-4 text-gray-400" />,
};

const KIND_FILTERS: ("All" | NotificationKind)[] = ["All", "appointment", "result", "approval", "payment", "system"];

function NotificationRow({ item, unread, onOpen }: { item: NotificationItem; unread: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 ${unread ? "bg-slate-50/60" : ""}`}
    >
      <span className="shrink-0 mt-0.5">{KIND_ICON[item.kind]}</span>
      <span className="flex-1 min-w-0">
        <span className={`text-sm block ${unread ? "font-bold text-gray-800" : "font-medium text-gray-600"}`}>{item.text}</span>
        <span className="text-xs text-gray-400 mt-0.5 block">{item.time} · {KIND_LABEL[item.kind]}</span>
      </span>
      {unread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" aria-hidden />}
    </button>
  );
}

function NotificationList({ items, readIds, onOpen }: { items: NotificationItem[]; readIds: Set<string>; onOpen: (item: NotificationItem) => void }) {
  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">Nothing here.</div>;
  }
  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} unread={!readIds.has(item.id)} onOpen={() => onOpen(item)} />
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const store = useAvailabilityStore();
  const readIds = useReadIds();
  const [kindFilter, setKindFilter] = useState<"All" | NotificationKind>("All");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Live, store-derived entries: Admin sees what's waiting on their own
  // decision; a Clinician sees decisions made on what they submitted. Never
  // duplicated as static mock, so this can't drift from My Availability /
  // Approval.
  const liveItems = useMemo(() => {
    if (role === "Admin") return pendingRequestNotifications(getPendingRequests(store));
    if (role === "Clinician") return decisionNotifications(store.decisions);
    return [];
  }, [role, store]);

  const allItems = useMemo(() => [...liveItems, ...staticNotificationsForRole(role)], [liveItems, role]);

  const filtered = allItems
    .filter((n) => kindFilter === "All" || n.kind === kindFilter)
    .filter((n) => !unreadOnly || !readIds.has(n.id));

  const unreadCount = allItems.filter((n) => !readIds.has(n.id)).length;

  const openItem = (item: NotificationItem) => {
    markRead(item.id);
    if (item.actionRoute) navigate(item.actionRoute);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead(allItems.map((n) => n.id))}
            className="text-xs font-bold text-slate-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
            {(["All", "Unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setUnreadOnly(t === "Unread")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  (t === "Unread") === unreadOnly ? "bg-slate-700 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <FilterSelect
            value={kindFilter}
            onChange={(v) => setKindFilter(v as "All" | NotificationKind)}
            options={KIND_FILTERS.map((k) => ({ value: k, label: k === "All" ? "All types" : KIND_LABEL[k] }))}
          />
        </div>

        <div className="border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
          <NotificationList items={filtered} readIds={readIds} onOpen={openItem} />
        </div>
      </div>
    </div>
  );
}
