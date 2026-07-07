import React from "react";
import { AlertTriangle } from "lucide-react";
import { BookedAppt, bookingLabel } from "./availabilityData";

export function ConflictModal({ bookings, context = "schedule", onCancel, onSubmit }: {
  bookings: BookedAppt[];
  context?: "schedule" | "leave";
  onCancel: () => void;
  onSubmit: () => void;
}) {
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

          <div className="space-y-1.5 mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            {shown.map((b, i) => (
              <div key={i} className="text-sm text-gray-700 font-medium">{bookingLabel(b)}</div>
            ))}
            {extra > 0 && <div className="text-sm text-gray-500">and {extra} more</div>}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            {context === "schedule"
              ? "Administrator approval is required. Affected bookings must be rescheduled or cancelled before your change takes effect."
              : "Administrator approval is required for all leave requests. These bookings will need to be rescheduled or cancelled if your leave is approved."}
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={onSubmit} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors">
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}
