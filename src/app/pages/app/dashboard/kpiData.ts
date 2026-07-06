// Per-role KPI catalogs for the Dashboard KPI Bar.
// Each role has 2 locked (clinic-set) cards + a pool of configurable metrics,
// of which 2 are selected by default. The "Customise KPIs" modal lets the user
// swap the 2 configurable slots (never the locked ones).

import type { Role } from "../../../context/AppContext";

export type Kpi = {
  id: string;
  label: string;
  value: string;
  desc: string; // shown in the customise modal
  delta?: { text: string; trend: "up" | "down" | "flat" };
  spark: number[]; // last 7 days
  route?: string;
};

export type RoleKpiConfig = {
  locked: Kpi[]; // exactly 2, cannot be changed
  pool: Kpi[]; // configurable options (includes the defaults)
  defaultSelected: string[]; // exactly 2 ids from pool
};

export const KPI_CONFIG: Record<Role, RoleKpiConfig> = {
  Admin: {
    locked: [
      { id: "appts-today", label: "Appointments Today", value: "14", desc: "Total booked appointments across the clinic today.", delta: { text: "3 vs last Friday", trend: "up" }, spark: [10, 12, 11, 13, 12, 11, 14], route: "/calendar/schedule" },
      { id: "results-pending", label: "Results Pending Review", value: "7", desc: "Results awaiting clinician sign-off.", delta: { text: "2 vs last Friday", trend: "down" }, spark: [11, 10, 9, 9, 8, 8, 7], route: "/patients" },
    ],
    pool: [
      { id: "checked-in-now", label: "Checked In Now", value: "5", desc: "Patients currently checked in at the clinic.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [3, 4, 4, 5, 4, 5, 5], route: "/dashboard" },
      { id: "utilisation", label: "Utilisation", value: "78%", desc: "Clinic capacity used across all rooms today.", delta: { text: "4% vs last Friday", trend: "up" }, spark: [70, 72, 74, 73, 76, 77, 78], route: "/calendar/schedule" },
      { id: "scans-today", label: "Scans Completed Today", value: "3", desc: "Body scans completed so far today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [4, 5, 3, 4, 2, 3, 3] },
      { id: "no-show-rate", label: "No Show Rate", value: "4.2%", desc: "Percentage of no-shows this month.", delta: { text: "0.6% vs last month", trend: "down" }, spark: [5.1, 4.9, 4.8, 4.6, 4.4, 4.3, 4.2] },
      { id: "new-registrations", label: "New Registrations", value: "38", desc: "New patients registered this month.", delta: { text: "6 vs last month", trend: "up" }, spark: [28, 30, 31, 33, 35, 36, 38], route: "/patients" },
      { id: "average-wait", label: "Average Wait", value: "12 min", desc: "Average patient wait time today.", delta: { text: "3 min vs last Friday", trend: "down" }, spark: [18, 16, 15, 14, 13, 13, 12] },
    ],
    defaultSelected: ["checked-in-now", "utilisation"],
  },
  Reception: {
    locked: [
      { id: "arrivals-expected", label: "Arrivals Expected", value: "14", desc: "Patients expected to arrive today.", delta: { text: "3 vs last Friday", trend: "up" }, spark: [10, 12, 11, 13, 12, 11, 14] },
      { id: "checked-in", label: "Checked In", value: "6", desc: "Patients checked in so far today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [4, 5, 4, 5, 5, 5, 6] },
    ],
    pool: [
      { id: "in-clinic-now", label: "In Clinic Now", value: "5", desc: "Patients currently inside the clinic.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [3, 4, 4, 5, 4, 5, 5] },
      { id: "unpaid-balances", label: "Unpaid Balances", value: "3", desc: "Appointments with outstanding balances today.", delta: { text: "1 vs last Friday", trend: "down" }, spark: [5, 4, 4, 3, 4, 3, 3], route: "/billing" },
      { id: "awaiting-checkin", label: "Awaiting Check In", value: "3", desc: "Patients arrived but not yet checked in.", delta: { text: "0 vs last Friday", trend: "flat" }, spark: [2, 3, 2, 3, 3, 2, 3] },
      { id: "walk-ins", label: "Walk Ins", value: "2", desc: "Unscheduled walk-in patients today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [0, 1, 1, 2, 1, 1, 2] },
    ],
    defaultSelected: ["in-clinic-now", "unpaid-balances"],
  },
  Nurse: {
    locked: [
      { id: "my-patients-today", label: "My Patients Today", value: "6", desc: "Patients assigned to you today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [4, 5, 5, 6, 5, 5, 6] },
      { id: "awaiting-me", label: "Awaiting Me", value: "2", desc: "Journeys waiting on a nurse action.", delta: { text: "1 vs last Friday", trend: "down" }, spark: [3, 3, 2, 3, 2, 2, 2] },
    ],
    pool: [
      { id: "in-journey-now", label: "In Journey Now", value: "4", desc: "Patients currently mid-journey.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [2, 3, 3, 4, 3, 4, 4] },
      { id: "samples-to-collect", label: "Samples To Collect", value: "3", desc: "Samples still to be collected today.", delta: { text: "1 vs last Friday", trend: "down" }, spark: [5, 4, 4, 3, 4, 3, 3] },
      { id: "consents-pending", label: "Consents Pending", value: "2", desc: "Consent forms awaiting signature.", delta: { text: "0 vs last Friday", trend: "flat" }, spark: [2, 3, 2, 2, 3, 2, 2] },
      { id: "rooms-in-use", label: "Rooms In Use", value: "3/5", desc: "Clinic rooms currently occupied.", delta: { text: "1 vs last hour", trend: "up" }, spark: [2, 2, 3, 3, 4, 3, 3] },
    ],
    defaultSelected: ["in-journey-now", "samples-to-collect"],
  },
  Clinician: {
    locked: [
      { id: "results-to-review", label: "Results To Review", value: "5", desc: "Results waiting for your review.", delta: { text: "2 vs last Friday", trend: "down" }, spark: [8, 7, 7, 6, 6, 5, 5], route: "/patients" },
      { id: "awaiting-sign-off", label: "Awaiting My Sign Off", value: "3", desc: "Reports awaiting your signature.", delta: { text: "1 vs last Friday", trend: "down" }, spark: [5, 5, 4, 4, 3, 3, 3], route: "/patients" },
    ],
    pool: [
      { id: "my-appointments", label: "My Appointments", value: "7", desc: "Your appointments scheduled today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [5, 6, 6, 7, 6, 6, 7] },
      { id: "video-calls-today", label: "Video Calls Today", value: "2", desc: "Video consultations booked today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [1, 1, 2, 1, 2, 1, 2] },
      { id: "patients-triaged", label: "Patients Triaged", value: "4", desc: "Patients triaged by you today.", delta: { text: "1 vs last Friday", trend: "up" }, spark: [2, 3, 3, 4, 3, 4, 4] },
      { id: "follow-ups-to-book", label: "Follow Ups To Book", value: "3", desc: "Follow-up appointments still to schedule.", delta: { text: "0 vs last Friday", trend: "flat" }, spark: [3, 4, 3, 3, 4, 3, 3] },
    ],
    defaultSelected: ["my-appointments", "video-calls-today"],
  },
};
