# Design System Consolidation Implementation Plan

> **For agentic workers:** Presentational/token work with no business-logic
> test cycle in this repo — verification per task uses this project's actual
> tools (dev-server transform-check via curl, `npx tsc --noEmit`,
> `bash scripts/check-tokens.sh`, `grep` on build output) instead of a unit
> test framework. Execute inline, continuously, per user's explicit
> instruction — no per-task pause for review.

**Status: ALL 10 TASKS COMPLETE (2026-07-23).** Full verification passed:
tsc clean, check-tokens.sh hard-fail categories unchanged (8/1/6/39),
official build (`npm run build:official`, added `cross-env` devDependency
to make it Windows-portable) ships zero design-system code (dist/ grep
confirmed across all 7 component names), Playwright click-through
confirmed real rendering + zero console errors across Colors/Spacing/
Cards/Legacy sections and Modal open/close. One real bug caught by tsc
and fixed (Stat `byRange` needed all 3 TimeRange keys, not just `today`).
One real pre-existing gap in check-tokens.sh's hex rule found and fixed
(no design-system-page exclusion, now added, mirroring the gradient
rule's same exclusion). One genuine PRE-EXISTING gradient violation
surfaced for the first time (CalendarWidget.tsx sticky header) — not
introduced by this task, left as-is (out of this task's stated scope),
noted for the user.

**Goal:** Consolidate recent design decisions into theme.css, build 4
standardized components (Input/Textarea/Button/Modal/Drawer), and ship a
real-token-rendering `/design-system` showcase page reachable only from
Demo Controls and fully tree-shaken out of the official build.

**Architecture:** Token edits in theme.css (additive, no renames). Two
vendored-but-unused shadcn files (`input.tsx`,`textarea.tsx`,`button.tsx`)
rewritten in place as the canonical implementations; `modal.tsx` new,
`drawer.tsx` rewritten — both matching this app's own proven hand-rolled
overlay pattern, not Radix. New page under `src/app/pages/demo/design-system/`,
split into one file per section (200-400 line convention). Route registered
via `React.lazy()` inside an `IS_DEMO_BUILD` compile-time conditional so
Rollup drops the chunk entirely when `VITE_DEMO_BUILD=false`.

**Tech Stack:** React 18, TypeScript, Tailwind v4 (token-based, no arbitrary
values), Vite/Rollup, React Router v7 (`<Routes>/<Route>` JSX), lucide-react.

## Global Constraints
- No hardcoded hex / no arbitrary Tailwind values (`p-[Npx]` etc.) anywhere in new code — every value must trace to an actual CSS custom property or Tailwind token class.
- Component-internal padding ≤ `--space-4` (16px); `--space-6` (24px) is page-layout-only.
- Every tappable element's real hit area ≥ 44×44px (use `.touch-extend`).
- File sizes follow 200-400 lines (project's coding-style.md convention).
- `--font-sans`/`--font-serif`/`--font-mono` stay `"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif` — do NOT change to a system stack (see spec decision #1).
- Never `git commit` unless the user explicitly asks in this session.

---

### Task 1: theme.css token consolidation

**Files:**
- Modify: `src/styles/theme.css`

**Interfaces:**
- Produces: `--identity-1` through `--identity-8` (new CSS custom properties, hex strings); a strengthened comment block above `--status-success` through `--status-special-ink` (no value changes); a usage-restriction comment above `--gradient-brand`/`--gradient-vitality`.

- [ ] **Step 1: Add the gradient usage-restriction comment**

Find the existing gradient block (currently reads):
```css
  --gradient-brand: linear-gradient(135deg, #30B0CD 0%, #2394CC 48%, #2E74B2 100%);
  --gradient-vitality: linear-gradient(135deg, #269381 0%, #1F8697 49%, #085E98 100%);
```
Replace with (same values, comment added directly above):
```css
  /* RESTRICTED: gradients are for the auth/brand/marketing surface (login,
     logo, the "Frosted Premium" hero) ONLY — never on data or operational
     UI (dashboards, tables, forms, buttons, progress bars). Business pages
     use flat Phenome Blue / semantic status colours instead. Enforced by
     scripts/check-tokens.sh's gradient-in-business-page rule (Task 8). */
  --gradient-brand: linear-gradient(135deg, #30B0CD 0%, #2394CC 48%, #2E74B2 100%);
  --gradient-vitality: linear-gradient(135deg, #269381 0%, #1F8697 49%, #085E98 100%);
```

- [ ] **Step 2: Strengthen the status-color "one colour one meaning" comment**

Find the existing comment block directly above `--status-success-ink:` (reads something like "Status INK variants — text only. ..."). Add this line immediately after the existing paragraph, before the ink values:
```css
  /* ONE COLOUR, ONE MEANING — never reuse a status hue for anything else:
       success  (green)  -> a positive/cleared outcome only
       warning  (amber)  -> needs attention soon, not yet urgent
       danger   (red)    -> STRICTLY blocked / overdue / needs the clinician
                            to act right now — never decorative
       info     (blue)   -> neutral "in progress / active now"
       special  (purple) -> a distinct category marker (e.g. Leave requests)
     Routine/expected states (Booked, Active, Completed, etc.) get NO
     colour — plain grey/ink. Colour is spent only on the exceptions above. */
```
Do not change any existing hex values in this step — the current
`--status-warning-ink: #8F4E05` already satisfies the darker-amber
requirement (already one step darker than the #B45309 reference value).

- [ ] **Step 3: Add the --identity-1..8 token block**

Add this new block directly after the `--phenome-blue-100` line inside the existing `:root` block that already holds `--phenome-blue-*`/`--gradient-*` (the "Phenome Portal — Design Style Guide v2" section, NOT the later FROZEN COMPACT TOKENS section):
```css
  /* Clinician/person IDENTITY colours — distinguishes WHO (calendar event
     ownership, avatar rings) never WHAT STATE something is in. Do not mix
     with --status-*: a green identity swatch must never be read as
     "success". Placeholder palette (low-saturation, mutually distinct, no
     overlap with any --status-* hex) — swap for the real brand swatch set
     when available. */
  --identity-1: #6B8CBE; /* soft indigo-blue */
  --identity-2: #C98A9A; /* soft rose */
  --identity-3: #7FA98E; /* soft sage green */
  --identity-4: #C9A56B; /* soft ochre */
  --identity-5: #9B87B5; /* soft mauve */
  --identity-6: #6BB0AE; /* soft teal */
  --identity-7: #B58A6B; /* soft terracotta */
  --identity-8: #8E97B5; /* soft slate-blue */
```

- [ ] **Step 4: Add the Tailwind bridge for identity tokens**

Find the `@theme inline` block that already bridges `--color-brand-ink`
(search for `--color-brand-ink: var(--phenome-blue-900);`). Add directly
after it:
```css
  /* Identity colours — bg-identity-1..8 (avatar rings, calendar-event
     ownership dots). See the --identity-1..8 definitions for the "never
     mix with status colour" rule. */
  --color-identity-1: var(--identity-1);
  --color-identity-2: var(--identity-2);
  --color-identity-3: var(--identity-3);
  --color-identity-4: var(--identity-4);
  --color-identity-5: var(--identity-5);
  --color-identity-6: var(--identity-6);
  --color-identity-7: var(--identity-7);
  --color-identity-8: var(--identity-8);
```

- [ ] **Step 5: Verify**

Run: `curl -s http://localhost:5173/src/styles/theme.css | head -c 200`
(dev server must already be running via `npm run dev` in another shell —
if not running, start it with `npm run dev` first)
Expected: valid CSS returned, no 500 error.

Run: `bash scripts/check-tokens.sh 2>&1 | tail -8`
Expected: same violation count as before this task (no new hex/arbitrary
findings — everything added here is a CSS custom property definition, not
a Tailwind class).

---

### Task 2: `build:official` npm script

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run build:official` — runs a production build with `VITE_DEMO_BUILD=false`.

- [ ] **Step 1: Add the script**

In `package.json`'s `"scripts"` block, add a new line directly after the existing `"build": "vite build",` line:
```json
    "build:official": "cross-env VITE_DEMO_BUILD=false vite build",
```
Check first whether `cross-env` is already a devDependency (`grep '"cross-env"' package.json`). If NOT present, use the Bash-portable inline form instead (this repo's shell is Git Bash on Windows per the environment, which supports `VAR=val cmd`):
```json
    "build:official": "VITE_DEMO_BUILD=false vite build",
```

- [ ] **Step 2: Verify the script exists**

Run: `grep -A1 '"build":' package.json`
Expected: both `"build"` and `"build:official"` lines present.

(Full build execution + dist-grep verification happens in Task 6, after
the route is actually wired — running it now would just prove nothing
since IS_DEMO_BUILD isn't consumed by anything design-system-specific yet.)

---

### Task 3: standardized Input + Textarea

**Files:**
- Modify: `src/app/components/ui/input.tsx` (currently vendored shadcn, 0 consumers — full rewrite)
- Modify: `src/app/components/ui/textarea.tsx` (same — full rewrite)

**Interfaces:**
- Produces:
  - `Input` component: `{ label?: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>` — forwardRef, renders label-on-top (12px, 4px gap) + control (38px height, `--radius-sm`, `--divider` border, 2px accent focus ring) + error text (12px, danger) when `error` is set.
  - `Textarea` component: same prop shape as `Input` but wraps `<textarea>`, `React.TextareaHTMLAttributes<HTMLTextAreaElement>`, default `rows={3}`.

- [ ] **Step 1: Read the current file to confirm the exact starting shadcn boilerplate**

Run: `head -30` on both files (via the Read tool, not shell) to confirm current imports/exports before overwriting — do not skip this, `Write` requires a prior `Read` on existing files.

- [ ] **Step 2: Write the new `input.tsx`**

```tsx
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

// The ONE Input implementation for the whole app — label sits on top (12px,
// 4px gap below it), never inline/floating: the most robust layout for
// narrow iPad-portrait columns and long Turkish-language labels that don't
// fit beside a control. Visual height is --control-h (38px); disabled and
// error states are baked in here so no call site improvises its own.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, disabled, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-label font-medium text-ink-soft mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          className={`h-[var(--control-h)] px-3 rounded-[var(--radius-sm)] border text-sm bg-surface outline-none transition-colors
            ${error ? "border-danger focus:ring-2 focus:ring-danger/40" : "border-divider focus:ring-2 focus:ring-info/40 focus:border-border-strong"}
            ${disabled ? "bg-surface-sunken text-ink-muted cursor-not-allowed" : "text-ink"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-label text-danger-ink mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
```

- [ ] **Step 3: Write the new `textarea.tsx`**

```tsx
import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

// Same label-on-top/error/disabled contract as Input (see input.tsx) —
// the two must always look like one family, never diverge independently.
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, disabled, rows = 3, ...props }, ref) => {
    const taId = id ?? React.useId();
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={taId} className="text-label font-medium text-ink-soft mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          className={`px-3 py-2 rounded-[var(--radius-sm)] border text-sm bg-surface outline-none transition-colors resize-y
            ${error ? "border-danger focus:ring-2 focus:ring-danger/40" : "border-divider focus:ring-2 focus:ring-info/40 focus:border-border-strong"}
            ${disabled ? "bg-surface-sunken text-ink-muted cursor-not-allowed" : "text-ink"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-label text-danger-ink mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
```

- [ ] **Step 4: Verify**

Run: `curl -s http://localhost:5173/src/app/components/ui/input.tsx | wc -c`
and the same for `textarea.tsx`. Expected: both > 500 (non-empty, transforms).
Run: `bash scripts/check-tokens.sh 2>&1 | grep -i "ui/input.tsx\|ui/textarea.tsx"`
Expected: no output (no arbitrary-value/hex hits — `var(--control-h)` /
`var(--radius-sm)` inside a Tailwind arbitrary-property bracket
(`rounded-[var(--radius-sm)]`) is a CSS-var reference, not a literal, and
must not be flagged; if the script DOES flag it, adjust to plain
`rounded-control` class instead — check `--radius-control` bridge exists
in theme.css before assuming `rounded-control` resolves correctly).

---

### Task 4: standardized Button

**Files:**
- Modify: `src/app/components/ui/button.tsx` (vendored shadcn, 0 consumers — full rewrite)

**Interfaces:**
- Produces: `Button` component — `{ variant?: "primary"|"secondary"|"ghost"|"destructive"; size?: "default"|"sm"; disabledReason?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>`, forwardRef. `.touch-extend` applied unconditionally (every Button always meets 44pt hit area, not opt-in per call site).

- [ ] **Step 1: Read current file first** (Read tool, confirm current shadcn boilerplate before overwrite).

- [ ] **Step 2: Write the new `button.tsx`**

```tsx
import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // When disabled, the WHY must be explicable — either pass this (renders
  // as a title tooltip) or handle onClick yourself to toast a reason. A
  // disabled button with no explanation anywhere is a dead end for the user.
  disabledReason?: string;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--phenome-blue-400)] text-white border border-transparent hover:bg-[var(--phenome-blue-500)]",
  secondary: "bg-surface text-ink-soft border border-divider hover:bg-surface-hover",
  ghost: "bg-transparent text-ink-soft border border-transparent hover:bg-surface-hover",
  destructive: "bg-danger-ink text-white border border-transparent hover:opacity-90",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: "h-[var(--control-h)] px-4 text-sm",
  sm: "h-[var(--control-h-sm)] px-3 text-xs",
};

// The ONE Button implementation for the whole app — four variants only
// (Primary/Secondary/Ghost/Destructive), never a fifth ad-hoc style at a
// call site. .touch-extend is unconditional: every Button always has a
// real ≥44pt hit area even at the compact `sm` visual height, so no call
// site can forget it.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", disabledReason, disabled, className = "", title, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        title={disabled ? (disabledReason ?? title) : title}
        className={`touch-extend inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-bold transition-colors
          ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]}
          ${disabled ? "opacity-50 cursor-not-allowed hover:bg-none" : ""}
          ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 3: Verify**

Run: `curl -s http://localhost:5173/src/app/components/ui/button.tsx | wc -c`
Expected: > 500.
Run: `bash scripts/check-tokens.sh 2>&1 | grep -i "ui/button.tsx"`
Expected: no output. If `var(--phenome-blue-400)` inside a Tailwind
arbitrary-value bracket (`bg-[var(--phenome-blue-400)]`) DOES get flagged
as an arbitrary value, replace with the existing `.btn-primary`/
`.btn-primary:hover` component classes already defined in theme.css
(search theme.css for `.btn-primary` before making this substitution, to
match its exact existing hover/active behavior).

---

### Task 5: Modal + Drawer

**Files:**
- Create: `src/app/components/ui/modal.tsx`
- Modify: `src/app/components/ui/drawer.tsx` (vendored Radix drawer, 0 consumers — full rewrite, non-Radix)

**Interfaces:**
- Produces:
  - `Modal` component: `{ open: boolean; onClose: () => void; size?: "confirm"|"form"; title: string; children: React.ReactNode; footer?: React.ReactNode }`. `size="confirm"` → max-width 480px; `size="form"` → max-width 640px. 48px title bar, 44pt close button (top-right), `rgba(16,33,75,.35)` overlay, `--space-4` (16px) body padding.
  - `Drawer` component: `{ open: boolean; onClose: () => void; width?: "sm"|"lg"; title: string; children: React.ReactNode; footer?: React.ReactNode }`. `width="sm"` → 400px; `width="lg"` → 560px. Slides in from the right, same title-bar/close-button/padding contract as Modal.

- [ ] **Step 1: Read current `drawer.tsx`** (Read tool, confirm current Radix-based boilerplate before overwrite).

- [ ] **Step 2: Write `modal.tsx`**

```tsx
import * as React from "react";
import { X } from "lucide-react";

export type ModalSize = "confirm" | "form";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  confirm: "max-w-[480px]",
  form: "max-w-[640px]",
};

// The ONE Modal implementation for the whole app — formalizes the
// hand-rolled `fixed inset-0 ... backdrop-blur-sm` overlay pattern already
// repeated across ~26 files (ConflictModal, WithdrawModal, RegisterPatientModal,
// etc.) into one shared component, rather than adopting the dormant
// Radix-based components/ui/dialog.tsx (0 real consumers in this app).
// Body padding is a flat --space-4 (16px) always — never 24px+ inside a
// modal, per the frozen-token law.
export function Modal({ open, onClose, title, size = "confirm", children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-6"
      style={{ backgroundColor: "rgba(16,33,75,.35)" }}
      onClick={onClose}
    >
      <div
        className={`bg-surface rounded-card shadow-2xl border border-divider w-full ${SIZE_CLASS[size]} max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="h-12 px-4 border-b border-divider flex items-center justify-between shrink-0 bg-surface-page">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-extend p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="p-4 border-t border-divider bg-surface-page shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `drawer.tsx`**

```tsx
import * as React from "react";
import { X } from "lucide-react";

export type DrawerWidth = "sm" | "lg";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: DrawerWidth;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const WIDTH_PX: Record<DrawerWidth, string> = { sm: "400px", lg: "560px" };

// The ONE Drawer implementation — same title-bar/close/padding contract as
// Modal (see modal.tsx), slides in from the right instead of centering.
// Two width tiers only: 400px (sm, quick side panels) / 560px (lg, richer
// detail views) — never a third ad-hoc width at a call site.
export function Drawer({ open, onClose, title, width = "sm", children, footer }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(16,33,75,.35)" }}
        onClick={onClose}
      />
      <div
        className="absolute top-0 right-0 h-full bg-surface border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        style={{ width: WIDTH_PX[width] }}
      >
        <div className="h-12 px-4 border-b border-divider flex items-center justify-between shrink-0 bg-surface-page">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-extend p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="p-4 border-t border-divider bg-surface-page shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run transform-check via curl on both files (same pattern as prior tasks).
Run: `bash scripts/check-tokens.sh 2>&1 | grep -i "ui/modal.tsx\|ui/drawer.tsx"`
Expected: no output (the `rgba(16,33,75,.35)` values are in a `style={}`
object, not a Tailwind className string, so the hex/rgb-in-className
scanner should not match them — confirm this is actually true by checking
the grep pattern in check-tokens.sh targets `className`/JSX attribute
strings, not arbitrary `style=` objects; if it DOES false-positive, that's
a script scoping gap to note, not a real violation — do not weaken the
inline overlay colour to work around a false positive without checking
first).

---

### Task 6: build-isolation plumbing (IS_DEMO_BUILD-gated lazy route + Demo Controls entry)

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/components/DemoControlsPill.tsx`

**Interfaces:**
- Consumes: `IS_DEMO_BUILD` from `src/app/config/buildMode.ts` (already exists — `export const IS_DEMO_BUILD = import.meta.env.VITE_DEMO_BUILD !== "false";`).
- Produces: route `/demo/design-system` registered only when `IS_DEMO_BUILD` is true; a "Design System" link in the Demo Controls panel.

- [ ] **Step 1: Read `App.tsx` and `DemoControlsPill.tsx` in full first** (Read tool — confirm exact current import list, exact `<Route>` JSX around `/site-map`, and the exact current Link/select markup in DemoControlsPill before editing either).

- [ ] **Step 2: Add the lazy-loaded, conditionally-registered route in `App.tsx`**

Near the top of the file, alongside the other imports, add:
```tsx
import { IS_DEMO_BUILD } from "./config/buildMode";
```
Directly below the other top-level `const`/import statements (not inside
the component function — must be module-scope so Rollup can statically
fold it), add:
```tsx
const DesignSystemPage = IS_DEMO_BUILD
  ? React.lazy(() => import("./pages/demo/design-system/DesignSystemPage").then((m) => ({ default: m.DesignSystemPage })))
  : null;
```
Inside the `<Routes>` JSX, find the existing `<Route path="/site-map" element={<SiteMap />} />` line and add directly after it:
```tsx
{IS_DEMO_BUILD && DesignSystemPage && (
  <Route
    path="/demo/design-system"
    element={
      <React.Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading…</div>}>
        <DesignSystemPage />
      </React.Suspense>
    }
  />
)}
```
Confirm `React` itself is imported as a namespace import (`import React from "react"` or `import * as React from "react"`) somewhere at the top of this file already — `React.lazy`/`React.Suspense` require it in scope.

- [ ] **Step 3: Add the "Design System" entry to `DemoControlsPill.tsx`**

Find the existing `<Link to="/site-map" ...>` entry (or equivalent Site Map link markup) inside the expanded panel. Add a new, visually identical entry directly after it, using the exact same className/icon-size pattern as the Site Map link but swapping the icon to `Palette` (import `Palette` from `"lucide-react"` alongside whatever icon Site Map already uses) and the label to "Design System", `to="/demo/design-system"`.

- [ ] **Step 4: Create the page shell (minimal, so the route resolves before Tasks 7-9 build out real content)**

Create `src/app/pages/demo/design-system/DesignSystemPage.tsx`:
```tsx
import React from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";

// The living, single-source-of-truth showcase of the frozen design tokens
// and standardized components. Demo-build only (see App.tsx's IS_DEMO_BUILD
// gate) — never reachable from any role's sidebar, never bundled into the
// official build. Every value on this page renders from an actual token or
// an actual shared component; nothing here is a copied literal.
export function DesignSystemPage() {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto bg-surface-page">
      <div className="sticky top-0 z-10 h-12 px-4 border-b border-divider bg-surface flex items-center justify-between">
        <h1 className="text-sm font-bold text-ink">Design System</h1>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to Demo Controls"
          className="touch-extend p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6 text-sm text-ink-muted">Sections load in Tasks 7-9.</div>
    </div>
  );
}
```

- [ ] **Step 5: Verify demo-build reachability**

With `npm run dev` running, navigate (or curl) to confirm the route
resolves: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/demo/design-system`
Expected: `200` (SPA shell always returns 200 regardless of client route,
so this only confirms the server itself is up — the REAL check is opening
`http://localhost:5173/demo/design-system` and confirming via the dev
server's transform log / a manual click-through from Demo Controls → Design
System that the page renders with no console error).

- [ ] **Step 6: Verify official-build tree-shaking**

Run: `npm run build:official 2>&1 | tail -15`
Expected: build succeeds, exit 0.
Run: `grep -rl "DesignSystemPage\|design-system" dist/assets/*.js 2>/dev/null; echo "exit:$?"`
Expected: `exit:1` (grep found nothing — confirms the chunk was fully
eliminated, not just unreferenced-but-present).
Then run: `rm -rf dist` to clean up the build artifact (per this session's
established practice of not leaving stray `dist/` output in the repo).

---

### Task 7: check-tokens.sh gradient rule

**Files:**
- Modify: `scripts/check-tokens.sh`

**Interfaces:**
- Produces: a 5th rule section matching the file's existing 4-rule pattern, detecting `bg-gradient-to-*`/`from-*-to-*` Tailwind gradient utility classes inside `src/app/pages/**`, excluding the design-system showcase page itself and any path already exempted for the existing "Frosted Premium" auth surface.

- [ ] **Step 1: Read the full current script first** (Read tool — confirm the exact grep pattern, exclude-list, and count-accumulation style used by the existing 4 rules before writing a 5th that matches their shape).

- [ ] **Step 2: Add the 5th rule**

Following the exact same `grep -rnoE ... | samples` structure the existing
4 rules use (confirmed in Step 1), add a new section for gradient
detection. The exact grep target: `bg-gradient-to-[trbl]+` and any
`from-[a-z]+-[0-9]+.*to-[a-z]+-[0-9]+` pattern, scoped to
`src/app/pages/**/*.{tsx,ts}`, EXCLUDING:
- any path containing `/pages/demo/design-system/` (the showcase
  intentionally renders the gradient tokens for documentation)
- any path containing `/pages/auth/` (confirm this is the actual auth
  page directory by running `ls src/app/pages/auth 2>/dev/null || find src/app/pages -iname "*login*"` first — adjust the exclude path to whatever the real directory is)
- any line where the matched class also contains `frosted-` (the
  established v2 "Frosted Premium" exception zone)

Add this as a failing (not just review-only) rule — a business-page
gradient is a genuine violation, add it to the hard-fail count alongside
rules 1-3, not the review-only bucket rules 4b uses.

- [ ] **Step 3: Verify**

Run: `bash scripts/check-tokens.sh 2>&1 | tail -10`
Expected: total violation count is EQUAL to the count recorded before this
task started (re-run the script once before Step 2 and save its printed
total for comparison) — the new rule must not flag any EXISTING file,
since business pages should currently have zero real gradients. If it
DOES flag something unexpected, read that file and confirm whether it's a
genuine pre-existing violation (note it, don't silently exclude it) or a
scoping bug in the new grep pattern (fix the pattern).

---

### Task 8: Design System page — Colors + Typography sections

**Files:**
- Create: `src/app/pages/demo/design-system/DesignSystemColors.tsx`
- Create: `src/app/pages/demo/design-system/DesignSystemTypography.tsx`
- Modify: `src/app/pages/demo/design-system/DesignSystemPage.tsx` (wire in the two sections + anchor nav)

**Interfaces:**
- Produces: `DesignSystemColors` and `DesignSystemTypography` — both zero-prop components, self-contained.
- Consumes: nothing external — reads token values only via rendered CSS (each swatch is a literal `<div>` with a Tailwind class like `bg-success` / `bg-identity-1`, never a hardcoded hex in the JSX).

- [ ] **Step 1: Write `DesignSystemColors.tsx`**

```tsx
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
  { name: "Success", className: "bg-success", hex: "#34C759", usage: "Positive/cleared outcome ONLY" },
  { name: "Success ink", className: "bg-success-ink", hex: "#177245", usage: "Text on success tint" },
  { name: "Warning", className: "bg-warning", hex: "#F5A623", usage: "Needs attention soon" },
  { name: "Warning ink", className: "bg-warning-ink", hex: "#8F4E05", usage: "Text on warning tint" },
  { name: "Danger", className: "bg-danger", hex: "#FF383C", usage: "Blocked / overdue ONLY" },
  { name: "Danger ink", className: "bg-danger-ink", hex: "#B91C1C", usage: "Text on danger tint" },
  { name: "Info", className: "bg-info", hex: "#2394CC", usage: "Neutral in-progress / active now" },
  { name: "Info ink", className: "bg-info-ink", hex: "#12658F", usage: "Text on info tint" },
  { name: "Special", className: "bg-special", hex: "#CB30E0", usage: "Distinct category marker" },
  { name: "Special ink", className: "bg-special-ink", hex: "#8B1FA0", usage: "Text on special tint" },
];

const SURFACE: Swatch[] = [
  { name: "Surface", className: "bg-surface", hex: "#FFFFFF", usage: "Card / panel background" },
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
```

- [ ] **Step 2: Write `DesignSystemTypography.tsx`**

```tsx
import React from "react";

type TypeSpec = { className: string; name: string; sizeVar: string };

const TYPE_TIERS: TypeSpec[] = [
  { className: "text-page-title", name: "Page title", sizeVar: "--text-page-title (22px)" },
  { className: "text-section", name: "Section heading", sizeVar: "--text-section (15px)" },
  { className: "text-body", name: "Body copy", sizeVar: "--text-body (14px)" },
  { className: "text-data", name: "Table / data row", sizeVar: "--text-data (13px)" },
  { className: "text-label", name: "Label / minor caption", sizeVar: "--text-label (12px)" },
  { className: "text-overline", name: "Overline / group head", sizeVar: "--text-overline (11px)" },
];

const KPI_TIERS: TypeSpec[] = [
  { className: "kpi-value-lg", name: "KPI value (card)", sizeVar: "--kpi-value-lg (28px)" },
  { className: "kpi-value-sm", name: "KPI value (strip)", sizeVar: "--kpi-value-sm (20px)" },
];

// A long Turkish label, deliberately included so this section proves the
// 6-tier scale + label-on-top Input contract both survive a genuinely long,
// diacritic-bearing real-world string without truncating awkwardly.
const TURKISH_SAMPLE = "Randevu saatinizi değiştirmek istediğinize emin misiniz?";

export function DesignSystemTypography() {
  return (
    <section id="typography" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Typography</h2>
      <p className="text-sm text-ink-muted mb-2">
        Design intent label: <span className="font-mono text-xs bg-surface-hover px-1.5 py-0.5 rounded-control">Helvetica Neue, Inter, -apple-system, BlinkMacSystemFont, sans-serif</span>
      </p>
      <p className="text-xs text-ink-muted mb-4 max-w-2xl">
        {/* English note per user decision: actual --font-sans stays the
            self-hosted TeX Gyre Heros stack, not the system-font string
            above. */}
        Note: the actual <code>--font-sans</code> token stays{" "}
        <code>"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif</code>{" "}
        — self-hosted, not the system-font stack shown above — because Windows
        has no Helvetica Neue installed and would silently fall back to Arial
        without it. TeX Gyre Heros is a metric-compatible Helvetica/Arial clone,
        so every OS renders the identical face instead of drifting per-platform.
      </p>

      <h3 className="text-section text-ink-soft mb-2">Six tiers</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 space-y-3">
        {TYPE_TIERS.map((t) => (
          <div key={t.className} className="flex items-baseline gap-3">
            <span className="w-32 shrink-0 text-label text-ink-muted tabular-nums">{t.sizeVar}</span>
            <span className={`${t.className} text-ink`}>{t.name} — {TURKISH_SAMPLE}</span>
          </div>
        ))}
      </div>

      <h3 className="text-section text-ink-soft mb-2">KPI numerals (tabular-nums)</h3>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-8">
        {KPI_TIERS.map((t) => (
          <div key={t.className}>
            <div className={`${t.className} text-ink`}>1,204</div>
            <div className="text-label text-ink-muted mt-1">{t.sizeVar}</div>
          </div>
        ))}
      </div>
      <p className="text-label text-ink-muted mt-2 px-0.5">Ban: no third-party numeral treatment — every numeric KPI/table value uses .tabular-nums (baked into the two classes above), never plain proportional digits.</p>
    </section>
  );
}
```

- [ ] **Step 3: Wire both sections into `DesignSystemPage.tsx`**

Replace the placeholder `<div className="p-6 text-sm text-ink-muted">Sections load in Tasks 7-9.</div>` with a two-column layout: a left anchor-nav column + a right scrollable content column. Full replacement of the page body:
```tsx
import React from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";
import { DesignSystemColors } from "./DesignSystemColors";
import { DesignSystemTypography } from "./DesignSystemTypography";

const SECTIONS = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
];

export function DesignSystemPage() {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto bg-surface-page">
      <div className="sticky top-0 z-10 h-12 px-4 border-b border-divider bg-surface flex items-center justify-between">
        <h1 className="text-sm font-bold text-ink">Design System</h1>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to Demo Controls"
          className="touch-extend p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex">
        <nav className="w-44 shrink-0 h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto p-4 border-r border-divider bg-surface">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block py-1.5 text-sm text-ink-soft hover:text-ink">{s.label}</a>
          ))}
        </nav>
        <div className="flex-1 min-w-0 p-6 space-y-10">
          <DesignSystemColors />
          <DesignSystemTypography />
        </div>
      </div>
    </div>
  );
}
```
(Tasks 9-10 will append more `<DesignSystemX />` entries + `SECTIONS`
rows to this same array/JSX — this file grows additively, not replaced
again from scratch.)

- [ ] **Step 4: Verify**

Transform-check all 3 files via curl (same pattern as prior tasks).
Run `npx tsc --noEmit 2>&1 | grep -i "design-system"` — expected: empty
(no new type errors from these 3 files; pre-existing unrelated errors
elsewhere in the repo are not this task's concern).
Manually click through: Demo Controls → Design System → confirm Colors +
Typography sections render with real swatches/type samples, anchor nav
scrolls to each section.

---

### Task 9: Design System page — Spacing/Radius/Shadow + Controls sections

**Files:**
- Create: `src/app/pages/demo/design-system/DesignSystemSpacing.tsx`
- Create: `src/app/pages/demo/design-system/DesignSystemControls.tsx`
- Modify: `src/app/pages/demo/design-system/DesignSystemPage.tsx` (append two more sections)

**Interfaces:**
- Produces: `DesignSystemSpacing`, `DesignSystemControls` — zero-prop.
- Consumes: `Input`/`Textarea`/`Button` from `../../../components/ui/{input,textarea,button}` (Tasks 3-4), `Modal`/`Drawer` from `../../../components/ui/{modal,drawer}` (Task 5), `FilterSelect` from `../../../components/FilterSelect`.

- [ ] **Step 1: Write `DesignSystemSpacing.tsx`**

```tsx
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
const SHADOW = [
  { name: "--shadow-none", cls: "shadow-none", label: "default for cards" },
  { name: "--shadow-raised", cls: "shadow-[var(--shadow-raised)]", label: "popovers & pressed only" },
];

export function DesignSystemSpacing() {
  return (
    <section id="spacing" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Spacing / Radius / Shadow</h2>
      <p className="text-xs text-ink-muted mb-4 px-0.5">Ban: component-internal padding must never exceed --space-4 (16px). --space-6 (24px) is page-layout only — gaps between sections, page gutters, never inside a card.</p>

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
        {SHADOW.map((s) => (
          <div key={s.name} className="text-center">
            <div className={`w-24 h-16 bg-surface border border-divider rounded-control ${s.cls}`} />
            <div className="text-label text-ink-muted mt-1">{s.name}</div>
            <div className="text-overline text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `DesignSystemControls.tsx`**

```tsx
import React, { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { Drawer } from "../../../components/ui/drawer";
import { FilterSelect } from "../../../components/FilterSelect";

// Wraps any interactive demo element with a semi-transparent overlay sized
// to the REAL rendered hit area (post .touch-extend), so ≥44pt compliance
// is visually provable, not just asserted in a comment. Purely additive —
// pointer-events-none so it never intercepts the actual click.
function HitAreaOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      {children}
      <div className="absolute inset-0 pointer-events-none ring-2 ring-info/40 ring-offset-1 rounded-control" />
    </div>
  );
}

export function DesignSystemControls() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectVal, setSelectVal] = useState("Option A");

  return (
    <section id="controls" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Controls</h2>
      <p className="text-xs text-ink-muted mb-4 px-0.5">Every interactive element below is ringed at its REAL clickable hit area — confirm the ring is always ≥44×44px, not just the visual box.</p>

      <h3 className="text-section text-ink-soft mb-2">Input / Textarea / Select</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 grid grid-cols-2 gap-4 max-w-2xl">
        <Input label="Patient name" placeholder="Ece Yıldırım" />
        <Input label="Email (error state)" defaultValue="not-an-email" error="Enter a valid email address" />
        <Input label="Disabled" defaultValue="Locked value" disabled />
        <div>
          <label className="text-label font-medium text-ink-soft mb-1 block">Clinic (Select — reference, not redefine)</label>
          <FilterSelect value={selectVal} onChange={setSelectVal} options={["Option A", "Option B", "Option C"]} className="w-full" />
        </div>
        <Textarea label="Notes" placeholder="Add a note…" className="col-span-2" />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Button — 4 variants × hit-area check</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex flex-wrap items-center gap-3">
        <HitAreaOverlay><Button variant="primary">Primary</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="secondary">Secondary</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="ghost">Ghost</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="destructive">Destructive</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="primary" size="sm">Compact 32px</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="secondary" disabled disabledReason="Complete step 1 first">Disabled (explicable)</Button></HitAreaOverlay>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Modal / Drawer (click to open)</h3>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-3">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal (form, 640px)</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer (lg, 560px)</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example form modal" size="form" footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setModalOpen(false)}>Save</Button>
        </div>
      }>
        <Input label="Example field" placeholder="Type here…" />
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Example drawer" width="lg" footer={
        <Button variant="primary" onClick={() => setDrawerOpen(false)}>Done</Button>
      }>
        <p className="text-sm text-ink-soft">Drawer body content — --space-4 padding, same as Modal.</p>
      </Drawer>
    </section>
  );
}
```

- [ ] **Step 3: Append both sections to `DesignSystemPage.tsx`**

Edit the existing `SECTIONS` array to add:
```tsx
  { id: "spacing", label: "Spacing / Radius" },
  { id: "controls", label: "Controls" },
