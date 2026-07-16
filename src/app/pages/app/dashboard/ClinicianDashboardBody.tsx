import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ApptStatus } from "./dashboardData";
import { useAppointments } from "./appointmentsStore";
import { CLINICIAN_ID, activeApptFor, upNextApptFor } from "./clinicianDashboardData";
import { ClinicianQueueCounters } from "./ClinicianQueueCounters";
import { ClinicianNowCard } from "./ClinicianNowCard";
import { ClinicianScheduleList } from "./ClinicianScheduleList";
import { ClinicianWorkQueue } from "./ClinicianWorkQueue";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Owns every piece of state the Clinician Dashboard's surfaces share:
// completing/starting a session (local status overrides, seeded from the
// shared mock data but never mutating it — same pattern as the Nurse
// dashboard) and the scroll targets for the top counters' "jump to" actions.
export function ClinicianDashboardBody() {
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState<Record<string, ApptStatus>>({});
  const scheduleRef = useRef<HTMLDivElement>(null);
  const workQueueRef = useRef<HTMLDivElement>(null);
  const appts = useAppointments();

  const todaysAppts = useMemo(() => {
    return appts
      .filter((a) => a.doctorId === CLINICIAN_ID)
      .map((a) => (overrides[a.id] ? { ...a, status: overrides[a.id] } : a))
      .sort((a, b) => a.startMin - b.startMin);
  }, [appts, overrides]);

  const activeAppt = activeApptFor(todaysAppts);
  const upNextAppt = activeAppt ? undefined : upNextApptFor(todaysAppts);

  const upcoming = todaysAppts
    .filter((a) => a.id !== activeAppt?.id && a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "No Show")
    .sort((a, b) => a.startMin - b.startMin);
  const nextTimeLabel = upcoming[0] ? upcoming[0].timeLabel.split(" – ")[0] : null;

  const openRecord = (id: string) => navigate(`/dashboard/appointment/${id}`);
  const complete = (id: string) => setOverrides((prev) => ({ ...prev, [id]: "Completed" }));
  const startOrJoin = (id: string) => setOverrides((prev) => ({ ...prev, [id]: "In Clinic" }));

  return (
    <div className="px-6 py-4 flex gap-4 h-[700px]">
      <div className="w-[55%] min-w-0 flex flex-col gap-4 h-full">
        <ClinicianNowCard
          activeAppt={activeAppt}
          upNextAppt={upNextAppt}
          onOpenRecord={openRecord}
          onComplete={complete}
          onStartOrJoin={startOrJoin}
        />
        <div ref={workQueueRef} className="flex-1 min-h-0">
          <ClinicianWorkQueue />
        </div>
      </div>

      <div className="w-[45%] min-w-0 h-full flex flex-col gap-4">
        <ClinicianQueueCounters
          todaysCount={todaysAppts.length}
          nextTimeLabel={nextTimeLabel}
          onJumpToWorkQueue={() => workQueueRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })}
          onJumpToSchedule={() => scheduleRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })}
        />
        <div ref={scheduleRef} className="flex-1 min-h-0 flex flex-col">
          <ClinicianScheduleList
            appts={todaysAppts}
            activeApptId={activeAppt?.id}
            hasActiveSession={!!activeAppt}
            onOpen={openRecord}
            onJoin={startOrJoin}
          />
        </div>
      </div>
    </div>
  );
}
