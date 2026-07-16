import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar, FlaskConical, ShieldCheck, CreditCard, Settings,
  ChevronDown, MoreHorizontal, X, BellOff,
} from "lucide-react";
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { useAppContext } from "../../context/AppContext";
import { RangeDatePicker } from "../../components/RangeDatePicker";
import { Skeleton } from "../../components/ui/skeleton";
import { NotificationItem, NotificationKind, KIND_LABEL, notificationDate, MOCK_TODAY } from "./notificationsData";
import { useNotificationItems } from "./notificationsSelectors";
import { useReadIds, markRead, markAllRead, markUnread } from "./notificationsStore";

const KIND_FILTERS: ("All" | NotificationKind)[] = ["All", "appointment", "result", "approval", "payment", "system"];

const KIND_ICON_BG: Record<NotificationKind, string> = {
  appointment: "bg-gray-100",
  result: "bg-blue-50",
  approval: "bg-amber-50",
  payment: "bg-emerald-50",
  system: "bg-gray-100",
};

const KIND_ICON: Record<NotificationKind, React.ReactNode> = {
  appointment: <Calendar className="w-4 h-4 text-gray-500" />,
  result: <FlaskConical className="w-4 h-4 text-blue-500" />,
  approval: <ShieldCheck className="w-4 h-4 text-amber-600" />,
  payment: <CreditCard className="w-4 h-4 text-emerald-600" />,
  system: <Settings className="w-4 h-4 text-gray-500" />,
};

type PresetKey = "Today" | "Last 7 days" | "Last 30 days" | "All time" | "Custom range";
const PRESET_OPTIONS: PresetKey[] = ["Today", "Last 7 days", "Last 30 days", "All time"];
const DEFAULT_PRESET: PresetKey = "Last 7 days";
const PAGE_SIZE = 50;

function presetToRange(preset: PresetKey): { start: Date; end: Date } | null {
  const end = endOfDay(MOCK_TODAY);
  if (preset === "Today") return { start: startOfDay(MOCK_TODAY), end };
  if (preset === "Last 7 days") return { start: startOfDay(subDays(MOCK_TODAY, 6)), end };
  if (preset === "Last 30 days") return { start: startOfDay(subDays(MOCK_TODAY, 29)), end };
  return null; // "All time" and "Custom range" (custom uses its own explicit range)
}

function dayLabel(d: Date): string {
  if (isSameDay(d, MOCK_TODAY)) return "Today";
  if (isSameDay(d, subDays(MOCK_TODAY, 1))) return "Yesterday";
  return format(d, "d MMM yyyy");
}

// --- L2: Scope tabs — underline style, role-scoped (a kind with zero items
// for this role never renders a tab for it) ---

function ScopeTab({ label, unread, active, onClick }: { label: string; unread: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 -mb-px min-h-11 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"
      }`}
    >
      {label}
      {unread > 0 && (
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{unread}</span>
      )}
    </button>
  );
}

// --- L3: Filter bar ---

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"}`}
    >
      <span className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all" style={{ left: checked ? 19 : 3 }} />
    </button>
  );
}

