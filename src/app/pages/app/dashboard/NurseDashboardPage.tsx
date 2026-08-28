import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getAppt, TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import {
  PatientIdentity, ScheduleItem, QueueItem, CompletedItem, DemoMoment, NurseJourneyStart,
  NURSE_DEMO_SCENARIOS, nextUpcomingAppointment, buildPatientFromQueueItem, isQueueLocked,
} from "./nurseDashboardData";
import { IN_ROOM_STATION } from "./journey/stationJourney";
import { useStationJourney } from "./journey/useStationJourney";
import { StationJourneyCard } from "./journey/StationJourneyCard";
import { EmptyJourney } from "./journey/JourneyEmptyStates";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { ClinicianScheduleList } from "./ClinicianScheduleList";
import { MyPatientsTodayCard } from "./MyPatientsTodayCard";
import { nurseCheckOutByName, nurseMarkPatientArrived, useAppointments } from "./appointmentsStore";
import { NURSE_SELF_NAME } from "../calendar/scheduleData";
import { PAGE_TITLE_CLASS } from "../../../components/PageTitleIcon";

const DEMO_MOMENTS: DemoMoment[] = ["day-start", "handoff", "mid-shift", "day-wrap"];

// QA/demo-only toggle: swaps which mock scenario the page initializes from,
// so all three "no active patient" states are reachable without editing
// code. Visually minor by design — matches the topbar's Demo Role select's
// scale, just rendered as a segmented control per the three named moments.
function DemoMomentSwitcher({ value, onChange }: { value: DemoMoment; onChange: (m: DemoMoment) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Demo Moment:</span>
      <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
        {DEMO_MOMENTS.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            // Same brand-blue selection language as the schedule's own tabs,
            // so "which thing is selected" reads identically in both controls.
            className={`px-3 py-1 text-xs font-bold rounded-control transition-all ${
              value === m
                ? "bg-surface text-[color:var(--phenome-blue-500)] shadow-sm"
                : "text-ink-muted hover:text-ink-soft"
            }`}
          >
            {NURSE_DEMO_SCENARIOS[m].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Owns the station journey for one patient. Remounted (via `key` in the
// parent) whenever a new patient starts, so each patient gets a fresh
// cursor/clock state rather than one hook instance threading through many.
function PatientJourneySection({
  identity, initialJourney, onComplete,
}: {
  identity: PatientIdentity;
  initialJourney: NurseJourneyStart;
  onComplete: (identity: PatientIdentity) => void;
}) {
  const journey = useStationJourney(initialJourney);
  const isDoneAll = journey.mode === "complete";
  // Diagnostic-room intake logged = the patient is physically in their
  // assigned room, which is the gate the Clinician Dashboard's Start waits on.
  const hasArrived = journey.state.cursor > IN_ROOM_STATION;

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
    <StationJourneyCard
      journey={journey}
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
  const [journeyStart, setJourneyStart] = useState<NurseJourneyStart>(initialScenario.journey);
  const [locked, setLocked] = useState(isQueueLocked(initialScenario)); // Up Next stays locked while a patient's journey is active

  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialScenario.schedule);
  const [upNext, setUpNext] = useState<QueueItem[]>(initialScenario.upNext);
  const [completedToday, setCompletedToday] = useState<CompletedItem[]>(initialScenario.completedToday);

  const handleDemoMomentChange = (moment: DemoMoment) => {
    const scenario = NURSE_DEMO_SCENARIOS[moment];
    setDemoMoment(moment);
    setIdentity(scenario.patient);
    setJourneyStart(scenario.journey);
    setLocked(isQueueLocked(scenario));
    setSchedule(scenario.schedule);
    setUpNext(scenario.upNext);
    setCompletedToday(scenario.completedToday);
    setPatientKey((k) => k + 1);
  };

  // Checkout confirmed: unlock Up Next and log completion, but leave
  // `identity` in place — the Patient Journey panel shows its own "Journey
  // complete" state until the nurse taps Start on the next patient.
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
    const { identity: nextIdentity, journey: nextJourney } = buildPatientFromQueueItem(next, journeyStart.clock);
    setIdentity(nextIdentity);
    setJourneyStart(nextJourney);
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
    // The page fills the shell's scroll region exactly (h-full + min-h-0),
    // and the two columns are stretched to that one height (`items-stretch`)
    // so both edges land together. Each column then scrolls inside itself:
    // the journey panel's body, and Today's Schedule (`flex-1 min-h-0`, i.e.
    // flex-basis 0, so its own row count never contributes to the height).
    // Without the cap the now card — sixteen-station rail, nine measurement
    // sub-steps, the action row — pushes the page down and strands the one
    // CTA below the fold, which is the exact failure this redesign fixes.
    <div className="bg-surface-page h-full min-h-0 flex flex-col">
      <div className="px-4 pt-6 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className={PAGE_TITLE_CLASS}>Good morning, {ROLE_GREETING.Nurse}</h1>
            <p className="text-sm text-ink-muted mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <DemoMomentSwitcher value={demoMoment} onChange={handleDemoMomentChange} />
          </div>
        </div>
      </div>

      <div className="flex items-stretch gap-3 px-4 py-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          {identity ? (
            <PatientJourneySection
              key={patientKey}
              identity={identity}
              initialJourney={journeyStart}
              onComplete={handleComplete}
            />
          ) : (
            <div className="bg-surface rounded-card flex flex-col overflow-hidden min-h-[420px]">
              <EmptyJourney
                hasQueue={upNext.length > 0}
                completedCount={completedToday.length}
                nextAppt={nextUpcomingAppointment(schedule)}
                onStartNext={handleStartNext}
              />
            </div>
          )}
        </div>

        {/* 360px, and gap-3 between the cards inside it — --card-gap (12px),
            the documented gap between sibling cards, where this used to use
            --section-gap (20px). Both trims hand the journey panel width and
            height it has better uses for than rail padding. */}
        <div className="w-[360px] shrink-0 flex flex-col gap-3 min-h-0">
          {/* Both the "In progress" counter and the schedule's active row are
              keyed off `locked` rather than `identity`: after a check-out the
              patient stays on the journey card (that's its "Patient Checked
              Out" screen) but is no longer a patient in progress. */}
          <MyPatientsTodayCard
            scheduled={upNext.length}
            inProgress={locked ? 1 : 0}
            done={completedToday.length}
            next={upNext[0] ?? null}
            locked={locked}
            onStart={handleStartNext}
            completed={completedToday}
          />
          <ClinicianScheduleList
            appts={nurseAppts}
            activeApptId={locked && identity ? nurseAppts.find((a) => a.patient.name === identity.name)?.id : undefined}
            hasActiveSession={false}
            onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
            onJoin={() => {}}
          />
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
