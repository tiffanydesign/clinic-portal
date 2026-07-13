# Reception Dashboard Redesign — Implementation Prompt

You are a Senior Product Designer (Neko Health background) and Design System Architect implementing a redesign of the **Reception dashboard** in Phenome Portal. This is a structural redesign of information hierarchy, layout, and flows — **not a reskin**. Keep the existing system UI style exactly as it is today.

---

## 1. Context

- Stack: React 18 + TS + Vite, Tailwind v4, shadcn/ui, react-router 7, lucide-react, sonner toasts.
- Reception dashboard entry: `src/app/pages/app/dashboard/DashboardPage.tsx` → `ReceptionDashboardBody.tsx`.
- Data model: `src/app/pages/app/dashboard/dashboardData.ts` (`Appt`, `APPTS`, `canCheckIn`, `checkInBlockReason`) and `receptionDashboardData.ts` (`primaryActionFor`, `groupQueue`, `consentOk`, `paymentOk`, `kpiValue`, `matchesKpi`).
- Target device: iPad 13″ landscape, 1366×1024pt, **touch-only**. Touch targets ≥44×44pt, list rows ≥48pt, 8pt spacing grid, no hover-only affordances.

### Hard constraints

1. **`CalendarWidget.tsx` (Today's Schedule) is preserved as-is.** Do not modify its internals. You may only reposition it and constrain its container height.
2. **Keep the current dashboard UI style**: solid white cards (`bg-white border border-gray-200 rounded-xl shadow-sm`), existing Tailwind utility conventions, existing semantic colors (emerald = complete/go, amber = pending, red = blocked, blue = in-progress, gray = neutral/read-only). Color always paired with icon or label, WCAG AA.
3. **Ignore `DESIGN_STYLE.md` and the frosted layer entirely.** Do not use `.frosted-*` classes, `--phenome-*` / `--status-*` / `--ink-*` tokens, or glass effects. Remove any DESIGN_STYLE.md references from files you touch in this scope.
4. **Reception never checks patients out.** Checkout is the nurse's action and must propagate back to Reception automatically.

---

## 2. The job of this screen

Reception's entire loop, in priority order:

1. **Act** — for each arriving patient, clear the two gates and check them in: **Consent → Payment → Check In** (check-in notifies the nurse).
2. **Glance** — see today's overall appointment picture (Today's Schedule).
3. **Monitor** — know how many/which patients are currently in clinic (auto-updated, never manually managed).

Design principle: **one patient = one row = one obvious next action.** A receptionist mid-conversation with a patient must be able to find that patient and know the single next step in under 2 seconds.

## 3. Problems with the current design (what you are fixing)

- **Duplicated work surfaces**: `AwaitingCheckInCard` ("Awaiting Check In") and `ReceptionFrontDeskQueue` ("Front Desk Queue") show the same patients in two competing lists with different affordances. Receptionists must reconcile two lists to do one job.
- **Inverted hierarchy**: the action queue (primary surface) sits below the fold; an oversized KPI band (`ReceptionLiveCounters`, ~120pt tall for two numbers) pushes it further down.
- **Weak row hierarchy**: gate chips (Consent/Payment) render with near-equal visual weight whether satisfied or blocked, and the action button on the far right is visually disconnected from the gate that blocks it.
- **Noise in prime space**: Recent Activity and filter empty-states ("No patients match this filter") occupy premium real estate while carrying near-zero operational value.
- **No actual consent flow**: red Consent chip has no patient-facing signing experience.
- **No real cross-role state**: Reception and Nurse dashboards each hold isolated local `useState` overrides; check-in/checkout never actually sync.

---

## 4. Target layout

