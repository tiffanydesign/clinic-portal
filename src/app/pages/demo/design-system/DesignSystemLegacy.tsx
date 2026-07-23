import React from "react";

// Static inventory (grep'd fresh during the design-system consolidation
// task on 2026-07-23, not live-scanned at runtime) of pre-existing ad-hoc
// implementations that predate the standardized Input/Button/Modal/Drawer.
// Migrate opportunistically when touching these files for other reasons —
// this task does not migrate them.
const LEGACY_MODALS = [
  "pages/app/availability/BlockedTimeModal.tsx",
  "pages/app/availability/ConflictModal.tsx",
  "pages/app/availability/LeaveRequestModal.tsx",
  "pages/app/availability/RejectReasonModal.tsx",
  "pages/app/availability/RequestCentreModal.tsx",
  "pages/app/availability/WithdrawModal.tsx",
  "pages/app/calendar/CreateModals.tsx",
  "pages/app/calendar/MyScheduleView.tsx",
  "pages/app/clinic-settings/ConsentFormPage.tsx",
  "pages/app/clinic-settings/RoomDeactivateDialog.tsx",
  "pages/app/clinic-settings/VersionHistoryPanel.tsx",
  "pages/app/clinic-settings/settingsUiShared.tsx",
  "pages/app/consent-sign/ConsentSignPage.tsx",
  "pages/app/dashboard/FrontDeskQueue.tsx",
  "pages/app/dashboard/KpiBar.tsx",
  "pages/app/dashboard/journey/JourneyDialogs.tsx",
  "pages/app/patient-record/ClinicianNotesTab.tsx",
  "pages/app/patients/RegisterPatientModal.tsx",
  "pages/app/staff/AddStaffModal.tsx",
  "pages/app/staff/ImportStaffModal.tsx",
  "pages/app/staff/StaffOverviewTab.tsx",
  "pages/app/staff/StaffWorkloadTab.tsx",
];

const LEGACY_INPUTS = [
  "pages/app/BillingPage.tsx",
  "pages/app/PatientsPage.tsx",
  "pages/app/ProfilePage.tsx",
  "pages/app/Timesheet.tsx",
  "pages/app/availability/LeaveRequestModal.tsx",
  "pages/app/clinic-settings/DeviceAddDrawer.tsx",
  "pages/app/clinic-settings/DeviceDetailDrawer.tsx",
  "pages/app/patients/RegisterPatientModal.tsx",
  "pages/app/staff/AddStaffModal.tsx",
  "pages/app/staff/StaffListPage.tsx",
];

function LegacyList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-surface rounded-card border border-divider p-4 mb-4">
      <h4 className="text-section font-bold text-ink mb-2">{title} ({items.length})</h4>
      <ul className="space-y-1">
        {items.map((f) => <li key={f} className="text-label text-ink-muted font-mono truncate">{f}</li>)}
      </ul>
    </div>
  );
}

export function DesignSystemLegacy() {
  return (
    <section id="legacy" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Legacy inventory</h2>
      <p className="text-label text-ink-muted mb-4 px-0.5">Not migrated by this task — listed here so migration is trackable and opportunistic, not a silent debt pile. Grep'd fresh on 2026-07-23.</p>
      <LegacyList title="Hand-rolled modal shells (should become Modal / Drawer)" items={LEGACY_MODALS} />
      <LegacyList title="Raw <input> elements (should become Input)" items={LEGACY_INPUTS} />
    </section>
  );
}
