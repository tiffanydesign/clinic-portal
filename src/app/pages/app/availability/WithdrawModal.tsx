import React from "react";

export function WithdrawModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <h2 className="text-lg font-bold text-ink mb-2">Withdraw Request?</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Your pending request will be removed. You can then make new availability changes.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-divider flex justify-end space-x-3 bg-surface-page">
          <button onClick={onCancel} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-danger-ink hover:bg-danger-ink transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
