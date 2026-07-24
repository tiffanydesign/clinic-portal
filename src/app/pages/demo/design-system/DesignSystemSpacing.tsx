import React from "react";

const SPACE = [
  { name: "--space-0", px: 0 },
  { name: "--space-1", px: 4 },
  { name: "--space-2", px: 8 },
  { name: "--space-3", px: 12 },
  { name: "--space-4", px: 16 },
  { name: "--space-5", px: 20 },
  { name: "--space-6", px: 24 },
  { name: "--space-7", px: 32 },
  { name: "--space-8", px: 40 },
  { name: "--space-9", px: 48 },
];
const RADIUS = [
  { name: "--radius-sm", px: 8, label: "small controls: chips, small badges" },
  { name: "--radius-md", px: 10, label: "buttons, inputs, selects" },
  { name: "--radius-lg", px: 12, label: "cards, panels" },
  { name: "--radius-xl", px: 16, label: "dialogs / modals" },
];
const HEIGHTS = [
  { name: "--control-sm", px: 36, label: "secondary button, icon button" },
  { name: "--control-md", px: 40, label: "input, select, search" },
  { name: "--button-h", px: 36, label: "primary button (v4: split from input height)" },
  { name: "--control-lg", px: 40, label: "sidebar menu row (v4: 44px → 40px)" },
  { name: "--table-row", px: 44, label: "table row (v4: 48px → 44px)" },
];
const LAYOUT = [
  { name: "--page-padding-x", value: "16px", label: "page horizontal padding (v4: 24px → 16px)" },
  { name: "--page-padding-y", value: "16px", label: "page top/bottom padding (v4: 20px → 16px)" },
  { name: "--sidebar-width", value: "248px", label: "sidebar width (v4: 260px → 248px)" },
  { name: "--content-gap", value: "8px", label: "sidebar → content gap (v4: 16px → 8px)" },
  { name: "--card-padding", value: "16px", label: "default card padding — unchanged in v4" },
  { name: "--card-padding-lg", value: "20px", label: "large card padding — unchanged" },
  { name: "--header-to-section", value: "16px", label: "header bar → first section" },
  { name: "--section-gap", value: "20px", label: "gap between page sections (v4: 24px → 20px)" },
  { name: "--section-gap-lg", value: "24px", label: "rare, larger section break" },
  { name: "--card-gap", value: "12px", label: "gap between cards (v4: 16px → 12px)" },
  { name: "--grid-gutter", value: "12px", label: "grid gutter (v4: 16px → 12px)" },
];

export function DesignSystemSpacing() {
  return (
    <section id="spacing" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Spacing / Radius / Height / Layout</h2>
      <p className="text-label text-ink-muted mb-4 px-0.5">v4 token scale (2026-07-24 compaction pass, on top of the v3 spacing/rhythm pass): every spacing value in the app must be one of --space-0..9 below — never an arbitrary Npx value. v4 tightened the page-layout layer specifically (page padding, sidebar width/gap, section/card gaps, table row height, button height) after a review found those still read too loose on iPad — component-internal card padding (--space-4 / --space-5) was deliberately left unchanged to avoid crowding.</p>

      <h3 className="text-section text-ink-soft mb-2">Spacing scale</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 space-y-2">
        {SPACE.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-label text-ink-muted tabular-nums">{s.name}</span>
            <div className="bg-info/30 h-4" style={{ width: s.px || 1 }} />
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

      <h3 className="text-section text-ink-soft mb-2">Height tokens</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex flex-wrap gap-6">
        {HEIGHTS.map((h) => (
          <div key={h.name} className="text-center">
            <div className="w-16 bg-info/20 border border-info/40 mx-auto rounded-control" style={{ height: h.px }} />
            <div className="text-label text-ink-muted mt-1 tabular-nums">{h.name} ({h.px}px)</div>
            <div className="text-overline text-ink-muted max-w-[140px]">{h.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-section text-ink-soft mb-2">Layout tokens</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="text-label font-bold text-ink-muted pb-2 pr-4">Token</th>
              <th className="text-label font-bold text-ink-muted pb-2 pr-4">Value</th>
              <th className="text-label font-bold text-ink-muted pb-2">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {LAYOUT.map((l) => (
              <tr key={l.name}>
                <td className="py-2 pr-4 font-mono text-label text-ink-soft tabular-nums">{l.name}</td>
                <td className="py-2 pr-4 text-label text-ink-muted tabular-nums">{l.value}</td>
                <td className="py-2 text-label text-ink-muted">{l.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
