# Product

## Register

product

## Users

Four internal staff roles at a single high-end preventive-medicine / longevity clinic in Istanbul, all operating on a shared iPad (13" landscape, 1366×1024pt) at the front desk, treatment rooms, or consult rooms:

- **Receptionist** — stands at the front desk. High-frequency loop: see who's arriving today → take payment → send forms for signature → check in → check out. Needs fast throughput and a hard gate against skipping payment/consent.
- **Nurse** — walks between rooms. Needs "what do I do right now, for which patient" to be obvious at a glance, with every step leaving a trace (Journey steps: Changing Room → Scan → Sample Collection → Home Kit → Consultation handoff).
- **Clinician** — reviews results and signs off reports, holds consultations. Needs two queues (Results Review, Sign-off) kept clearly separate, with full patient context on hand.
- **Admin** — the single account with full authority. Watches clinic-wide KPIs, clears the approval queue, manages staff/billing/config.

Shared context: this is operational, time-pressured, standing-up iPad use next to patients — not desk-bound mouse-and-keyboard work. No hover, thumb-reachable primary actions, big touch targets, must stay legible under real clinic lighting.

## Product Purpose

Phenome Portal is the staff-facing operations system for the clinic's full front-of-house loop: **booking → arrival/check-in → in-clinic journey → billing → results review**, plus scheduling/leave, staff management, feedback, and attendance. It is not patient-facing (patients only touch payment links, e-signature, and iPad signing at the counter).

Core product bets, stated directly in the PRD and worth preserving in every redesign decision:
- **Single source of truth** — the same appointment/patient reads identically everywhere.
- **State-machine driven** — every object's transitions have explicit guard conditions; nothing is "verbal process."
- **Role-minimal visibility** — data is trimmed to what each role needs, no more.
- **iPad-first** — every interaction assumes touch, no reliable hover, and a device held or glanced at mid-task.

Success = a staff member can tell, in under two seconds of looking at a schedule/calendar surface, what's happening now, what's next, and what needs their action — without tapping into a detail view first.

## Brand Personality

Three words: **Premium, restrained, trustworthy.**

This is a luxury longevity clinic, not a budget walk-in practice — the interface should read as calm, considered, and expensive without being decorative. The PRD's own design principle states it plainly: *"Premium = restraint"* (Premium=克制). Concretely:
- Glass/blur effects are reserved for the shell (sidebar, top bar, drawer/modal scrims, popovers) — never on data-bearing content. Medical/scheduling data must stay on solid, fully opaque, high-contrast surfaces.
- Two shadow tiers only (card / elevated), a three-step radius scale (8/12/16pt), an 8pt spacing grid, and 150–250ms ease-out motion used only for state changes — never decorative animation.
- Status color is semantic and fixed clinic-wide: green = complete/done, amber = pending/waiting, red = blocked/danger, blue = in progress/info, purple = refund/special. One meaning per color, everywhere.

## Anti-references

- **Not** a generic flat gray enterprise admin template (thin 1px borders on white, no depth, badge soup) — this is the exact complaint driving this redesign: current calendar surfaces read as flat and undifferentiated.
- **Not** a consumer wellness app (rounded pastel blobs, playful illustration, casual tone) — this is a clinical tool used under time pressure, not a lifestyle app.
- **Not** a dense legacy EHR/scheduling grid (tiny text, cramped rows, everything visible at once regardless of relevance) — information density must be curated, not maximized.

## Design Principles

1. **Glass on the shell, solid under the data.** Blur and translucency are structural (nav, drawers, overlays); every card, table, and calendar block sits on an opaque surface so clinical information is never read through a filter.
2. **One glance, correct triage.** Any schedule/calendar view must let a standing, time-pressured user identify "now / next / needs attention" without opening a detail panel.
3. **Touch is the only input.** 44×44pt minimum targets, ≥48pt row heights, no hover-dependent affordances, long-press instead of drag-to-pick-up, confirmations sized for a thumb.
4. **Fixed semantic color, no freelancing.** The five-color status language (green/amber/red/blue/purple) is clinic-wide law; a new calendar view does not invent its own palette for "in progress" or "urgent."
5. **Depth communicates hierarchy, not decoration.** Shadow, radius, and spacing exist to separate "structure" from "content" and "today" from "everything else" — restraint over flourish, always.

## Accessibility & Inclusion

- WCAG AA minimum: body text and key figures ≥4.5:1 contrast; this must be verified specifically for any text sitting on a glass/blur surface, where translucency tends to erode contrast.
- Reduced-motion alternative required for any transition (crossfade/instant swap).
- Designed for sustained iPad use in variable clinic lighting — no color-only signaling (status must pair color with icon/label/shape, useful for color-vision-deficient staff).
