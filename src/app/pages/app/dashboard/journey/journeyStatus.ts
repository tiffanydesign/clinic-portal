import type { StepRenderState } from "./journeyEngine";

// ONE status vocabulary for the whole Patient Journey panel. Every surface
// that paints a step's state — the progress strip's segments, its legend
// chips, the vertical stepper's node, the step's own label, and the action
// rail's status line — reads its colour from here, so a station can never
// look amber in the bar, gray on the rail and blue in the timeline at the
// same time (which is exactly what it did before).
//
// The mapping is deliberately narrow:
//   done  -> success   a station that is finished
//   prog  -> info      the one station happening right now
//   wait  -> GRAY      not started yet; the patient is between stations
//   up    -> GRAY      not started yet
//   skip  -> GRAY      not started and never will be, struck through
//
// `wait` sharing `up`'s gray is the point, not an oversight: both mean "this
// station has not begun". The wait's *duration* is the thing that can turn
// amber, and only once it crosses WAIT_SLA_MIN — see waitPillClass below.
// Reserving warning for a breached SLA is what keeps it meaningful.

export type JourneyStatusTone = {
  /** progress-strip segment fill + stepper connector below a node */
  bar: string;
  /** stepper node — see StepNode, which owns the shape per state */
  ring: string;
  dot: string;
  /** the step's own name in the timeline */
  label: string;
  /** legend chip in the progress strip */
  chip: string;
  chipDot: string;
};

// Pure-colour fills carrying no text only need WCAG's 3:1 non-text floor, so
// the -fill tier is correct for bars/dots; -ink is reserved for actual text.
export const JOURNEY_TONE: Record<StepRenderState, JourneyStatusTone> = {
  done: {
    bar: "bg-success-fill",
    ring: "border-success-fill bg-success-fill",
    dot: "bg-success-fill",
    label: "text-ink-soft font-semibold",
    chip: "bg-success/10 text-success-ink",
    chipDot: "bg-success-fill",
  },
  prog: {
    bar: "bg-info-fill",
    ring: "border-info-fill bg-surface",
    dot: "bg-info-fill",
    label: "text-ink font-bold",
    chip: "bg-info/10 text-info-ink",
    chipDot: "bg-info-fill",
  },
  wait: {
    bar: "bg-surface-sunken",
    ring: "border-border-strong bg-surface",
    dot: "bg-ink-muted",
    label: "text-ink-muted font-semibold",
    chip: "bg-surface-hover text-ink-muted",
    chipDot: "bg-ink-muted",
  },
  up: {
    bar: "bg-surface-sunken",
    ring: "border-border-strong bg-surface",
    dot: "bg-ink-muted",
    label: "text-ink-muted font-semibold",
    chip: "bg-surface-hover text-ink-muted",
    chipDot: "bg-ink-muted",
  },
  skip: {
    bar: "bg-surface-sunken",
    ring: "border-border-strong bg-surface-hover",
    dot: "bg-ink-muted",
    label: "text-ink-muted font-semibold line-through decoration-ink-muted/50",
    chip: "bg-surface-hover text-ink-muted",
    chipDot: "bg-ink-muted",
  },
};

// A wait only earns warning colour once it has actually breached the SLA.
export function waitPillClass(overSla: boolean): string {
  return overSla ? "text-warning-ink bg-warning/10" : "text-ink-muted bg-surface-hover";
}

export function waitTextClass(overSla: boolean): string {
  return overSla ? "text-warning-ink" : "text-ink-muted";
}

// ---------------------------------------------------------------------------
// Bridge to Patient Record's own journey model.
//
// patient-record/patientRecordData.ts carries a second, independently-shaped
// Journey/JourneyStep model (see JourneyDetailPage.tsx for why it exists).
// Rather than let it grow a third private colour scheme, both models funnel
// through the ONE tone table above. Keys are plain strings so this module
// never imports from patient-record — the dependency only ever runs the other
// way (patientRecordData already imports buildJourneyRows from here).
// ---------------------------------------------------------------------------

export const RECORD_STEP_STATE: Record<string, StepRenderState> = {
  Completed: "done",
  "In Progress": "prog",
  Pending: "up",
  Skipped: "skip",
};

export function recordStepState(status: string): StepRenderState {
  return RECORD_STEP_STATE[status] ?? "up";
}

export type JourneyPillType = "default" | "success" | "warning" | "error" | "info";

// A journey's own lifecycle pill. "Active" is INFO BLUE, not green: blue is
// what "happening right now" means everywhere else in this system (the
// stepper node, the segment bar, the strip, Staff Workload's own journey
// column already), and green is reserved for a finished, cleared outcome.
// Painting both Active and Completed green — which the old mapping did — left
// the only two states a journey can be in wearing the same colour.
export function journeyStatusPill(status: string): JourneyPillType {
  if (status === "Active") return "info";
  if (status === "Completed") return "success";
  return "default";
}
