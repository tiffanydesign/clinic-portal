Build a LOW-FIDELITY, CLICKABLE WIREFRAME prototype of an internal clinic management portal ("Phenome Portal"). This is for validating that business flows connect end to end — clickability and navigation matter far more than visual polish.

TARGET DEVICE
- iPad 13" landscape. Design at logical size 1366 x 1024 points (renders at 2732 x 2048 @2x). Layout must fit this landscape frame, no desktop layouts.

VISUAL RULES (strict — this is a wireframe, not a finished UI)
- Grayscale only: white background, gray borders (1px), dark gray text. ONE muted neutral accent (a desaturated slate/blue-gray) ONLY for active nav item and selected/current states.
- DO NOT use any brand colors (no navy, no teal), no gradients, no photos, no illustrations. Avatars = gray circle with initials. Charts = simple gray placeholder blocks.
- System/sans font. Boxy cards with visible section labels. Buttons = outlined rectangles. It should obviously look like a wireframe.

APP SHELL (shared across all staff pages)
- Collapsible LEFT SIDEBAR with nav items; active item highlighted.
- TOP BAR: page title, search field, notifications bell (with unread dot), profile menu.
- Add a DEMO ROLE SWITCHER in the top bar to jump between Admin / Reception / Nurse / Clinician (there is no real backend; this lets us walk every role's flow). Switching role changes the sidebar items and the dashboard.

ROLES & SIDEBAR (per xlsx)
- Admin: Dashboard, Calendar, Patients, Staff, Clinic Settings, Billing, Feedback, Timesheet, Notifications, Approval, Profile, Logout
- Reception: Dashboard, Calendar, Patients, Billing, Notifications, Profile, Logout
- Nurse: Dashboard, Calendar, Patients, Availability, Notifications, Profile, Logout
- Clinician: Dashboard, Calendar, Patients, Availability, Notifications, Approval, Profile, Logout

AUTH (minimal, reachable)
- Staff Login (email, password, sign in) → Two-Factor (code field, verify) → route to the role dashboard. Keep it one quick path.

DASHBOARDS (build all 4, reachable via role switcher)
Each opens with a KPI BAR of cards (label, big value, comparison "vs last [weekday]", tiny trend line, lock marker on locked cards). Each KPI card is clickable → the list it summarizes.
- Admin KPI: [Appointments Today], [Results Pending Review] locked; + Checked In Now, Utilisation. Below: "Today's Clinic" timeline (rows clickable → Patient Record) and an "AI Insight" placeholder card.
- Reception KPI: [Arrivals Expected], [Checked In] locked; + In Clinic Now, Unpaid Balances. Below: Arrivals list, Check-in queue.
- Nurse KPI: [My Patients Today], [Awaiting Me] locked; + In Journey Now, Samples To Collect. Below: My patients today, Journey queue.
- Clinician KPI: [Results To Review], [Awaiting My Sign Off] locked; + My Appointments, Video Calls Today. Below: Results review queue, Today's consultations.

CALENDAR + APPOINTMENT DRAWER (this is the spine — wire it fully)
- Per role: Admin = full editable clinic calendar (staff columns + room columns, day/week); Reception = today-focused day calendar; Nurse = own day; Clinician = own calendar with a read-only clinic overlay.
- Clicking an APPOINTMENT BLOCK opens a RIGHT-SIDE DRAWER (not a modal — keep calendar visible). Drawer shows: patient summary, appointment details, assigned clinician, assigned nurse, room, status, payment status, signed-forms status, today's journey summary.
- Drawer actions: Open Patient Record, Reschedule, Reassign, Cancel (Admin), plus role variants below.
- RECEPTION DRAWER GATING (critical to demo): a "Check In" button that is DISABLED until BOTH payment is complete AND required forms are signed. If payment incomplete, show "Start Transaction / Send Payment Link"; if form unsigned, show "Send Form / Initialize Signing". Once both complete, Check In enables. Include a "Check Out" button too.

PATIENT LIST → PATIENT RECORD (wire navigation)
- Patients list per role (Admin = all clinic; Reception = booking/check-in columns incl. consent + payment status; Clinician = my patients). Row click → Patient Record.
- Patient Record: sticky HEADER (photo placeholder, name, ID, DOB, age, sex, phone, email, assigned clinician, assigned nurse, status, last visit, next appointment) + TAB BAR: Overview, Results, Journeys, Signed Forms, Clinician Notes, Appointments.
- Results tab = PLACEHOLDER ("Digital Twin — to be designed"). Do not build the Digital Twin.
- Journeys tab → Journey Details with a step timeline: Consent → Changing Room → Scan → Sample Collection → Home Kit, current step highlighted, steps markable as entered/finished (nurse fills these).
- Signed Forms tab = table (form name, type, version, signed date, signed by, view PDF). Role-gate: Nurse & Clinician see reduced content; hide Clinician Notes from Reception & Nurse.

STUB PAGES (build as reachable skeletons only — title + labeled empty sections, NOT full detail)
Staff Management (Admin: staff list + details tabs overview/availability/permissions/workload), Clinic Settings (reports, diagnoses, form templates, consent files), Availability (clinician slot editor with type: in person / video / both), Billing (single table page), Feedback, Timesheet, Notifications (filterable list with read/unread), Approval (list of "clinician requests access to non-assigned patient" with Approve/Reject → writes an Audit Log entry).

SHARED MOCK DATA (use one consistent dataset across all pages)
- ~8 patients, ~3 staff per role, and today's clinic of ~6 appointments spread across statuses: Booked, Checked In, In Clinic / Awaiting, Completed. The same patient clicked anywhere shows the same record.

PRIORITY: Every nav item, KPI card, list row, appointment block and tab must be clickable and lead somewhere. Reachability and state transitions first; pixels last.