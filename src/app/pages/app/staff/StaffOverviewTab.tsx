import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  getStaff, getProfileDetails, getSecurity, getOperationalSnapshot, getMonthlyActivity, getMonthlyAttendance,
  CURRENT_ADMIN_ID, statusPillClass,
} from "./staffData";
import { logAudit, AUDIT_ACTOR } from "../clinic-settings/auditStore";
import { Stat } from "../../../components/stat";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

function InfoRow({ label, value, amber = false }: { label: string; value: React.ReactNode; amber?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-divider last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`text-sm font-medium text-right ${amber ? "text-warning-ink font-bold" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function SectionCard({
  title, action, children, footer,
}: {
  title: string; action?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-card p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {action}
      </div>
      {children}
      {footer && <div className="mt-4 pt-3 border-t border-divider flex justify-between items-center">{footer}</div>}
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
      <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, onClose, onConfirm,
}: {
  title: string; message: string; confirmLabel: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-body text-ink-soft">{message}</p>
    </Modal>
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
    <div className="px-4 py-4 space-y-5">
      {/* Stat Tiles — the page's first-paint answer to "how loaded is this
          person, and is anything backing up". Results Awaiting is the only
          number on this whole page allowed to turn amber. */}
      <div className="grid grid-cols-4 gap-3">
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

      <div className="grid grid-cols-[55fr_45fr] gap-5 items-start">
        {/* This Month — Activity (Clinician only) + Attendance (everyone) */}
        <SectionCard
          title="This Month"
          action={<span className="text-xs text-ink-muted font-medium">{attendance.month}</span>}
          footer={
            <>
              <Link to={`/staff/${staff.id}/workload`} className="text-xs font-bold text-ink-soft hover:underline">View full workload →</Link>
              <Link to="/timesheet" className="text-xs font-bold text-ink-soft hover:underline">View timesheet →</Link>
            </>
          }
        >
          {activity && (
            <div className="mb-4 pb-4 border-b border-divider">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">Activity</div>
              <InfoRow label="Appointments Completed" value={activity.appointmentsCompleted} />
              <InfoRow label="Consultations (in-person · video)" value={`${activity.inPersonConsults} · ${activity.videoConsults}`} />
              <InfoRow label="Reports Signed Off" value={activity.reportsSignedOff} />
              <InfoRow label="Average Consultation Duration" value={`${activity.avgConsultMinutes} min`} />
            </div>
          )}
          <div>
            <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">Attendance</div>
            <div className="py-2.5 border-b border-divider text-sm text-ink font-medium">
              {attendance.daysPresent} of {attendance.daysScheduled} days
              <span className="text-ink-muted font-normal"> · On Leave {attendance.daysOnLeave} · Attendance {attendance.attendanceRate}% · Overtime {attendance.overtimeHours}h</span>
            </div>
          </div>
        </SectionCard>

        {/* Account & Security */}
        <SectionCard
          title="Account & Security"
          footer={
            !isSelf && (
              <button onClick={() => setConfirming(true)} className="text-xs font-bold text-danger-ink hover:underline">
                {accountActive ? "Deactivate account" : "Reactivate account"}
              </button>
            )
          }
        >
          <div className="flex justify-between items-baseline py-2.5 border-b border-divider">
            <span className="text-sm text-ink-muted">Status</span>
            <span className={`px-2 py-0.5 text-overline rounded-control border ${statusPillClass(accountActive ? "Active" : "Inactive")}`}>
              {accountActive ? "Active" : "Inactive"}
            </span>
          </div>
          <InfoRow label="Last Login" value={`${security.lastLogin} · ${security.device} · ${security.location}`} amber={staleLogin} />
          <InfoRow label="2FA Status" value={security.twoFactorEnabled ? `Enabled via ${security.twoFactorMethod}` : "Not enabled"} amber={no2FA} />
          <div className="flex justify-between items-baseline py-2.5">
            <span className="text-sm text-ink-muted">Active Sessions</span>
            <span className="text-sm font-medium text-ink">
              {security.sessions.length} device{security.sessions.length === 1 ? "" : "s"} ·{" "}
              <button onClick={() => setShowSessions(!showSessions)} className="text-ink-soft font-bold hover:underline">View sessions</button>
            </span>
          </div>
          {showSessions && (
            <div className="mt-2 space-y-2">
              {security.sessions.length === 0 ? (
                <div className="text-sm text-ink-muted italic px-1">No active sessions</div>
              ) : security.sessions.map((s) => (
                <div key={s.device} className="flex justify-between items-center bg-surface-page border border-divider rounded-card px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-ink">{s.device}</div>
                    <div className="text-xs text-ink-muted">{s.location}</div>
                  </div>
                  {s.current ? (
                    <span className="text-overline text-success-ink">This device</span>
                  ) : (
                    <button onClick={() => toast("Session signed out remotely (demo)")} className="text-xs font-bold text-danger-ink hover:underline">Sign out</button>
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
        action={<button onClick={() => toast("Edit profile details (demo)")} className="px-3 py-1.5 border border-divider rounded-control text-xs font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">Edit</button>}
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
