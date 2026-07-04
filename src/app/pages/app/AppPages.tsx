import React from "react";
import { Link, Outlet, useLocation, useParams, useNavigate } from "react-router";
import { useAppContext } from "../../context/AppContext";

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

export { CalendarLayout, CalendarScheduleSkeleton, AvailabilityList, AvailabilityEdit } from "./CalendarViews";
export { TeamAvailability } from "./TeamAvailability";

export function AppointmentDrawerSkeleton() {
  const navigate = useNavigate();
  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-gray-50 border-l border-gray-300 shadow-xl z-10 flex flex-col animate-in slide-in-from-right">
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
export { PatientRecordLayout } from "./PatientRecordLayout";

export function StaffLayout({ children }: { children?: React.ReactNode }) {
  const { staffId } = useParams();
  const location = useLocation();

  const tabs = [
    { label: "Overview", path: `/staff/${staffId}/overview` },
    { label: "Availability", path: `/staff/${staffId}/availability` },
    { label: "Permissions", path: `/staff/${staffId}/permissions` },
    { label: "Workload", path: `/staff/${staffId}/workload` },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 pb-4 shrink-0">
        <Link to="/staff" className="text-sm text-slate-500 hover:underline mb-4 inline-block">← Back to Staff</Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Staff Profile {staffId}</h1>
      </div>

      <div className="px-8 border-b border-gray-300 flex space-x-8 shrink-0">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`py-3 text-sm font-medium ${location.pathname.startsWith(tab.path) ? 'border-b-2 border-slate-600 text-slate-800' : 'text-gray-500 border-b-2 border-transparent'}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="p-8 flex-1 overflow-auto">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export { SettingsLayout } from "./clinic-settings/SettingsLayout";
export { ReportsPage } from "./clinic-settings/Reports";
export { DiagnosesPage } from "./clinic-settings/Diagnoses";
export { FormTemplatesPage } from "./clinic-settings/FormTemplates";
export { ConsentFilesPage } from "./clinic-settings/ConsentFiles";

// Expose the Profile Page instead of the skeleton
export { ProfilePage } from "./ProfilePage";

// Generic Skeletons
export const TabContentSkeleton = ({ label }: { label: string }) => <PlaceholderBlock label={label} className="h-64 border-dashed bg-gray-50" />;
export const NewPatientSkeleton = () => <SkeletonPage title="New Patient"><PlaceholderBlock label="Patient Intake Form" className="h-96" /></SkeletonPage>;
export const JourneyDetailSkeleton = () => <SkeletonPage title="Journey Detail"><PlaceholderBlock label="Journey Steps & Updates" className="h-96" /></SkeletonPage>;
export const StaffListSkeleton = () => <SkeletonPage title="Staff Management"><PlaceholderBlock label="Staff List" className="h-96" /><div className="mt-4"><Link to="/staff/S-001" className="text-slate-600 hover:underline">Demo: View Staff S-001</Link></div></SkeletonPage>;
export { BillingPage } from "./BillingPage";
export { FeedbackAdminPage } from "./FeedbackAdminPage";
export { TimesheetPage } from "./Timesheet";
export const NotificationsSkeleton = () => <SkeletonPage title="Notifications"><PlaceholderBlock label="Unread / All Notifications List" className="h-96" /></SkeletonPage>;
export const ApprovalSkeleton = () => <SkeletonPage title="Approvals"><PlaceholderBlock label="Pending Clinician Access Requests" className="h-96" /><div className="mt-4"><Link to="/approval/REQ-1" className="text-slate-600 hover:underline">Demo: View Request REQ-1</Link></div></SkeletonPage>;
export const ApprovalDetailSkeleton = () => <SkeletonPage title="Approval Request"><Link to="/approval" className="mb-4 inline-block text-sm text-slate-500">← Back</Link><PlaceholderBlock label="Request Details & Actions" className="h-96" /></SkeletonPage>;
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
      { path: "/patients/new", label: "New Patient Form" },
      { path: "/billing", label: "Billing" },
      { path: "/notifications", label: "Notifications" },
      { path: "/profile", label: "Profile" },
    ]},
    { section: "Patient Record (Nested)", links: [
      { path: "/patients/P-001", label: "Patient Record -> Redirects to Overview" },
      { path: "/patients/P-001/overview", label: "Overview Tab" },
      { path: "/patients/P-001/results", label: "Results Tab" },
      { path: "/patients/P-001/journeys", label: "Journeys Tab" },
      { path: "/patients/P-001/journeys/J-123", label: "Journey Details" },
      { path: "/patients/P-001/signed-forms", label: "Signed Forms Tab" },
      { path: "/patients/P-001/notes", label: "Clinician Notes Tab" },
      { path: "/patients/P-001/appointments", label: "Appointments Tab" },
    ]},
    { section: "Admin & Clinician Only", links: [
      { path: "/staff", label: "Staff List" },
      { path: "/staff/S-001", label: "Staff Detail -> Redirects to Overview" },
      { path: "/clinic-settings", label: "Clinic Settings -> Redirects to Reports" },
      { path: "/clinic-settings/form-templates", label: "Clinic Settings (Form Templates)" },
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
