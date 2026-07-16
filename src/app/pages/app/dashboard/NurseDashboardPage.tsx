import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import {
  PatientIdentity, ScheduleItem, QueueItem, CompletedItem, DemoMoment,
  NURSE_DEMO_SCENARIOS, nextUpcomingAppointment, buildPatientFromQueueItem,
} from "./nurseDashboardData";
import type { JourneyEntries } from "./journey/journeyEngine";
import { useJourneyEngine } from "./journey/useJourneyEngine";
import { PatientJourneyCard, EmptyJourney } from "./journey/PatientJourneyCard";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ClinicianScheduleList } from "./ClinicianScheduleList";
import { UpNextPanel } from "./UpNextPanel";
import { MyPatientsTodayCard } from "./MyPatientsTodayCard";
import { nurseCheckOutByName, nurseMarkPatientArrived, useAppointments } from "./appointmentsStore";
import { NURSE_SELF_NAME } from "../calendar/scheduleData";

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
  const hasArrived = !!engine.entries["arrived-room"]?.at;

  useEffect(() => {
    if (isDoneAll) onComplete(identity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoneAll]);

  // Unlocks the Clinician Dashboard's "Start" gate the moment the nurse
  // confirms the patient has arrived in their assigned room — see
  // nurseMarkPatientArrived() in appointmentsStore.ts.
  useEffect(() => {
    if (hasArrived) nurseMarkPatientArrived(identity.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArrived]);

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
  const navigate = useNavigate();
  const { apptId } = useParams();
  const deepLinkedAppt = getAppt(apptId);
  const [demoMoment, setDemoMoment] = useState<DemoMoment>("mid-shift");
  const initialScenario = NURSE_DEMO_SCENARIOS[demoMoment];

  // Today's Schedule (below) reads the real shared Appt store — same
  // component and drawer-click behavior as the Clinician Dashboard's own
  // schedule list — rather than the Patient Journey card's own name-only
  // demo-scenario data. No video rows: a nurse's in-clinic day never
  // includes a video consultation to join.
  const nurseAppts = useAppointments().filter((a) => a.nurse === NURSE_SELF_NAME && !a.isVideo);

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
  // Also flips the matching appointment in the shared store to Completed —
  // this page's own patient/schedule model is name-only (see
  // nurseDashboardData.ts) and isn't otherwise wired to Appt ids, so this
  // is a minimal, name-matched join purely so Reception's "In Clinic" count
  // and queue actually reflect a nurse-side checkout, with no redesign of
  // this page's own UI or data model.
  const handleComplete = (finished: PatientIdentity) => {
    setLocked(false);
    setCompletedToday((prev) => [{ name: finished.name, type: finished.meta.split(" · ")[0], time: "Just now" }, ...prev]);
    setSchedule((prev) => prev.map((item) => (item.name === finished.name && item.status === "in-progress" ? { ...item, status: "upcoming" } : item)));
    nurseCheckOutByName(finished.name);
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
    // No forced page height anywhere — the whole page scrolls as a unit.
    // The right rail used to be a fixed-height, independently-scrolling
    // "sidebar" (w-[396px] + h-[760px] row + its own overflow-y-auto); that
    // meant Up Next's Completed section could end up scrolled out of view
    // with no visible cue. Now every card (Patient Journey included) sizes
    // to its own full content and the page itself is the only scroll
    // surface, so nothing is ever clipped or hidden behind a nested scrollbar.
    <div className="bg-gray-50">
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING.Nurse}</h1>
          <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
        </div>
        <DemoMomentSwitcher value={demoMoment} onChange={handleDemoMomentChange} />
      </div>

      {/* No `items-start` here (default is `items-stretch`) — the right
          column stretches to match Patient Journey's height, and Up Next
          (the column's last card, see its own `grow` below) fills whatever
          space that leaves, so its bottom edge lands exactly on Patient
          Journey's bottom instead of stopping short at its own natural
          content height. */}
      <div className="flex gap-6 px-6 pb-6">
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
            // `h-full` (not just min-h-[500px]) — PatientJourneyCard's own
            // root already uses `h-full` to fill the row's stretched height
            // (see the comment above), so without it here too, this empty
            // state would stay stuck at its min-height floor whenever the
            // right rail's stacked cards resolve taller than 500px, leaving
            // it visually shorter than Up Next instead of bottom-aligned.
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[500px] h-full">
              <EmptyJourney
                hasQueue={upNext.length > 0}
                completedCount={completedToday.length}
                nextAppt={nextUpcomingAppointment(schedule)}
                onStartNext={handleStartNext}
              />
            </div>
          )}
        </div>

        <div className="w-[396px] shrink-0 flex flex-col gap-5">
          <MyPatientsTodayCard scheduled={upNext.length} inProgress={identity ? 1 : 0} done={completedToday.length} />
          <ClinicianScheduleList
            appts={nurseAppts}
            activeApptId={identity ? nurseAppts.find((a) => a.patient.name === identity.name)?.id : undefined}
            hasActiveSession={false}
            onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
            onJoin={() => {}}
          />
          <UpNextPanel queue={upNext} completed={completedToday} locked={locked} onStart={handleStartNext} />
        </div>
      </div>

      {/* This page returns early out of DashboardPage.tsx (see
          DashboardPage's Nurse branch), so it never reaches that file's own
          drawer rendering — Today's Schedule's row clicks need their own
          copy here, same as ReceptionDashboardBody.tsx already does for
          Reception. */}
      {deepLinkedAppt && <AppointmentDrawer appt={deepLinkedAppt} role="Nurse" />}
    </div>
  );
}