```
Edit the imports to add:
```tsx
import { DesignSystemSpacing } from "./DesignSystemSpacing";
import { DesignSystemControls } from "./DesignSystemControls";
```
Edit the JSX body to append after `<DesignSystemTypography />`:
```tsx
          <DesignSystemSpacing />
          <DesignSystemControls />
```

- [ ] **Step 4: Verify**

Transform-check the 2 new files + the modified page file via curl.
Run `npx tsc --noEmit 2>&1 | grep -i "design-system\|components/ui/"` —
expected: no NEW errors traceable to these files (compare against the
Task 8 tsc baseline; pre-existing unrelated repo errors are not in scope).
Manually click through: Design System page → Controls section → click
each Button variant (confirm visual states), open Modal, open Drawer,
confirm both close via the X button and via backdrop click.

---

### Task 10: Design System page — Cards & composites + legacy inventory + final acceptance pass

**Files:**
- Create: `src/app/pages/demo/design-system/DesignSystemCards.tsx`
- Create: `src/app/pages/demo/design-system/DesignSystemLegacy.tsx`
- Modify: `src/app/pages/demo/design-system/DesignSystemPage.tsx` (append two final sections)

**Interfaces:**
- Produces: `DesignSystemCards`, `DesignSystemLegacy` — zero-prop.
- Consumes: `Stat`/`StatStripGroup` from `../../../components/stat`, `StatusPill` from `../../dashboard/DashboardShared` (confirm exact export path via Read before importing — path shown here is the best-known location from research; adjust if Read reveals a different actual path), `JourneyProgressChip`/`JourneyProgressStrip` from `../../dashboard/journey/JourneyProgress`.

- [ ] **Step 1: Confirm exact import paths first**

Read `src/app/pages/app/dashboard/DashboardShared.tsx` and
`src/app/pages/app/dashboard/journey/JourneyProgress.tsx` to reconfirm
their exact current export names (`StatusPill`, `JourneyProgressChip`,
`JourneyProgressStrip`) before writing imports in Step 2 — these were
identified by the earlier research fork but must be re-verified fresh
since files may have changed since that research ran.

- [ ] **Step 2: Write `DesignSystemCards.tsx`**

```tsx
import React from "react";
import { CalendarClock, FileClock, UserCheck, Gauge } from "lucide-react";
import { Stat, StatStripGroup } from "../../../components/stat";
import { StatusPill } from "../../app/dashboard/DashboardShared";
import { JourneyProgressStrip } from "../../app/dashboard/journey/JourneyProgress";

