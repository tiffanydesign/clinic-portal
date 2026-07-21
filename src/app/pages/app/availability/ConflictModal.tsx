import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { BookedAppt, bookingLabel } from "./availabilityData";

// "schedule" and "override" are blocking: every conflicting booking must be
// individually resolved (Reschedule/Cancel) before Confirm unlocks, since
// neither kind goes through Admin approval anymore — this modal IS the
// gate. "leave" stays informational-only: Leave still always requires a
// real Admin decision, so conflicts are shown for awareness but don't block
// submission.
export function ConflictModal({ bookings, context, onCancel, onConfirm }: {
  bookings: BookedAppt[];
  context: "schedule" | "override" | "leave";
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
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning-ink" />
            </div>
            <h2 className="text-lg font-bold text-ink pt-1.5">This change conflicts with existing bookings</h2>
          </div>

          {blocking ? (
            <>
              <p className="text-sm text-ink-soft leading-relaxed mb-3">
                Reschedule or cancel each affected booking to continue. This change applies immediately once resolved — no admin approval needed.
              </p>
              <div className="space-y-2">
                {bookings.map((b, i) => {
                  const isResolved = resolvedIdx.has(i);
                  return (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-card border px-3 py-2 ${isResolved ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"}`}>
                      <span className={`text-sm font-medium ${isResolved ? "text-success-ink line-through" : "text-danger-ink"}`}>{bookingLabel(b)}</span>
                      {isResolved ? (
                        <span className="text-overline text-success-ink shrink-0">Resolved</span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => resolve(i, "Reschedule")} className="px-2.5 py-1 text-label font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-page">Reschedule</button>
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
                  <div key={i} className="text-sm text-ink-soft font-medium">{bookingLabel(b)}</div>
                ))}
                {extra > 0 && <div className="text-sm text-ink-muted">and {extra} more</div>}
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">
                Administrator approval is required for all leave requests. These bookings will need to be rescheduled or cancelled if your leave is approved.
              </p>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-divider flex justify-end space-x-3 bg-surface-page">
          <button onClick={onCancel} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <div title={!canConfirm ? "Resolve all affected bookings before saving" : undefined}>
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`px-6 py-2 rounded-control text-sm font-bold text-white transition-colors ${canConfirm ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
            >
              {context === "leave" ? "Submit for Approval" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
