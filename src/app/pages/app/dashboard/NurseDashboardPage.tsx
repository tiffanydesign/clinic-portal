import React, { useState } from "react";
import { toast } from "sonner";
import { TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import {
  CurrentPatient, ScheduleItem, QueueItem, CompletedItem,
  INITIAL_CURRENT_PATIENT, INITIAL_SCHEDULE, INITIAL_UP_NEXT, INITIAL_COMPLETED_TODAY,
  buildPatientFromQueueItem,
} from "./nurseDashboardData";
import { CurrentPatientCard } from "./CurrentPatientCard";
import { TodaysSchedulePanel } from "./TodaysSchedulePanel";
import { UpNextPanel } from "./UpNextPanel";

// A completely separate, single-focus experience for the Nurse role: no KPI
// cards, no multi-patient grid — one current patient, one action, and a
// lightweight glance at the rest of the day. See RolePanels.tsx / KpiBar.tsx
// for the shared Admin/Reception/Clinician dashboard this deliberately
// diverges from.
export function NurseDashboardPage() {
  const [currentPatient, setCurrentPatient] = useState<CurrentPatient | null>(INITIAL_CURRENT_PATIENT);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [upNext, setUpNext] = useState<QueueItem[]>(INITIAL_UP_NEXT);
  const [completedToday, setCompletedToday] = useState<CompletedItem[]>(INITIAL_COMPLETED_TODAY);
  const [scheduleOpenIndex, setScheduleOpenIndex] = useState<number | null>(null);

  const handleAdvanceStep = () => {
    if (!currentPatient) return;
    const finishedLabel = currentPatient.steps[currentPatient.currentStepIndex].label;
    const nextIndex = currentPatient.currentStepIndex + 1;
    const steps = currentPatient.steps.map((s, i) => (i === currentPatient.currentStepIndex ? { ...s, completedTime: "Just now" } : s));

    setCurrentPatient({ ...currentPatient, steps, currentStepIndex: nextIndex });

    if (nextIndex >= steps.length) {
      const type = currentPatient.appointment.split(" · ")[0];
      setCompletedToday((prev) => [{ name: currentPatient.name, type, time: "Just now" }, ...prev]);
      setSchedule((prev) => prev.map((item) => (item.name === currentPatient.name && item.status === "in-progress" ? { ...item, status: "upcoming" } : item)));
      toast.success(`${currentPatient.name}'s journey is complete.`);
    } else {
      toast.success(`${finishedLabel} marked complete.`);
    }
  };

  const handleStartNext = () => {
    if (upNext.length === 0) return;
    const [next, ...rest] = upNext;
    setUpNext(rest);
    setCurrentPatient(buildPatientFromQueueItem(next));
    setSchedule((prev) => prev.map((item) => {
      if (item.status === "in-progress") return { ...item, status: "upcoming" };
      if (item.name === next.name && item.status === "upcoming") return { ...item, status: "in-progress" };
      return item;
    }));
    toast.success(`Started ${next.name}'s journey.`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING.Nurse}</h1>
        <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
      </div>

      <div className="flex-1 min-h-0 flex gap-6 px-6 pb-6">
        <div className="w-[60%] min-w-0">
          <CurrentPatientCard
            patient={currentPatient}
            hasQueue={upNext.length > 0}
            onAdvanceStep={handleAdvanceStep}
            onStartNext={handleStartNext}
          />
        </div>

        <div className="w-[40%] min-w-0 flex flex-col gap-6 min-h-0">
          <div className="shrink-0">
            <TodaysSchedulePanel items={schedule} openIndex={scheduleOpenIndex} onToggle={(i) => setScheduleOpenIndex((cur) => (cur === i ? null : i))} />
          </div>
          <div className="flex-1 min-h-0">
            <UpNextPanel queue={upNext} completed={completedToday} onStart={handleStartNext} />
          </div>
        </div>
      </div>
    </div>
  );
}
