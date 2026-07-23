# My Availability v2 — 三概念分层 + 去重复 (Clinician & Nurse)

> Living spec + phase plan. Source of truth across phased execution.
> Date: 2026-07-23. Scope: Clinician & Nurse self-service availability.

## Confirmed decisions
1. **Blocked Time = carve-out model.** Use the existing `BlockedTime` type (`{id,date,startMin,durationMin,reason}`) + new `addBlockedTime`/`removeBlockedTime` store actions. **Retire** the old `OverrideItem` "set different hours for a date" concept and its modal/handlers.
2. **Keep the transit list.** `/calendar/my-availability` stays a landing list; the editor (`:id`) is where the v2 restructure lives. Rename copy to "My Availability".
3. **Roles:** only Clinician & Nurse get a personal My Availability. Admin/Reception: Team Availability only (+ Schedule).
4. **Execution: phased, user verifies each phase on localhost:5173.**
5. **Booking on a Blocked time = HARD block** (cannot create an appointment overlapping a Blocked Time for the signed-in clinician), upgrading today's soft "outside hours" signal. Done in P2.
6. **Team Availability grid stays a separate mock** — Blocked Time is NOT synced into it this round; reflect in personal Schedule overlay + Preview and add a visible "not reflected in Team grid (demo)" note.

## Core principle
Partition by effect mechanism: **Applies instantly** (Weekly Hours, Blocked Time) vs **Requires approval** (Leave). Any request appears **exactly once** on the page (in the right-column Request Centre).

## Current-state facts (from code map)
- Weekly hours already multi-segment: `DayConfig = { active, slots: Slot[] }` (午休 needs no model change).
- `BlockedTime` type + calendar gray-hatch rendering already exist; **no CRUD actions yet**.
- Only **Leave** has a pending→approve/reject lifecycle. Weekly Hours + (old) overrides apply instantly.
- Admin read-only notification pattern exists: `scheduleChangeNotifications` (kind=`system`, never in Needs Action).
- Team Availability grid (`availability-grid/`) uses a **separate mock model**, not `availabilityStore` — true two-way sync is out of scope; we reflect Blocked Time in the personal Schedule overlay + Preview, and note the grid limitation.
- Preview component (`WeeklyAvailabilityPreview.tsx`) exists but is orphaned (not wired).
- Booking is only a **soft** "outside hours" signal (`SchedulePage.isOutsideWorkingHours`), already reads `blockedTime`.

## Target layout (editor page)
- Header: title **My Availability**; one-line note: "Only leave requires Admin approval. Everything else applies instantly."
- Left ~65%: **Section 1 Weekly Hours** (`Applies instantly`), **Section 2 Blocked Time** (`Applies instantly`), **Section 3 Leave** (`Requires approval`, entry + description only), **Section 4 Availability Preview** (read-only synthesis).
- Right ~35%: **Request Centre** (the only request-status area): Pending list (type pill · summary · submitted · Withdraw) + collapsible "Recent decisions".

## Phase plan

### Phase 1 — Nav + terminology shell (safe, text/route only)  ✅ DONE (2026-07-23)
Done: nav "Availability"→"Team Availability" (4 roles; C&N now [Schedule, My Availability, Team Availability], Admin/Reception [Schedule, Team Availability]); landing card + editor title → "My Availability"; approval copy → "Blocked Time"; `PendingKind` literal "Date Override"→"Blocked Time"; DEC-1 seed → Leave; SiteMap label → "Team Availability". Header note line already present. Remaining "Date Override" is one code comment (availabilityData.ts:243) — clean in P2. Editor's own DateOverridesSection/OverrideModal text intentionally left (replaced wholesale in P2).
- Sidebar (`AppShell.tsx`): rename "Availability" → **Team Availability** (all roles); remove the duplicate so C&N = [Schedule, My Availability, Team Availability], Admin/Reception = [Schedule, Team Availability].
- Editor/landing copy → "My Availability"; keep landing list.
- Global text rename "Date override(s)" → "Blocked Time" in Calendar overlay labels, `notificationsData`, `AvailabilityApprovalPage` copy, `SiteMap`.
- Keep the header note line.
- **Verify:** nav deduped per role; page title correct; no "Date override" user-facing text on shared surfaces.