Fixed-viewport operational screen. **The page itself never scrolls**; zones scroll internally. Vertical budget on 1024pt:

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 1 · Header bar (~64pt, fixed)                                │
│ Good morning, Elif · Fri 3 Jul · Istanbul Clinic                  │
│ [● In Clinic 4] [● Unpaid 3 · ₺8,400]      [Register] [New Booking]│
├──────────────────────────────────────────────────────────────────┤
│ ZONE 2 · Today's Schedule (~38% of remaining height)              │
│ <CalendarWidget /> unchanged, internal scroll, auto-centered      │
│ on the now-line                                                   │
├──────────────────────────────────────────────────────────────────┤
│ ZONE 3 · Front Desk queue (hero — all remaining height)           │
│ ── NEEDS ACTION (3) ─────────────────────────────────────────────│
│ 09:30  Riley Guarana        [Consent ✗]            [Sign Consent] │
│        Body Scan · Dr. Reis · Scan B                              │
│ 09:45  Penny Pelargonium    [Payment ✗ ₺4,800]     [Take Payment] │
│ ── READY / UPCOMING (2) ─────────────────────────────────────────│
│ 09:30  Oliver Folate        ✓✓                     [Check In]     │
│ ── IN CLINIC (4) · collapsed by default ─────────────────────────│
│ Mackenzie Messineo · With Dr. Reis · Body Scan          (read-only)│
└──────────────────────────────────────────────────────────────────┘
```

### Zone 1 — Header bar (one row, ~64pt)

- Left: greeting + date + clinic on a single line (`text-xl font-semibold` + muted meta). Kill the current two-line hero header.
- Center-left: two **live stat chips** replacing `ReceptionLiveCounters`:
  - `In Clinic · 4` (blue dot, live from shared store)
  - `Unpaid · 3 · ₺8,400` (red dot, only when count > 0; hidden at zero)
  - Each chip is a ≥44pt tappable filter for the queue (reuse `matchesKpi` logic). Active filter = filled chip + an inline "×" to clear. **Never render a dead empty-state**: if a filter yields zero rows, show one 48pt row "No patients — Clear filter" with the clear action inline.
- Right: quick actions `Register Patient` (primary, dark) + `New Booking` (secondary). Drop the third "Schedule" button — the schedule is already on screen; keep "Open Calendar →" inside CalendarWidget's own header as-is.

### Zone 2 — Today's Schedule

- Render `<CalendarWidget />` untouched inside a height-capped container (~38% of remaining viewport). It already scrolls internally and shows the red now-line; ensure it initial-scrolls to center the now-line.

### Zone 3 — Front Desk queue (the hero)

**Merge `AwaitingCheckInCard` + `ReceptionFrontDeskQueue` into a single new component `FrontDeskQueue.tsx`. Delete both old components.** One list, grouped by the existing `groupQueue` logic, with sticky group headers:

1. **Needs Action** — arrived (or late) patients with a blocked gate. Sorted most-urgent first.
2. **Ready / Upcoming** — all gates clear, awaiting check-in; then booked patients ordered by time.
3. **In Clinic** — collapsed group (header shows live count); expands to read-only quiet rows `{name} · With {clinician} · {current step}`. No actions. This answers "is X still in?" without giving Reception any checkout control.

Completed/cancelled patients leave the queue (available via the "In Clinic"-adjacent collapsed "Done today" count if trivial to include; otherwise omit).

**Row anatomy** (min 56pt, `px-4`, 8pt grid):

- Col 1 (fixed width): time, `tabular-nums`, muted; late patients get an amber "Late" tag under the time (existing `isLate`).
- Col 2 (flex): patient name `text-base font-semibold text-gray-900`; below it one muted meta line `Service · Clinician · Room`.
- Col 3: **gates — show only what blocks.** A blocked gate renders as a red chip (`bg-red-50 border-red-200 text-red-700`, ✗ + label + amount for payment), ≥44pt, directly tappable (same action as the primary button). Satisfied gates collapse to a single quiet `✓✓` in muted emerald — they must not compete with blocked gates. No gates shown for Booked (not yet arrived) rows.
- Col 4: **exactly one primary action button** per row, driven by a consent-first state machine (update `primaryActionFor` in `receptionDashboardData.ts` — currently payment-first):

| Row state | Primary action | Style |
|---|---|---|
| Booked, not arrived | `Mark Arrived` | outline |
| Arrived, consent incomplete | `Sign Consent` → opens Consent Signing Mode (§5) | amber solid |
| Arrived, consent ✓, unpaid | `Take Payment` → opens existing `StartTransactionModal` directly | red solid |
| Arrived, all gates ✓ | `Check In` | emerald solid |
| Video appt | keep existing `Send Link` behavior | outline |
| Checked In / In Clinic | none (read-only row) | — |

- `Check In` keeps the existing two-step confirm (`ConfirmCheckInModal` — move it out of `AwaitingCheckInCard.tsx` into the new queue) with copy "This will notify the nurse." On confirm: toast `"{name} checked in. Nurse notified."`, row moves to In Clinic group, In Clinic chip increments.
- `Take Payment`: open `StartTransactionModal` directly (remove the intermediate popover). Put "Send payment link instead" as a quiet text button inside the modal footer. On success the row auto-advances to its next state.
- Tapping the row body (not buttons) opens the existing `AppointmentDrawer` — unchanged.
- Row state transitions animate gently (150–250ms ease-out, subtle slide/fade between groups). No confetti, no bounce.

### Demoted / removed

- `ActivityFeed`: remove from the dashboard. If any of its events matter to reception they already surface as toasts. (Keep the component file; just stop rendering it here.)
- `ReceptionLiveCounters.tsx` and its KPI-layout customizer: delete; replaced by header stat chips.

---

## 5. Consent Signing Mode (iPad kiosk)

New patient-facing flow. Receptionist taps `Sign Consent`, hands the iPad to the patient.

- **Route**: `/consent-sign/:apptId`, registered in `App.tsx` **outside `AppShell`** — no sidebar, no top bar, no role switcher, no notifications. Full-screen `fixed inset-0 bg-white z-50`. Nothing else on screen; the patient can see and reach only the consent form.
- **Escape-proofing**: block in-app navigation out of the route except via the flows below. Intercept browser back (push a history state on mount and re-push on popstate). A small muted `Staff` button in the top corner opens a confirm dialog ("Cancel signing and return to dashboard?") — the only exit besides completion. (Demo-grade guarding is fine; no PIN needed.)
- **Content** (max-w ~720pt centered, generous line-height for reading):
  1. Header: clinic wordmark, form title, patient name + service + date.
  2. Scrollable consent document rendered from the latest published version in `clinic-settings/consentFormData.ts` (`CONSENT_FORM_VERSIONS`).
  3. Agreement checkbox(es) per the form's sections.
  4. **Signature pad**: canvas with pointer-event drawing (build a small `SignatureCanvas` component — no new deps), with a `Clear` link.
  5. `Agree & Sign` primary button, ≥56pt tall, disabled until: document scrolled to end + boxes checked + signature non-empty. Show a muted hint for whichever condition is unmet.
- **Completion screen**: full-screen check + "Thank you, {first name}. Please hand the iPad back to reception." Single button `Done` (staff taps) → navigate back to `/dashboard`.
- **On return**: consent gate flips to Signed in the shared store, toast `"{name} — consent signed."`, and the row's primary action auto-advances (to `Take Payment` or `Check In`).

---

## 6. Shared state — real Reception ↔ Nurse sync

Replace per-page local `overrides` with one shared store so the demo actually syncs across roles:

- Create `src/app/pages/app/dashboard/appointmentsStore.ts` following the existing `useSyncExternalStore` store pattern (see `src/app/pages/app/paymentTerminalsStore.ts`). Seed from `APPTS`. Expose: `useAppointments()`, `markArrived(id)`, `signConsent(id)` (sets all forms Signed), `recordPayment(id)`, `checkIn(id)`, `nurseCheckOut(id)` (→ status `Completed`).
- `ReceptionDashboardBody` consumes the store; delete its local `overrides` state.
- `NurseDashboardPage`: minimal integration — wire its existing checkout milestone (`journey/journeyEngine.ts`, step `"checkout"`) to call `nurseCheckOut(id)`; also have it read checked-in patients from the store where trivial. **Do not redesign the nurse UI.**
- Effect to demo: nurse completes checkout → Reception's In Clinic chip decrements and the row leaves the In Clinic group, with no reception interaction.

---

## 7. File plan

| Action | File |
|---|---|
| Rewrite | `dashboard/ReceptionDashboardBody.tsx` (zone layout, no page scroll) |
| Create | `dashboard/FrontDeskQueue.tsx` (merged queue + ConfirmCheckInModal moved in) |
| Create | `dashboard/appointmentsStore.ts` |
| Create | `pages/app/consent-sign/ConsentSignPage.tsx` + `SignatureCanvas.tsx` |
| Modify | `receptionDashboardData.ts` (consent-first `primaryActionFor`) |
| Modify | `App.tsx` (kiosk route outside AppShell) |
| Modify | `NurseDashboardPage.tsx` / `journeyEngine.ts` (checkout → store, minimal) |
| Delete | `AwaitingCheckInCard.tsx`, `ReceptionFrontDeskQueue.tsx`, `ReceptionLiveCounters.tsx` |
| Untouched | `CalendarWidget.tsx`, `StartTransactionModal.tsx`, `AppointmentDrawer.tsx`, `ActivityFeed.tsx` (just unmounted here), all other roles' views |

## 8. Acceptance criteria

1. On a 1366×1024 viewport the dashboard shows header, schedule, and queue with **zero page scroll**; only Zones 2/3 scroll internally.
2. Exactly **one** patient list exists; every row shows at most one primary action, and blocked gates are visually louder than satisfied ones.
3. Full happy path works end-to-end by touch: Mark Arrived → Sign Consent (kiosk: scroll, check, sign, confirm, hand-back screen) → Take Payment (terminal flow) → Check In (confirm) → row appears read-only under In Clinic → switch DEMO ROLE to Nurse, complete checkout → switch back to Reception → In Clinic count decremented, row gone. No manual reception checkout exists anywhere.
4. In kiosk mode nothing but the consent form is visible or reachable; browser back does not escape; `Staff` exit requires confirmation.
5. All interactive targets ≥44×44pt, rows ≥48pt, spacing on the 8pt grid; visuals match today's card/color language; no frosted classes or `--phenome-*` tokens are introduced.
6. `In Clinic` and `Unpaid` chips live-update from the store and filter the queue; zero-result filters show an inline clear row, never a large empty panel.
7. Typecheck and build pass (`npm run build`); no console errors while performing criterion 3.

## 9. Out of scope

Nurse/Clinician/Admin dashboard visuals, Billing/Patients/Calendar pages, CalendarWidget internals, auth, real backend or persistence, consent template editing (admin side stays as-is).
