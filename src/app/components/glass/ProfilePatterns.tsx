import React from "react";
import { Pencil } from "lucide-react";

// Information Display pattern: a field that isn't a form until you ask it
// to be one. Read mode is plain typography (label + value, no box, no
// border) — only `editing` swaps the value slot for a real input, so a
// read-only or not-currently-editing field never wears fake input chrome.
export function InfoRow({ label, value, editing, children, className = "" }: {
  label: string;
  value?: React.ReactNode;
  editing?: boolean;
  children?: React.ReactNode; // the actual input, used only when editing
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-label font-medium uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-400)" }}>
        {label}
      </div>
      {editing ? (
        children
      ) : (
        <div className="text-section" style={{ color: "var(--ink-900)" }}>{value}</div>
      )}
    </div>
  );
}

// Section heading — typography and spacing carry the hierarchy, not a
// bordered card. A hairline divider is optional and only used where a
// section genuinely needs a hard stop (e.g. above a dense list).
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-section font-medium" style={{ color: "var(--ink-900)" }}>{children}</h2>
      {action}
    </div>
  );
}

// Small ghost icon-button for a section's single "Edit" affordance — never
// gradient (the Hero owns the page's one gradient focus), just a quiet
// invitation to switch a group of InfoRows into their editable form.
export function EditToggle({ editing, onClick }: { editing: boolean; onClick: () => void }) {
  if (editing) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors hover:bg-surface/70"
      style={{ color: "var(--phenome-blue-500)" }}
    >
      <Pencil className="w-3.5 h-3.5" /> Edit
    </button>
  );
}

// Compact pill toggle — used for notification channels instead of a
// checkbox grid; reads closer to iOS/Health settings than an admin table.
export function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="w-9 h-5 rounded-full relative shrink-0 transition-colors"
      style={{ background: checked ? "var(--phenome-blue-500)" : "var(--phenome-blue-100)", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <span
        className="w-3.5 h-3.5 bg-surface rounded-full absolute top-[3px] transition-all shadow-sm"
        style={{ left: checked ? 19 : 3 }}
      />
    </button>
  );
}
