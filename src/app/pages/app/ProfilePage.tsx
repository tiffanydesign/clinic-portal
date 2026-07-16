import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppContext, Role } from "../../context/AppContext";
import {
  Camera, Monitor, MapPin, Pencil,
  ChevronDown, ChevronUp, HelpCircle, Mail, ShieldCheck, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { getStaff } from "./staff/staffData";

// --- Mock Data ---

// The demo "self" account for each role, by real EMP-id — sourced from the
// canonical staff registry (staffData.ts) instead of a fourth independent
// copy of the same identities, so a name/email/phone change there is
// reflected here automatically.
const PROFILE_STAFF_ID: Record<Role, string> = {
  Admin: "EMP-001",
  Clinician: "EMP-003",
  Reception: "EMP-010",
  Nurse: "EMP-007",
};

function roleProfile(role: Role): { first: string; last: string; email: string; phone: string; roleLabel: string } {
  const s = getStaff(PROFILE_STAFF_ID[role])!;
  const [first, ...rest] = s.name.replace(/^Dr\.\s*/, "").split(" ");
  // DataField prepends "+90 " itself, so this field stays prefix-free.
  return { first, last: rest.join(" "), email: s.email, phone: s.phone.replace(/^\+90\s*/, ""), roleLabel: s.role };
}

export const ROLE_DATA: Record<Role, { first: string; last: string; email: string; phone: string; roleLabel: string }> = {
  Admin: roleProfile("Admin"),
  Clinician: roleProfile("Clinician"),
  Reception: roleProfile("Reception"),
  Nurse: roleProfile("Nurse"),
};

const CLINIC_NAME = "Istanbul Clinic";

const NOTIFICATION_EVENTS = [
  { name: "Appointment updates", allowed: ["Admin", "Reception", "Clinician", "Nurse"] },
  { name: "Result updates", allowed: ["Admin", "Clinician", "Nurse"] },
  { name: "Approval requests", allowed: ["Admin"] }
];

const INITIAL_NOTIFS = [
  { sms: true, email: true },
  { sms: false, email: true },
  { sms: true, email: true }
];

// --- Flat design-system atoms (page-local — the shared glass/ atoms stay
// untouched since StaffOverviewTab.tsx also depends on ProfilePatterns.tsx) ---

function FlatCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl transition-shadow duration-150 hover:shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {action}
    </div>
  );
}

function EditButton({ editing, onClick }: { editing?: boolean; onClick: () => void }) {
  if (editing) return null;
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
      <Pencil className="w-3.5 h-3.5" /> Edit
    </button>
  );
}

function SaveButton({ onClick, children = "Save Changes" }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
      {children}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
      Cancel
    </button>
  );
}

function Pill({ tone = "neutral", icon, children }: { tone?: "green" | "neutral"; icon?: React.ReactNode; children: React.ReactNode }) {
  const toneClasses = tone === "green" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${toneClasses}`}>
      {icon}{children}
    </span>
  );
}

function FlatInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-colors ${className}`}
      {...props}
    />
  );
}

