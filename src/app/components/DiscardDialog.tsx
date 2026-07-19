import React from "react";
import { AlertTriangle } from "lucide-react";

// Unsaved-changes guard for the create flows (New Booking, Register Patient).
//
// Deliberately its own tiny component rather than calendar/EditModals'
// ConfirmDialog: that one renders through ModalShell at z-50, which is the
// same layer as the booking modal it would have to sit above — and importing
// it into CreateModals would close an import cycle (EditModals already imports
// ModalShell *from* CreateModals).
//
// z-[70] keeps it above both the booking modal (z-50) and the register
// modal-over-modal (z-[60]).
export function DiscardDialog({
  title,
  message,
  confirmLabel = "Discard",
  onKeepEditing,
  onDiscard,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-6"
      onClick={onKeepEditing}
    >
      <div
        role="alertdialog"
        aria-label={title}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex gap-3">
            <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onKeepEditing}
            className="min-h-11 px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            Keep editing
          </button>
          <button
            onClick={onDiscard}
            className="min-h-11 px-5 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
