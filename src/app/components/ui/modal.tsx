import * as React from "react";
import { X } from "lucide-react";

export type ModalSize = "confirm" | "form";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  confirm: "max-w-[480px]",
  form: "max-w-[640px]",
};

// The ONE Modal implementation for the whole app — formalizes the
// hand-rolled `fixed inset-0 ... backdrop-blur-sm` overlay pattern already
// repeated across ~26 files (ConflictModal, WithdrawModal, RegisterPatientModal,
// etc.) into one shared component, rather than adopting the dormant
// Radix-based components/ui/dialog.tsx (0 real consumers in this app).
// Body padding is a flat --space-4 (16px) always — never 24px+ inside a
// modal, per the frozen-token law.
export function Modal({ open, onClose, title, subtitle, size = "confirm", children, footer }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-6"
      style={{ backgroundColor: "rgba(16,33,75,.35)" }}
      onClick={onClose}
    >
      <div
        className={`bg-surface rounded-card shadow-2xl border border-divider w-full ${SIZE_CLASS[size]} max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-4 py-3 border-b border-divider flex items-start justify-between shrink-0 bg-surface-page gap-3">
          <div className="min-w-0">
            <h2 className="text-section font-bold text-ink truncate">{title}</h2>
            {subtitle && <p className="text-label text-ink-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-extend p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="p-4 border-t border-divider bg-surface-page shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
