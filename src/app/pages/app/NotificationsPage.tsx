import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar, FlaskConical, ShieldCheck, CreditCard, Settings,
  ChevronDown, MoreHorizontal, X, BellOff, Bell, CheckCheck, CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { useAppContext } from "../../context/AppContext";
import { Stat } from "../../components/stat";
import { RangeDatePicker } from "../../components/RangeDatePicker";
import { Skeleton } from "../../components/ui/skeleton";
import { NotificationItem, NotificationKind, KIND_LABEL, notificationDate, MOCK_TODAY } from "./notificationsData";
import { useNotificationItems } from "./notificationsSelectors";
import { useReadIds, markRead, markAllRead, markUnread } from "./notificationsStore";

const KIND_FILTERS: ("All" | NotificationKind)[] = ["All", "appointment", "result", "approval", "payment", "system"];

// One source of truth for a category's visual identity — the icon, its colour,
// the soft chip behind it, the inline category tag, and the tab count badge.
// Each kind gets a distinct hue so the feed and nav are scannable at a glance;
// "system" stays neutral slate as it's low-signal noise.
type KindStyle = {
  icon: LucideIcon;
  iconColor: string;
  chipBg: string;
  tag: string;
};

const KIND_STYLE: Record<NotificationKind, KindStyle> = {
  appointment: { icon: Calendar, iconColor: "text-special-ink", chipBg: "bg-special/10", tag: "bg-special/10 text-special-ink" },
  result: { icon: FlaskConical, iconColor: "text-info-ink", chipBg: "bg-info/10", tag: "bg-info/10 text-info-ink" },
  approval: { icon: ShieldCheck, iconColor: "text-warning-ink", chipBg: "bg-warning/10", tag: "bg-warning/10 text-warning-ink" },
  payment: { icon: CreditCard, iconColor: "text-success-ink", chipBg: "bg-success/10", tag: "bg-success/10 text-success-ink" },
  system: { icon: Settings, iconColor: "text-ink-muted", chipBg: "bg-surface-hover", tag: "bg-surface-hover text-ink-soft" },
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

// The count rides in the Stat family's T4 `pill` tier. It stays tone-neutral:
// category identity is already carried by the tab's coloured icon, and an
// amber/red count here would falsely read as an alarm.
function ScopeTab({ label, icon: Icon, iconColor, unread, active, onClick }: {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  unread: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 -mb-px min-h-11 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? "text-ink border-ink" : "text-ink-muted border-transparent hover:text-ink-soft"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? iconColor : "text-ink-muted"}`} />
      {label}
      {unread > 0 && (
        <Stat
          stat={{ id: `scope-${label}`, label: `${label} unread`, kind: "count", variant: "pill", value: String(unread) }}
        />
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
      className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${checked ? "bg-surface-sunken" : "bg-surface-sunken"}`}
    >
      <span className="w-3.5 h-3.5 bg-surface rounded-full absolute top-[3px] transition-all" style={{ left: checked ? 19 : 3 }} />
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
          isDefault ? "text-ink-soft hover:text-ink" : "bg-surface-hover text-ink-soft hover:bg-surface-sunken"
        }`}
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {!isDefault && (
        <button
          onClick={() => onSelectPreset(DEFAULT_PRESET)}
          aria-label="Clear date filter"
          className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full hover:bg-surface-hover text-ink-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-divider rounded-card shadow-lg py-1 z-20">
          {PRESET_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => { onSelectPreset(p); setMenuOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${preset === p ? "text-ink font-medium bg-surface-page" : "text-ink-soft hover:bg-surface-page"}`}
            >
              {p}
            </button>
          ))}
          <div className="border-t border-divider my-1" />
          <button
            onClick={() => { setMenuOpen(false); setPickerOpen(true); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${preset === "Custom range" ? "text-ink font-medium bg-surface-page" : "text-ink-soft hover:bg-surface-page"}`}
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

function DayHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm py-2 flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
      <span className="text-xs font-medium text-ink-muted">{count}</span>
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
  const style = KIND_STYLE[item.kind];
  const Icon = style.icon;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={`group relative w-full flex items-center gap-3.5 pl-4 pr-1 py-3 min-h-14 border-b border-divider cursor-pointer transition-colors hover:bg-surface-page ${unread ? "bg-info/10" : "bg-transparent"}`}
    >
      {/* Unread accent — canonical blue spine, distinct from category colour */}
      {unread && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-info-ink" aria-hidden />}
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-1 ring-black/[0.03] ${style.chipBg}`}>
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`text-sm block leading-snug ${unread ? "font-semibold text-ink" : "font-normal text-ink-soft"}`}>{item.text}</span>
        <span className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-label font-medium ${style.tag}`}>{KIND_LABEL[item.kind]}</span>
          <span className="text-xs text-ink-muted tabular-nums">{item.time}</span>
        </span>
      </span>
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
          aria-label="More actions"
          className={`w-11 h-11 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken/70 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-40 bg-surface border border-divider rounded-card shadow-lg py-1 z-20">
            <button
              onClick={unread ? onMarkRead : onMarkUnread}
              className="w-full text-left px-3 py-2.5 text-sm text-ink-soft hover:bg-surface-page"
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
    <div className="flex items-center gap-4 py-3 min-h-14 border-b border-divider">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, action, tone = "neutral" }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tone?: "neutral" | "positive";
}) {
  const positive = tone === "positive";
  const Icon = positive ? CheckCircle2 : BellOff;
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${positive ? "bg-success/10" : "bg-surface-hover"}`}>
        <Icon className={`w-5 h-5 ${positive ? "text-success-ink" : "text-ink-muted"}`} />
      </div>
      <div className="text-sm font-medium text-ink-soft">{title}</div>
      {subtitle && <div className="text-xs text-ink-muted mt-1">{subtitle}</div>}
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
    <div className="h-full overflow-y-auto bg-surface">
      <div className="px-6 pt-4">
        {/* L1 — Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="relative w-11 h-11 rounded-card bg-surface-sunken text-ink-soft flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-info-ink text-white text-label font-bold ring-2 ring-white tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink leading-tight">Notifications</h1>
              <div className="mt-1">
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 text-info-ink px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-info-ink" />
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success-ink font-medium">
                    <CheckCircle2 className="w-4 h-4" /> You're all caught up
                  </span>
                )}
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead(allItems.map((n) => n.id))}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-card text-sm font-medium text-ink-soft border border-divider bg-surface hover:bg-surface-page hover:text-ink transition-colors shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          )}
        </div>

        {/* L2 — Scope tabs, full-width underline separating nav from filters+feed below */}
        <div className="mt-6 border-b border-divider">
          <nav className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleKinds.map((k) => (
              <ScopeTab
                key={k}
                label={k === "All" ? "All" : KIND_LABEL[k]}
                icon={k === "All" ? Bell : KIND_STYLE[k].icon}
                iconColor={k === "All" ? "text-ink-soft" : KIND_STYLE[k].iconColor}
                unread={kindCounts[k].unread}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-6 pb-6">
        {/* L3 — Filter bar, right-aligned, one visual layer below scope */}
        <div className="flex items-center justify-end gap-2 mt-4 mb-2">
          <label className="flex items-center gap-2 h-11 px-1 text-sm text-ink-soft cursor-pointer select-none">
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
          <EmptyState tone="positive" title="You're all caught up" subtitle="New notifications will appear here." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={unreadOnly ? "No unread notifications in this period" : "No notifications match these filters"}
            subtitle="Try a different category or date range."
            action={<button onClick={clearFilters} className="text-sm font-medium text-ink-soft hover:text-ink underline">Clear filters</button>}
          />
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                <DayHeader label={group.label} count={group.items.length} />
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
                  className="px-4 py-2 rounded-card text-sm font-medium text-ink-soft border border-divider hover:bg-surface-page transition-colors"
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
