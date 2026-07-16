import React from "react";
import { useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { useKpiBar, KpiControls, KpiCards } from "./KpiBar";
import { CalendarWidget } from "./CalendarWidget";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ActivityFeed } from "./ActivityFeed";
import { AdminPanels } from "./RolePanels";
import { NeedsYourActionCard } from "./NeedsYourActionCard";
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
    <div className="bg-gray-50">
      {/* Header — part of the normal page flow, so the whole page (including
          this) scrolls together rather than pinning under a fixed header. */}
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING[role]}</h1>
            <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
          </div>
          {/* Clinician gets its own plain live counters (see
              ClinicianDashboardBody) instead of the configurable KPI bar. */}
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
           Tier 2 (below): Results Queue + Waiting Room, the room-by-room
           monitoring pair. Tier 3: Recent Activity, collapsed by default —
           an audit trail, not something Admin needs open by default. */
        <div className="px-6 py-4 space-y-4">
          <div className="flex gap-4">
            {/* The inner `shrink-0` wrapper (not `h-full` directly on a
                stretched flex-1 parent) is what lets CalendarWidget's own
                `h-full` degrade to its natural content height instead of a
                self-referential stretch computation that clips a few px off
                the bottom — same structure Reception's schedule column
                uses, which is why that one never grows an internal scrollbar. */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="shrink-0"><CalendarWidget /></div>
            </div>
            <div className="w-[420px] shrink-0"><NeedsYourActionCard /></div>
          </div>
          <div className="h-[320px]"><AdminPanels /></div>
          <ActivityFeed defaultCollapsed />
        </div>
      )}

      {/* Deep-linked appointment drawer */}
      {appt && <AppointmentDrawer appt={appt} role={role} />}
    </div>
  );
}
