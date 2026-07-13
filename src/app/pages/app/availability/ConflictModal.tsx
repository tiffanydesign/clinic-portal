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
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 pt-1.5">This change conflicts with existing bookings</h2>
          </div>

          {blocking ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Reschedule or cancel each affected booking to continue. This change applies immediately once resolved — no admin approval needed.
              </p>
              <div className="space-y-2">
                {bookings.map((b, i) => {
                  const isResolved = resolvedIdx.has(i);
                  return (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${isResolved ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                      <span className={`text-sm font-medium ${isResolved ? "text-emerald-700 line-through" : "text-red-700"}`}>{bookingLabel(b)}</span>
                      {isResolved ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">Resolved</span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => resolve(i, "Reschedule")} className="px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-300 bg-white rounded hover:bg-slate-50">Reschedule</button>
                          <button onClick={() => resolve(i, "Cancel")} className="px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-300 bg-white rounded hover:bg-red-50">Cancel</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5 mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                {shown.map((b, i) => (
                  <div key={i} className="text-sm text-gray-700 font-medium">{bookingLabel(b)}</div>
                ))}
                {extra > 0 && <div className="text-sm text-gray-500">and {extra} more</div>}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Administrator approval is required for all leave requests. These bookings will need to be rescheduled or cancelled if your leave is approved.
              </p>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <div title={!canConfirm ? "Resolve all affected bookings before saving" : undefined}>
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`px-6 py-2 rounded text-sm font-bold text-white transition-colors ${canConfirm ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {context === "leave" ? "Submit for Approval" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
