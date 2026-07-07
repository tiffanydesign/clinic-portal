import React from "react";
import { useParams } from "react-router";
import { useAppContext } from "../../../context/AppContext";
import { KpiBar } from "./KpiBar";
import { CalendarWidget } from "./CalendarWidget";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ActivityFeed } from "./ActivityFeed";
import { AdminPanels, ReceptionPanels, NursePanels, ClinicianPanels } from "./RolePanels";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";

function RolePanels() {
  const { role } = useAppContext();
  if (role === "Admin") return <AdminPanels />;
  if (role === "Reception") return <ReceptionPanels />;
  if (role === "Nurse") return <NursePanels />;
  return <ClinicianPanels />;
}

export function DashboardPage() {
  const { role } = useAppContext();
  const { apptId } = useParams();
  const appt = getAppt(apptId);
  const isAdmin = role === "Admin";

  const workArea = (
    <div className="flex gap-4 h-full min-h-0">
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
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header + KPI Bar (fixed) */}
      <div className="px-6 pt-6 shrink-0">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING[role]}</h1>
          <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
        </div>
        {/* KpiBar keyed by role so the configurable selection resets per role */}
        <KpiBar key={role} />
      </div>

      {/* Work area (+ Admin activity feed) */}
      {isAdmin ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          <div className="h-[540px]">{workArea}</div>
          <ActivityFeed />
        </div>
      ) : (
        <div className="flex-1 min-h-0 px-6 py-4">{workArea}</div>
      )}

      {/* Deep-linked appointment drawer */}
      {appt && <AppointmentDrawer appt={appt} role={role} />}
    </div>
  );
}
