// Mock data for the Clinic Settings Hub — a module-selection layer inserted
// between the sidebar nav and the Consent Form Template detail page. Only
// one module is real today; the rest are disabled placeholders so the grid
// can grow sideways later without a layout redesign.

export type SettingsModule = {
  name: string;
  description: string;
  enabled: boolean;
  route?: string; // present only when enabled
  status?: string; // e.g. "Version 4 · Active"
  lastEdited?: string;
  badge?: string; // e.g. "Coming soon"
};

export type SettingsCategory = {
  name: string;
  modules: SettingsModule[];
};

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    name: "Templates & Documents",
    modules: [
      {
        name: "Consent Form Template",
        description: "The consent form patients sign at reception before their visit",
        enabled: true,
        route: "/clinic-settings/consent-form",
        status: "Version 4 · Active",
        lastEdited: "Last edited by Ayşe Hançer · 28 Jun 2026",
      },
    ],
  },
  {
    // Payment Terminals folds in here as one device type — the old Payments
    // card is gone and its route redirects into Devices' terminal filter.
    name: "Rooms & Devices",
    modules: [
      {
        name: "Rooms",
        description: "Manage consultation, scan and sample rooms",
        enabled: true,
        route: "/clinic-settings/rooms",
      },
      {
        name: "Devices",
        description: "Scanners, TVs and payment terminals",
        enabled: true,
        route: "/clinic-settings/devices",
      },
    ],
  },
];