### Phase 2 — Blocked Time card + store (carve-out; retire override)  ✅ DONE (2026-07-23)
Done: store `addBlockedTime`/`removeBlockedTime` (instant + scheduleChangeLog audit + Admin read-only system notification); new `BlockedTimeSection` (replaces DateOverridesSection) + `BlockedTimeModal` (date=next-90d workdays dropdown, time range, reason [Training/External meeting/Personal/Other+note required], full-day→Leave hint); conflict gating via ConflictModal (context "blocked-time", blocking). Retired override: deleted OverrideModal.tsx + DateOverridesSection.tsx, removed store `overrides` state/actions/OV-1 seed, editor override handlers/state. Hard block: SchedulePage.onEmptyClick refuses a new booking over the self-clinician's Blocked Time (toast). availabilityData helpers added: BLOCKED_REASONS, minToLabel, blockedTimeConflicts, blockCoversWholeDay. tsc: only pre-existing RefObject errors (AppShell:269, availability-grid) — zero from this refactor. Team grid NOT synced (noted in section). Dormant: OverrideItem/OverrideStatus/classifyDateChange types kept unused in availabilityData (harmless).
- `availabilityStore`: add `addBlockedTime(date,startMin,durationMin,reason)` + `removeBlockedTime(id)`; instant apply; write `scheduleChangeLog` (audit) + Admin read-only `system` notification.
- New `BlockedTimeSection` (replaces `DateOverridesSection`): list existing + "Add Blocked Time" → modal: date (workday, next 90d) + time range + reason (Training / External meeting / Personal / Other+note, required). Conflict with booked appts → ConflictModal gating (must resolve before save). Covering the whole workday → hint "use Leave instead".
- Retire `OverrideModal` + override handlers from the editor; remove/retire override store actions not used elsewhere.
- Blocked Time reflects in personal Schedule overlay + blocks booking (soft signal already reads blockedTime; keep).
- **Verify:** 午休/挖除 ≤4 clicks; conflict gating blocks save; full-day → Leave hint; calendar shows the block.

### Phase 3 — Request Centre merge (dedup)  ✅ DONE (2026-07-23)
Done: `PendingRequestsSection` heading → **"Request Centre"** (shared by editor + ClinicianRequestsPage, so both surfaces stay in sync). New `LeaveEntrySection` (entry-only: badge + description + "New Leave Request" button, no list) replaces the old `LeaveRequestsSection` (deleted — its list duplicated Request Centre once Leave went Pending). **Layout correction vs P2:** per the original 3-section spec, moved `BlockedTimeSection` from the right column into the LEFT/main column (65%) alongside a newly-wrapped "Weekly Hours" card (heading + Applies-instantly badge) and the new Leave entry card; right column (35%) now holds **only** Request Centre. Left column bg switched to `surface-page` with each section as its own white `bg-surface rounded-card` — the three sections now read as distinct modules per the "轻卡片+细线分区" principle. Dead-code cleanup (full "Date override" purge): deleted `classifyDateChange`, `OverrideStatus`/`OverridePendingAction`/`OverrideItem` types, and the now-unused `overrideStatusPillClass` helper from availabilityData.ts; fixed remaining "Date Override" code comments in AvailabilityApprovalPage/ClinicianRequestsPage/LeaveRequestModal/availabilityData. Verify: 8 files transform cleanly; tsc — zero errors from this change (only pre-existing availability-grid RefObject errors, unrelated).

