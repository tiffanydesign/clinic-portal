import React from "react";
import { CheckCircle2, StickyNote, Undo2 } from "lucide-react";
import { FULL_DAY_STATIONS, fmtClockAbs } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";
import { Textarea } from "../../../../components/ui/textarea";

// No close button, no backdrop-dismiss — deliberate, and carried over
// unchanged from the previous panel: every dialog here is a clinical journey
// checkpoint (§11.4 confirmation levels) that must be explicitly resolved,
// never accidentally dismissed. The redesign moved these behind the now
// card's overflow menu; it did not remove the confirmations themselves.
//
// Chrome follows Modal's own contract rather than a local invention, which is
// where these had drifted: DESIGN.md records the blurred `surface-sunken/34`
// scrim as resolved drift across the product, and these had inherited exactly
// that from the panel they replaced. Flat --ink-900 at 35%, no blur;
// rounded-dialog (16px), the tier reserved for surfaces that block the page;
// a tinted icon chip beside the title; a surface-page footer; and buttons
// ordered secondary-then-primary.

function ScrimDialog({
  icon, tint, title, children, footer, width = "max-w-[480px]",
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 bg-ink/35 flex items-center justify-center z-50 p-6">
      <div
        className={`bg-surface rounded-dialog shadow-2xl border border-divider w-full ${width} overflow-hidden animate-in fade-in zoom-in-95`}
      >
        <div className="p-4 flex items-start gap-3">
          <span className={`w-10 h-10 rounded-control border flex items-center justify-center shrink-0 ${tint}`}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-section text-ink">{title}</h2>
            {children}
          </div>
        </div>
        <div className="px-4 py-3 bg-surface-page border-t border-divider flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

// Secondary then primary, left to right — Modal's footer order product-wide.
function DialogActions({
  onCancel, onConfirm, confirmLabel, disabled,
}: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled?: boolean;
}) {
  return (
    <>
      <button
        onClick={onCancel}
        className="min-h-11 px-4 border border-divider rounded-control text-data font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className={`min-h-11 px-4 rounded-control text-data font-bold transition-colors ${
          disabled
            // Button.tsx's DISABLED_CLASS — a flat neutral, never a dimmed
            // brand fill, because "faint version of that action" does not
            // read as "unavailable".
            ? "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
            : "btn-primary shadow-sm"
        }`}
      >
        {confirmLabel}
      </button>
    </>
  );
}

// L2 standard confirmation: completing a station writes the patient's logged
// timeline, so the times about to be recorded are shown before they are.
function CompleteDialog({ journey }: { journey: StationJourney }) {
  const active = journey.view.active;
  if (!active) return null;
  return (
    <ScrimDialog
      icon={<CheckCircle2 className="w-5 h-5" strokeWidth={2.4} />}
      tint="bg-success/10 border-success/30 text-success-ink"
      title="Confirm completion?"
      footer={
        <DialogActions
          onCancel={journey.closeDialog}
          onConfirm={journey.confirmComplete}
          confirmLabel="Confirm completion"
        />
      }
    >
      <p className="text-data text-ink-muted mt-1.5 leading-relaxed">
        {active.config.name} will be logged in the patient journey.
      </p>
      <div className="mt-3 bg-surface-page border border-divider rounded-control px-3 py-2.5 flex items-baseline gap-2">
        <span className="text-section text-ink tabular-nums">{fmtClockAbs(active.timing.startAbs) ?? "—"}</span>
        <span className="text-ink-muted">→</span>
        <span className="text-section text-ink tabular-nums">{fmtClockAbs(journey.clock)}</span>
        {/* Neutral, not green: green means "a positive, cleared outcome" and
            a duration is neither. The chip beside the title already carries
            the completion meaning. */}
        <span className="ml-auto text-label font-bold text-ink tabular-nums">
          {active.timing.dur ?? 0} min
        </span>
      </div>
    </ScrimDialog>
  );
}

function NoteDialog({ journey }: { journey: StationJourney }) {
  return (
    <ScrimDialog
      icon={<StickyNote className="w-5 h-5" strokeWidth={2.2} />}
      tint="bg-warning/10 border-warning/30 text-warning-ink"
      title="Add note"
      footer={
        <DialogActions onCancel={journey.closeDialog} onConfirm={journey.saveNote} confirmLabel="Save note" />
      }
    >
      <p className="text-data text-ink-muted mt-1.5 leading-relaxed">
        Recorded on {journey.view.active?.config.name ?? "this journey"}.
      </p>
      <Textarea
        autoFocus
        value={journey.noteDraft}
        onChange={(e) => journey.setNoteDraft(e.target.value)}
        placeholder="Type a note for this station…"
        className="w-full min-h-[110px] mt-3 resize-none"
      />
    </ScrimDialog>
  );
}

// L3 strong confirmation: stepping back reopens the previous station and
// resets the current one, so it needs an explicit reason. Warning tone on the
// icon chip (it undoes a logged record), but the confirm button stays the one
// primary fill — DESIGN.md ships exactly four button variants, and
// amber-as-button-fill is not one of them.
function StepBackDialog({ journey }: { journey: StationJourney }) {
  const prevName = FULL_DAY_STATIONS[journey.state.cursor - 1]?.name ?? "the previous station";
  const curName = journey.view.active?.config.name ?? "this station";
  const can = journey.stepBackReason.trim().length > 0;
  return (
    <ScrimDialog
      icon={<Undo2 className="w-5 h-5" strokeWidth={2.2} />}
      tint="bg-warning/10 border-warning/30 text-warning-ink"
      title={`Return to ${prevName}?`}
      footer={
        <DialogActions
          onCancel={journey.closeDialog}
          onConfirm={journey.confirmStepBack}
          confirmLabel="Confirm & go back"
          disabled={!can}
        />
      }
    >
      <p className="text-data text-ink-muted mt-1.5 leading-relaxed">
        This will reopen &ldquo;{prevName}&rdquo; and reset &ldquo;{curName}&rdquo; to not started.
      </p>
      <label className="block text-label font-bold text-ink mt-4 mb-1">Reason for correction (required)</label>
      <Textarea
        autoFocus
        value={journey.stepBackReason}
        onChange={(e) => journey.setStepBackReason(e.target.value)}
        placeholder="Explain why you're going back…"
        className="w-full min-h-[80px] resize-none"
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
