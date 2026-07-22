import React, { useState } from "react";
import { Calendar, User, CreditCard, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "./DashboardShared";
import { FilterSelect } from "../../../components/FilterSelect";

type EventKind = "Appointments" | "Patients" | "Payments" | "System";

type ActivityItem = {
  time: string;
  kind: EventKind;
  text: React.ReactNode;
};

// Emphasised entity inside an activity line (name, amount, clinician). One
// consistent treatment — bold + full ink — so key nouns stand out by weight
// and contrast rather than by scattering accent colours through the feed.
function E({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

const FEED: ActivityItem[] = [
  { time: "09:12", kind: "Patients", text: <><E>Elif Yıldız</E> checked in <E>Ece Yıldırım</E></> },
  { time: "09:05", kind: "Payments", text: <>Payment of <E>₺4,800</E> received from <E>Aslı Kutlu</E> (Card)</> },
  { time: "08:58", kind: "Patients", text: <><E>Dr. Ebru Reis</E> signed off Blood Panel report for <E>Gül Korkmaz</E></> },
  { time: "08:52", kind: "Appointments", text: <>Appointment cancelled: <E>Defne Korkut</E>, 10:30 Body Scan (by Deniz Arslan)</> },
  { time: "08:45", kind: "Patients", text: <>New patient registered: <E>Umut Erdem</E> (by Elif Yıldız)</> },
  { time: "08:30", kind: "Appointments", text: <>Appointment rescheduled: <E>Serkan Çetin</E>, 3 Jul → 8 Jul (by Deniz Arslan)</> },
  { time: "08:22", kind: "Appointments", text: <><E>Ozan Bilgin</E> marked as No Show for 08:00 appointment (auto-flagged)</> },
  { time: "08:18", kind: "System", text: <>Automated reminders sent to <E>6 patients</E> for today's appointments</> },
  { time: "08:05", kind: "Payments", text: <>Refund of <E>₺1,200</E> issued to <E>Burak Kocaman</E> (by Ayşe Hançer)</> },
  { time: "07:52", kind: "Appointments", text: <><E>Hakan Bulut</E> arrived for Sample Collection with Dr. Emre Yalçın</> },
];

// One unified, low-saturation icon treatment for every event kind: the icon
// SHAPE says what happened, while colour is deliberately NOT used to encode
// kind — the old per-kind colours (esp. the deep green) added noise and
// clashed with the blue system palette. Each icon sits in a neutral chip.
const KIND_ICON: Record<EventKind, LucideIcon> = {
  Appointments: Calendar,
  Patients: User,
  Payments: CreditCard,
  System: Settings,
};

const FILTERS: ("All Events" | EventKind)[] = ["All Events", "Appointments", "Patients", "Payments", "System"];

export function ActivityFeed({ defaultCollapsed = false, className }: { defaultCollapsed?: boolean; className?: string }) {
  const [filter, setFilter] = useState<"All Events" | EventKind>("All Events");
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const items = filter === "All Events" ? FEED : FEED.filter((f) => f.kind === filter);
  const visibleItems = collapsed ? items.slice(0, 3) : items;

  return (
    <Section
      title="Recent Activity"
      className={className ?? (defaultCollapsed ? undefined : "h-64")}
      action={
        <FilterSelect
          value={filter}
          onChange={(v) => setFilter(v as "All Events" | EventKind)}
          options={FILTERS}
          className="text-xs px-2 py-1"
        />
      }
    >
      <div className="divide-y divide-divider">
        {visibleItems.map((item, i) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xs font-medium text-ink-muted w-10 shrink-0 tabular-nums">{item.time}</span>
              <span className="w-8 h-8 rounded-card bg-surface-hover flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-ink-soft" />
              </span>
              <span className="text-sm text-ink-soft flex-1 min-w-0 leading-snug">{item.text}</span>
            </div>
          );
        })}
      </div>
      {collapsed && items.length > 3 && (
        <button onClick={() => setCollapsed(false)} className="w-full text-center py-2 text-xs font-bold text-ink-soft hover:underline border-t border-divider">
          View all
        </button>
      )}
    </Section>
  );
}
