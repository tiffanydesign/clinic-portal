import React from "react";

type TypeSpec = { className: string; name: string; sizeVar: string };

const TYPE_TIERS: TypeSpec[] = [
  { className: "text-page-title", name: "Page title", sizeVar: "--text-page-title (24px)" },
  { className: "text-section", name: "Section heading", sizeVar: "--text-section (16px)" },
  { className: "text-body", name: "Body copy", sizeVar: "--text-body (16px)" },
  { className: "text-data", name: "Table / data row", sizeVar: "--text-data (14px)" },
  { className: "text-label", name: "Label / minor caption", sizeVar: "--text-label (13px)" },
  { className: "text-overline", name: "Overline / group head", sizeVar: "--text-overline (12px)" },
];

const KPI_TIERS: TypeSpec[] = [
  { className: "kpi-value-lg", name: "KPI value (card)", sizeVar: "--kpi-value-lg (30px)" },
  { className: "kpi-value-sm", name: "KPI value (strip)", sizeVar: "--kpi-value-sm (22px)" },
];

// The brand's own typeface, per Phenome Brand Guideline pp.18-19 — rendered
// with an EXPLICIT font-family override so the samples below genuinely show
// Helvetica Neue (or the closest available face), independent of the rest
// of the app's --font-sans (self-hosted TeX Gyre Heros, an engineering
// substitute kept for Windows rendering consistency — a separate, unrelated
// decision from what the brand guideline itself specifies).
const HN_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

type WeightSpec = { name: string; weight: number; italic?: boolean; condensed?: boolean };
const HN_WEIGHTS: WeightSpec[] = [
  { name: "UltraLight", weight: 100 },
  { name: "UltraLight Italic", weight: 100, italic: true },
  { name: "Thin", weight: 200 },
  { name: "Thin Italic", weight: 200, italic: true },
  { name: "Light", weight: 300 },
  { name: "Light Italic", weight: 300, italic: true },
  { name: "Regular", weight: 400 },
  { name: "Italic", weight: 400, italic: true },
  { name: "Medium", weight: 500 },
  { name: "Medium Italic", weight: 500, italic: true },
  { name: "Bold", weight: 700 },
  { name: "Bold Italic", weight: 700, italic: true },
  { name: "Condensed Bold", weight: 700, condensed: true },
  { name: "Condensed Black", weight: 900, condensed: true },
];

const HN_SAMPLE = "The quick brown fox jumps over the crazy dog 1234567890";

// A long Turkish label, deliberately included so this section proves the
// 6-tier scale + label-on-top Input contract both survive a genuinely long,
// diacritic-bearing real-world string without truncating awkwardly.
const TURKISH_SAMPLE = "Randevu saatinizi değiştirmek istediğinize emin misiniz?";

export function DesignSystemTypography() {
  return (
    <section id="typography" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Typography</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-2xl">
        Helvetica Neue is used throughout the brand — different font-weights
        identify headings, sub-headings, or body text. The logo wordmark
        itself uses a separate face, Hurme Geometric Sans 3, never for UI text.
      </p>

      <h3 className="text-section text-ink-soft mb-2">Typeface — Helvetica Neue</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-divider">
          <div className="w-16 h-16 rounded-control bg-[color:var(--phenome-blue-900)] flex items-center justify-center shrink-0">
            <span style={{ fontFamily: HN_STACK, fontWeight: 700 }} className="text-white text-3xl leading-none">Aa</span>
          </div>
          <div>
            <div style={{ fontFamily: HN_STACK, fontWeight: 700 }} className="text-lg text-ink">Helvetica Neue</div>
            <div style={{ fontFamily: HN_STACK }} className="text-sm text-ink-soft">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {HN_WEIGHTS.map((w) => (
            <div key={w.name} className="flex items-baseline gap-3">
              <span className="w-32 shrink-0 text-label text-ink-muted">{w.name}</span>
              <span
                style={{
                  fontFamily: HN_STACK,
                  fontWeight: w.weight,
                  fontStyle: w.italic ? "italic" : "normal",
                  letterSpacing: w.condensed ? "-0.03em" : undefined,
                  transform: w.condensed ? "scaleX(0.85)" : undefined,
                  transformOrigin: "left",
                }}
                className="text-sm text-ink truncate"
              >
                {HN_SAMPLE}
              </span>
            </div>
          ))}
        </div>
        <p className="text-label text-ink-muted mt-3 px-0.5">Note: Condensed styles are approximated (scale/letter-spacing) — no condensed Helvetica Neue cut is installed as a web font here.</p>
      </div>

      <div className="bg-surface-hover border border-divider rounded-control px-3 py-2 mb-6 text-xs text-ink-soft">
        <span className="font-bold">Logo-only typeface:</span> Hurme Geometric Sans 3 — used exclusively in the "Phenome Longevity" wordmark lettering (see Brand mark, in Colors). Not a web font here; never used for UI/body text.
      </div>

      <h3 className="text-section text-ink-soft mb-2">Six tiers</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 space-y-3">
        {TYPE_TIERS.map((t) => (
          <div key={t.className} className="flex items-baseline gap-3">
            <span className="w-32 shrink-0 text-label text-ink-muted tabular-nums">{t.sizeVar}</span>
            <span style={{ fontFamily: HN_STACK }} className={`${t.className} text-ink`}>{t.name} — {TURKISH_SAMPLE}</span>
          </div>
        ))}
      </div>

      <h3 className="text-section text-ink-soft mb-2">KPI numerals (tabular-nums)</h3>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-8">
        {KPI_TIERS.map((t) => (
          <div key={t.className}>
            <div style={{ fontFamily: HN_STACK }} className={`${t.className} text-ink`}>1,204</div>
            <div className="text-label text-ink-muted mt-1">{t.sizeVar}</div>
          </div>
        ))}
      </div>
      <p className="text-label text-ink-muted mt-2 px-0.5">Ban: no separate numeral treatment anywhere else — every numeric KPI/table value uses .tabular-nums (baked into the two classes above), never plain proportional digits.</p>
    </section>
  );
}
