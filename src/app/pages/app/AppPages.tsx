import React from "react";
import { Link, useNavigate } from "react-router";
import { useAppContext } from "../../context/AppContext";
import { AvailabilityApprovalPage } from "./availability/AvailabilityApprovalPage";
import { ClinicianRequestsPage } from "./availability/ClinicianRequestsPage";
export { NotificationsPage } from "./NotificationsPage";

export function SkeletonPage({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="p-8 w-full h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-8 italic">Detailed content in a later pass</p>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export const PlaceholderBlock = ({ label, className = "" }: { label: string, className?: string }) => (
  <div className={`border border-gray-300 bg-white rounded flex items-center justify-center text-sm font-medium text-gray-400 p-4 ${className}`}>
    {label}
  </div>
);

// Specific Skeletons
export function DashboardSkeleton() {
  const { role } = useAppContext();
  return (
    <SkeletonPage title={`Dashboard - ${role}`}>
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map(i => <PlaceholderBlock key={i} label="KPI Box" className="h-24" />)}
      </div>
      <div className="grid grid-cols-3 gap-6 h-96">
        <PlaceholderBlock label={`Role Work-List / Timeline (${role})`} className="col-span-2 h-full" />
        <PlaceholderBlock label="Secondary Info / AI Insight" className="col-span-1 h-full" />
      </div>
    </SkeletonPage>
  );
}

export { CalendarLayout, CalendarScheduleSkeleton, AvailabilityList } from "./CalendarViews";
export { AvailabilityEditorPage as AvailabilityEdit } from "./availability/AvailabilityEditorPage";
export { SchedulePage } from "./calendar/SchedulePage";
export { AvailabilityPage } from "./AvailabilityPage";

export function AppointmentDrawerSkeleton() {
  const navigate = useNavigate();
  return (
    <div className="absolute top-0 right-0 w-[500px] h-full bg-gray-50 border-l border-gray-300 shadow-xl z-10 flex flex-col animate-in slide-in-from-right">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-white">
        <h3 className="font-bold text-gray-800">Appointment Details</h3>
        <button onClick={() => navigate('/calendar')} className="text-gray-500 hover:text-gray-800">Close</button>
      </div>
      <div className="flex-1 p-6">
        <PlaceholderBlock label="Right-Side Drawer Content" className="h-full border-dashed" />
      </div>
    </div>
  );
}

export { PatientsPage } from "./PatientsPage";

// Patient Record module
export { PatientRecordLayout, PatientRecordRedirect } from "./patient-record/PatientRecordLayout";
export { OverviewTab as PatientOverviewTab } from "./patient-record/OverviewTab";
export { ResultsTab as PatientResultsTab } from "./patient-record/ResultsTab";
export { JourneysTab as PatientJourneysTab } from "./patient-record/JourneysTab";
export { JourneyDetailPage as PatientJourneyDetailPage } from "./patient-record/JourneyDetailPage";
export { SignedFormsTab as PatientSignedFormsTab } from "./patient-record/SignedFormsTab";
export { ClinicianNotesTab as PatientClinicianNotesTab } from "./patient-record/ClinicianNotesTab";
export { AppointmentsTab as PatientAppointmentsTab } from "./patient-record/AppointmentsTab";

// Staff Management module
export { StaffListPage } from "./staff/StaffListPage";
export { StaffDetailLayout } from "./staff/StaffDetailLayout";
export { StaffOverviewTab } from "./staff/StaffOverviewTab";
export { StaffAvailabilityTab } from "./staff/StaffAvailabilityTab";
export { StaffPermissionsTab } from "./staff/StaffPermissionsTab";
export { StaffWorkloadTab } from "./staff/StaffWorkloadTab";

export { ConsentFormPage } from "./clinic-settings/ConsentFormPage";
export { ClinicSettingsHubPage } from "./clinic-settings/ClinicSettingsHubPage";
export { RoomsPage } from "./clinic-settings/RoomsPage";
export { DevicesPage } from "./clinic-settings/DevicesPage";

// Expose the Profile Page instead of the skeleton
export { ProfilePage } from "./ProfilePage";

// Generic Skeletons
export { BillingPage } from "./BillingPage";
export { FeedbackAdminPage } from "./FeedbackAdminPage";
export { TimesheetPage } from "./Timesheet";
export const ApprovalDetailSkeleton = () => <SkeletonPage title="Approval Request"><Link to="/approval" className="mb-4 inline-block text-sm text-slate-500">← Back</Link><PlaceholderBlock label="Request Details & Actions" className="h-96" /></SkeletonPage>;

// Admin approves availability requests (the real queue); a Clinician can't
// approve anything themselves, so /approval instead shows the status of
// what *they've* submitted — see ClinicianRequestsPage.
export function ApprovalRouter() {
  const { role } = useAppContext();
  return role === "Admin" ? <AvailabilityApprovalPage /> : <ClinicianRequestsPage />;
}
export const AvailabilitySkeleton = () => <SkeletonPage title="Availability"><PlaceholderBlock label="Slot Editor" className="h-96" /></SkeletonPage>;

// Site Map
export function SiteMap() {
  const routes = [
    { section: "Auth (Public)", links: [
      { path: "/login", label: "Login" },
      { path: "/login/2fa", label: "Two-Factor (needs pending auth)" },
      { path: "/enrollment", label: "Enrollment (needs first-time auth)" },
      { path: "/forgot-password", label: "Forgot Password (Email)" },
      { path: "/forgot-password/verify", label: "Forgot Password (Verify)" },
      { path: "/reset-password", label: "Reset Password (New Pwd)" },
      { path: "/reset-password/done", label: "Reset Password (Success)" },
    ]},
    { section: "App Base", links: [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/calendar", label: "Calendar" },
      { path: "/calendar/appointment/A-101", label: "Calendar > Appt Drawer" },
      { path: "/patients", label: "Patients List" },
      { path: "/billing", label: "Billing" },
      { path: "/notifications", label: "Notifications" },
      { path: "/profile", label: "Profile" },
    ]},
    { section: "Patient Record (Nested)", links: [
      { path: "/patients/P-001", label: "Patient Record -> Redirects to Overview" },
      { path: "/patients/P-001/overview", label: "Overview Tab" },
      { path: "/patients/P-001/results", label: "Results Tab" },
      { path: "/patients/P-001/journeys", label: "Journeys Tab" },
      { path: "/patients/P-001/journeys/J-7OMICS", label: "Journey Details" },
      { path: "/patients/P-001/signed-forms", label: "Signed Forms Tab" },
      { path: "/patients/P-001/notes", label: "Clinician Notes Tab" },
      { path: "/patients/P-001/appointments", label: "Appointments Tab" },
    ]},
    { section: "Admin & Clinician Only", links: [
      { path: "/staff", label: "Staff List" },
      { path: "/staff/EMP-003", label: "Staff Detail -> Redirects to Overview" },
      { path: "/clinic-settings", label: "Clinic Settings (Hub)" },
      { path: "/clinic-settings/consent-form", label: "Clinic Settings -> Consent Form Template" },
      { path: "/clinic-settings/rooms", label: "Clinic Settings -> Rooms" },
      { path: "/clinic-settings/devices", label: "Clinic Settings -> Devices" },
      { path: "/clinic-settings/payment-terminals", label: "Clinic Settings -> Payment Terminals (redirects to Devices)" },
      { path: "/feedback", label: "Feedback" },
      { path: "/timesheet", label: "Timesheet" },
      { path: "/approval", label: "Approvals" },
      { path: "/approval/REQ-1", label: "Approval Detail" },
      { path: "/availability", label: "Availability" },
    ]}
  ];

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Site Map</h1>
      <div className="space-y-8">
        {routes.map(group => (
          <div key={group.section} className="bg-white border border-gray-300 rounded p-6">
            <h2 className="text-lg font-bold text-slate-700 mb-4 pb-2 border-b border-gray-200">{group.section}</h2>
            <div className="grid grid-cols-2 gap-4">
              {group.links.map(link => (
                <Link key={link.path} to={link.path} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
