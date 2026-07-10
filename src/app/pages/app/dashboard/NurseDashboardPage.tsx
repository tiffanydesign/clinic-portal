import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import {
  PatientIdentity, ScheduleItem, QueueItem, CompletedItem,
  INITIAL_PATIENT, INITIAL_ENTRIES, INITIAL_CLOCK, INITIAL_SCHEDULE, INITIAL_UP_NEXT, INITIAL_COMPLETED_TODAY,
  buildPatientFromQueueItem,
} from "./nurseDashboardData";
import type { JourneyEntries } from "./journey/journeyEngine";
import { useJourneyEngine } from "./journey/useJourneyEngine";
import { PatientJourneyCard } from "./journey/PatientJourneyCard";
import { TodaysSchedulePanel } from "./TodaysSchedulePanel";
import { UpNextPanel } from "./UpNextPanel";
import { MyPatientsTodayCard } from "./MyPatientsTodayCard";

// Owns the journey engine for one patient. Remounted (via `key` in the
// parent) whenever a new patient starts, so each patient gets a fresh
// entries/clock state rather than one hook instance threading through many.
function PatientJourneySection({
  identity, initialEntries, initialClock, hasQueue, onStartNext, onComplete,
}: {
  identity: PatientIdentity;
  initialEntries: JourneyEntries;
  initialClock: number;
  hasQueue: boolean;
  onStartNext: () => void;
  onComplete: (identity: PatientIdentity) => void;
}) {
  const engine = useJourneyEngine(initialEntries, initialClock);
  const isDoneAll = engine.cur.mode === "done";

  useEffect(() => {
    if (isDoneAll) onComplete(identity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoneAll]);

  return (
    <PatientJourneyCard
      engine={engine}
      patientName={identity.name}
      patientTag={identity.tag}
      patientMeta={identity.meta}
      patientRoute={identity.route}
      hasQueue={hasQueue}
      onStartNext={onStartNext}
    />
  );
}

export function NurseDashboardPage() {
  const [patientKey, setPatientKey] = useState(0);
  const [identity, setIdentity] = useState<PatientIdentity | null>(INITIAL_PATIENT);
  const [entries, setEntries] = useState<JourneyEntries>(INITIAL_ENTRIES);
  const [clock] = useState(INITIAL_CLOCK); // each patient's journey engine owns its own ticking clock from here
  const [locked, setLocked] = useState(true); // Up Next stays locked while a patient's journey is active

  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [upNext, setUpNext] = useState<QueueItem[]>(INITIAL_UP_NEXT);
  const [completedToday, setCompletedToday] = useState<CompletedItem[]>(INITIAL_COMPLETED_TODAY);

  const handleComplete = (finished: PatientIdentity) => {
    setLocked(false);
    setCompletedToday((prev) => [{ name: finished.name, type: finished.meta.split(" · ")[0], time: "Just now" }, ...prev]);
    setSchedule((prev) => prev.map((item) => (item.name === finished.name && item.status === "in-progress" ? { ...item, status: "upcoming" } : item)));
  };

  const handleStartNext = () => {
    if (upNext.length === 0 || locked) return;
    const [next, ...rest] = upNext;
    setUpNext(rest);
    const { identity: nextIdentity, entries: nextEntries } = buildPatientFromQueueItem(next, clock);
    setIdentity(nextIdentity);
    setEntries(nextEntries);
    setLocked(true);
    setPatientKey((k) => k + 1);
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
        <div className="flex-1 min-w-0">
          {identity ? (
            <PatientJourneySection
              key={patientKey}
              identity={identity}
              initialEntries={entries}
              initialClock={clock}
              hasQueue={upNext.length > 0}
              onStartNext={handleStartNext}
              onComplete={handleComplete}
            />
          ) : (
            <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center p-10">
              <h2 className="text-xl font-bold text-gray-800 mb-1">No patient in progress</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">Start the next patient from your queue to begin their journey.</p>
              <button
                onClick={handleStartNext}
                disabled={upNext.length === 0}
                className={`px-8 py-3.5 rounded-xl text-base font-bold transition-colors ${upNext.length > 0 ? "bg-slate-700 text-white hover:bg-slate-800 shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {upNext.length > 0 ? "Start Next Patient" : "No patients waiting"}
              </button>
            </div>
          )}
        </div>

        <div className="w-[396px] shrink-0 flex flex-col gap-5 min-h-0 overflow-y-auto">
          <MyPatientsTodayCard scheduled={upNext.length} inProgress={identity ? 1 : 0} done={completedToday.length} />
          <TodaysSchedulePanel items={schedule} />
          <div className="flex-1 min-h-[220px]">
            <UpNextPanel queue={upNext} completed={completedToday} locked={locked} onStart={handleStartNext} />
          </div>
        </div>
      </div>
    </div>
  );
}
