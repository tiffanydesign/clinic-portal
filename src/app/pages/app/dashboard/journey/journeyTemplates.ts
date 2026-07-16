// Single canonical station vocabulary for every "patient journey progress"
// surface in the app EXCEPT the Nurse Dashboard's own Patient Journey card
// (journeyEngine.ts / useJourneyEngine.ts), which keeps its own richer
// milestone+station engine untouched. Everywhere else — the patient roster,
// Front Desk Queue, calendar blocks, Appointment Drawer, Clinician
// Dashboard's Up Next card, and Patient Record's Journeys tab — reads
// through this module so a station never has two names in two places.
//
// The station names themselves are pulled directly from journeyEngine.ts's
// JOURNEY_STEPS (not re-typed here) so the two can never drift apart again
// the way the old dashboardData.ts JOURNEY_STEPS_RECEPTION list ("Test Kit")
// and patientRecordData.ts's own journey steps ("Home Test Kit") once did.
import type { Appt, ApptType } from "../dashboardData";
import { JOURNEY_STEPS } from "./journeyEngine";

export const CANONICAL_STATIONS: string[] = JOURNEY_STEPS.map((s) => s.name);

// Which of the 12 canonical stations a given appointment type's journey
// actually passes through, in order. A journey's `currentStep` always
// indexes the full CANONICAL_STATIONS list (never a type-relative index),
// so cross-type comparisons (e.g. "has this appointment reached Results
// Consultation yet") stay valid regardless of which template applies.
export const TYPE_TEMPLATES: Record<ApptType, string[]> = {
  "Body Scan": ["Checked In", "Patient Intake", "Preparation", "In Room", "Scan 1", "Scan 2", "Check Out"],
  "Sample Collection": ["Checked In", "Patient Intake", "Sample Collection 1", "Sample Collection 2", "Check Out"],
  "Consultation (in-person)": ["Checked In", "Patient Intake", "Results Consultation", "Check Out"],
  "Consultation (video)": ["Checked In", "Results Consultation"],
  "Follow-up": ["Checked In", "Results Consultation", "Check Out"],
};

export const RESULTS_CONSULTATION_INDEX = CANONICAL_STATIONS.indexOf("Results Consultation");

// Dynamic, type-aware journey steps for any chip/strip/drawer rendering.
// Falls back to the full canonical list whenever the appointment's actual
// current step isn't part of its type's expected template (e.g. a Sample
// Collection visit that happens to be sitting in "Scan 1") rather than
// silently misrepresenting a real record to fit a heuristic.
export function journeyStepsFor(appt: Appt): { steps: string[]; current: number } {
  const template = TYPE_TEMPLATES[appt.type] ?? CANONICAL_STATIONS;
  const currentName = CANONICAL_STATIONS[appt.currentStep];
  if (currentName && template.includes(currentName)) {
    return { steps: template, current: template.indexOf(currentName) };
  }
  return { steps: CANONICAL_STATIONS, current: Math.min(appt.currentStep, CANONICAL_STATIONS.length - 1) };
}

export type JourneyChipInfo =
  | { kind: "none" }
  | { kind: "completed" }
  | { kind: "active"; station: string; x: number; N: number };

// The chip density's entire data need: current station name + x/N, or the
// terminal "Completed" state, or nothing for an appointment that hasn't
// started a journey yet (Booked, never checked in).
export function journeyChipInfo(appt: Appt): JourneyChipInfo {
  if (appt.status === "Completed") return { kind: "completed" };
  if (appt.status === "Booked") return { kind: "none" };
  const { steps, current } = journeyStepsFor(appt);
  return { kind: "active", station: steps[current], x: current + 1, N: steps.length };
}
