import React from "react";

// Glass-Card, per DESIGN_STYLE.md §3 and §10.2 — a shared base so the
// "Frosted Premium" look doesn't get reinvented ad hoc per page. `index`
// drives the entrance stagger (§6): each card fades up 40ms after the last.
export function GlassCard({ children, className = "", index = 0 }: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <div
      className={`frosted-card frosted-stagger rounded-[var(--radius-frosted-md)] p-6 ${className}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: "1px solid var(--divider)" }}>
      <h2 className="text-section font-medium" style={{ color: "var(--ink-900)" }}>{title}</h2>
      {description && <p className="text-sm mt-1" style={{ color: "var(--ink-600)" }}>{description}</p>}
    </div>
  );
}

// Glass-Inset, §3 — the un-blurred nested surface for read-only fields,
// table containers, and other content sitting inside a Glass-Card.
export function GlassInset({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`frosted-inset rounded-[var(--radius-frosted-sm)] ${className}`} style={style}>
      {children}
    </div>
  );
}
