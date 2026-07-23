import React from "react";
import Logo from "../../../../imports/Logo-1";
import epLogo from "../../../../assets/EPlogo.png";

// Real vector brand-mark component (src/imports/Logo-1) — the same asset
// already used in production by AuthLayout. Renders true SVG gradients per
// Phenome Brand Guideline pp.3-9, not a CSS approximation.

const MISUSE: string[] = [
  "Do not crop the logo",
  "Do not change the size or position of the icon and logotype",
  "Do not change the transparency of the logo",
  "Do not distort the logo",
  "Do not use drop shadows or any other effects",
  "Do not readjust any spacing of the logotype",
  "Do not use different colours",
  "Do not rotate any part of the logo",
  "Do not re-create using any other typeface",
  "Do not outline logotype",
];

export function DesignSystemLogo() {
  return (
    <section id="logo" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Logo</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-2xl">
        Per Phenome Brand Guideline pp.3-9. Rendered below via the real vector
        component (<code className="text-label">src/imports/Logo-1</code>) —
        the same asset AuthLayout already uses in production — not a text/CSS
        approximation.
      </p>

      <h3 className="text-section text-ink-soft mb-2">Full logo</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Primary version, used in most applications. Full-colour cut only on white/light backgrounds; use the white monochrome cut on dark or photographic backgrounds (p.3, p.6).</p>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-control border border-divider bg-white p-6 flex flex-col items-center gap-3">
          <Logo property1="full" property2="coloured" />
          <span className="text-label text-ink-muted">Full · Coloured — on white/light</span>
        </div>
        <div className="rounded-control p-6 flex flex-col items-center gap-3 bg-[color:var(--phenome-blue-900)]">
          <Logo property1="full" property2="mono" />
          <span className="text-label text-white/70">Full · Mono (white) — on dark/photo</span>
        </div>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Icon logo</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Simplified mark for compact spaces — favicons, wearables, collapsed sidebars (p.4). The vector asset ships mono variants only; this app's actual coloured compact mark is the raster PNG below.</p>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-control p-6 flex flex-col items-center gap-3 bg-[color:var(--phenome-blue-900)]">
          <Logo property1="small" property2="mono" />
          <span className="text-label text-white/70">Icon · Mono (white)</span>
        </div>
        <div className="rounded-control border border-divider bg-white p-6 flex flex-col items-center gap-3">
          <Logo property1="small" property2="mono-blue" />
          <span className="text-label text-ink-muted">Icon · Mono-blue</span>
        </div>
        <div className="rounded-control border border-divider bg-white p-6 flex flex-col items-center gap-3">
          <img src={epLogo} alt="Phenome icon" className="h-14 w-auto" />
          <span className="text-label text-ink-muted">Icon · Coloured (assets/EPlogo.png)</span>
        </div>
      </div>
      <div className="bg-surface-hover border border-divider rounded-control px-3 py-2 mb-6 text-xs text-ink-soft">
        Currently used in this app: the coloured PNG icon above is the sidebar mark (AppShell); the Full · Mono vector above is the auth-screen mark (AuthLayout). AuthLayout's mobile/compact header currently falls back to a generic placeholder icon rather than either brand mark — a pre-existing inconsistency, left as-is here since it's outside this page's scope.
      </div>

      <h3 className="text-section text-ink-soft mb-2">Monochrome</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Use when full colour reproduction isn't possible — single-colour print, busy/photographic backgrounds (p.5). Approved cuts: Phenome-blue, black, white. Only blue (coloured, above) and white (mono, above) exist as this app's vector asset; no solid-black cut is implemented here.</p>

      <h3 className="text-section text-ink-soft mb-2">Clearspace</h3>
      <div className="bg-warning/10 border border-warning/30 rounded-control px-3 py-2 mb-6 text-xs text-warning-ink font-medium">
        ⚠ Keep the area around the logo free of text, images, or other graphic elements at all times (p.7). Note: the guideline's own clearspace unit is left as an unfilled placeholder in the source document — no exact multiple is specified to encode here.
      </div>

      <h3 className="text-section text-ink-soft mb-2">Misuse — do not</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-ink-soft list-disc pl-4">
          {MISUSE.map((m) => <li key={m}>{m}</li>)}
        </ul>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Sub-brand logos</h3>
      <p className="text-label text-ink-muted px-0.5">Guideline defines sub-brand lockups (Phenome Omics, Phenome Longevity Wearables/Tech, Phenome Longevity Supplements/Phenome+) for other product lines (p.10) — not applicable to this clinical portal.</p>
    </section>
  );
}
