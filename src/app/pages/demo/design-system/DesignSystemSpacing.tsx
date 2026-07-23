import React from "react";

const SPACE = [
  { name: "--space-1", px: 4 },
  { name: "--space-2", px: 8 },
  { name: "--space-3", px: 12 },
  { name: "--space-4", px: 16 },
  { name: "--space-6", px: 24 },
];
const RADIUS = [
  { name: "--radius-control", px: 8, label: "buttons, inputs, chips" },
  { name: "--radius-card", px: 16, label: "cards, panels, modals" },
];

export function DesignSystemSpacing() {
  return (
    <section id="spacing" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Spacing / Radius / Shadow</h2>
      <p className="text-label text-ink-muted mb-4 px-0.5">Ban: component-internal padding must never exceed --space-4 (16px). --space-6 (24px) is page-layout only — gaps between sections, page gutters, never inside a card.</p>

      <h3 className="text-section text-ink-soft mb-2">Spacing scale</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 space-y-2">
        {SPACE.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-label text-ink-muted tabular-nums">{s.name}</span>
            <div className="bg-info/30 h-4" style={{ width: s.px }} />
            <span className="text-label text-ink-muted tabular-nums">{s.px}px</span>
          </div>
        ))}
      </div>

      <h3 className="text-section text-ink-soft mb-2">Radius</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex gap-6">
        {RADIUS.map((r) => (
          <div key={r.name} className="text-center">
            <div className="w-16 h-16 bg-info/20 border border-info/40 mx-auto" style={{ borderRadius: r.px }} />
            <div className="text-label text-ink-muted mt-1 tabular-nums">{r.name} ({r.px}px)</div>
            <div className="text-overline text-ink-muted">{r.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-section text-ink-soft mb-2">Shadow</h3>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-6">
        <div className="text-center">
          <div className="w-24 h-16 bg-surface border border-divider rounded-control shadow-none" />
          <div className="text-label text-ink-muted mt-1">--shadow-none</div>
          <div className="text-overline text-ink-muted">default for cards</div>
        </div>
        <div className="text-center">
          <div className="w-24 h-16 bg-surface border border-divider rounded-control" style={{ boxShadow: "var(--shadow-raised)" }} />
          <div className="text-label text-ink-muted mt-1">--shadow-raised</div>
          <div className="text-overline text-ink-muted">popovers & pressed only</div>
        </div>
      </div>
    </section>
  );
}
