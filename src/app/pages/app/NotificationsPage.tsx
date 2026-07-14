import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, CalendarDays, FlaskConical, ShieldCheck, CreditCard, Settings, Bell } from "lucide-react";
import { format, isWithinInterval } from "date-fns";
import { useAppContext } from "../../context/AppContext";
import { RangeDatePicker } from "../../components/RangeDatePicker";
import {
  NotificationItem, NotificationKind, KIND_LABEL, notificationDate,
  staticNotificationsForRole, pendingRequestNotifications, decisionNotifications, scheduleChangeNotifications,
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

function CategoryTab({ label, total, unread, active, onClick }: { label: string; total: number; unread: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${active ? "bg-slate-700 text-white" : "text-gray-500 hover:text-gray-700"}`}
    >
      {label} ({total})
      {unread > 0 && (
        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ${active ? "ring-slate-700" : "ring-white"}`} aria-hidden />
      )}
    </button>
  );
}

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
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date(2026, 6, 3);
    const start = new Date(2026, 6, 3);
    start.setDate(start.getDate() - 7);
    return { start, end };
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!datePickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datePickerOpen]);

  // Live, store-derived entries: Admin sees what's waiting on their own
  // decision; a Clinician sees decisions made on what they submitted. Never
  // duplicated as static mock, so this can't drift from My Availability /
  // Approval.
  const liveItems = useMemo(() => {
    if (role === "Admin") return [...pendingRequestNotifications(getPendingRequests(store)), ...scheduleChangeNotifications(store.scheduleChangeLog)];
    if (role === "Clinician") return decisionNotifications(store.decisions);
    return [];
  }, [role, store]);

  const allItems = useMemo(() => [...liveItems, ...staticNotificationsForRole(role)], [liveItems, role]);

  // Per-tab total + unread counts, computed once over the full set so
  // switching tabs never changes another tab's own badge.
  const kindCounts = useMemo(() => {
    const counts: Record<"All" | NotificationKind, { total: number; unread: number }> = {
      All: { total: 0, unread: 0 }, appointment: { total: 0, unread: 0 }, result: { total: 0, unread: 0 },
      approval: { total: 0, unread: 0 }, payment: { total: 0, unread: 0 }, system: { total: 0, unread: 0 },
    };
    allItems.forEach((n) => {
      const unread = !readIds.has(n.id);
      counts.All.total++;
      if (unread) counts.All.unread++;
      counts[n.kind].total++;
      if (unread) counts[n.kind].unread++;
    });
    return counts;
  }, [allItems, readIds]);

  const filtered = allItems
    .filter((n) => kindFilter === "All" || n.kind === kindFilter)
    .filter((n) => !unreadOnly || !readIds.has(n.id))
    .filter((n) => isWithinInterval(notificationDate(n.time), { start: dateRange.start, end: dateRange.end }));

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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex flex-wrap gap-0.5 bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
            {KIND_FILTERS.map((k) => (
              <CategoryTab
                key={k}
                label={k === "All" ? "All" : KIND_LABEL[k]}
                total={kindCounts[k].total}
                unread={kindCounts[k].unread}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
              />
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            />
            Unread only
          </label>

          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setDatePickerOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-xs font-bold text-gray-700 shadow-sm hover:border-gray-400 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              {format(dateRange.start, "d MMM")} – {format(dateRange.end, "d MMM yyyy")}
            </button>
            {datePickerOpen && (
              <RangeDatePicker
                initialStart={dateRange.start}
                initialEnd={dateRange.end}
                initialPreset="Custom Range"
                onCancel={() => setDatePickerOpen(false)}
                onApply={(start, end) => { setDateRange({ start, end }); setDatePickerOpen(false); }}
              />
            )}
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
          <NotificationList items={filtered} readIds={readIds} onOpen={openItem} />
        </div>
      </div>
    </div>
  );
}
