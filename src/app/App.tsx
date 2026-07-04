import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate, useParams, Link } from "react-router";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Toaster, toast } from 'sonner';

// Auth
import { LoginPage } from "./pages/auth/LoginPage";
import { TwoFactorPage } from "./pages/auth/TwoFactorPage";
import { EnrollmentPage } from "./pages/auth/EnrollmentPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";

// App components
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import {
  AppointmentDrawerSkeleton, PatientsPage, PatientRecordLayout,
  StaffListPage, StaffDetailLayout, StaffOverviewTab, StaffAvailabilityTab, StaffPermissionsTab, StaffWorkloadTab,
  SettingsLayout, ReportsPage, DiagnosesPage, FormTemplatesPage, ConsentFilesPage, BillingPage, FeedbackAdminPage,
  NotificationsSkeleton, ApprovalSkeleton, ApprovalDetailSkeleton, ProfilePage, SiteMap, TabContentSkeleton,
  NewPatientSkeleton, JourneyDetailSkeleton, CalendarLayout, CalendarScheduleSkeleton, AvailabilityList, AvailabilityEdit, TeamAvailability,
  TimesheetPage
} from "./pages/app/AppPages";

// Route Guard Data
const ALLOWED_ROUTES = {
  Admin: ["/dashboard", "/calendar", "/patients", "/staff", "/clinic-settings", "/billing", "/feedback", "/timesheet", "/notifications", "/approval", "/profile", "/site-map"],
  Reception: ["/dashboard", "/calendar", "/patients", "/billing", "/notifications", "/profile", "/site-map"],
  Nurse: ["/dashboard", "/calendar", "/patients", "/availability", "/notifications", "/profile", "/site-map"],
  Clinician: ["/dashboard", "/calendar", "/patients", "/availability", "/notifications", "/approval", "/profile", "/site-map"]
};

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { role } = useAppContext(); // Removed isAuthenticated dependency for bypass
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Root paths check
    const currentBase = "/" + location.pathname.split("/")[1];
    
    // Check if the current base route is allowed for this role
    if (!ALLOWED_ROUTES[role].includes(currentBase) && currentBase !== "/site-map" && currentBase !== "/") {
      toast.error(`No access: ${role} cannot view this page.`);
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, role, navigate]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Temporary bypass for review: always allow access.
  // const { isAuthenticated } = useAppContext();
  // if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <RoleGuard>{children}</RoleGuard>;
}

function AppShellLayout({ children }: { children?: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>
        {children || <Outlet />}
      </AppShell>
    </ProtectedRoute>
  );
}

// Redirect helpers for nested default routes
const RedirectTo = ({ to }: { to: string }) => <Navigate to={to} replace />;