function DateFilterControl({
  preset, customRange, onSelectPreset, onApplyCustom,
}: {
  preset: PresetKey;
  customRange: { start: Date; end: Date } | null;
  onSelectPreset: (p: PresetKey) => void;
  onApplyCustom: (start: Date, end: Date) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDefault = preset === DEFAULT_PRESET;

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const label = preset === "Custom range" && customRange
    ? `${format(customRange.start, "d MMM")} – ${format(customRange.end, "d MMM yyyy")}`
    : preset;

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-11 pl-3 pr-2 rounded-full text-sm font-medium transition-colors ${
          isDefault ? "text-gray-600 hover:text-gray-900" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {!isDefault && (
        <button
          onClick={() => onSelectPreset(DEFAULT_PRESET)}
          aria-label="Clear date filter"
          className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
          {PRESET_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => { onSelectPreset(p); setMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${preset === p ? "text-gray-900 font-medium bg-gray-50" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { setMenuOpen(false); setPickerOpen(true); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${preset === "Custom range" ? "text-gray-900 font-medium bg-gray-50" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Custom range…
          </button>
        </div>
      )}

      {pickerOpen && (
        <RangeDatePicker
          initialStart={customRange?.start ?? subDays(MOCK_TODAY, 6)}
          initialEnd={customRange?.end ?? MOCK_TODAY}
          initialPreset="Custom Range"
          onCancel={() => setPickerOpen(false)}
          onApply={(start, end) => { onApplyCustom(start, end); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}

// --- L4: Feed ---

function DayHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 bg-white py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </div>
  );
}

function FeedRow({ item, unread, menuOpen, onOpen, onToggleMenu, onMarkRead, onMarkUnread }: {
  item: NotificationItem;
  unread: boolean;
  menuOpen: boolean;
  onOpen: () => void;
  onToggleMenu: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={`w-full flex items-center gap-4 pl-1 pr-1 py-3 min-h-14 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${unread ? "bg-blue-50/30" : "bg-transparent"}`}
    >
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${KIND_ICON_BG[item.kind]}`}>
        {KIND_ICON[item.kind]}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`text-sm block ${unread ? "font-medium text-gray-900" : "font-normal text-gray-700"}`}>{item.text}</span>
        <span className="text-xs text-gray-500 mt-1 block">{item.time} · {KIND_LABEL[item.kind]}</span>
      </span>
      <span className="w-2.5 shrink-0 flex justify-center">
        {unread && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden />}
      </span>
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
          aria-label="More actions"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-200/70 text-gray-400"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
            <button
              onClick={unread ? onMarkRead : onMarkUnread}
              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Mark as {unread ? "read" : "unread"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 min-h-14 border-b border-gray-100">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <BellOff className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NotificationsPage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const allItems = useNotificationItems(role);
  const readIds = useReadIds();

  const [kindFilter, setKindFilter] = useState<"All" | NotificationKind>("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [datePreset, setDatePreset] = useState<PresetKey>(DEFAULT_PRESET);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [role]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [kindFilter, unreadOnly, datePreset, customRange]);

  useEffect(() => {
    if (!menuOpenId) return;
    function onDocClick() { setMenuOpenId(null); }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpenId]);

  // Per-tab total + unread counts, computed once over the full role-scoped
  // set so switching tabs never changes another tab's own badge — also
  // drives which scope tabs are even worth rendering for this role.
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

  const visibleKinds = KIND_FILTERS.filter((k) => k === "All" || kindCounts[k].total > 0);

  const effectiveRange = datePreset === "Custom range" ? customRange : presetToRange(datePreset);

  const filtered = allItems
    .filter((n) => kindFilter === "All" || n.kind === kindFilter)
    .filter((n) => !unreadOnly || !readIds.has(n.id))
    .filter((n) => !effectiveRange || isWithinInterval(notificationDate(n.time), effectiveRange));

  const paginated = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: NotificationItem[] }>();
    for (const item of paginated) {
      const d = notificationDate(item.time);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, { label: dayLabel(d), items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([, g]) => g);
  }, [paginated]);

  const unreadCount = kindCounts.All.unread;

  const openItem = (item: NotificationItem) => {
    markRead(item.id);
    if (item.actionRoute) navigate(item.actionRoute);
  };

  const clearFilters = () => {
    setKindFilter("All");
    setUnreadOnly(false);
    setDatePreset(DEFAULT_PRESET);
    setCustomRange(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="px-8 pt-8">
        {/* L1 — Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead(allItems.map((n) => n.id))}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* L2 — Scope tabs, full-width underline separating nav from filters+feed below */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleKinds.map((k) => (
              <ScopeTab
                key={k}
                label={k === "All" ? "All" : KIND_LABEL[k]}
                unread={kindCounts[k].unread}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-8 pb-24">
        {/* L3 — Filter bar, right-aligned, one visual layer below scope */}
        <div className="flex items-center justify-end gap-2 mt-4 mb-2">
          <label className="flex items-center gap-2 h-11 px-1 text-sm text-gray-600 cursor-pointer select-none">
            <ToggleSwitch checked={unreadOnly} onChange={() => setUnreadOnly((v) => !v)} />
            Unread only
          </label>
          <DateFilterControl
            preset={datePreset}
            customRange={customRange}
            onSelectPreset={setDatePreset}
            onApplyCustom={(start, end) => { setCustomRange({ start, end }); setDatePreset("Custom range"); }}
          />
        </div>

        {/* L4 — Feed, no card wrapper, grouped by day */}
        {loading ? (
          <div>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : allItems.length === 0 ? (
          <EmptyState title="You're all caught up" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={unreadOnly ? "No unread notifications in this period" : "No notifications match these filters"}
            subtitle="Try a different category or date range."
            action={<button onClick={clearFilters} className="text-sm font-medium text-gray-700 hover:text-gray-900 underline">Clear filters</button>}
          />
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                <DayHeader label={group.label} />
                {group.items.map((item) => {
                  const unread = !readIds.has(item.id);
                  return (
                    <FeedRow
                      key={item.id}
                      item={item}
                      unread={unread}
                      menuOpen={menuOpenId === item.id}
                      onOpen={() => openItem(item)}
                      onToggleMenu={() => setMenuOpenId((v) => (v === item.id ? null : item.id))}
                      onMarkRead={() => { markRead(item.id); setMenuOpenId(null); }}
                      onMarkUnread={() => { markUnread(item.id); setMenuOpenId(null); }}
                    />
                  );
                })}
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
