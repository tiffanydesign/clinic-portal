---
name: Phenome Portal
description: Staff-facing clinical operations console for a premium Istanbul longevity clinic — restrained, semantic, iPad-first.
colors:
  phenome-blue-900: "#0A1E57"
  phenome-blue-700: "#142B6E"
  phenome-blue-500: "#203A85"
  phenome-blue-400: "#435BA1"
  phenome-blue-300: "#7185BD"
  phenome-blue-200: "#A9B5D9"
  phenome-blue-100: "#E6E9F2"
  status-success: "#70D332"
  status-success-ink: "#417e1b"
  status-success-fill: "#509b21"
  status-warning: "#FFB600"
  status-warning-ink: "#8f6600"
  status-warning-fill: "#b27f00"
  status-danger: "#FF4B2B"
  status-danger-ink: "#db2100"
  status-danger-fill: "#ff3c1a"
  status-info: "#508CFC"
  status-info-ink: "#045afb"
  status-info-fill: "#1d6bfb"
  status-special: "#3366FF"
  status-special-ink: "#0040ff"
  status-special-fill: "#1a53ff"
  ink: "#10214B"
  ink-soft: "#4A5578"
  ink-muted: "#646B80"
  surface-page: "#F4F6FB"
  surface-card: "#FFFFFF"
  surface-hover: "#EEF1F8"
  surface-sunken: "#E7EBF3"
  divider: "rgba(32, 58, 133, 0.08)"
  border-strong: "rgba(32, 58, 133, 0.16)"
  grid-line: "rgba(32, 58, 133, 0.05)"
  identity-1: "#6B8CBE"
  identity-2: "#C98A9A"
  identity-3: "#7FA98E"
  identity-4: "#C9A56B"
  identity-5: "#9B87B5"
  identity-6: "#6BB0AE"
  identity-7: "#B58A6B"
  identity-8: "#8E97B5"
typography:
  page-title:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  section:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  data:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
  overline:
    fontFamily: "TeX Gyre Heros, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  chip: "8px"
  control: "10px"
  card: "12px"
  dialog: "16px"
  full: "9999px"
spacing:
  "0": "0px"
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "32px"
  "8": "40px"
  "9": "48px"
components:
  button-primary:
    backgroundColor: "{colors.phenome-blue-500}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.phenome-blue-400}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
  button-destructive:
    backgroundColor: "{colors.status-danger-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.card}"
  dialog:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.dialog}"
    width: "480px"
  drawer:
    backgroundColor: "{colors.surface-card}"
    width: "400px"
---

# Design System: Phenome Portal

## Overview

**Creative North Star: "Premium Is Restraint"** — the phrase is not a slogan chosen for this document; it is copied verbatim from the product's own design principle, and every visual decision in the codebase traces back to it.

Phenome Portal is a clinical operations console, not a marketing surface: four roles (Receptionist, Nurse, Clinician, Admin) read it standing up, on a shared iPad, between patients, under time pressure. Its aesthetic answer to that brief is a flat, quiet, navy-and-white instrument that spends color like a scarce resource — status hues (green/amber/red/blue/deep-blue) are the only saturated color in the entire product, and each one carries exactly one meaning everywhere it appears. Everything else — text, surfaces, borders, dividers — lives in a single tinted-navy neutral family (`#10214B`-based grays and near-whites), which is what gives the product its "expensive, calm" read rather than "generic gray admin template."

The system converged through several dated revision passes (v2 → v3 → v4, all documented inline in `src/styles/theme.css`) that repeatedly *tightened* rather than *decorated*: spacing scales collapsed from 192 ad-hoc values to a 10-step scale, radii from 24 values to 4 tiers, shadows from 22 to a graduated 9-step navy-tinted ramp, row heights from scattered values to two named tiers. That convergence history is itself a design fact worth preserving: this is a system under active discipline, and any new work should extend the existing token vocabulary rather than reintroduce a one-off value.

