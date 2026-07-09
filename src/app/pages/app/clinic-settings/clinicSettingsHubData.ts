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
    name: "Payments",
    modules: [
      {
        name: "Payment Terminals",
        description: "Manage Stripe card readers used for in-person payments",
        enabled: true,
        route: "/clinic-settings/payment-terminals",
      },
    ],
  },
  {
    name: "Compliance & Data",
    modules: [
      { name: "Data Retention Policy", description: "Configure how long patient records are stored", enabled: false, badge: "Coming soon" },
    ],
  },
  {
    name: "Notifications",
    modules: [
      { name: "Notification Templates", description: "Email and SMS templates sent to patients", enabled: false, badge: "Coming soon" },
    ],
  },
  {
    name: "Branding",
    modules: [
      { name: "Clinic Branding", description: "Logo, colors, and patient portal appearance", enabled: false, badge: "Coming soon" },
    ],
  },
];
