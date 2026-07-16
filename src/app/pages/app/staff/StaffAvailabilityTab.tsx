import React from "react";
import { useNavigate, useParams } from "react-router";
import { Info } from "lucide-react";
import { getStaff } from "./staffData";
import { MyScheduleView } from "../calendar/MyScheduleView";
import { ScheduleTarget } from "../calendar/myScheduleData";

const BASE = "/calendar/schedule";

// Admin view of a staff member's schedule: the same read-only calendar
// surface Nurses/Clinicians see as their own "My Schedule" (Calendar >
// Schedule), scoped to whichever staff member is being viewed instead of the
// signed-in self. Replaces the old weekly-hours editor — Weekly Hours/Date
// Overrides/Leave now live in the Availability request workflow
// (src/app/pages/app/availability), not here.
export function StaffAvailabilityTab() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const staff = getStaff(staffId);

  if (!staff) return null;
  if (staff.role !== "Clinician" && staff.role !== "Nurse") return null;

  const target: ScheduleTarget = staff.role === "Clinician" ? { doctorId: staff.id } : { nurseName: staff.name };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Admin context banner */}
      <div className="flex items-start bg-blue-50 border-b border-blue-200 px-6 py-3 text-sm text-blue-800 shrink-0">
        <Info className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
        You are viewing the schedule for <span className="font-bold ml-1">{staff.name}</span>
      </div>

      <div className="flex-1 min-h-0">
        <MyScheduleView
          role={staff.role}
          target={target}
          possessive={false}
          availabilityAvailable={false}
          onOpenAppt={(id) => navigate(`${BASE}/appointment/${id}`)}
        />
      </div>
    </div>
  );
}
