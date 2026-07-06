import React from "react";

export function WithdrawModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-5">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Withdraw Request?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your pending request will be removed. You can then make new availability changes.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
