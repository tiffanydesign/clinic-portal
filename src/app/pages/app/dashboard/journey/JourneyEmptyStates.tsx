import React from "react";
import { useNavigate } from "react-router";
import { Check, Clock, UserRound } from "lucide-react";

// The Nurse Dashboard's "no patient on the panel" states. Split out of the
// old PatientJourneyCard when the Patient Journey panel was redesigned around
// the station model (see StationJourneyCard.tsx) — these three moments are
// about the shift, not about any one journey, so they outlived that card.

export type NextAppointment = { name: string; time: string };

// The dashboard's three "no active patient" moments. Branch A (a queue is
// waiting) is the original behavior; B and C read the shift's shape from
// completedCount to tell "hasn't started yet" apart from "already wrapped
// up" — two very different moments that a single generic empty state would
// blur together.
export function EmptyJourney({
  hasQueue, completedCount, nextAppt, onStartNext,
}: {
  hasQueue: boolean;
  completedCount: number;
  nextAppt: NextAppointment | null;
  onStartNext: () => void;
}) {
  const navigate = useNavigate();

  if (hasQueue) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <UserRound className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">No patient in progress</h2>
        <p className="text-sm text-ink-muted mb-5 max-w-xs">Start the next patient from your queue to begin their journey.</p>
        <button
          onClick={onStartNext}
          className="px-6 py-3 rounded-control text-sm font-bold transition-colors btn-primary shadow-md"
        >
          Start Next Patient
        </button>
      </div>
    );
  }

  if (completedCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">Awaiting First Patient</h2>
        <p className="text-sm text-ink-muted max-w-xs">
          {nextAppt
            ? <>The queue is currently empty. Next upcoming appointment is <span className="font-semibold text-ink-soft">{nextAppt.name}</span> at <span className="font-semibold text-ink-soft">{nextAppt.time}</span>.</>
            : "The queue is currently empty. No further appointments are scheduled today."}
        </p>
        <button onClick={() => navigate("/calendar/schedule")} className="mt-4 text-sm font-bold text-ink-soft hover:text-ink hover:underline">
          View today's schedule ↓
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="w-11 h-11 rounded-full bg-success-ink text-white flex items-center justify-center mb-2.5">
        <Check className="w-5 h-5" strokeWidth={3} />
      </div>
      <h2 className="text-sm font-extrabold text-ink">All Patients Completed</h2>
      <p className="text-sm text-ink-muted mt-1 max-w-xs">You have successfully processed all {completedCount} assigned patients for today.</p>
    </div>
  );
}