One notable gap between token *capability* and actual *usage*: the codebase defines a "Frosted Premium" glass/gradient layer (`--gradient-brand`, `--gradient-vitality`, `.frosted-shell`, `.frosted-card`, `GlassButton`, `GlassCard`) intended for the auth/marketing shell, but **none of it is currently rendered anywhere in the live prototype** — the actual Login page uses its own simpler, ad-hoc glass treatment instead (see Do's and Don'ts). Treat the frosted/gradient layer as dormant, not canonical, until a surface actually adopts it.

**Key Characteristics:**
- Flat by default: cards and rows carry no shadow at rest; elevation is spent only on things that float above content (popovers, dropdowns, dialogs, drawers).
- One hue, one meaning: green/amber/red/blue/deep-blue are status-exclusive; an eight-color low-saturation "identity" palette exists separately to mark *who* (calendar ownership, avatars) and must never be read as status.
- Two-tier row rhythm: every list distinguishes actionable rows (44px) from read-only rows (40px) — never a third height.
- Sentence case everywhere: the product retired all-caps tracked-out labels; hierarchy comes from size + weight + muted color, not shouting.
- One typeface: TeX Gyre Heros (a libre Helvetica clone), so Windows, macOS, and iPadOS all render identically.

## Colors

The palette is almost entirely desaturated navy-on-white, with saturated color reserved for five fixed status meanings. Naming below follows the product's own in-code convention (functional labels — "Phenome Blue 500", "Danger" — not invented poetic names), because that plain-spoken naming is itself part of the restrained character this system is built around.

### Primary
- **Phenome Blue 500** (`#203A85`): the primary button's resting fill — deliberately the ramp's more muted, less saturated step.
- **Phenome Blue 400** (`#435BA1`): the primary button's hover fill, the ramp's most saturated step — hovering visibly "wakes the button up" rather than darkening it. Also the wash behind every page-title icon chip (`PageTitleIcon`) and the KPI-tile brand-blue tint.
- **Phenome Blue 900 / 700 / 300 / 200 / 100** (`#0A1E57` / `#142B6E` / `#7185BD` / `#A9B5D9` / `#E6E9F2`): ramp steps; 900 anchors auth-hero text, the paler steps are reserved for tints and are not yet load-bearing anywhere observed.

