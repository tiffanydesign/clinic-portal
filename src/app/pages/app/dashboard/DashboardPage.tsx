import React from "react";
import { useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { PAGE_TITLE_CLASS } from "../../../components/PageTitleIcon";
import { useKpiBar, KpiControls, KpiCards } from "./KpiBar";
import { CalendarWidget } from "./CalendarWidget";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ActivityFeed } from "./ActivityFeed";
import { AdminPanels } from "./RolePanels";
import { NeedsYourActionCard } from "./NeedsYourActionCard";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { NurseDashboardPage } from "./NurseDashboardPage";
import { ClinicianDashboardBody } from "./ClinicianDashboardBody";
import { ReceptionDashboardBody } from "./ReceptionDashboardBody";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";

export function DashboardPage() {
  const { role } = useAppContext();
  const { apptId } = useParams();
  // Called unconditionally (rules of hooks) even though only Admin renders
  // its output below — role can change via the demo switcher without this
  // component remounting, so the hook call itself can't be behind the
  // Nurse/Reception early returns.
  const kpi = useKpiBar();

  // Nurse, Reception, and Clinician are each a fully separate, purpose-built
  // layout — bypass the shared header / KPI bar / room calendar layout
  // entirely for these roles. Reception owns its own frosted header (per
  // DESIGN_STYLE.md) rather than reusing the classic header below.
  if (role === "Nurse") return <NurseDashboardPage />;
  if (role === "Reception") return <ReceptionDashboardBody />;

  const appt = getAppt(apptId);

  return (
    <div className="bg-surface-page">
      {/* Header — part of the normal page flow, so the whole page (including
          this) scrolls together rather than pinning under a fixed header. */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          {/* Greeting + the two front-desk quick actions (New Patient / New
              Booking) sit together on the left; the KPI range/customise
              controls stay on the far right. Wraps gracefully at narrow iPad
              widths. Clinician gets its own plain live counters instead. */}
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap min-w-0">
            <div className="shrink-0">
              <h1 className={`${PAGE_TITLE_CLASS} whitespace-nowrap`}>Good morning, {ROLE_GREETING[role]}</h1>
              <p className="text-sm text-ink-muted mt-1 whitespace-nowrap">{TODAY_LABEL} · Istanbul Clinic</p>
            </div>
            {role === "Admin" && <DashboardQuickActions />}
          </div>
          {role === "Admin" && <KpiControls kpi={kpi} />}
        </div>
        {role === "Admin" && <KpiCards kpi={kpi} />}
      </div>

      {role === "Clinician" ? (
        <ClinicianDashboardBody />
      ) : (
        /* Tier 1 (top row): the day's shape, at full height — no internal
           scroll, the whole 08:00-19:00 grid is always visible — paired with
           Needs Your Action at the same proportions Reception uses for its
           Schedule + Front Desk Queue row (flex-1 calendar + a 420px fixed
           column, both stretched to the taller side's natural height).
           Tier 2 (below): Results Queue + Waiting Room + Recent Activity —
           the three monitoring cards packed into ONE height-matched row so
           Admin scans the clinic's live state without scrolling the page. */
        <div className="px-4 py-4 space-y-3">
          <div className="flex gap-3">
            {/* The inner `shrink-0` wrapper (not `h-full` directly on a
                stretched flex-1 parent) is what lets CalendarWidget's own
                `h-full` degrade to its natural content height instead of a
                self-referential stretch computation that clips a few px off
                the bottom — same structure Reception's schedule column
                uses, which is why that one never grows an internal scrollbar. */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="shrink-0"><CalendarWidget /></div>
            </div>
            {/* Column ratio 70:30 (was a fixed 420px, ~60:40) — the schedule
                grid is the page's primary content and was starved of width
                by an oversized fixed-width action column; a min-width floor
                keeps the action list from ever getting uncomfortably narrow
                on smaller viewports. */}
            <div className="w-[30%] min-w-[320px] shrink-0"><NeedsYourActionCard /></div>
          </div>
          {/* Fixed-height row: each card is flex-1 (equal thirds) and scrolls
              its own body — Recent Activity is expanded here since it now owns
              a full column rather than a collapsed strip beneath the pair. */}
          <div className="flex gap-3 h-72">
            <AdminPanels />
            <ActivityFeed className="flex-1 min-w-0" />
          </div>
        </div>
      )}

      {/* Deep-linked appointment drawer */}
      {appt && <AppointmentDrawer appt={appt} role={role} />}
    </div>
  );
}
