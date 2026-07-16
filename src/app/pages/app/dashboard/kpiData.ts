// Per-role KPI catalogs for the Dashboard KPI Bar.
// Each role has 2 locked (clinic-set) cards + a pool of configurable metrics,
// of which 2 are selected by default. The "Customise KPIs" modal lets the user
// swap the 2 configurable slots (never the locked ones).
//
// Every KPI is one of three kinds, which controls how it responds to the
// global Today / 7d / 30d switcher:
//   - "period": a genuine period total. Value, comparison, and sparkline all
//     change with the selected range (e.g. Appointments).
//   - "live":   a live snapshot (e.g. Checked In Now). The headline number
//     never changes with range — only the comparison line (which becomes an
//     informational period average) and the sparkline's sampling granularity
//     do. The range pill always reads "LIVE".
//   - "hybrid": a metric whose *meaning* changes with range (Samples To
//     Collect, a live backlog, becomes Samples Collected, a period total, at
//     7d/30d). The label and inverse-ness can differ per range.

import type { Role } from "../../../context/AppContext";
import type { TimeRange } from "./kpiRangeStore";
import { APPTS } from "./dashboardData";
import { getSchedulableRoomsSnapshot } from "../clinic-settings/roomsStore";
import { clinicUtilisationPct } from "../clinic-settings/roomAvailability";

// Same rooms + same appts + same pure function as the Availability page's
// Rooms tab — this card and that tab's row-end % can never show two
// different numbers for "how busy is the clinic".
const TODAY_UTILISATION_PCT = clinicUtilisationPct(getSchedulableRoomsSnapshot(), APPTS);

export type Trend = "up" | "down" | "flat";
export type MetricKind = "period" | "live" | "hybrid";

export type RangeValue = {
  value: string;
  deltaText: string;
  trend: Trend;
  spark: number[]; // Today: 7 daily points · 7d: 8 weekly points · 30d: 6 monthly points
  informational?: boolean; // true => comparison line is a plain gray reference figure, no arrow
  label?: string; // overrides the KPI's base label for this range (hybrid)
  inverse?: boolean; // overrides the KPI-level `inverse` for this specific range (hybrid)
};

export type Kpi = {
  id: string;
  label: string; // base (Today) label
  kind: MetricKind;
  inverse?: boolean; // "lower is better" — flips the up/down -> good/bad color mapping
  desc: string;
  route?: string;
  byRange: Record<TimeRange, RangeValue>;
};

export type RoleKpiConfig = {
  locked: Kpi[]; // exactly 2, cannot be changed
  pool: Kpi[]; // configurable options (includes the defaults)
  defaultSelected: string[]; // exactly 2 ids from pool
};

export function metricKindLabel(kind: MetricKind): "Period metric" | "Live metric" {
  return kind === "live" ? "Live metric" : "Period metric";
}

// Admin's locked + pool cards are also Reception's, verbatim (see
// KPI_CONFIG.Reception below) — Reception's own distinct KPI set (Arrivals
// Expected, Awaiting Check In, Walk Ins, ...) was superseded once the
// Reception dashboard got its own live Front Desk Queue + header stat
// chips (in-clinic/unpaid filters, see receptionDashboardData.ts) driven
// directly off real appointment data rather than this mock KPI catalog.
const ADMIN_LOCKED: Kpi[] = [
  {
    id: "appts-today", label: "Appointments Today", kind: "period",
    desc: "Total booked appointments across the clinic.", route: "/calendar/schedule",
    byRange: {
      today: { value: "14", deltaText: "3 vs last Friday", trend: "up", spark: [10, 12, 11, 13, 12, 11, 14] },
      "7d": { value: "89", deltaText: "6 vs previous 7 days", trend: "up", spark: [72, 75, 80, 78, 83, 85, 83, 89], label: "Appointments" },
      "30d": { value: "372", deltaText: "14 vs previous 30 days", trend: "down", spark: [340, 355, 360, 365, 386, 372], label: "Appointments" },
    },
  },
  {
    id: "results-pending", label: "Results Pending Review", kind: "live", inverse: true,
    desc: "Results awaiting clinician sign-off.", route: "/patients",
    byRange: {
      today: { value: "7", deltaText: "2 vs last Friday", trend: "down", spark: [11, 10, 9, 9, 8, 8, 7] },
      "7d": { value: "7", deltaText: "avg 6.4 over period", trend: "flat", informational: true, spark: [9, 8.5, 8, 7.8, 7.2, 7, 6.8, 6.4] },
      "30d": { value: "7", deltaText: "avg 7.1 over period", trend: "flat", informational: true, spark: [8.5, 8, 7.8, 7.5, 7.2, 7.1] },
    },
  },
];

