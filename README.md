# Phenome Portal — Clinic Portal Prototype

Interactive clinic-management prototype generated with [Figma Make](https://www.figma.com/design/DLtqMQjbNoyjUy6LS1i83L/Phenome-Portal), exported as a runnable React application.

The prototype targets the **Apple iPad Air 13″ in landscape** (2732 × 2048 physical, 1366 × 1024 logical points) and ships with a device-frame preview page (`ipad.html`) that renders the app inside an iPad shell at the exact target resolution.

## Quick start

```bash
npm install
npm run dev
```

Then open:

| URL | What you get |
|-----|--------------|
| `http://localhost:5173/ipad.html` | The prototype inside an iPad Air 13″ frame, auto-scaled to your window, with a route switcher bar |
| `http://localhost:5173/login` | The raw app, full-screen |
| `http://localhost:5173/site-map` | Site map listing every screen in the prototype |

`npm run build` produces a static production build in `dist/` (serve it with any SPA-fallback-capable static server, e.g. `npx serve dist -s`).

## iPad preview (`ipad.html`)

- Renders the app in an iframe at the iPad Air 13″ landscape logical resolution (1366 × 1024 pt), wrapped in a device shell with bezel, camera, and hardware buttons.
- Scales the whole device to fit your browser window (current zoom shown in the control bar).
- The bottom control bar jumps between the main sections: Login, Dashboard, Calendar, Patients, Billing, Settings, and Site Map. `⟳` reloads the frame; `⤢` opens the app full-screen in a new tab.
- All in-app interactions (routing, drawers, dialogs, role guard toasts) work inside the frame — it is the real app, not screenshots.

## What's in the prototype

### Screens

- **Auth**: Login, Two-factor, Enrollment, Forgot/Reset password
- **Dashboard**: role-aware landing page
- **Calendar**: schedule view, appointment drawer, my availability (list + edit), team availability
- **Patients**: patient list, new patient, patient record (Overview / Results / Journeys / Signed Forms / Notes / Appointments), journey detail
- **Staff**: staff list, staff record (Overview / Availability / Permissions / Workload)
- **Clinic Settings**: Reports, Diagnoses, Form Templates, Consent Files
- **Billing**, **Feedback admin**, **Timesheet**, **Notifications**, **Approvals**, **Profile**, **Site Map**

### Role-based access

A role switcher (in-app) drives a route guard with four roles — **Admin**, **Reception**, **Nurse**, **Clinician** — each limited to its own set of sections; navigating to a forbidden section shows a toast and redirects to the dashboard. Authentication is currently bypassed for review purposes (see `src/app/App.tsx`).

## Tech stack

- **React 18 + Vite 6** (`react-router` v7, `BrowserRouter`)
- **Tailwind CSS v4** + shadcn/ui-style component library (`src/app/components/ui/`)
- Radix UI primitives, `lucide-react` icons, `sonner` toasts, `recharts`, `motion`

## Project structure

```
├── index.html              # App entry (SPA)
├── ipad.html               # iPad Air 13″ device-frame preview
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx         # Routes + role guard
│   │   ├── components/     # AppShell, Dashboard, Calendar, ui/ library
│   │   ├── context/        # AppContext (role, state)
│   │   ├── layouts/        # AuthLayout
│   │   └── pages/          # auth/ and app/ page components
│   ├── imports/            # Figma-exported assets and pasted specs
│   └── styles/             # Tailwind, theme, fonts
├── guidelines/Guidelines.md
└── vite.config.ts          # Figma asset resolver + @ alias
```

## Notes

- This is a **design prototype**: data is mocked in-component, and several deep screens are intentional skeletons (`TabContentSkeleton`) that mark layout slots from the wireframe.
- Original design source: [Phenome Portal on Figma](https://www.figma.com/design/DLtqMQjbNoyjUy6LS1i83L/Phenome-Portal).