function FlatSelect({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Label-over-value pair — used for both the hero's Email/Phone and the
// Preferences grid's Language/Time Zone/Date Format.
function DataField({ label, value, editing, children, className = "" }: {
  label: string;
  value?: React.ReactNode;
  editing?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      {editing ? children : <span className="text-sm font-medium text-gray-900">{value}</span>}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all" style={{ left: checked ? 19 : 3 }} />
    </button>
  );
}

function ChannelToggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

function SessionRow({ device, location, tag, action }: { device: string; location: string; tag?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 group">
      <div className="flex items-center gap-3">
        <Monitor className="w-4 h-4 shrink-0 text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
            {device}
            {tag && <Pill>{tag}</Pill>}
          </div>
          <div className="text-xs text-gray-500 flex items-center mt-0.5">
            <MapPin className="w-3 h-3 mr-1" /> {location}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

// --- Main Page Component ---

export function ProfilePage() {
  const { role, logout, setFeedbackModalOpen } = useAppContext();
  const navigate = useNavigate();
  const profile = ROLE_DATA[role];
  const isAdmin = role === "Admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState(profile);

  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [notifsData, setNotifsData] = useState(INITIAL_NOTIFS);
  const [draftNotifs, setDraftNotifs] = useState(INITIAL_NOTIFS);

  const [activityExpanded, setActivityExpanded] = useState(false);

  const [showMacbook, setShowMacbook] = useState(true);
  const [signOutTarget, setSignOutTarget] = useState<string | null>(null);

  useEffect(() => {
    setPersonalForm(profile);
    setIsEditingPersonal(false);
    setIsEditingPreferences(false);
    setDraftNotifs(notifsData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, profile]);

  const handleAvatarClick = () => {
    if (!isAdmin) return;
    toast('File upload dialog would open here.', { icon: <Camera className="w-4 h-4" /> });
  };

  const savePersonal = () => {
    setIsEditingPersonal(false);
    toast.success("Personal Information updated successfully.");
  };

  const cancelPersonal = () => {
    setPersonalForm(profile);
    setIsEditingPersonal(false);
  };

  const savePreferences = () => {
    setNotifsData(draftNotifs);
    setIsEditingPreferences(false);
    toast.success("Preferences updated successfully.");
  };

  const cancelPreferences = () => {
    setDraftNotifs(notifsData);
    setIsEditingPreferences(false);
  };

  const toggleNotifDraft = (index: number, field: 'sms' | 'email') => {
    const newDrafts = [...draftNotifs];
    newDrafts[index] = { ...newDrafts[index], [field]: !newDrafts[index][field] };
    setDraftNotifs(newDrafts);
  };

  const confirmSignOut = () => {
    toast.success(`Signed out from ${signOutTarget === 'all' ? 'all other devices' : 'device'}.`);
    setShowMacbook(false);
    setSignOutTarget(null);
  };

  const visibleEvents = NOTIFICATION_EVENTS.filter(evt => evt.allowed?.includes(role));

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="w-full max-w-3xl mx-auto py-10 px-6 pb-24">

        {/* SECTION 1 — User Profile */}
        <FlatCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                onClick={handleAvatarClick}
                className="w-16 h-16 rounded-full flex items-center justify-center relative shrink-0 overflow-hidden group"
                style={{ backgroundColor: "var(--phenome-blue-900)", cursor: isAdmin ? "pointer" : "default" }}
              >
                <span className="text-lg font-semibold text-white group-hover:opacity-0 transition-opacity">
                  {profile.first[0]}{profile.last[0]}
                </span>
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">{profile.first} {profile.last}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{profile.roleLabel} · {CLINIC_NAME}</p>
              </div>
            </div>
            {isAdmin && <EditButton editing={isEditingPersonal} onClick={() => setIsEditingPersonal(true)} />}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-x-12 gap-y-4">
            <DataField label="Email" value={profile.email} />
            <DataField label="Phone" value={`+90 ${profile.phone}`} editing={isEditingPersonal && isAdmin}>
              <FlatInput value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} />
            </DataField>
            {isEditingPersonal && isAdmin && (
              <>
                <DataField label="First Name" editing>
                  <FlatInput value={personalForm.first} onChange={(e) => setPersonalForm({ ...personalForm, first: e.target.value })} />
                </DataField>
                <DataField label="Last Name" editing>
                  <FlatInput value={personalForm.last} onChange={(e) => setPersonalForm({ ...personalForm, last: e.target.value })} />
                </DataField>
              </>
            )}
          </div>

          {isEditingPersonal && isAdmin && (
            <div className="flex justify-end gap-3 mt-6">
              <CancelButton onClick={cancelPersonal} />
              <SaveButton onClick={savePersonal} />
            </div>
          )}

          {!isAdmin && (
            <p className="text-xs text-gray-400 mt-5 pt-5 border-t border-gray-100">
              Your profile information is managed by your clinic administrator.
            </p>
          )}
        </FlatCard>

        {/* SECTION 2 — Security */}
        <div className="mt-10">
          <SectionHeading>Security</SectionHeading>
          <FlatCard className="p-6">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-xs text-gray-500 mt-1">Required for all staff · codes sent to a****z@example.com</div>
              </div>
              <div title="Required and cannot be disabled">
                <Pill tone="green" icon={<ShieldCheck className="w-3.5 h-3.5" />}>Enabled</Pill>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Sessions</span>
                {showMacbook && (
                  <button onClick={() => setSignOutTarget('all')} className="text-sm font-medium text-red-600 hover:text-red-700">
                    Sign out all other devices
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                <SessionRow device={'iPad Air 13" · Safari'} location="Istanbul, TR · Active now" tag="This device" />
                {showMacbook && (
                  <SessionRow
                    device="MacBook Pro · Chrome"
                    location="Istanbul, TR · 35 minutes ago"
                    action={
                      <button
                        onClick={() => setSignOutTarget('macbook')}
                        className="text-sm font-medium text-gray-400 group-hover:text-red-600 transition-colors"
                      >
                        Sign Out
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </FlatCard>
        </div>

        {/* SECTION 3 — Preferences */}
        <div className="mt-10">
          <SectionHeading>Preferences</SectionHeading>
          <FlatCard className="p-6">
            <div className="pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Locale & Formats</span>
                <EditButton editing={isEditingPreferences} onClick={() => setIsEditingPreferences(true)} />
              </div>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <DataField label="Language" value="English (UK)" editing={isEditingPreferences}>
                  <FlatSelect defaultValue="en">
                    <option value="en">English (UK)</option>
                    <option value="tr">Türkçe</option>
                  </FlatSelect>
                </DataField>
                <DataField label="Time Zone" value="Europe/Istanbul" />
                <DataField label="Date Format" value="DD/MM/YYYY" editing={isEditingPreferences}>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="dateFormat" defaultChecked className="accent-gray-900" /> DD/MM/YYYY
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                      <input type="radio" name="dateFormat" className="accent-gray-900" /> MM/DD/YYYY
                    </label>
                  </div>
                </DataField>
              </div>
            </div>

            <div className="pt-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4 block">Notifications</span>
              <div className="divide-y divide-gray-100">
                {visibleEvents.map((eventObj, i) => {
                  const event = eventObj.name;
                  const isAppt = event === "Appointment updates";
                  const helperText = isAppt ? (role === "Clinician" ? "For your appointments only" : role === "Nurse" ? "For your assigned patients only" : "") : "";
                  return (
                    <div key={event} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm text-gray-900">{event}</div>
                        {helperText && <div className="text-xs text-gray-500 mt-0.5">{helperText}</div>}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <ChannelToggle label="System" checked disabled />
                        <ChannelToggle
                          label="SMS"
                          checked={isEditingPreferences ? draftNotifs[i].sms : notifsData[i].sms}
                          onChange={() => toggleNotifDraft(i, 'sms')}
                          disabled={!isEditingPreferences}
                        />
                        <ChannelToggle
                          label="Email"
                          checked={isEditingPreferences ? draftNotifs[i].email : notifsData[i].email}
                          onChange={() => toggleNotifDraft(i, 'email')}
                          disabled={!isEditingPreferences}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isEditingPreferences && (
              <div className="flex justify-end gap-3 mt-6">
                <CancelButton onClick={cancelPreferences} />
                <SaveButton onClick={savePreferences}>Save Preferences</SaveButton>
              </div>
            )}
          </FlatCard>
        </div>

        {/* SECTION 4 — Support + Recent Activity */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5 text-sm">
              {!isAdmin && (
                <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-900">
                  <Mail className="w-3.5 h-3.5" /> Contact Administrator
                </button>
              )}
              <button onClick={() => toast('Opening help centre...')} className="flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-900">
                <HelpCircle className="w-3.5 h-3.5" /> Help Centre
              </button>
            </div>
            <button
              onClick={() => setActivityExpanded(!activityExpanded)}
              className="text-xs font-medium flex items-center gap-1 text-gray-400 hover:text-gray-700"
            >
              Recent Activity {activityExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {activityExpanded && (
            <div className="mt-4 space-y-2.5">
              {[
                { time: "Just now", desc: "Viewed Profile Settings" },
                { time: "2 hours ago", desc: "Logged in from iPad Air · Istanbul" },
                { time: "Yesterday, 14:20", desc: "Updated password" },
                { time: "Yesterday, 09:15", desc: "Viewed patient record: E. Yıldırım" },
                { time: "Oct 12, 16:00", desc: "Changed notification preferences" },
                { time: "Oct 11, 11:30", desc: "Logged out" },
                { time: "Oct 11, 08:45", desc: "Logged in from iPhone 14 Pro · Istanbul" },
              ].map((log, i) => (
                <div key={i} className="flex text-xs gap-4">
                  <span className="w-28 shrink-0 text-gray-400">{log.time}</span>
                  <span className="text-gray-500">{log.desc}</span>
                </div>
              ))}
              <button className="text-xs font-medium text-gray-700 hover:text-gray-900 mt-1">
                {role === 'Admin' ? 'View Audit Log' : 'View full activity log'}
              </button>
            </div>
          )}
        </div>

        {/* SECTION 5 — Log Out. Was a sidebar nav row; lives here now that
            the shell is sidebar-only and every other account action
            (security, sessions, support) already sits on this page. */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>

        {/* --- Confirmation Modal --- */}
        {signOutTarget && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
            <FlatCard className="p-6 max-w-sm w-full mx-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Sign Out</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {signOutTarget === 'all'
                  ? "Sign out all other devices? This will end 2 sessions. You will remain signed in on this device."
                  : "Sign out this device? The session on MacBook Pro · Chrome will be ended immediately."}
              </p>
              <div className="flex justify-end gap-3">
                <CancelButton onClick={() => setSignOutTarget(null)} />
                <button
                  onClick={confirmSignOut}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  {signOutTarget === 'all' ? 'Sign Out All' : 'Sign Out'}
                </button>
              </div>
            </FlatCard>
          </div>
        )}

      </div>
    </div>
  );
}
