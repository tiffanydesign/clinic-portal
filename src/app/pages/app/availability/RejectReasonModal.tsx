import React, { useState } from "react";
import { toast } from "sonner";

export function RejectReasonModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) { toast.error("A reason is required to reject this request."); return; }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <h2 className="text-lg font-bold text-ink mb-2">Reject Request</h2>
          <p className="text-sm text-ink-soft leading-relaxed mb-4">
            This reason will be sent to the employee.
          </p>
          <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
            Reason <span className="text-danger-ink">*</span>
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Insufficient staffing that week"
            className="w-full px-3 py-2 border border-divider rounded-control text-sm outline-none bg-surface focus:border-border-strong resize-none"
          />
        </div>
        <div className="px-6 py-4 border-t border-divider flex justify-end space-x-3 bg-surface-page">
          <button onClick={onCancel} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button onClick={submit} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-danger-ink hover:bg-danger-ink transition-colors">
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}