### Phase 4 — Availability Preview + conflict-gating polish  ✅ DONE (2026-07-23)
Done: new `AvailabilityPreview.tsx` (replaces the orphaned `WeeklyAvailabilityPreview.tsx`, deleted) wired as the 4th left-column section, receiving `localSchedule`/`savedSchedule`/`blockedTime`/`leaves`. Renders a real navigable calendar week (prev/next/Today, anchored on the shared demo "today" 3 Jul 2026) so date-scoped Blocked Time/Leave attach correctly — a per-weekday template alone can't carry dates. Layering (bottom→top): off-track → working slots (white; **semi-transparent + dashed when that day's local draft differs from the saved schedule** — the live unsaved-preview requirement) → Blocked Time (diagonal hatch via `var(--ink-400)`, tooltip = reason) → Leave (solid grey full/half-day for Approved, dashed outline + "Pending" pill for Pending) — leave always wins visually over blocks/hours, matching real precedence. Added `blockedTimeForDate`/`leaveForDate` date-string lookups to availabilityData.ts (own tiny date-compare, no date-fns dependency, consistent with the rest of the file) instead of coupling into calendar/myScheduleData.ts's Date-based equivalents — zero risk to the live Schedule view. Conflict-gating review: traced the existing `classifyWeekChange`/`hasBlockingConflicts`/ConflictModal("schedule") flow — already correct and unchanged by this refactor (reduction+conflict blocks Save until every booking is resolved; instant-apply + scheduleChangeLog audit on confirm). Added the one real polish: an inline "N bookings affected" indicator next to Save, visible BEFORE the click (previously only surfaced after opening the modal) + a disabled-reason tooltip. Verify: 3 files transform cleanly; token check clean (the hatch's `var(--ink-400)` is a CSS-var reference, not a hardcoded hex); tsc — zero errors from this change (only the same 2 pre-existing, unrelated availability-grid RefObject errors seen since session start).

## Status: all 4 phases complete.

## v3 amendment (2026-07-23) — Request popup + right-column regroup + mini-calendar Preview
Post-Phase-4 follow-up request, confirmed via 2 clarifying questions:
1. **New business rule: only one Leave request may be Pending at a time.** `availabilityStore.hasPendingRequest()` added; `submitLeave` checks it first (before overlap/conflict checks), in both the direct-submit and ConflictModal-confirm paths. Seed data fixed to match (previously 3 concurrent Pending leaves — now exactly 1 Pending [LV-2], the other two moved to decided history with matching `decisions` entries). `LeaveEntrySection` disables "New Leave Request" + shows an inline note when a request is already pending — surfaced before the click, same pattern as the Save button's affected-count indicator.
2. **Layout regroup, ratio 55/45** (user's choice over keeping 65/35): left column now holds ONLY the Weekly Hours card; Blocked Time, Leave entry, and Availability Preview moved to the right column. The right-column **Request Centre card is removed entirely** — replaced by a **"Requests" button in the top bar** (with a pending-count badge) that opens `RequestCentreModal.tsx`, a dialog reusing `PendingRequestsSection` via a new `variant="bare"` prop (skips its own card chrome/heading so it doesn't double up inside the dialog's own header — `ClinicianRequestsPage.tsx`'s embed is untouched, still defaults to `variant="card"`). Since only one Leave can ever be Pending, the popup's "current request" list is always 0 or 1 card, with "Recent decisions" for history below.
3. **Availability Preview redesigned as a mini week calendar**: 7 vertical day-columns (6am–9pm) instead of the P4 horizontal bar-per-day strip, still date-real (navigable prev/next/Today) so Blocked Time/Leave attach correctly. Colour + icon both carry the two exception states (icons intentionally omitted from Working/Off — the routine default shouldn't need decoration): Blocked = amber hatch + `CalendarOff`; Leave = purple fill (or dashed outline + `Clock3` for Pending) + `Plane`; a compact legend row explains all five states. Unsaved Weekly Hours draft still renders semi-transparent/dashed per-day exactly as in P4.

Verify: token check clean; tsc — zero errors introduced (same 2 pre-existing, unrelated availability-grid RefObject errors as every prior phase); `AvailabilityApprovalPage`'s pending-queue filter is dynamic (`.filter(status === "Pending")`), so it naturally now shows exactly the 1 seeded pending item — no hardcoded-count assumptions broke.

## Constraints
Frozen tokens + compact spec; touch ≥44pt (visual 38px + hit-area extend); no hover dependency; semantic colour green=approved/instant, amber=pending, red=conflict; state machine stays in `availabilityStore`; all instant-apply ops write audit.

## Acceptance (from task)
1. 2s to tell instant vs approval. 2. 午休 ≤4 clicks. 3. each request once; zero "Date override" residue. 4. preview == effective logic incl. draft. 5. unresolved conflict blocks save. 6. title + sidebar fixed; Admin read-only notifications + Approval queue unaffected.