const ADMIN_POOL: Kpi[] = [
  {
    id: "checked-in-now", label: "In Clinic Now", kind: "live", route: "/dashboard",
    desc: "Patients currently checked in at the clinic.",
    byRange: {
      today: { value: "5", deltaText: "1 vs last Friday", trend: "up", spark: [3, 4, 4, 5, 4, 5, 5] },
      "7d": { value: "5", deltaText: "avg 4.6 over period", trend: "flat", informational: true, spark: [3.8, 4, 4.2, 4.5, 4.6, 4.4, 4.7, 4.6] },
      "30d": { value: "5", deltaText: "avg 4.3 over period", trend: "flat", informational: true, spark: [4.0, 4.1, 4.2, 4.2, 4.3, 4.3] },
    },
  },
  {
    id: "utilisation", label: "Utilisation", kind: "live", route: "/calendar/availability?tab=rooms",
    desc: "Clinic capacity used across all rooms.",
    byRange: {
      today: { value: `${TODAY_UTILISATION_PCT}%`, deltaText: "4% vs last Friday", trend: "up", spark: [70, 72, 74, 73, 76, 77, TODAY_UTILISATION_PCT] },
      "7d": { value: `${TODAY_UTILISATION_PCT}%`, deltaText: "avg 75% over period", trend: "flat", informational: true, spark: [70, 71, 73, 74, 75, 76, 75, 75] },
      "30d": { value: `${TODAY_UTILISATION_PCT}%`, deltaText: "avg 73% over period", trend: "flat", informational: true, spark: [68, 70, 71, 72, 73, 73] },
    },
  },
  {
    id: "scans-today", label: "Scans Completed Today", kind: "period",
    desc: "Body scans completed in the period.",
    byRange: {
      today: { value: "3", deltaText: "1 vs last Friday", trend: "up", spark: [4, 5, 3, 4, 2, 3, 3] },
      "7d": { value: "19", deltaText: "2 vs previous 7 days", trend: "up", spark: [15, 16, 14, 17, 18, 16, 17, 19], label: "Scans Completed" },
      "30d": { value: "76", deltaText: "5 vs previous 30 days", trend: "down", spark: [70, 74, 78, 81, 79, 76], label: "Scans Completed" },
    },
  },
  {
    id: "no-show-rate", label: "No Show Rate", kind: "period", inverse: true,
    desc: "Percentage of no-shows in the period.",
    byRange: {
      today: { value: "2.5%", deltaText: "0.8% vs last Friday", trend: "down", spark: [3.5, 3.2, 3.0, 2.9, 2.7, 2.8, 2.5] },
      "7d": { value: "4.2%", deltaText: "0.4% vs previous 7 days", trend: "up", spark: [3.6, 3.8, 3.7, 3.9, 4.0, 4.1, 3.9, 4.2] },
      "30d": { value: "4.6%", deltaText: "0.3% vs previous 30 days", trend: "down", spark: [5.1, 4.9, 4.8, 4.9, 4.7, 4.6] },
    },
  },
  {
    id: "new-registrations", label: "New Registrations", kind: "period", route: "/patients",
    desc: "New patients registered in the period.",
    byRange: {
      today: { value: "2", deltaText: "1 vs last Friday", trend: "up", spark: [1, 2, 1, 2, 3, 1, 2] },
      "7d": { value: "11", deltaText: "3 vs previous 7 days", trend: "up", spark: [6, 7, 8, 7, 9, 10, 9, 11] },
      "30d": { value: "38", deltaText: "4 vs previous 30 days", trend: "down", spark: [30, 33, 35, 37, 40, 38] },
    },
  },
  {
    id: "average-wait", label: "Average Wait", kind: "live", inverse: true,
    desc: "Average patient wait time.",
    byRange: {
      today: { value: "12 min", deltaText: "3 min vs last Friday", trend: "down", spark: [18, 16, 15, 14, 13, 13, 12] },
      "7d": { value: "12 min", deltaText: "avg 13.4 min over period", trend: "flat", informational: true, spark: [16, 15.5, 15, 14.5, 14, 13.8, 13.5, 13.4] },
      "30d": { value: "12 min", deltaText: "avg 14.1 min over period", trend: "flat", informational: true, spark: [16, 15.5, 15, 14.6, 14.3, 14.1] },
    },
  },
];

const ADMIN_DEFAULT_SELECTED = ["checked-in-now", "utilisation"];

