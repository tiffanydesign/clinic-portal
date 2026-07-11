import React from "react";
import { useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { KpiBar } from "./KpiBar";
import { CalendarWidget } from "./CalendarWidget";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ActivityFeed } from "./ActivityFeed";
import { AdminPanels, ReceptionPanels, ClinicianPanels } from "./RolePanels";
import { NurseDashboardPage } from "./NurseDashboardPage";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";

function RolePanels() {
  const { role } = useAppContext();
  if (role === "Admin") return <AdminPanels />;
  if (role === "Reception") return <ReceptionPanels />;
  return <ClinicianPanels />;
}

export function DashboardPage() {
  const { role } = useAppContext();
  const { apptId } = useParams();

  // The Nurse dashboard is a fully separate single-focus layout (current
  // patient + action, not KPIs/multi-patient panels) — bypass the shared
  // KPI bar / calendar / role-panels layout entirely for this role.
  if (role === "Nurse") return <NurseDashboardPage />;

  const appt = getAppt(apptId);
  // Reception's calendar is the same room-first view as Admin's (see
  // CalendarWidget), so it gets the identical full-width-calendar-then-panels
  // layout rather than the narrower 58/42 split used by Clinician.
  const useRoomLayout = role === "Admin" || role === "Reception";

  const workArea = (
    <div className="flex gap-4 h-[700px]">
      <div className="w-[58%] min-w-0">
        <CalendarWidget role={role} />
      </div>
      <div className="w-[42%] min-w-0">
        {/* remount panels per role so derived state stays consistent */}
        <RolePanels key={role} />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50">
      {/* Header + KPI Bar — part of the normal page flow, so the whole page
          (including this) scrolls together rather than pinning under a
          fixed header. */}
      <div className="px-6 pt-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING[role]}</h1>
          <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
        </div>
        {/* KpiBar keyed by role so the configurable selection resets per role */}
        <KpiBar key={role} />
      </div>

      {/* Work area (+ activity feed). The room-based calendar (7 columns)
          gets the full row width instead of sharing it with the side
          panels — the role panels move to their own row underneath, side
          by side, so nothing needs a horizontal scrollbar and both still
          show as many rows as possible. Recent Activity is secondary and
          deliberately sits below the fold. */}
      {useRoomLayout ? (
        <div className="px-6 py-4 space-y-4">
          <div className="h-[440px]"><CalendarWidget role={role} /></div>
          <div className="h-[340px]"><RolePanels key={role} /></div>
          <ActivityFeed />
        </div>
      ) : (
        <div className="px-6 py-4">{workArea}</div>
      )}

      {/* Deep-linked appointment drawer */}
      {appt && <AppointmentDrawer appt={appt} role={role} />}
    </div>
  );
}
