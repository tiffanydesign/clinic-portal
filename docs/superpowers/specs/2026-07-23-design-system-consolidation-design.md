# Design System 收口 + 核心组件标准化 + /design-system 活页面

> Spec + phase plan. Source of truth across a large multi-phase build.
> Date: 2026-07-23. User approved full autonomous execution — no per-phase
> check-in required this time; verify correctness (transform/tsc/token-check/
> dist-grep) at each boundary but proceed continuously through all phases.

## Confirmed decisions (from brainstorming Q&A)
1. **Font**: `--font-sans`/`--font-serif`/`--font-mono` in theme.css stay
   `"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif`
   (self-hosted, chosen so Windows — this user's own OS — never silently
   falls back to Arial). NOT changed to the task's literal
   `Helvetica Neue/Inter/-apple-system` string. Instead, the
   /design-system Typography section displays that string as the **design
   intent / spec label**, with an English comment explaining the actual
   token differs and why (Windows lacks Helvetica Neue; self-hosted
   TeX Gyre Heros is the metric-compatible substitute so every OS renders
   the same face instead of silently falling back to a system default).
2. **Official build**: additive `build:official` npm script setting
   `VITE_DEMO_BUILD=false`. Plain `npm run build` is UNCHANGED (stays
   demo-ON, zero risk to the existing gh-pages deploy flow).
3. **Component architecture**: repurpose the currently-unused vendored
   `components/ui/{input,textarea,button}.tsx` (0 real consumers,
   confirmed via grep) in place as the canonical spec-compliant
   implementations. Build NEW `components/ui/modal.tsx` and rewrite
   `components/ui/drawer.tsx` (also 0 consumers) to match this app's own
   proven hand-rolled overlay pattern (`fixed inset-0 bg-surface-sunken/30
   backdrop-blur-sm`, used across 26 existing files) rather than adopting
   the dormant Radix-based vendored dialog/drawer/sheet.
4. **Identity colors**: no brand reference image was provided. Generate 8
   reasonable, low-saturation, mutually-distinguishable placeholder colors
   (none overlapping any --status-* hex), commented as first-pass /
   easily swappable for a real brand swatch later.
5. **Select**: no new Select component — FilterSelect (already the
   de-facto shared dropdown across the whole app) is referenced, not
   redefined, per the task's own "reference not redefine" instruction.

## Current-state facts (from research fork)
- `IS_DEMO_BUILD` (`src/app/config/buildMode.ts`) + `DemoControlsPill`
  already exist — extend, don't invent. Gate point: `AppShell.tsx:348`.
- No existing route in this app is actually tree-shaken (`/site-map` is
  merely nav-hidden, still fully bundled) — the lazy+conditional Route
  pattern for /demo/design-system is new to this codebase; verify via
  `VITE_DEMO_BUILD=false npm run build:official` + grep dist/.
- theme.css's FROZEN COMPACT TOKENS section + its own "USAGE LAW" header
  comment already state the 4 rules this task is consolidating — this is
  tightening/documenting an existing law, not inventing a new one.
- `--status-warning-ink` is already #8F4E05 (already darker than the
  task's requested #B45309) — no hex change needed, just a stronger
  "one colour one meaning" comment block.
- check-tokens.sh has 4 rule classes (hex, arbitrary text/padding size,
  padding-step ban) and NO gradient-detection rule yet — additive 5th
  rule, same `grep -rnoE` pattern as the existing 4.
- Legacy inventory (for the "list, don't migrate" requirement): ~26 files
  with hand-rolled modal shells, ~10 files with raw `<input>` elements —
  becomes a static list on the /design-system page itself.
- Shared components to REFERENCE not redefine: `FilterSelect.tsx`,
  `components/stat/*` (Stat family), `StatusPill` (dashboard/DashboardShared.tsx),
  `JourneyProgress*` (dashboard/journey/JourneyProgress.tsx).

## Phase plan
- **P1 Infrastructure**: theme.css token consolidation (gradient
  restriction comment, identity-1..8 placeholder tokens, strengthened
  status-color comment block), `build:official` script, IS_DEMO_BUILD-
  gated lazy `/demo/design-system` route, DemoControlsPill third entry,
  check-tokens.sh gradient rule. Verify: 2-click reachability in demo
  build; `build:official` dist/ has zero "design-system"/"DesignSystemPage"
  string matches.
- **P2 Standardized components**: rewrite `components/ui/input.tsx`,
  `textarea.tsx`, `button.tsx` in place; new `components/ui/modal.tsx`;
  rewrite `components/ui/drawer.tsx`.
- **P3 Page — Colors/Typography/Spacing/Radius/Shadow** sections.
- **P4 Page — Controls** section (all new components × all states +
  semi-transparent hit-area overlay proving ≥44pt).
- **P5 Page — Cards & composites** (KPI 4-tier, StatusPill all semantics,
  JourneyProgress 3-tier, clickable Modal/Drawer instances, table row
  heights) + legacy inventory list + full acceptance pass (check-tokens
  regression count, dist grep, visual click-through).

## Constraints
No hardcoded hex/arbitrary Tailwind values anywhere in new code — every
value on the page renders from an actual token or an actual shared
component, never a copied literal. ≥44pt hit areas via `.touch-extend`.
File sizes follow the project's 200-400 line convention (page split into
per-section files under `src/app/pages/demo/design-system/`).

## Acceptance (from task, both prompts combined)
1. /design-system fully real-rendered; changing a token changes the page.
2. Site-wide font-family has one source (--font-sans) — confirmed
   unchanged/consolidated per decision #1 above, not switched.
3. Business UI has zero gradients (check-tokens rule enforces).
4. Input/Button/Modal/Drawer: one implementation each; legacy list
   documented (not migrated).
5. All interactive demos visualize ≥44pt hit area.
6. `npm run check:tokens` violation count does not increase.
7. Demo Controls → 2 clicks → design-system page; not in any sidebar.
8. Official build (`build:official`) ships zero design-system code
   (grep-verified on dist/ output).