export const KPI_CONFIG: Record<Role, RoleKpiConfig> = {
  // ---------------------------------------------------------------- Admin
  Admin: {
    locked: ADMIN_LOCKED,
    pool: ADMIN_POOL,
    defaultSelected: ADMIN_DEFAULT_SELECTED,
  },

  // ------------------------------------------------------------ Reception
  // Mirrors Admin's cards exactly, minus New Registrations and Average
  // Wait — Reception's own front desk queue already surfaces registration
  // and wait-time signal at the row level, so those two would be redundant
  // here.
  Reception: {
    locked: ADMIN_LOCKED,
    pool: ADMIN_POOL.filter((k) => k.id !== "new-registrations" && k.id !== "average-wait"),
    defaultSelected: ADMIN_DEFAULT_SELECTED,
  },

  // ----------------------------------------------------------------- Nurse
  Nurse: {
    locked: [
      {
        id: "my-patients-today", label: "My Patients Today", kind: "period",
        desc: "Patients assigned to you in the period.",
        byRange: {
          today: { value: "6", deltaText: "1 vs last Friday", trend: "up", spark: [4, 5, 5, 6, 5, 5, 6] },
          "7d": { value: "31", deltaText: "4 vs previous 7 days", trend: "up", spark: [24, 25, 27, 26, 28, 29, 28, 31], label: "My Patients" },
          "30d": { value: "128", deltaText: "6 vs previous 30 days", trend: "down", spark: [120, 125, 130, 134, 131, 128], label: "My Patients" },
        },
      },
      {
        id: "awaiting-me", label: "Awaiting Me", kind: "live", inverse: true,
        desc: "Journeys waiting on a nurse action.",
        byRange: {
          today: { value: "2", deltaText: "1 vs last Friday", trend: "down", spark: [3, 3, 2, 3, 2, 2, 2] },
          "7d": { value: "2", deltaText: "avg 2.8 over period", trend: "flat", informational: true, spark: [3.2, 3.0, 2.9, 2.8, 2.7, 2.8, 2.9, 2.8] },
          "30d": { value: "2", deltaText: "avg 3.1 over period", trend: "flat", informational: true, spark: [3.4, 3.3, 3.2, 3.1, 3.1, 3.1] },
        },
      },
    ],
    pool: [
      {
        id: "in-journey-now", label: "In Journey Now", kind: "live",
        desc: "Patients currently mid-journey.",
        byRange: {
          today: { value: "4", deltaText: "1 vs last hour", trend: "up", spark: [2, 3, 3, 4, 3, 4, 4] },
          "7d": { value: "4", deltaText: "avg 3.5 over period", trend: "flat", informational: true, spark: [3.0, 3.2, 3.3, 3.4, 3.6, 3.5, 3.6, 3.5] },
          "30d": { value: "4", deltaText: "avg 3.2 over period", trend: "flat", informational: true, spark: [3.0, 3.1, 3.2, 3.2, 3.3, 3.2] },
        },
      },
      {
        id: "samples-to-collect", label: "Samples To Collect", kind: "hybrid", inverse: true,
        desc: "Today: samples still waiting to be collected. 7d/30d: samples collected in the period.",
        byRange: {
          today: { value: "3", deltaText: "1 vs last Friday", trend: "down", spark: [5, 4, 4, 3, 4, 3, 3] },
          "7d": { value: "22", deltaText: "3 vs previous 7 days", trend: "up", spark: [16, 17, 18, 19, 20, 21, 19, 22], label: "Samples Collected", inverse: false },
          "30d": { value: "87", deltaText: "5 vs previous 30 days", trend: "down", spark: [80, 84, 90, 93, 91, 87], label: "Samples Collected", inverse: false },
        },
      },
      {
        id: "consents-pending", label: "Consents Pending", kind: "live", inverse: true,
        desc: "Consent forms awaiting signature.",
        byRange: {
          today: { value: "2", deltaText: "0 vs last Friday", trend: "flat", spark: [2, 3, 2, 2, 3, 2, 2] },
          "7d": { value: "2", deltaText: "avg 2.3 over period", trend: "flat", informational: true, spark: [2.6, 2.5, 2.4, 2.3, 2.2, 2.3, 2.4, 2.3] },
          "30d": { value: "2", deltaText: "avg 2.6 over period", trend: "flat", informational: true, spark: [2.8, 2.7, 2.6, 2.6, 2.7, 2.6] },
        },
      },
      {
        id: "rooms-in-use", label: "Rooms In Use", kind: "live",
        desc: "Clinic rooms currently occupied.",
        byRange: {
          today: { value: "3/5", deltaText: "1 vs last hour", trend: "up", spark: [2, 2, 3, 3, 4, 3, 3] },
          "7d": { value: "3/5", deltaText: "avg 3.1 over period", trend: "flat", informational: true, spark: [2.8, 2.9, 3.0, 3.1, 3.2, 3.1, 3.0, 3.1] },
          "30d": { value: "3/5", deltaText: "avg 2.9 over period", trend: "flat", informational: true, spark: [2.7, 2.8, 2.9, 2.9, 3.0, 2.9] },
        },
      },
    ],
    defaultSelected: ["in-journey-now", "samples-to-collect"],
  },

  // ------------------------------------------------------------- Clinician
  Clinician: {
    locked: [
      {
        id: "results-to-review", label: "Results To Review", kind: "live", inverse: true, route: "/patients",
        desc: "Results waiting for your review.",
        byRange: {
          today: { value: "5", deltaText: "2 vs last Friday", trend: "down", spark: [8, 7, 7, 6, 6, 5, 5] },
          "7d": { value: "5", deltaText: "avg 6.1 over period", trend: "flat", informational: true, spark: [7.2, 7.0, 6.8, 6.5, 6.3, 6.1, 6.0, 6.1] },
          "30d": { value: "5", deltaText: "avg 6.8 over period", trend: "flat", informational: true, spark: [7.8, 7.5, 7.2, 7.0, 6.9, 6.8] },
        },
      },
      {
        id: "awaiting-sign-off", label: "Awaiting My Sign Off", kind: "live", inverse: true, route: "/patients",
        desc: "Reports awaiting your signature.",
        byRange: {
          today: { value: "3", deltaText: "1 vs last Friday", trend: "down", spark: [5, 5, 4, 4, 3, 3, 3] },
          "7d": { value: "3", deltaText: "avg 3.6 over period", trend: "flat", informational: true, spark: [4.2, 4.0, 3.9, 3.8, 3.7, 3.6, 3.7, 3.6] },
          "30d": { value: "3", deltaText: "avg 4.0 over period", trend: "flat", informational: true, spark: [4.5, 4.3, 4.2, 4.1, 4.0, 4.0] },
        },
      },
    ],
    pool: [
      {
        id: "my-appointments", label: "My Appointments", kind: "period",
        desc: "Your appointments scheduled in the period.",
        byRange: {
          today: { value: "7", deltaText: "1 vs last Friday", trend: "up", spark: [5, 6, 6, 7, 6, 6, 7] },
          "7d": { value: "44", deltaText: "3 vs previous 7 days", trend: "up", spark: [36, 38, 39, 40, 42, 41, 43, 44] },
          "30d": { value: "183", deltaText: "7 vs previous 30 days", trend: "up", spark: [160, 165, 170, 174, 178, 183] },
        },
      },
      {
        id: "video-calls-today", label: "Video Calls Today", kind: "period",
        desc: "Video consultations booked in the period.",
        byRange: {
          today: { value: "2", deltaText: "1 vs last Friday", trend: "up", spark: [1, 1, 2, 1, 2, 1, 2] },
          "7d": { value: "11", deltaText: "2 vs previous 7 days", trend: "up", spark: [7, 8, 8, 9, 10, 9, 10, 11], label: "Video Calls" },
          "30d": { value: "42", deltaText: "3 vs previous 30 days", trend: "down", spark: [38, 40, 44, 46, 45, 42], label: "Video Calls" },
        },
      },
      {
        id: "patients-triaged", label: "Patients Triaged", kind: "period",
        desc: "Patients triaged by you in the period.",
        byRange: {
          today: { value: "4", deltaText: "1 vs last Friday", trend: "up", spark: [2, 3, 3, 4, 3, 4, 4] },
          "7d": { value: "24", deltaText: "2 vs previous 7 days", trend: "up", spark: [18, 19, 20, 21, 22, 21, 23, 24] },
          "30d": { value: "98", deltaText: "4 vs previous 30 days", trend: "up", spark: [85, 88, 90, 93, 95, 98] },
        },
      },
      {
        id: "follow-ups-to-book", label: "Follow Ups To Book", kind: "live",
        desc: "Follow-up appointments still to schedule.",
        byRange: {
          today: { value: "3", deltaText: "0 vs last Friday", trend: "flat", spark: [3, 4, 3, 3, 4, 3, 3] },
          "7d": { value: "3", deltaText: "avg 3.2 over period", trend: "flat", informational: true, spark: [3.4, 3.3, 3.2, 3.1, 3.2, 3.3, 3.2, 3.2] },
          "30d": { value: "3", deltaText: "avg 3.4 over period", trend: "flat", informational: true, spark: [3.6, 3.5, 3.4, 3.4, 3.5, 3.4] },
        },
      },
    ],
    defaultSelected: ["my-appointments", "video-calls-today"],
  },
};
