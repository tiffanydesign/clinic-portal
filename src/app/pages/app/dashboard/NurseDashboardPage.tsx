import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import {
  PatientIdentity, ScheduleItem, QueueItem, CompletedItem, DemoMoment,
  NURSE_DEMO_SCENARIOS, nextUpcomingAppointment, buildPatientFromQueueItem,
} from "./nurseDashboardData";
import type { JourneyEntries } from "./journey/journeyEngine";
import { useJourneyEngine } from "./journey/useJourneyEngine";
import { PatientJourneyCard, EmptyJourney } from "./journey/PatientJourneyCard";
import { TodaysSchedulePanel } from "./TodaysSchedulePanel";
import { UpNextPanel } from "./UpNextPanel";
import { MyPatientsTodayCard } from "./MyPatientsTodayCard";

const DEMO_MOMENTS: DemoMoment[] = ["day-start", "mid-shift", "day-wrap"];

// QA/demo-only toggle: swaps which mock scenario the page initializes from,
// so all three "no active patient" states are reachable without editing
// code. Visually minor by design — matches the topbar's Demo Role select's
// scale, just rendered as a segmented control per the three named moments.
function DemoMomentSwitcher({ value, onChange }: { value: DemoMoment; onChange: (m: DemoMoment) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Demo Moment:</span>
      <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
        {DEMO_MOMENTS.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${value === m ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {NURSE_DEMO_SCENARIOS[m].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Owns the journey engine for one patient. Remounted (via `key` in the
// parent) whenever a new patient starts, so each patient gets a fresh
// entries/clock state rather than one hook instance threading through many.
function PatientJourneySection({
  identity, initialEntries, initialClock, onComplete,
}: {
  identity: PatientIdentity;
  initialEntries: JourneyEntries;
  initialClock: number;
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
    />
  );
}

export function NurseDashboardPage() {
  const [demoMoment, setDemoMoment] = useState<DemoMoment>("mid-shift");
  const initialScenario = NURSE_DEMO_SCENARIOS[demoMoment];

  const [patientKey, setPatientKey] = useState(0);
  const [identity, setIdentity] = useState<PatientIdentity | null>(initialScenario.patient);
  const [entries, setEntries] = useState<JourneyEntries>(initialScenario.entries);
  const [clock, setClock] = useState(initialScenario.clock);
  const [locked, setLocked] = useState(!!initialScenario.patient); // Up Next stays locked while a patient's journey is active

  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialScenario.schedule);
  const [upNext, setUpNext] = useState<QueueItem[]>(initialScenario.upNext);
  const [completedToday, setCompletedToday] = useState<CompletedItem[]>(initialScenario.completedToday);

  const handleDemoMomentChange = (moment: DemoMoment) => {
    const scenario = NURSE_DEMO_SCENARIOS[moment];
    setDemoMoment(moment);
    setIdentity(scenario.patient);
    setEntries(scenario.entries);
    setClock(scenario.clock);
    setLocked(!!scenario.patient);
    setSchedule(scenario.schedule);
    setUpNext(scenario.upNext);
    setCompletedToday(scenario.completedToday);
    setPatientKey((k) => k + 1);
  };

  // Checkout confirmed: unlock Up Next and log completion, but leave
  // `identity` in place — the Patient Journey card shows its own "Patient
  // Checked Out" screen until the nurse taps Start on the next patient.
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
    // No forced page height / overflow-hidden here — the whole page scrolls
    // as a unit (same pattern as the shared DashboardPage) so a shorter
    // viewport never clips content with no way to reach it; only the
    // internal panel math below relies on a concrete height.
    <div className="bg-gray-50">
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING.Nurse}</h1>
          <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
        </div>
        <DemoMomentSwitcher value={demoMoment} onChange={handleDemoMomentChange} />
      </div>

      <div className="flex gap-6 px-6 pb-6 h-[760px]">
        <div className="flex-1 min-w-0">
          {identity ? (
            <PatientJourneySection
              key={patientKey}
              identity={identity}
              initialEntries={entries}
              initialClock={clock}
              onComplete={handleComplete}
            />
          ) : (
            <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <EmptyJourney
                hasQueue={upNext.length > 0}
                completedCount={completedToday.length}
                nextAppt={nextUpcomingAppointment(schedule)}
                onStartNext={handleStartNext}
              />
            </div>
          )}
        </div>

        <div className="w-[396px] shrink-0 flex flex-col gap-5 min-h-0 overflow-y-auto">
          <MyPatientsTodayCard scheduled={upNext.length} inProgress={identity ? 1 : 0} done={completedToday.length} />
          <TodaysSchedulePanel items={schedule} now={clock} />
          <UpNextPanel queue={upNext} completed={completedToday} locked={locked} onStart={handleStartNext} />
        </div>
      </div>
    </div>
  );
}
