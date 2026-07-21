// Shared UI primitives for the Rooms & Devices admin pages: a right-side
// drawer shell, a portal overflow menu (escapes table overflow), a centered
// confirm dialog, and form field primitives — all matching the portal's
// existing dialog language (solid surfaces, slate accents, 8pt rhythm).
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, MoreHorizontal, LucideIcon } from "lucide-react";

export const inputCls =
  "w-full px-3 py-2 border border-divider rounded-card text-sm text-ink bg-surface outline-none focus:border-border-strong focus:ring-2 focus:ring-divider transition-shadow";
export const labelCls = "block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5";

export function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-danger-ink"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-danger-ink mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

// Right-side drawer. Solid content surface (clinical data never behind glass);
// only the scrim is translucent. Slides in, with a reduced-motion fallback.
export function SettingsDrawer({ title, subtitle, onClose, children, footer, width = 480 }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-surface-sunken/40 backdrop-blur-sm animate-in fade-in motion-reduce:animate-none"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative h-full bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right-8 fade-in duration-200 motion-reduce:animate-none max-w-[92vw]"
        style={{ width }}
      >
        <div className="px-6 py-4 border-b border-divider flex justify-between items-start bg-surface-page shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink truncate">{title}</h2>
            {subtitle && <p className="text-sm text-ink-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-1 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-divider flex justify-end gap-3 bg-surface-page shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export type OverflowItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

// Portal kebab menu with fixed positioning so it escapes an overflow-auto
// table. Mirrors the existing StaffRowMenu pattern.
export function OverflowMenu({ items, ariaLabel }: { items: OverflowItem[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuH = items.length * 40 + 8;
      const openUp = r.bottom + menuH > window.innerHeight;
      setPos({ top: openUp ? r.top - menuH - 4 : r.bottom + 4, left: Math.max(8, r.right - 200) });
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={ariaLabel}
        className="p-2 text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-card transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed w-[200px] bg-surface border border-divider rounded-card shadow-lg z-50 py-1" style={{ top: pos.top, left: pos.left }}>
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.label}
                  disabled={it.disabled}
                  onClick={() => { setOpen(false); it.onClick(); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                    it.disabled
                      ? "text-ink-muted cursor-not-allowed"
                      : it.danger
                      ? "text-danger-ink hover:bg-danger/10"
                      : "text-ink-soft hover:bg-surface-page"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  {it.label}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// Centered confirm dialog for lightweight confirmations (reactivate, retire…).
export function ConfirmDialog({ title, body, confirmLabel, danger, onCancel, onConfirm }: {
  title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6" onClick={onCancel}>
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 motion-reduce:animate-none" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-base font-bold text-ink mb-1.5">{title}</h2>
          <div className="text-sm text-ink-muted leading-relaxed">{body}</div>
        </div>
        <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-divider rounded-card text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-card text-sm font-bold text-white transition-colors ${danger ? "bg-danger-ink hover:bg-danger-ink" : "bg-surface-sunken hover:bg-surface-sunken"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small labelled pill used for statuses (color pairs with an icon/dot elsewhere,
// never color alone).
export function Pill({ tone, children }: { tone: "emerald" | "amber" | "gray" | "slate" | "red"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    emerald: "bg-success/10 border-success/30 text-success-ink",
    amber: "bg-warning/10 border-warning/30 text-warning-ink",
    gray: "bg-surface-hover border-divider text-ink-muted",
    slate: "bg-surface-hover border-divider text-ink-soft",
    red: "bg-danger/10 border-danger/30 text-danger-ink",
  };
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${map[tone]}`}>{children}</span>;
}
