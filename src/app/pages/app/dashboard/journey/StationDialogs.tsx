import React from "react";
import { FULL_DAY_STATIONS, fmtClockAbs } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";
import { Textarea } from "../../../../components/ui/textarea";

// No close button, no backdrop-dismiss — deliberate, and carried over
// unchanged from the previous panel: every dialog here is a clinical journey
// checkpoint (§11.4 confirmation levels) that must be explicitly resolved,
// never accidentally dismissed. The redesign moved these behind the now
// card's overflow menu; it did not remove the confirmations themselves.
function ScrimDialog({ children, width = "max-w-md" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 bg-surface-sunken/34 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className={`bg-surface rounded-card shadow-2xl border border-divider w-full ${width} p-4 animate-in fade-in zoom-in-95`}>
        {children}
      </div>
    </div>
  );
}

function DialogActions({
  onCancel, onConfirm, confirmLabel, disabled, tone = "ink",
}: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled?: boolean; tone?: "ink" | "warning";
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 h-12 border border-divider rounded-control text-data font-bold text-ink-soft bg-surface hover:bg-surface-hover"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className={`flex-[1.3] h-12 rounded-control text-data font-bold ${
          disabled
            ? "bg-surface-sunken text-ink-muted cursor-not-allowed"
            : tone === "warning"
              ? "bg-warning-ink text-white"
              : "bg-ink text-white hover:bg-ink-soft"
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

// L2 standard confirmation: completing a station writes the patient's logged
// timeline, so the times about to be recorded are shown before they are.
function CompleteDialog({ journey }: { journey: StationJourney }) {
  const active = journey.view.active;
  if (!active) return null;
  const start = active.timing.startAbs;
  return (
    <ScrimDialog width="max-w-sm">
      <h2 className="text-section text-ink">Confirm completion?</h2>
      <p className="text-body text-ink-muted mt-2 leading-relaxed">
        {active.config.name} will be logged in the patient journey.
      </p>
      <div className="text-lg font-bold text-ink tabular-nums mt-4 bg-surface-page border border-divider rounded-card px-4 py-3">
        {fmtClockAbs(start) ?? "—"} → {fmtClockAbs(journey.clock)} · {active.timing.dur ?? 0} min
      </div>
      <DialogActions onCancel={journey.closeDialog} onConfirm={journey.confirmComplete} confirmLabel="Confirm completion" />
    </ScrimDialog>
  );
}

function NoteDialog({ journey }: { journey: StationJourney }) {
  return (
    <ScrimDialog>
      <h2 className="text-section text-ink">Add note</h2>
      <p className="text-body text-ink-muted mt-2 leading-relaxed">
        Recorded on {journey.view.active?.config.name ?? "this journey"}.
      </p>
      <Textarea
        autoFocus
        value={journey.noteDraft}
        onChange={(e) => journey.setNoteDraft(e.target.value)}
        placeholder="Type a note for this station…"
        className="w-full min-h-[110px] mt-4 resize-none"
      />
      <DialogActions onCancel={journey.closeDialog} onConfirm={journey.saveNote} confirmLabel="Save note" />
    </ScrimDialog>
  );
}

// L3 strong confirmation: stepping back reopens the previous station and
// resets the current one, so it needs an explicit reason.
function StepBackDialog({ journey }: { journey: StationJourney }) {
  const prevName = FULL_DAY_STATIONS[journey.state.cursor - 1]?.name ?? "the previous station";
  const curName = journey.view.active?.config.name ?? "this station";
  const can = journey.stepBackReason.trim().length > 0;
  return (
    <ScrimDialog>
      <h2 className="text-section text-ink">Return to {prevName}?</h2>
      <p className="text-body text-ink-muted mt-2 leading-relaxed">
        This will reopen &ldquo;{prevName}&rdquo; and reset &ldquo;{curName}&rdquo; to not started.
      </p>
      <label className="block text-data font-bold text-ink mt-5 mb-2">Reason for correction (required)</label>
      <Textarea
        autoFocus
        value={journey.stepBackReason}
        onChange={(e) => journey.setStepBackReason(e.target.value)}
        placeholder="Explain why you're going back…"
        className="w-full min-h-[80px] resize-none"
      />
      <DialogActions
        onCancel={journey.closeDialog}
        onConfirm={journey.confirmStepBack}
        confirmLabel="Confirm & go back"
        disabled={!can}
        tone="warning"
      />
    </ScrimDialog>
  );
}

export function StationDialogs({ journey }: { journey: StationJourney }) {
  const kind = journey.dialog?.kind;
  if (kind === "complete") return <CompleteDialog journey={journey} />;
  if (kind === "note") return <NoteDialog journey={journey} />;
  if (kind === "stepback") return <StepBackDialog journey={journey} />;
  return null;
}
