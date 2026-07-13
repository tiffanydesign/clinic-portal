import React from "react";
import { useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { KpiBar } from "./KpiBar";
import { CalendarWidget } from "./CalendarWidget";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ActivityFeed } from "./ActivityFeed";
import { AdminPanels } from "./RolePanels";
import { NurseDashboardPage } from "./NurseDashboardPage";
import { ClinicianDashboardBody } from "./ClinicianDashboardBody";
import { ReceptionDashboardBody } from "./ReceptionDashboardBody";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";

export function DashboardPage() {
  const { role } = useAppContext();
  const { apptId } = useParams();

  // Nurse, Clinician, and Reception are each a fully separate, purpose-built
  // layout — bypass the shared KPI bar / room calendar layout entirely for
  // these roles.
  if (role === "Nurse") return <NurseDashboardPage />;

  const appt = getAppt(apptId);

  return (
    <div className="bg-gray-50">
      {/* Header — part of the normal page flow, so the whole page (including
          this) scrolls together rather than pinning under a fixed header. */}
      <div className="px-6 pt-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING[role]}</h1>
          <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
        </div>
        {/* Clinician and Reception each get their own plain live counters
            (see ClinicianDashboardBody / ReceptionDashboardBody) instead of
            the configurable KPI bar. */}
        {role === "Admin" && <KpiBar key={role} />}
      </div>

      {role === "Clinician" ? (
        <ClinicianDashboardBody />
      ) : role === "Reception" ? (
        <ReceptionDashboardBody />
      ) : (
        /* Admin's room-based calendar (7 columns) gets the full row width
           instead of sharing it with the side panels — the role panels move
           to their own row underneath. Recent Activity is secondary and
           deliberately sits below the fold. */
        <div className="px-6 py-4 space-y-4">
          <div className="h-[440px]"><CalendarWidget /></div>
          <div className="h-[340px]"><AdminPanels /></div>
          <ActivityFeed />
        </div>
      )}

      {/* Deep-linked appointment drawer */}
      {appt && <AppointmentDrawer appt={appt} role={role} />}
    </div>
  );
}
