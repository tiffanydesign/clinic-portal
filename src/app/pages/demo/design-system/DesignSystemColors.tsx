import React from "react";

type Swatch = { name: string; className: string; hex: string; usage: string };

const BRAND: Swatch[] = [
  { name: "Phenome Blue 900", className: "bg-[color:var(--phenome-blue-900)]", hex: "#0A1E57", usage: "Darkest brand navy — auth hero text" },
  { name: "Phenome Blue 700", className: "bg-[color:var(--phenome-blue-700)]", hex: "#142B6E", usage: "Brand ramp step" },
  { name: "Phenome Blue 500", className: "bg-[color:var(--phenome-blue-500)]", hex: "#203A85", usage: "Brand ramp step" },
  { name: "Phenome Blue 400", className: "bg-[color:var(--phenome-blue-400)]", hex: "#435BA1", usage: "Primary button fill" },
  { name: "Phenome Blue 300", className: "bg-[color:var(--phenome-blue-300)]", hex: "#7185BD", usage: "Brand ramp step" },
  { name: "Phenome Blue 200", className: "bg-[color:var(--phenome-blue-200)]", hex: "#A9B5D9", usage: "Brand ramp step" },
  { name: "Phenome Blue 100", className: "bg-[color:var(--phenome-blue-100)]", hex: "#E6E9F2", usage: "Brand ramp step" },
];

const SEMANTIC: Swatch[] = [
  { name: "Success", className: "bg-success", hex: "#70D332", usage: "Positive/cleared outcome ONLY" },
  { name: "Success ink", className: "bg-success-ink", hex: "#417e1b", usage: "Text on success tint" },
  { name: "Warning", className: "bg-warning", hex: "#FFB600", usage: "Needs attention soon" },
  { name: "Warning ink", className: "bg-warning-ink", hex: "#8f6600", usage: "Text on warning tint" },
  { name: "Danger", className: "bg-danger", hex: "#FF4B2B", usage: "Blocked / overdue ONLY" },
  { name: "Danger ink", className: "bg-danger-ink", hex: "#db2100", usage: "Text on danger tint" },
  { name: "Info", className: "bg-info", hex: "#508CFC", usage: "Neutral in-progress / active now" },
  { name: "Info ink", className: "bg-info-ink", hex: "#045afb", usage: "Text on info tint" },
  { name: "Special", className: "bg-special", hex: "#3366FF", usage: "Distinct category marker (reuses reference palette's Brand Primary — kept apart from Info by being deeper/more saturated)" },
  { name: "Special ink", className: "bg-special-ink", hex: "#0040ff", usage: "Text on special tint" },
  { name: "Success fill", className: "bg-success-fill", hex: "#509b21", usage: "Icon-circle / progress-segment fill, non-text only" },
  { name: "Warning fill", className: "bg-warning-fill", hex: "#b27f00", usage: "Icon-circle / progress-segment fill, non-text only" },
  { name: "Danger fill", className: "bg-danger-fill", hex: "#ff3c1a", usage: "Icon-circle / progress-segment fill, non-text only" },
  { name: "Info fill", className: "bg-info-fill", hex: "#1d6bfb", usage: "Icon-circle / progress-segment fill, non-text only" },
  { name: "Special fill", className: "bg-special-fill", hex: "#1a53ff", usage: "Icon-circle / progress-segment fill, non-text only" },
];

const SURFACE: Swatch[] = [
  { name: "Surface", className: "bg-surface border border-divider", hex: "#FFFFFF", usage: "Card / panel background" },
  { name: "Surface page", className: "bg-surface-page", hex: "#F4F6FB", usage: "Page background" },
  { name: "Surface hover", className: "bg-surface-hover", hex: "#EEF1F8", usage: "Hover / chip fill" },
  { name: "Surface sunken", className: "bg-surface-sunken", hex: "#E7EBF3", usage: "Track / well / disabled" },
];

const IDENTITY: Swatch[] = [
  { name: "Identity 1", className: "bg-identity-1", hex: "#6B8CBE", usage: "Person A (calendar/avatar)" },
  { name: "Identity 2", className: "bg-identity-2", hex: "#C98A9A", usage: "Person B" },
  { name: "Identity 3", className: "bg-identity-3", hex: "#7FA98E", usage: "Person C" },
  { name: "Identity 4", className: "bg-identity-4", hex: "#C9A56B", usage: "Person D" },
  { name: "Identity 5", className: "bg-identity-5", hex: "#9B87B5", usage: "Person E" },
  { name: "Identity 6", className: "bg-identity-6", hex: "#6BB0AE", usage: "Person F" },
  { name: "Identity 7", className: "bg-identity-7", hex: "#B58A6B", usage: "Person G" },
  { name: "Identity 8", className: "bg-identity-8", hex: "#8E97B5", usage: "Person H" },
];

function SwatchRow({ s }: { s: Swatch }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-10 h-10 rounded-control border border-divider shrink-0 ${s.className}`} />
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink">{s.name}</div>
        <div className="text-xs text-ink-muted tabular-nums">{s.hex} — {s.usage}</div>
      </div>
    </div>
  );
}

export function DesignSystemColors() {
  return (
    <section id="colors" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Colors</h2>
      <p className="text-sm text-ink-muted mb-4">Every swatch below renders its actual token — change the token in theme.css and this section updates.</p>

      <h3 className="text-section text-ink-soft mb-2">Brand ramp</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">{BRAND.map((s) => <SwatchRow key={s.name} s={s} />)}</div>

      <h3 className="text-section text-ink-soft mb-2">Semantic (one colour, one meaning)</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Ban: never reuse a status hue for anything else — see theme.css's "ONE COLOUR, ONE MEANING" comment block.</p>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">{SEMANTIC.map((s) => <SwatchRow key={s.name} s={s} />)}</div>

      <h3 className="text-section text-ink-soft mb-2">Surfaces</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">{SURFACE.map((s) => <SwatchRow key={s.name} s={s} />)}</div>

      <h3 className="text-section text-ink-soft mb-2">Identity (person, never state)</h3>
      <div className="bg-warning/10 border border-warning/30 rounded-control px-3 py-2 mb-3 text-xs text-warning-ink font-medium">
        ⚠ Usage ban: identity colours mark WHO (calendar ownership, avatar rings) — never mix with --status-* semantics. Placeholder palette, pending real brand swatch.
      </div>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">{IDENTITY.map((s) => <SwatchRow key={s.name} s={s} />)}</div>

      <h3 className="text-section text-ink-soft mb-2">Gradients</h3>
      <div className="bg-danger/10 border border-danger/30 rounded-control px-3 py-2 mb-3 text-xs text-danger-ink font-medium">
        ⚠ Usage ban: gradients are for the auth/brand/marketing surface ONLY (login, logo). Never on data or operational UI. Enforced by check-tokens.sh.
      </div>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-4">
        <div className="w-32 h-16 rounded-control" style={{ background: "var(--gradient-brand)" }} />
        <div className="w-32 h-16 rounded-control" style={{ background: "var(--gradient-vitality)" }} />
      </div>
    </section>
  );
}