// Param-aware redirect: /staff/:staffId -> /staff/:staffId/overview
function StaffDetailRedirect() {
  const { staffId } = useParams();
  return <Navigate to={`/staff/${staffId}/overview`} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RedirectTo to="/dashboard" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/2fa" element={<TwoFactorPage />} />
          <Route path="/enrollment" element={<EnrollmentPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password/verify" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/done" element={<ForgotPasswordPage />} />
          <Route path="/site-map" element={<AppShellLayout><SiteMap /></AppShellLayout>} />
          <Route path="/dashboard" element={<AppShellLayout><Dashboard /></AppShellLayout>} />
          <Route path="/calendar" element={<RedirectTo to="/calendar/schedule" />} />
          <Route path="/calendar/schedule" element={<AppShellLayout><CalendarLayout><CalendarScheduleSkeleton /></CalendarLayout></AppShellLayout>} />
          <Route path="/calendar/schedule/appointment/A-101" element={<AppShellLayout><CalendarLayout><CalendarScheduleSkeleton><AppointmentDrawerSkeleton /></CalendarScheduleSkeleton></CalendarLayout></AppShellLayout>} />
          
          <Route path="/calendar/team-availability" element={<AppShellLayout><CalendarLayout><TeamAvailability /></CalendarLayout></AppShellLayout>} />

          {/* New Availability Routes */}
          <Route path="/calendar/my-availability" element={<AppShellLayout><CalendarLayout><AvailabilityList /></CalendarLayout></AppShellLayout>} />
          <Route path="/calendar/my-availability/:id" element={<AppShellLayout><CalendarLayout><AvailabilityEdit /></CalendarLayout></AppShellLayout>} />
          <Route path="/patients" element={<AppShellLayout><PatientsPage /></AppShellLayout>} />
          <Route path="/patients/new" element={<AppShellLayout><NewPatientSkeleton /></AppShellLayout>} />
          <Route path="/patients/P-001" element={<RedirectTo to="/patients/P-001/overview" />} />
          <Route path="/patients/P-001/overview" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Overview Tab Content" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/results" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Results Tab Content" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/journeys" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Journeys Tab Content" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/signed-forms" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Signed Forms Table" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/notes" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Clinician Notes Editor" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/appointments" element={<AppShellLayout><PatientRecordLayout><TabContentSkeleton label="Patient Appointments History" /></PatientRecordLayout></AppShellLayout>} />
          <Route path="/patients/P-001/journeys/J-123" element={<AppShellLayout><JourneyDetailSkeleton /></AppShellLayout>} />
          <Route path="/staff" element={<AppShellLayout><StaffListPage /></AppShellLayout>} />
          <Route path="/staff/:staffId" element={<StaffDetailRedirect />} />
          <Route path="/staff/:staffId/overview" element={<AppShellLayout><StaffDetailLayout><StaffOverviewTab /></StaffDetailLayout></AppShellLayout>} />
          <Route path="/staff/:staffId/availability" element={<AppShellLayout><StaffDetailLayout><StaffAvailabilityTab /></StaffDetailLayout></AppShellLayout>} />
          <Route path="/staff/:staffId/permissions" element={<AppShellLayout><StaffDetailLayout><StaffPermissionsTab /></StaffDetailLayout></AppShellLayout>} />
          <Route path="/staff/:staffId/workload" element={<AppShellLayout><StaffDetailLayout><StaffWorkloadTab /></StaffDetailLayout></AppShellLayout>} />
          <Route path="/clinic-settings" element={<RedirectTo to="/clinic-settings/reports" />} />
          <Route path="/clinic-settings/reports" element={<AppShellLayout><SettingsLayout><ReportsPage /></SettingsLayout></AppShellLayout>} />
          <Route path="/clinic-settings/diagnoses" element={<AppShellLayout><SettingsLayout><DiagnosesPage /></SettingsLayout></AppShellLayout>} />
          <Route path="/clinic-settings/form-templates" element={<AppShellLayout><SettingsLayout><FormTemplatesPage /></SettingsLayout></AppShellLayout>} />
          <Route path="/clinic-settings/consent-files" element={<AppShellLayout><SettingsLayout><ConsentFilesPage /></SettingsLayout></AppShellLayout>} />
          <Route path="/billing" element={<AppShellLayout><BillingPage /></AppShellLayout>} />
          <Route path="/feedback" element={<AppShellLayout><FeedbackAdminPage /></AppShellLayout>} />
          <Route path="/timesheet" element={<AppShellLayout><TimesheetPage /></AppShellLayout>} />
          <Route path="/notifications" element={<AppShellLayout><NotificationsSkeleton /></AppShellLayout>} />
          <Route path="/approval" element={<AppShellLayout><ApprovalSkeleton /></AppShellLayout>} />
          <Route path="/approval/REQ-1" element={<AppShellLayout><ApprovalDetailSkeleton /></AppShellLayout>} />
          <Route path="/profile" element={<AppShellLayout><ProfilePage /></AppShellLayout>} />
          <Route path="*" element={<AppShellLayout><div className="p-8"><h1 className="text-2xl font-bold mb-4">404 - Not Found</h1><Link to="/site-map" className="text-slate-600 hover:underline">Go to Site Map</Link></div></AppShellLayout>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
