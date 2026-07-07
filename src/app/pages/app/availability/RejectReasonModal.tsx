import React, { useState } from "react";
import { toast } from "sonner";

export function RejectReasonModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) { toast.error("A reason is required to reject this request."); return; }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Reject Request</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            This reason will be sent to the employee.
          </p>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Insufficient staffing that week"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white focus:border-slate-500 resize-none"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={submit} className="px-6 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}
