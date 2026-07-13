import React, { useState } from "react";
import { Calendar, User, CreditCard, Settings } from "lucide-react";
import { Section } from "./DashboardShared";
import { FilterSelect } from "../../../components/FilterSelect";

type EventKind = "Appointments" | "Patients" | "Payments" | "System";

type ActivityItem = {
  time: string;
  kind: EventKind;
  text: React.ReactNode;
};

const FEED: ActivityItem[] = [
  { time: "09:12", kind: "Patients", text: <><b>Elif Yıldız</b> checked in <b>Mackenzie Messineo</b></> },
  { time: "09:05", kind: "Payments", text: <>Payment of <b>₺4,800</b> received from <b>Penny Pelargonium</b> (Card)</> },
  { time: "08:58", kind: "Patients", text: <><b>Dr. Claudia</b> signed off Blood Panel report for <b>Arysse Arcerola</b></> },
  { time: "08:52", kind: "Appointments", text: <>Appointment cancelled: <b>Amara Chen</b>, 10:30 Body Scan (by Deniz Arslan)</> },
  { time: "08:45", kind: "Patients", text: <>New patient registered: <b>Noah Nac</b> (by Elif Yıldız)</> },
  { time: "08:30", kind: "Appointments", text: <>Appointment rescheduled: <b>Bob Bromelain</b>, 3 Jul → 8 Jul (by Deniz Arslan)</> },
  { time: "08:22", kind: "Appointments", text: <><b>Noah Kimura</b> marked as No Show for 08:00 appointment (auto-flagged)</> },
  { time: "08:18", kind: "System", text: <>Automated reminders sent to <b>6 patients</b> for today's appointments</> },
  { time: "08:05", kind: "Payments", text: <>Refund of <b>₺1,200</b> issued to <b>Dylan Daniel</b> (by Ayşe Hançer)</> },
  { time: "07:52", kind: "Appointments", text: <><b>Gustavo Propolis</b> arrived for Sample Collection with Dr. Chad</> },
];

const KIND_ICON: Record<EventKind, React.ReactNode> = {
  Appointments: <Calendar className="w-4 h-4 text-slate-500" />,
  Patients: <User className="w-4 h-4 text-emerald-500" />,
  Payments: <CreditCard className="w-4 h-4 text-blue-500" />,
  System: <Settings className="w-4 h-4 text-gray-400" />,
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
      <div className="divide-y divide-gray-100">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-2.5">
            <span className="text-xs font-bold text-gray-400 w-10 shrink-0 tabular-nums">{item.time}</span>
            <span className="shrink-0">{KIND_ICON[item.kind]}</span>
            <span className="text-sm text-gray-700 flex-1 min-w-0">{item.text}</span>
          </div>
        ))}
      </div>
      {collapsed && items.length > 3 && (
        <button onClick={() => setCollapsed(false)} className="w-full text-center py-2 text-xs font-bold text-slate-600 hover:underline border-t border-gray-100">
          View all
        </button>
      )}
    </Section>
  );
}
