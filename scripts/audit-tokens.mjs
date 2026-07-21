#!/usr/bin/env node
/**
 * audit-tokens.mjs — Phenome Portal style audit (Task Step 0).
 *
 * Scans src/app/**\/*.tsx and src/styles/*.css (excludes node_modules,
 * src/imports) and reports actual usage counts for six categories:
 *   1. font sizes   2. spacing   3. radius
 *   4. colors       5. control heights   6. shadows
 *
 * Occurrence = every regex match (multiple per line counted separately),
 * so numbers are reproducible: `node scripts/audit-tokens.mjs`.
 * `--json` prints the raw aggregate for downstream tooling.
 *
 * Pure Node, no deps. Read-only; touches nothing.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const TSX_ROOT = join(ROOT, "src", "app");
const CSS_ROOT = join(ROOT, "src", "styles");
const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist"]);

// ---------------------------------------------------------------- file walk
function walk(dir, pred, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      // never descend into src/imports
      if (full.includes(join("src", "imports"))) continue;
      walk(full, pred, out);
    } else if (pred(full)) {
      out.push(full);
    }
  }
  return out;
}

// NOTE: .ts is included deliberately — shared style constants (SOURCE_COLORS,
// STATUS_PILLS, role pills…) live in *Data.ts / *View.ts files. Scanning only
// .tsx hid 165 palette classes in the first audit pass.
const tsxFiles = walk(TSX_ROOT, (f) => f.endsWith(".tsx") || f.endsWith(".ts"));
const cssFiles = walk(CSS_ROOT, (f) => f.endsWith(".css"));

// ---------------------------------------------------------------- helpers
// Aggregate keyed by value -> { count, files: Map(relpath -> count) }
function makeAgg() {
  return new Map();
}
function bump(agg, key, file, n = 1) {
  let e = agg.get(key);
  if (!e) {
    e = { count: 0, files: new Map() };
    agg.set(key, e);
  }
  e.count += n;
  e.files.set(file, (e.files.get(file) || 0) + n);
}
function rel(f) {
  return relative(ROOT, f).split(sep).join("/");
}
function topFiles(entry, k = 3) {
  return [...entry.files.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([f, c]) => `${f} (${c})`);
}
function sortedByCount(agg) {
  return [...agg.entries()].sort((a, b) => b[1].count - a[1].count);
}

// Tailwind spacing scale step -> px (v4 default, 1 unit = 4px)
function stepToPx(step) {
  const n = parseFloat(step);
  if (Number.isNaN(n)) return null;
  return n * 4;
}
const FONT_TW = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
  "5xl": "48px",
  "6xl": "60px",
};

// ---------------------------------------------------------------- categories
const fontSizes = makeAgg(); // key: display label
const spacing = makeAgg(); // key: class root+value, tagged with px
const radius = makeAgg();
const hexColors = makeAgg();
const rgbColors = makeAgg();
const paletteColors = makeAgg(); // text-gray-500 etc (raw tailwind palette)
const varRefsCss = makeAgg(); // var(--x) in css
const semanticClasses = makeAgg(); // text-primary, bg-card ... (token-backed)
const heights = makeAgg();
const shadows = makeAgg();

// spacing prefixes (longer first so alternation is greedy-correct)
const SPACE_PREFIX =
  "gap-x|gap-y|space-x|space-y|gap|px|py|pt|pb|pl|pr|ps|pe|p|mx|my|mt|mb|ml|mr|ms|me|m";
const spaceRe = new RegExp(
  `(?<![\\w-])(-?)(${SPACE_PREFIX})-(\\[[^\\]]+\\]|\\d+(?:\\.\\d+)?)(?![\\w.])`,
  "g"
);
// font size: tailwind size keywords + arbitrary text-[..px/rem]
const fontTwRe =
  /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g;
const fontArbRe = /(?<![\w-])text-\[(\d+(?:\.\d+)?(?:px|rem|em))\]/g;
// radius
const radiusRe =
  /(?<![\w-])rounded(-(?:tl|tr|bl|br|t|b|l|r|s|e|ss|se|es|ee))?(-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\]))?(?![\w-])/g;
// hex + rgb (in tsx source)
const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
const rgbRe = /rgba?\([^)]*\)/g;
// tailwind palette (raw): utility-color-shade
const paletteRe =
  /(?<![\w-])(text|bg|border|ring|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder|ring-offset)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3})(?![\w-])/g;
// semantic / token-backed color classes (good usage — tracked, not flagged)
const semanticRe =
  /(?<![\w-])(text|bg|border|ring|fill|stroke|from|to|via|placeholder|divide)-(primary|secondary|muted|accent|card|popover|background|foreground|destructive|input|border|ring|sidebar|muted-foreground|card-foreground|primary-foreground|secondary-foreground|accent-foreground|popover-foreground|destructive-foreground)(?:-foreground)?(?![\w-])/g;
// heights
const heightRe =
  /(?<![\w-])(min-h|max-h|h)-(\[[^\]]+\]|\d+(?:\.\d+)?|px|full|screen|auto|dvh|svh|lvh|fit|min|max)(?![\w.])/g;
// shadows (tailwind utility)
const shadowRe =
  /(?<![\w-])shadow(-(?:2xs|xs|sm|md|lg|xl|2xl|inner|none|\[[^\]]+\]))?(?![\w-])/g;

// css-side
const cssFontRe = /font-size\s*:\s*([^;]+);/g;
const cssRadiusRe = /border-radius\s*:\s*([^;]+);/g;
const cssVarRe = /var\((--[\w-]+)/g;

// ---------------------------------------------------------------- scan tsx
for (const file of tsxFiles) {
  const src = readFileSync(file, "utf8");
  const f = rel(file);
  let m;

  fontTwRe.lastIndex = 0;
  while ((m = fontTwRe.exec(src))) {
    const key = `text-${m[1]} (${FONT_TW[m[1]] || "?"})`;
    bump(fontSizes, key, f);
  }
  fontArbRe.lastIndex = 0;
  while ((m = fontArbRe.exec(src))) bump(fontSizes, `text-[${m[1]}]`, f);

  spaceRe.lastIndex = 0;
  while ((m = spaceRe.exec(src))) {
    const neg = m[1] === "-" ? "-" : "";
    const prefix = m[2];
    const val = m[3];
    let px;
    if (val.startsWith("[")) px = val.slice(1, -1);
    else {
      const p = stepToPx(val);
      px = p == null ? "?" : `${neg}${p}px`;
    }
    bump(spacing, `${neg}${prefix}-${val}  →  ${px}`, f);
  }

  radiusRe.lastIndex = 0;
  while ((m = radiusRe.exec(src))) {
    const side = m[1] || "";
    const size = m[2] || "-(base)";
    bump(radius, `rounded${side}${size}`, f);
  }

  hexRe.lastIndex = 0;
  while ((m = hexRe.exec(src))) bump(hexColors, m[0].toLowerCase(), f);
  rgbRe.lastIndex = 0;
  while ((m = rgbRe.exec(src))) bump(rgbColors, m[0].replace(/\s+/g, " "), f);

  paletteRe.lastIndex = 0;
  while ((m = paletteRe.exec(src))) bump(paletteColors, m[0], f);
  semanticRe.lastIndex = 0;
  while ((m = semanticRe.exec(src))) bump(semanticClasses, m[0], f);

  heightRe.lastIndex = 0;
  while ((m = heightRe.exec(src))) bump(heights, `${m[1]}-${m[2]}`, f);

  shadowRe.lastIndex = 0;
  while ((m = shadowRe.exec(src))) bump(shadows, m[0], f);
}

// ---------------------------------------------------------------- scan css
for (const file of cssFiles) {
  const src = readFileSync(file, "utf8");
  const f = rel(file);
  let m;
  cssFontRe.lastIndex = 0;
  while ((m = cssFontRe.exec(src)))
    bump(fontSizes, `css font-size: ${m[1].trim()}`, f);
  cssRadiusRe.lastIndex = 0;
  while ((m = cssRadiusRe.exec(src)))
    bump(radius, `css border-radius: ${m[1].trim()}`, f);
  hexRe.lastIndex = 0;
  while ((m = hexRe.exec(src))) bump(hexColors, m[0].toLowerCase(), f);
  rgbRe.lastIndex = 0;
  while ((m = rgbRe.exec(src))) bump(rgbColors, m[0].replace(/\s+/g, " "), f);
  cssVarRe.lastIndex = 0;
  while ((m = cssVarRe.exec(src))) bump(varRefsCss, `var(${m[1]})`, f);
}

// ---------------------------------------------------------------- top offenders
// "hardcoded severity" = hex + rgb + raw palette + arbitrary spacing/font/radius
const arbitraryOf = (agg) =>
  [...agg.entries()].filter(([k]) => k.includes("[")).reduce((s, [, e]) => s + e.count, 0);
const offenderScore = new Map();
function addOffenders(agg, filterFn = () => true) {
  for (const [, e] of agg) {
    for (const [f, c] of e.files) {
      // filterFn applies at entry level via closure; here just accumulate
      offenderScore.set(f, (offenderScore.get(f) || 0) + c);
    }
  }
}
// only "hardcoded" style debt contributes to offender ranking
function addOffendersEntry(agg, keep) {
  for (const [k, e] of agg) {
    if (!keep(k)) continue;
    for (const [f, c] of e.files) offenderScore.set(f, (offenderScore.get(f) || 0) + c);
  }
}
addOffendersEntry(hexColors, () => true);
addOffendersEntry(rgbColors, () => true);
addOffendersEntry(paletteColors, () => true);
addOffendersEntry(fontSizes, (k) => k.includes("["));
addOffendersEntry(spacing, (k) => k.includes("["));
addOffendersEntry(radius, (k) => k.includes("["));
addOffendersEntry(heights, (k) => k.includes("["));
addOffendersEntry(shadows, (k) => k.includes("["));
const topOffenders = [...offenderScore.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);

// ---------------------------------------------------------------- output
if (process.argv.includes("--json")) {
  const dump = (agg) =>
    sortedByCount(agg).map(([k, e]) => ({ value: k, count: e.count, files: topFiles(e, 5) }));
  console.log(
    JSON.stringify(
      {
        scanned: { tsx: tsxFiles.length, css: cssFiles.length },
        fontSizes: dump(fontSizes),
        spacing: dump(spacing),
        radius: dump(radius),
        hexColors: dump(hexColors),
        rgbColors: dump(rgbColors),
        paletteColors: dump(paletteColors),
        semanticClasses: dump(semanticClasses),
        varRefsCss: dump(varRefsCss),
        heights: dump(heights),
        shadows: dump(shadows),
        topOffenders,
      },
      null,
      2
    )
  );
  process.exit(0);
}

function section(title, agg, { topN = 100 } = {}) {
  const rows = sortedByCount(agg);
  const distinct = rows.length;
  const total = rows.reduce((s, [, e]) => s + e.count, 0);
  console.log(`\n## ${title}  —  ${distinct} distinct, ${total} occurrences`);
  for (const [k, e] of rows.slice(0, topN)) {
    console.log(`  ${String(e.count).padStart(4)}  ${k}`);
    console.log(`        ${topFiles(e).join(" · ")}`);
  }
}

console.log(`Scanned ${tsxFiles.length} .tsx + ${cssFiles.length} .css files`);
console.log(`(root: ${ROOT})`);
section("Font sizes", fontSizes);
section("Spacing", spacing);
section("Radius", radius);
section("Hardcoded hex colors", hexColors);
section("rgb()/rgba() colors", rgbColors);
section("Raw Tailwind palette refs", paletteColors);
section("Semantic/token color classes", semanticClasses);
section("CSS var() refs", varRefsCss);
section("Heights", heights);
section("Shadows", shadows);

console.log(`\n## Top offenders (hardcoded hex/rgb/palette + arbitrary [..] values)`);
for (const [f, c] of topOffenders) console.log(`  ${String(c).padStart(4)}  ${f}`);

// quick summary line for spacing >=24px component padding candidates
const bigPad = sortedByCount(spacing).filter(([k]) => {
  const mm = k.match(/→\s*(-?\d+)px/);
  const isPad = /^p[xytblrse]?-/.test(k);
  return isPad && mm && Math.abs(parseInt(mm[1], 10)) >= 24;
});
console.log(`\n## Padding >=24px (convergence targets)  —  ${bigPad.length} distinct`);
for (const [k, e] of bigPad) console.log(`  ${String(e.count).padStart(4)}  ${k}   ${topFiles(e,3).join(" · ")}`);