### Semantic status (one colour, one meaning — never reused for anything else)
- **Success** (`#70D332` fill / `#417e1b` ink / `#509b21` icon-fill): a positive, cleared outcome only (checked in, resolved, completed).
- **Warning** (`#FFB600` fill / `#8f6600` ink / `#b27f00` icon-fill): needs attention soon, not yet urgent (in review, arrived).
- **Danger** (`#FF4B2B` fill / `#db2100` ink / `#ff3c1a` icon-fill): strictly blocked, overdue, or "act now" (no-show, overdue SLA, flagged feedback, the calendar's now-line). Never decorative.
- **Info** (`#508CFC` fill / `#045afb` ink / `#1d6bfb` icon-fill): neutral "in progress / active now" (booked, selection highlight rings).
- **Special** (`#3366FF` fill / `#0040ff` ink / `#1a53ff` icon-fill): a distinct category marker — deliberately deeper/more saturated than Info so the two never get confused (e.g. staff leave requests, Nurse role badges).

**The Three-Tier Status Rule.** Every status hue ships three strengths, each with one legal use: the base tone (`bg-success` etc.) for dots, small fills and solid buttons; the `-ink` tone for text and badge labels, darkened until it clears 4.5:1 on white *and* on the page background; the `-fill` tone for icon-circle backgrounds and progress segments, tuned to clear the 3:1 non-text contrast floor without over-darkening. Using the base tone as text, or the `-ink` tone as a large fill, is a contrast bug, not a style choice.

### Neutral (text / surface / line)
- **Ink** (`#10214B`): headings, primary values, the one page-title text color.
- **Ink soft** (`#4A5578`): body copy, secondary labels.
- **Ink muted** (`#646B80`): captions, hints, IDs, timestamps, decorative icons — deliberately darkened from the raw `--identity`-adjacent gray (`#8B93AD`) that measured only 3.05:1 on white and failed the AA text floor.
- **Surface page** (`#F4F6FB`): the page background, a very faint blue-gray, never pure white.
- **Surface card** (`#FFFFFF`): every card, table, drawer, and dialog body — pure white, so clinical content always reads as "on paper," never seen through a tint.
- **Surface hover** (`#EEF1F8`): hover states and chip fills.
- **Surface sunken** (`#E7EBF3`): disabled fields, track wells, the selected-row tint in tables.
- **Divider** (`rgba(32,58,133,.08)`): the default border/rule color, tinted navy rather than flat gray.
- **Border strong** (`rgba(32,58,133,.16)`): emphasized borders (sticky-column shadow seams, focus-adjacent edges).
- **Grid line** (`rgba(32,58,133,.05)`), fainter than Divider on purpose: the calendar's internal hour hairlines, so the ruling recedes behind appointment blocks instead of competing with them.

### Identity (marks WHO, never WHAT state)
Eight low-saturation, mutually distinct hues (`#6B8CBE` soft indigo, `#C98A9A` soft rose, `#7FA98E` soft sage, `#C9A56B` soft ochre, `#9B87B5` soft mauve, `#6BB0AE` soft teal, `#B58A6B` soft terracotta, `#8E97B5` soft slate) mark calendar-event ownership and avatar rings — a placeholder set pending the real brand swatch, but already engineered to share no hex with any status color.

**The Identity/Status Wall Rule.** A green identity swatch must never be read as "success," and a red one must never be read as "danger." If a future feature needs both a person's identity color and their appointment's status color on the same element, they must be visually separated (e.g. a colored dot for identity, a colored border for status) — never blended into one hue.

### Gradients (defined, currently dormant)
`--gradient-brand` (`linear-gradient(135deg, #30B0CD 0%, #2394CC 48%, #2E74B2 100%)`) and `--gradient-vitality` are restricted by an enforced lint rule (`scripts/check-tokens.sh`) to the auth/brand/marketing shell only — never data or operational UI. As of this audit, **no live page actually renders either gradient**; they exist as reserved tokens, not an active pattern. Do not add a gradient to a dashboard, table, form, or button on the strength of these tokens existing — that would violate the rule they were written to enforce.

## Typography

**Body & Display Font:** TeX Gyre Heros (self-hosted; falls back to Helvetica Neue → Helvetica → Arial → sans-serif purely for load-time/availability, not as a second design choice). One face for the entire product — `font-sans`, `font-serif`, and `font-mono` all resolve to it, so no utility class can accidentally introduce a second typeface.

**Character:** Plain, dense, and unadorned — a working instrument's type, sized generously for arm's-length iPad reading rather than desk-distance density.

### Hierarchy
- **Page title** (600, 24px, 1.25 line-height): the one H1 per page, always plain ink color — paired with a brand-tinted icon chip (see Components → Navigation) that carries the only color at that level.
- **Section** (600, 16px, 1.3): card and block headings.
- **Body** (400, 16px, 1.4): prose, form values, primary reading text.
- **Data** (400, 14px, 1.35): table rows, list subrows, control text.
- **Label** (500, 13px, 1.2): form labels, minor captions.
- **Overline** (600, 12px, 1.2, normal tracking): small group headers, KPI titles, status-pill text.
- **Micro** (600, 11px, 1.15): reserved for exactly one surface — the calendar's dense-hour micro-pill stack, bumped to semibold because the self-hosted face reads soft/fuzzy under 12px at normal weight.
- **KPI numerals** (600, tabular-nums): 30px large tier, 22px compact-strip tier.

**The Sentence-Case Rule.** The product retired all-caps, letter-spaced micro-labels outright — `.uppercase` and `.tracking-wide/wider/widest` are neutralized globally in `theme.css` so legacy markup can't reintroduce shouting. Hierarchy is carried by size, weight, and muted color only. Do not hand-add `uppercase` or letter-spacing to a new label; it will be stripped and reads as a mistake if it isn't.

## Layout

iPad-first, 1366×1024pt landscape as the reference frame; no interaction assumes a mouse or hover. Fixed shell: a 248px sidebar, collapsible to icon-only, sits left of a single scrolling content column — pages themselves do not scroll internally except tables/lists that intentionally cap their own height.

Spacing rhythm (10-step scale, `--space-0` … `--space-9` = 0/4/8/12/16/20/24/32/40/48px) is governed by one hard rule: **component-internal padding stops at `--space-4` (16px)**, with a "large" card tier allowed `--space-5` (20px); `--space-6` (24px) and above is page-layout-only (section gaps, page gutters) and must never appear inside a card, row, or control. Page gutters are 16px horizontal/vertical; sidebar-to-content gap is 8px; section gaps default to 20px (24px for a rare larger break); card-to-card and grid gutters are 12px.

Every tappable element must resolve a real ≥44×44px hit area regardless of its visual size — controls visually shorter than that (36px secondary buttons, 40px inputs) get a centered invisible `.touch-extend` pseudo-element rather than growing the visible control. This is treated as non-negotiable, not a nice-to-have.

## Elevation & Depth

Two coexisting systems, both real. The *semantic* law (documented as "Elevation: 2 states" in `theme.css`) is that cards are flat at rest (`--shadow-none`) and gain a single raised shadow only for popovers and pressed states (`--shadow-raised`, `0 2px 8px rgba(16,33,75,.08)`). In practice, the app also draws on a fuller **graduated 9-step shadow ramp** (`--shadow-2xs` through `--shadow-2xl`), every step re-tinted to the brand's navy ink (`rgba(16,33,75, …)`) instead of Tailwind's default flat black, at low opacity with a single soft layer rather than a harsh double stack. Both are true simultaneously: the *rule* is "flat unless floating"; the *palette* used to render "floating" has more than two steps.

Observed tier assignments:
- **Flat / `shadow-sm`** — cards, table wrappers, the calendar widget shell, KPI strips. The near-invisible resting shadow (`0 2px 6px rgba(16,33,75,.06)`) is what makes a card read as "an object on the page" rather than a flat rectangle — deliberately the single biggest lever for perceived depth in the whole system.
- **`shadow-lg` / `shadow-xl`** — floating, click-anchored surfaces: the FilterSelect dropdown, FloatingPopover, the calendar's overflow popover.
- **`shadow-2xl`** — the app's heaviest tier, reserved for anything that blocks the page: Modal, Drawer, DiscardDialog.
- **Calendar appointment block** — an explicit *resting* (not hover-only) custom shadow, `0 1px 2px rgba(15,23,42,.06)`, called out in source as the reason a block reads as a physical object sitting on the grid rather than a tinted rectangle.

**The Rest-Is-Flat Rule.** Nothing gains a shadow purely to look "nicer" — every shadow on the page corresponds to a real z-order relationship (this thing sits above that thing). If a component doesn't float above other content, it should carry `shadow-sm` at most.

## Shapes

Four radius tiers, each tied to a role rather than a generic scale — do not pick a radius by "which one looks right," pick it by what kind of element it is:

- **`--radius-sm` (8px, `rounded-chip`)** — small controls: chips, small badges, pills that aren't fully round.
- **`--radius-md` (10px, `rounded-control`)** — buttons, inputs, selects, filter dropdowns: anything you click or type into.
- **`--radius-lg` (12px, `rounded-card`)** — cards, panels, page-title icon chips, floating popovers, dropdown menus.
- **`--radius-xl` (16px, `rounded-dialog`)** — the single most-elevated tier, reserved for Modal and DiscardDialog so a blocking surface always reads as *more* elevated than the cards behind it.
- **`rounded-full`** — pills, avatars, status dots; kept as a fifth, unscaled tier rather than folded into the numeric ramp.

**The Drawer Is Flush Rule.** The Drawer component intentionally carries **no radius at all** — it is right-anchored and flush against the viewport edge on three sides, so a rounded corner would float meaninglessly against the browser chrome. Its separation from the page comes entirely from `border-l` + `shadow-2xl`, not shape. Don't add a radius to a drawer edge that touches the viewport boundary.

## Components

### Buttons
- **Shape:** `rounded-control` (10px), height 36px (`--button-h`) for the default size, 36×36px square for icon-only.
- **Primary:** solid `Phenome Blue 500` fill, white text, no border, no gradient (gradients were removed from every operational button). Hover moves *up* to `Phenome Blue 400` — the ramp's most saturated step — rather than darkening, so hover reads as "waking up," not "dimming."
- **Secondary / Ghost / Destructive:** Secondary is a white-surface bordered button; Ghost drops the border entirely (transparent until hover); Destructive is a solid `danger-ink` fill with white text. Exactly four variants exist app-wide — a fifth ad-hoc button style at a call site is treated as a defect.
- **States:** Disabled swaps the fill for a flat neutral gray regardless of variant (never a dimmed version of the variant's own color — dimming still reads as "that action, fainter," not "unavailable"). Loading blocks clicks but keeps full color and swaps in a spinner instead of dimming, because "in progress" must never look like "unavailable."

### Inputs / Textarea / Select
- **Style:** label sits above the control (never inline/floating — chosen for narrow iPad-portrait columns and long localized labels), 13px/500 weight, 4px gap to the control. Control height 40px (`--control-h`), `rounded-control` (10px), 12px horizontal padding, white surface, 1px divider border.
- **Focus:** border shifts to `border-strong` plus a 2px `info/40` ring glow.
- **Error:** border and ring switch to `danger`/`danger/40`, with a `danger-ink` message line below the control.
- **Disabled:** `surface-sunken` fill, `ink-muted` text, `not-allowed` cursor.
- **Select:** a Radix-based `FilterSelect` skinned to match Input exactly (same height, radius, border) rather than the vendored shadcn Select defaults; opens a portal-rendered popover (`shadow-lg`, `rounded-card`) so it can never be clipped by a scrolling ancestor.

### Table
The vendored shadcn `<table>` primitive (`components/ui/table.tsx`) has **zero real consumers** — every actual data table (Patients, Staff, Billing) is a hand-built native `<table>` sharing one identical recipe:
- **Wrapper:** `bg-surface border border-divider rounded-card shadow-sm overflow-hidden` — the table always sits inside a distinctly framed card, never bare on the page background.
- **Header:** `bg-surface-page`, `sticky top-0`, separated from the body by a `border-strong`-colored 1px shadow seam rather than a plain border (reads crisper under sticky scroll).
- **Rows:** `divide-y divide-divider` between rows (no zebra striping); hover fills `surface-hover`; a selected row fills `surface-page`. First column(s) can be sticky-left (e.g. a select-all checkbox + patient identity cell) with the same border-strong shadow seam used on the sticky header, so scrolling never disconnects a row from its identity.
- **Cell padding:** 12px horizontal / 10px vertical, identical for header and body cells — denser than the table primitive's unused default.
- **Row height:** two tiers only — `--row-h` (44px) for actionable rows you click into, `--row-h-dense` (40px) for read-only rows. A third row height at a new call site is a violation, not a variant.
- **In-row status:** status pills render as `rounded-full`, bordered, tinted (`bg-{status}/10 text-{status}-ink border-{status}/30`) badges — never a bare colored word.
- **Sortable column headers:** a header that supports sorting adds `cursor-pointer hover:bg-surface-hover select-none` and a trailing `ArrowUpDown` icon (`w-3 h-3`, `text-ink-muted` at rest, `text-ink-soft` once that column is the active sort key) — click toggles ascending/descending on the same column, or resets to ascending on a new one. Only give a header this treatment if the column is genuinely re-sortable; a manually-reordered list (e.g. clinic-settings Rooms, which has its own drag handle) never gets one.
- **Pagination:** the shared `Pagination` component (`components/Pagination.tsx`) is the ONE footer for any list capped at `PAGE_SIZE` (20) rows — replacing the decorative, non-functional "Previous / 1 / Next" markup previously copy-pasted per page (Next had no handler, Previous was permanently disabled, and the row/total counts were often hardcoded strings disconnected from the real data length). It shows `Showing X–Y of N {items}`, prev/next chevrons, a windowed page-number strip (first, last, current ±1, "…" for gaps), and a direct "Go to page" number input — because clicking through many pages one at a time doesn't scale on an iPad. Apply it to any list whose real (not mock) row count plausibly exceeds 20 — Patients, Billing, Feedback, Timesheet's Daily view — not to inherently small, roster-bounded lists (Staff, Rooms, Devices) where pagination would be pure decoration.

### Calendar
The real calendar is the room/clinician schedule grid (`CalendarWidget`, `CalendarViews`), not the vendored `react-day-picker` primitive in `ui/calendar.tsx` (also a zero-consumer file).
- **Grid:** an hour-row timeline with alternating faint horizontal bands (`surface-hover/50` on odd hours) and hairline `grid-line` gridlines — deliberately fainter than the page's normal divider so appointment blocks read first.
- **Appointment blocks:** color comes from **status**, never identity — `bg-{status}/10` fill, `border-{status}/30`, `rounded-card`, plus the one resting (non-hover) custom shadow noted above so a block reads as an object on the grid. A small leading status dot (pulsing only for "In Clinic," the one truly-live state) replaces an older left-border-stripe convention.
- **Now line:** a 2px `danger`-colored line with a soft red glow (`shadow: 0 0 6px rgba(239,68,68,.35)`) and a solid `danger-ink` dot — the calendar's one deliberately loud element, because "what's happening right now" is the system's single most time-critical read.
- **Density fallback:** an hour that would exceed ~6 visible blocks collapses into a compact "micro-pill" stack (Apple Calendar-style: status dot + name only, 18px tall, same tonal colors as the full block but no shadow/radius), with a "+N" overflow trigger opening a `FloatingPopover` list.
- **Column headers:** room/clinician name plus a small brand-tinted count chip (`Phenome Blue 500` at 10% fill), sticky above the grid.

### Drawer
The canonical shared `Drawer` component (`components/ui/drawer.tsx`) defines two width tiers only — 400px (`sm`) and 560px (`lg`) — right-anchored, sliding in over 200ms, backed by a flat `rgba(16,33,75,.35)` scrim (no blur), with a `border-l + shadow-2xl` edge and **no corner radius** (see Shapes). Header/body/footer follow the same contract as Modal: a `surface-page`-tinted header bar with title + close button, a scrollable body (20px padding), an optional right-aligned footer action row.

**Resolved drift (2026-07-27):** the Feedback detail drawer and the Appointment drawer both hand-roll their own markup outside the shared component (their header/footer contracts differ enough — inline badges, a fixed action bar, role-specific footers — that folding them into `<Drawer>` remains a real consolidation task, not done here). Their **widths** were previously ad-hoc (420px / 500px); both are now snapped to the canonical `lg` (560px) tier — the tier every other real `<Drawer>` consumer in the app already uses (Room/Device settings drawers, Version History). A future pass should still migrate their markup onto the shared `Drawer` component itself.

### Dialog
Internally called **Modal**, not Dialog — the vendored Radix `ui/dialog.tsx` has zero consumers, exactly like `ui/table.tsx`. The real `Modal` component (`components/ui/modal.tsx`) has two size tiers: `confirm` (480px) and `form` (640px), centered, `rounded-dialog` (16px), `shadow-2xl`, a flat `rgba(16,33,75,.35)` scrim (no blur), fixed 16px body padding regardless of size tier (never 24px+, per the frozen-token law), and a `surface-page`-tinted header/footer matching Drawer's contract exactly — the two are deliberately one visual family with different geometry (centered box vs. right-anchored panel).

**Resolved drift (2026-07-27):** the smaller purpose-built `DiscardDialog` (an unsaved-changes guard) still does not use the shared `Modal` component, but its scrim previously diverged — `bg-surface-sunken/40` with `backdrop-blur-sm` — from Modal's flat, unblurred navy scrim. It now uses the same flat `rgba(16,33,75,.35)` (no blur) as every other overlay. It otherwise already followed the confirm-dialog convention correctly: an icon in a tinted round chip beside the title/message, and right-aligned footer buttons ordered secondary-then-primary/destructive (`Keep editing` / `Discard`).

### Navigation
Sidebar rows use no brand color for the active state — active is `surface-hover` fill + `ink` text, inactive is `ink-soft` + hover-only `surface-hover`. The only place brand blue appears at the navigation layer is the page-title icon chip (`Phenome Blue 500` at 10% fill, matching the sidebar icon for that same route) — identity color is spent once per page, at the title, not repeated down the nav rail.

### Iconography
Lucide React is the sole icon set. Sizes follow a small fixed scale keyed to context, not a free choice: `w-3` (12px) for inline history/timeline dots-and-flags, `w-3.5` (14px) for dense list/card metadata icons, `w-4` (16px) as the default — the single most common size, used in buttons, form fields, and drawer headers, `w-5` (20px) for page-title icon chips. A separate, smaller scale marks status dots (`w-1.5`/`w-2`, filled circles, not icons). Color follows the same status law as everything else: the large majority of icons are neutral `ink-muted` (decorative/utility — search, close, chevrons), and an icon only takes a status/semantic color (`danger-ink`, `warning-ink`, `special-ink`) when it is itself conveying that meaning (a flagged-feedback flag, an overdue alert, a leave-request marker) — never for decoration.

## Do's and Don'ts

### Do:
- **Do** treat status color (success/warning/danger/info/special) as reserved vocabulary — one hue, one meaning, everywhere it appears.
- **Do** cap component-internal padding at `--space-4` (16px); reach for `--space-6` (24px)+ only at the page-layout level.
- **Do** give every tappable element a real ≥44×44px hit area via `.touch-extend`, even when its visual box is 36px or 40px.
- **Do** use the two named row heights (44px actionable / 40px read-only) for any new list or table — never a third.
- **Do** keep Modal and Drawer visually one family (same header/footer contract, same flat unblurred scrim, same `shadow-2xl`) — they differ only in geometry (centered vs. right-anchored) and radius (16px vs. flush).
- **Do** use the shared `Button`, `Input`, `Textarea`, `Modal`, `Drawer`, and `FilterSelect` components for any new UI — they are each the one implementation for their category, not a starting point to fork.

### Don't:
- **Don't** reuse a status hue for anything other than its one assigned meaning, and never mix it with an identity color (person marker) on the same element.
- **Don't** add a shadow to a resting card or row "to make it pop" — elevation is reserved for things that genuinely float above other content (popovers, dropdowns, Modal, Drawer).
- **Don't** add a corner radius to the Drawer's viewport-touching edge — it is deliberately flush.
- **Don't** add `uppercase` or letter-spacing to a new label — the sentence-case rule strips it globally, and hand-adding it back reads as a mistake.
- **Don't** introduce a new drawer width or a divergent dialog scrim treatment — snap to the shared `Drawer`/`Modal` components' existing tiers, as the Feedback/Appointment drawers and DiscardDialog now do, and migrate their markup onto the shared components when touching them next.
- **Don't** reach for the `--gradient-brand`/`--gradient-vitality` tokens or the `.frosted-*`/`Glass*` component set on a whim — they are currently dormant (zero live consumers) and restricted by lint rule to a not-yet-built auth/marketing surface, not general decoration.
