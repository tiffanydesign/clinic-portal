import React from "react";
import { AlertTriangle } from "lucide-react";

export function ConflictModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 pt-1.5">Availability Change Affects Existing Bookings</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            This request conflicts with one or more scheduled appointments. Administrator approval is required before these changes can take effect. All affected bookings must be cancelled or rescheduled before approval.
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
