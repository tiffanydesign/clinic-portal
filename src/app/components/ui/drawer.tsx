import * as React from "react";
import { X } from "lucide-react";

export type DrawerWidth = "sm" | "lg";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: DrawerWidth;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const WIDTH_PX: Record<DrawerWidth, string> = { sm: "400px", lg: "560px" };

// The ONE Drawer implementation — same title-bar/close/padding contract as
// Modal (see modal.tsx), slides in from the right instead of centering.
// Two width tiers only: 400px (sm, quick side panels) / 560px (lg, richer
// detail views) — never a third ad-hoc width at a call site. Replaces the
// vendored vaul-based Drawer (0 real consumers in this app) with the same
// hand-rolled overlay pattern already proven across ~26 modal files.
export function Drawer({ open, onClose, title, subtitle, width = "sm", children, footer }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(16,33,75,.35)" }}
        onClick={onClose}
      />
      <div
        className="absolute top-0 right-0 h-full bg-surface border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        style={{ width: WIDTH_PX[width] }}
      >
        <div className="px-5 py-4 border-b border-divider flex items-start justify-between shrink-0 bg-surface-page gap-3">
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
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-divider bg-surface-page shrink-0 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