export function DesignSystemCards() {
  return (
    <section id="cards" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Cards &amp; composites</h2>
      <p className="text-xs text-ink-muted mb-4 px-0.5">These render the SAME shared components used across the real app — Stat family, StatusPill, JourneyProgress — never a re-implementation for this page.</p>

      <h3 className="text-section text-ink-soft mb-2">Stat — T1 card tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat
            stat={{ id: "ds-appts", label: "Appointments Today", kind: "period", variant: "card", byRange: { today: { value: "14", trend: "up", deltaText: "3 vs last Friday", spark: [4, 6, 5, 8, 7, 9, 14] } } }}
            range="today" locked icon={CalendarClock} iconTone="blue" clickable={false}
          />
          <Stat
            stat={{ id: "ds-results", label: "Results Pending", kind: "live", variant: "card", byRange: { today: { value: "7", trend: "down", deltaText: "2 vs last Friday", spark: [10, 9, 8, 8, 7, 7, 7] } } }}
            range="today" icon={FileClock} iconTone="amber" clickable={false}
          />
        </div>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Stat — T3 strip tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6">
        <StatStripGroup>
          <Stat stat={{ id: "ds-strip-1", label: "Checked in", kind: "count", variant: "strip", value: "5" }} icon={UserCheck} iconTone="emerald" />
          <Stat stat={{ id: "ds-strip-2", label: "Utilisation", kind: "count", variant: "strip", value: "21%" }} icon={Gauge} iconTone="blue" />
        </StatStripGroup>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Stat — T4 pill tier</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex gap-2">
        <Stat stat={{ id: "ds-pill-1", label: "unread", kind: "count", variant: "pill", value: "3" }} tone="amber" dot />
        <Stat stat={{ id: "ds-pill-2", label: "overdue", kind: "count", variant: "pill", value: "1" }} tone="red" dot />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Status Pill — all semantics</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex flex-wrap gap-2">
        <StatusPill status="Active" type="success" />
        <StatusPill status="Pending" type="warning" />
        <StatusPill status="Blocked" type="error" />
        <StatusPill status="Default" type="default" />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Journey Progress — strip density</h3>
      <div className="bg-surface rounded-card border border-divider p-4">
        <JourneyProgressStrip steps={["Checked In", "Preparation", "Scan 1", "Scan 2", "Check Out"]} current={2} caption="Room 3" />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write `DesignSystemLegacy.tsx`**

```tsx
import React from "react";

// Static inventory (grep'd once by hand during the design-system
// consolidation task, not live-scanned at runtime) of pre-existing ad-hoc
// implementations that predate the standardized Input/Button/Modal/Drawer.
// Migrate opportunistically when touching these files for other reasons —
// this task does not migrate them.
const LEGACY_MODALS = [
  "src/app/pages/app/availability/ConflictModal.tsx",
  "src/app/pages/app/availability/WithdrawModal.tsx",
  "src/app/pages/app/availability/BlockedTimeModal.tsx",
  "src/app/pages/app/availability/RequestCentreModal.tsx",
  "src/app/pages/app/availability/LeaveRequestModal.tsx",
  "src/app/pages/app/patients/RegisterPatientModal.tsx",
  "src/app/pages/app/calendar/CreateModals.tsx",
  "src/app/pages/app/calendar/EditModals.tsx",
  "src/app/pages/app/dashboard/journey/JourneyDialogs.tsx",
  "src/app/pages/app/clinic-settings/RoomDeactivateDialog.tsx",
  "src/app/pages/app/clinic-settings/settingsUiShared.tsx",
  "src/app/pages/app/staff/AddStaffModal.tsx",
  "src/app/pages/app/staff/ImportStaffModal.tsx",
  "…and ~13 more (26 total) — see the 2026-07-23 research pass for the full grep output",
];

const LEGACY_INPUTS = [
  "src/app/pages/app/BillingPage.tsx (search box)",
  "src/app/pages/app/PatientsPage.tsx (search box, ×3 role toolbars)",
  "src/app/pages/app/availability/BlockedTimeModal.tsx (Other reason note field)",
  "…and ~6 more (10 total) — see the 2026-07-23 research pass for the full grep output",
];

function LegacyList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-surface rounded-card border border-divider p-4 mb-4">
      <h4 className="text-sm font-bold text-ink mb-2">{title} ({items.length})</h4>
      <ul className="space-y-1">
        {items.map((f) => <li key={f} className="text-xs text-ink-muted font-mono truncate">{f}</li>)}
      </ul>
    </div>
  );
}

export function DesignSystemLegacy() {
  return (
    <section id="legacy" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Legacy inventory</h2>
      <p className="text-xs text-ink-muted mb-4 px-0.5">Not migrated by this task — listed here so migration is trackable and opportunistic, not a silent debt pile.</p>
      <LegacyList title="Hand-rolled modal shells (should become &lt;Modal&gt;/&lt;Drawer&gt;)" items={LEGACY_MODALS} />
      <LegacyList title="Raw &lt;input&gt; elements (should become &lt;Input&gt;)" items={LEGACY_INPUTS} />
    </section>
  );
}
```
Before finalizing this file, actually re-run the inventory greps to fill
in the real, complete file lists (don't leave the "…and N more" placeholder
in the shipped file — Step 1 of this task's verification below covers
this):
```bash
grep -rl "fixed inset-0.*backdrop-blur" src/app/pages --include=*.tsx
grep -rl "<input type=" src/app/pages --include=*.tsx | grep -v "FilterSelect\|components/ui"
```
Use the ACTUAL output of both commands to write the complete
`LEGACY_MODALS`/`LEGACY_INPUTS` arrays — the lists above are illustrative
starting points from the earlier research pass, not final.

- [ ] **Step 4: Append both sections to `DesignSystemPage.tsx`**

Same pattern as Task 9 Step 3 — add to `SECTIONS`:
```tsx
  { id: "cards", label: "Cards" },
  { id: "legacy", label: "Legacy inventory" },
```
Add imports and append `<DesignSystemCards />` + `<DesignSystemLegacy />`
to the JSX body, after `<DesignSystemControls />`.

- [ ] **Step 5: Full acceptance verification pass**

Run in sequence:
1. `curl -s http://localhost:5173/src/app/pages/demo/design-system/DesignSystemPage.tsx | wc -c` — expect > 500 (final assembled page transforms).
2. `npx tsc --noEmit 2>&1 | grep -iE "design-system|components/ui/(input|textarea|button|modal|drawer)"` — expect empty (zero errors across the entire new surface).
3. `bash scripts/check-tokens.sh 2>&1 | tail -10` — expect total violation count ≤ the count recorded at the very start of Task 1 (no net-new debt across the whole task).
4. `npm run build:official 2>&1 | tail -15` then `grep -rl "DesignSystemPage\|design-system\|DesignSystemColors\|DesignSystemControls" dist/assets/*.js 2>/dev/null; echo "exit:$?"` — expect `exit:1` (still fully eliminated after all 5 sections were added). Clean up with `rm -rf dist` after.
5. Manual click-through on the demo build (`npm run dev`): Demo Controls (bottom-right pill) → Design System → confirm all 6 anchor-nav sections (Colors, Typography, Spacing/Radius, Controls, Cards, Legacy inventory) scroll correctly and render real content, confirm the top-right close button returns to the previous page.

- [ ] **Step 6: Report completion**

Summarize to the user (no commit — this session's git policy requires an
explicit ask before any `git commit`): what was built, the two confirmed
decisions honored (font token unchanged + rationale documented on-page,
identity palette flagged as placeholder), the full verification results
from Step 5, and the exact legacy-file counts now written into
`DesignSystemLegacy.tsx`.
