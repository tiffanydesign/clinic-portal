import React, { useState } from "react";
import { toast } from "sonner";
import { BookedAppt, bookingLabel } from "./availabilityData";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

// "schedule" and "blocked-time" are blocking: every conflicting booking must
// be individually resolved (Reschedule/Cancel) before Confirm unlocks, since
// neither kind goes through Admin approval anymore — this modal IS the
// gate. "leave" stays informational-only: Leave still always requires a
// real Admin decision, so conflicts are shown for awareness but don't block
// submission.
export function ConflictModal({ bookings, context, onCancel, onConfirm }: {
  bookings: BookedAppt[];
  context: "schedule" | "blocked-time" | "leave";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const blocking = context !== "leave";
  const [resolvedIdx, setResolvedIdx] = useState<Set<number>>(new Set());
  const allResolved = bookings.every((_, i) => resolvedIdx.has(i));
  const canConfirm = !blocking || allResolved;

  const resolve = (i: number, action: "Reschedule" | "Cancel") => {
    setResolvedIdx((prev) => new Set(prev).add(i));
    toast.success(action === "Reschedule" ? "Appointment rescheduled (demo)." : "Appointment cancelled (demo).");
  };

  const shown = bookings.slice(0, 5);
  const extra = bookings.length - shown.length;

  return (
    <Modal
      open
      onClose={onCancel}
      title="This change conflicts with existing bookings"
      size="form"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={!canConfirm} disabledReason="Resolve all affected bookings before saving">
            {context === "leave" ? "Submit for Approval" : "Save Changes"}
          </Button>
        </>
      }
    >
      {blocking ? (
        <>
          <p className="text-body text-ink-soft leading-relaxed mb-3">
            Reschedule or cancel each affected booking to continue. This change applies immediately once resolved — no admin approval needed.
          </p>
          <div className="space-y-2">
            {bookings.map((b, i) => {
              const isResolved = resolvedIdx.has(i);
              return (
                <div key={i} className={`flex items-center justify-between gap-3 rounded-card border px-3 py-2 ${isResolved ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"}`}>
                  <span className={`text-data font-medium ${isResolved ? "text-success-ink line-through" : "text-danger-ink"}`}>{bookingLabel(b)}</span>
                  {isResolved ? (
                    <span className="text-overline text-success-ink shrink-0">Resolved</span>
                  ) : (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => resolve(i, "Reschedule")} className="px-2.5 py-1 text-label font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-hover">Reschedule</button>
                      <button onClick={() => resolve(i, "Cancel")} className="px-2.5 py-1 text-label font-bold text-danger-ink border border-danger/30 bg-surface rounded-control hover:bg-danger/10">Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5 mb-4 bg-surface-page border border-divider rounded-card p-3">
            {shown.map((b, i) => (
              <div key={i} className="text-data text-ink-soft font-medium">{bookingLabel(b)}</div>
            ))}
            {extra > 0 && <div className="text-data text-ink-muted">and {extra} more</div>}
          </div>
          <p className="text-body text-ink-soft leading-relaxed">
            Administrator approval is required for all leave requests. These bookings will need to be rescheduled or cancelled if your leave is approved.
          </p>
        </>
      )}
    </Modal>
  );
}
