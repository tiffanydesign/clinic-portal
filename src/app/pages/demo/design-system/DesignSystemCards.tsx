import React from "react";
import { CalendarClock, FileClock, UserCheck, Gauge } from "lucide-react";
import { Stat, StatStripGroup } from "../../../components/stat";
import { StatusPill } from "../../app/dashboard/DashboardShared";
import { JourneyProgressStrip } from "../../app/dashboard/journey/JourneyProgress";

export function DesignSystemCards() {
  return (
    <section id="cards" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Cards &amp; composites</h2>
      <p className="text-label text-ink-muted mb-4 px-0.5">These render the SAME shared components used across the real app — Stat family, StatusPill, JourneyProgress, row-height tokens — never a re-implementation for this page.</p>

      <h3 className="text-section text-ink-soft mb-2">Stat — T1 card tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat
            stat={{ id: "ds-appts", label: "Appointments Today", kind: "period", variant: "card", byRange: {
              today: { value: "14", trend: "up", deltaText: "3 vs last Friday", spark: [4, 6, 5, 8, 7, 9, 14], label: "Appointments" },
              "7d": { value: "68", trend: "up", deltaText: "5 vs last week", spark: [50, 55, 60, 58, 62, 65, 68] },
              "30d": { value: "290", trend: "flat", deltaText: "same as last month", spark: [280, 285, 288, 290, 289, 291, 290] },
            } }}
            range="today" locked icon={CalendarClock} iconTone="blue" clickable={false}
          />
          <Stat
            stat={{ id: "ds-results", label: "Results Pending", kind: "live", variant: "card", byRange: {
              today: { value: "7", trend: "down", deltaText: "2 vs last Friday", spark: [10, 9, 8, 8, 7, 7, 7] },
              "7d": { value: "7", trend: "down", deltaText: "2 vs last Friday", spark: [10, 9, 8, 8, 7, 7, 7] },
              "30d": { value: "7", trend: "down", deltaText: "2 vs last Friday", spark: [10, 9, 8, 8, 7, 7, 7] },
            } }}
            range="today" icon={FileClock} iconTone="amber" clickable={false}
          />
        </div>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Stat — T3 strip tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <StatStripGroup>
          <Stat stat={{ id: "ds-strip-1", label: "Checked in", kind: "count", variant: "strip", value: "5" }} icon={UserCheck} iconTone="emerald" />
          <Stat stat={{ id: "ds-strip-2", label: "Utilisation", kind: "count", variant: "strip", value: "21%" }} icon={Gauge} iconTone="blue" />
        </StatStripGroup>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Stat — T4 pill tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex gap-2">
        <Stat stat={{ id: "ds-pill-1", label: "unread", kind: "count", variant: "pill", value: "3" }} tone="amber" dot />
        <Stat stat={{ id: "ds-pill-2", label: "overdue", kind: "count", variant: "pill", value: "1" }} tone="red" dot />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Status Pill — all semantics</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex flex-wrap gap-2">
        <StatusPill status="Active" type="success" />
        <StatusPill status="Pending" type="warning" />
        <StatusPill status="Blocked" type="error" />
        <StatusPill status="Default" type="default" />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Journey Progress — strip density</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <JourneyProgressStrip steps={["Checked In", "Preparation", "Scan 1", "Scan 2", "Check Out"]} current={2} caption="Room 3" />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Table rows — two heights</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Ban: no third row-height at a call site — actionable rows are --row-h / --table-row (44px, v4: was 48px), read-only rows are --row-h-dense (40px). Cell padding: 12px horizontal, 10px vertical (v4: was 16px/12px), same for header and body cells.</p>
      <div className="bg-surface rounded-card border border-divider overflow-hidden mb-6">
        <div className="flex items-center px-4 border-b border-divider" style={{ height: "var(--row-h)" }}>
          <span className="text-sm font-bold text-ink flex-1">Actionable row</span>
          <span className="text-label text-ink-muted tabular-nums">--row-h (48px)</span>
        </div>
        <div className="flex items-center px-4" style={{ height: "var(--row-h-dense)" }}>
          <span className="text-sm text-ink-soft flex-1">Read-only row</span>
          <span className="text-label text-ink-muted tabular-nums">--row-h-dense (40px)</span>
        </div>
      </div>
    </section>
  );
}
