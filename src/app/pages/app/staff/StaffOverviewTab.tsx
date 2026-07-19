import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  getStaff, getProfileDetails, getSecurity, getOperationalSnapshot, getMonthlyActivity, getMonthlyAttendance,
  CURRENT_ADMIN_ID, statusPillClass,
} from "./staffData";
import { logAudit, AUDIT_ACTOR } from "../clinic-settings/auditStore";
import { Stat } from "../../../components/stat";

function InfoRow({ label, value, amber = false }: { label: string; value: React.ReactNode; amber?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right ${amber ? "text-amber-600 font-bold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function SectionCard({
  title, action, children, footer,
}: {
  title: string; action?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
      {footer && <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">{footer}</div>}
    </div>
  );
}

// A stat tile is only a button when it has somewhere real to go — a dashed-out
// "—" for a non-clinical role stays inert rather than pretending to drill down.
// Thin adapter over the Stat family's T2 `tile` tier — keeps this file's call
// sites readable while every pixel comes from the shared component.
function StatTile({
  id, label, value, amber, onClick,
}: {
  id: string; label: string; value: React.ReactNode; amber?: boolean; onClick?: () => void;
}) {
  return (
    <Stat stat={{ id, label, kind: "count", variant: "tile", value: String(value), alert: amber, onClick }} />
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, onClose, onConfirm,
}: {
  title: string; message: string; confirmLabel: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold transition-colors shadow-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function StaffOverviewTab() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const staff = getStaff(staffId);
  const [accountActive, setAccountActive] = useState(staff?.status !== "Inactive");
  const [showSessions, setShowSessions] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!staff) return null;

  const isClinician = staff.role === "Clinician";
  const isNurse = staff.role === "Nurse";
  const isClinical = isClinician || isNurse;
  const isSelf = staff.id === CURRENT_ADMIN_ID;

  const profile = getProfileDetails(staff.id);
  const security = getSecurity(staff.id);
  const snapshot = isClinical ? getOperationalSnapshot(staff.id) : undefined;
  const activity = isClinician ? getMonthlyActivity(staff.id) : undefined;
  const attendance = getMonthlyAttendance(staff.id);

  const staleLogin = security.lastLoginDaysAgo > 30;
  const no2FA = !security.twoFactorEnabled;

  // Patients' clinician/nurse columns store the assignee's display name, not
  // their Employee ID (see patientsData.ts), so the filter param is name-based
  // here — unlike Schedule's clinician param below, which matches doctorId.
  const goPatients = () => navigate(`/patients?${isNurse ? "nurse" : "clinician"}=${encodeURIComponent(staff.name)}`);
  const goSchedule = () => navigate(isClinician ? `/calendar/schedule?clinician=${staff.id}` : "/calendar/schedule");

  const handleToggleAccount = () => {
    const next = !accountActive;
    setAccountActive(next);
    logAudit({
      actor: AUDIT_ACTOR, entityType: "staff", entityId: staff.id,
      action: next ? "Reactivated account" : "Deactivated account", detail: staff.name,
    });
    toast[next ? "success" : "error"](`${staff.name}'s account ${next ? "reactivated" : "deactivated"}.`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Stat Tiles — the page's first-paint answer to "how loaded is this
          person, and is anything backing up". Results Awaiting is the only
          number on this whole page allowed to turn amber. */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile id="assigned-patients" label="Assigned Patients" value={isClinical ? staff.patients : "—"} onClick={isClinical ? goPatients : undefined} />
        <StatTile id="active-journeys" label="Active Journeys" value={isClinical ? (snapshot?.activeJourneys ?? 0) : "—"} onClick={isClinical ? goPatients : undefined} />
        <StatTile id="upcoming-7-days" label="Upcoming 7 Days" value={isClinical ? (snapshot?.upcoming7Days ?? 0) : "—"} onClick={isClinical ? goSchedule : undefined} />
        {isNurse ? (
          <StatTile id="steps-completed-today" label="Steps Completed Today" value={snapshot?.stepsCompletedToday ?? 0} />
        ) : (
          <StatTile
            id="results-awaiting"
            label="Results Awaiting"
            value={isClinician ? (snapshot?.resultsAwaiting ?? 0) : "—"}
            amber={isClinician && (snapshot?.resultsAwaiting ?? 0) > 0}
            onClick={isClinician ? goPatients : undefined}
          />
        )}
      </div>

      <div className="grid grid-cols-[55fr_45fr] gap-6 items-start">
        {/* This Month — Activity (Clinician only) + Attendance (everyone) */}
        <SectionCard
          title="This Month"
          action={<span className="text-xs text-gray-400 font-medium">{attendance.month}</span>}
          footer={
            <>
              <Link to={`/staff/${staff.id}/workload`} className="text-xs font-bold text-slate-600 hover:underline">View full workload →</Link>
              <Link to="/timesheet" className="text-xs font-bold text-slate-600 hover:underline">View timesheet →</Link>
            </>
          }
        >
          {activity && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Activity</div>
              <InfoRow label="Appointments Completed" value={activity.appointmentsCompleted} />
              <InfoRow label="Consultations (in-person · video)" value={`${activity.inPersonConsults} · ${activity.videoConsults}`} />
              <InfoRow label="Reports Signed Off" value={activity.reportsSignedOff} />
              <InfoRow label="Average Consultation Duration" value={`${activity.avgConsultMinutes} min`} />
            </div>
          )}
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attendance</div>
            <div className="py-2.5 border-b border-gray-100 text-sm text-gray-800 font-medium">
              {attendance.daysPresent} of {attendance.daysScheduled} days
              <span className="text-gray-400 font-normal"> · On Leave {attendance.daysOnLeave} · Attendance {attendance.attendanceRate}% · Overtime {attendance.overtimeHours}h</span>
            </div>
          </div>
        </SectionCard>

        {/* Account & Security */}
        <SectionCard
          title="Account & Security"
          footer={
            !isSelf && (
              <button onClick={() => setConfirming(true)} className="text-xs font-bold text-red-600 hover:underline">
                {accountActive ? "Deactivate account" : "Reactivate account"}
              </button>
            )
          }
        >
          <div className="flex justify-between items-baseline py-2.5 border-b border-gray-100">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusPillClass(accountActive ? "Active" : "Inactive")}`}>
              {accountActive ? "Active" : "Inactive"}
            </span>
          </div>
          <InfoRow label="Last Login" value={`${security.lastLogin} · ${security.device} · ${security.location}`} amber={staleLogin} />
          <InfoRow label="2FA Status" value={security.twoFactorEnabled ? `Enabled via ${security.twoFactorMethod}` : "Not enabled"} amber={no2FA} />
          <div className="flex justify-between items-baseline py-2.5">
            <span className="text-sm text-gray-500">Active Sessions</span>
            <span className="text-sm font-medium text-gray-800">
              {security.sessions.length} device{security.sessions.length === 1 ? "" : "s"} ·{" "}
              <button onClick={() => setShowSessions(!showSessions)} className="text-slate-600 font-bold hover:underline">View sessions</button>
            </span>
          </div>
          {showSessions && (
            <div className="mt-2 space-y-2">
              {security.sessions.length === 0 ? (
                <div className="text-sm text-gray-400 italic px-1">No active sessions</div>
              ) : security.sessions.map((s) => (
                <div key={s.device} className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{s.device}</div>
                    <div className="text-xs text-gray-500">{s.location}</div>
                  </div>
                  {s.current ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">This device</span>
                  ) : (
                    <button onClick={() => toast("Session signed out remotely (demo)")} className="text-xs font-bold text-red-600 hover:underline">Sign out</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Profile Details — sinks to the bottom; Role and Employee ID live only
          in the header above, so they don't repeat here. */}
      <SectionCard
        title="Profile Details"
        action={<button onClick={() => toast("Edit profile details (demo)")} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">Edit</button>}
      >
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Email" value={staff.email} />
          <Field label="Phone" value={staff.phone} />
          <Field label="Date of Birth" value={profile.dob} />
          <Field label="Nationality" value={profile.nationality} />
          <Field label="Preferred Language" value={profile.preferredLanguage} />
          <Field label="Contract Type" value={profile.contractType} />
          {isClinician && <Field label="Specialisation" value={staff.specialisation ?? "—"} />}
          {isClinician && <Field label="License Number" value={staff.licenseNumber ?? "—"} />}
          <Field label="Start Date" value={staff.joined} />
        </div>
      </SectionCard>

      {confirming && (
        <ConfirmDialog
          title={accountActive ? "Deactivate account?" : "Reactivate account?"}
          message={
            accountActive
              ? `${staff.name} will lose access immediately. Future appointments remain assigned to them until reassigned.`
              : `${staff.name} will regain access immediately.`
          }
          confirmLabel={accountActive ? "Deactivate" : "Reactivate"}
          onClose={() => setConfirming(false)}
          onConfirm={handleToggleAccount}
        />
      )}
    </div>
  );
}
