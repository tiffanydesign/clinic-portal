import React, { useState, useEffect } from "react";
import { useAppContext, Role } from "../../context/AppContext";
import {
  Camera, Monitor, MapPin,
  ChevronDown, ChevronUp, HelpCircle, Mail, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { GlassStatusPill } from "../../components/glass/GlassStatusPill";
import { GlassButton } from "../../components/glass/GlassButton";
import { InfoRow, SectionTitle, EditToggle, ToggleSwitch } from "../../components/glass/ProfilePatterns";

// --- Mock Data ---

export const ROLE_DATA: Record<Role, { first: string; last: string; email: string; phone: string; roleLabel: string }> = {
  Admin: { first: "Ayşe", last: "Hançer", email: "ayse@phenome.com", phone: "532 123 4567", roleLabel: "Admin" },
  Clinician: { first: "Claudia", last: "Reis", email: "claudia@phenome.com", phone: "555 987 6543", roleLabel: "Clinician" },
  Reception: { first: "Elif", last: "Yıldız", email: "elif@phenome.com", phone: "533 456 7890", roleLabel: "Receptionist" },
  Nurse: { first: "Berna", last: "Koç", email: "berna@phenome.com", phone: "544 111 2222", roleLabel: "Nurse" }
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

// --- Local field chrome (edit-mode only — read mode never wears a box) ---

function EditInput({ value, onChange, type = "text", ...props }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full pb-1.5 text-[15px] outline-none bg-transparent"
      style={{ color: "var(--ink-900)", borderBottom: "1px solid var(--phenome-blue-300)" }}
      {...props}
    />
  );
}

function SessionRow({ device, location, tag, action }: { device: string; location: string; tag?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <Monitor className="w-4 h-4 shrink-0" style={{ color: "var(--ink-400)" }} />
        <div>
          <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--ink-900)" }}>
            {device}
            {tag && <GlassStatusPill status="success" label={tag} />}
          </div>
          <div className="text-xs flex items-center mt-0.5" style={{ color: "var(--ink-400)" }}>
            <MapPin className="w-3 h-3 mr-1" /> {location}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

function ChannelToggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      <span className="text-[10px] font-medium" style={{ color: "var(--ink-400)" }}>{label}</span>
    </div>
  );
}

// --- Main Page Component ---

export function ProfilePage() {
  const { role, setFeedbackModalOpen } = useAppContext();
  const profile = ROLE_DATA[role];
  const isAdmin = role === "Admin";

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
    <div className="frosted-ambient min-h-full">
      <div className="w-full max-w-[680px] mx-auto py-10 px-6 pb-24">

        {/* HERO — the page's one visual focal point and its one gradient
            moment (the avatar ring + the hero's own gradient wash). Every
            other section below is deliberately quieter. */}
        <div className="frosted-hero frosted-stagger rounded-[var(--radius-frosted-lg)] p-7" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div
                onClick={handleAvatarClick}
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center relative shrink-0 overflow-hidden group"
                style={{ padding: 2, background: "var(--gradient-brand)", cursor: isAdmin ? "pointer" : "default" }}
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                  <span className="text-2xl font-light group-hover:opacity-0 transition-opacity" style={{ color: "var(--phenome-blue-300)" }}>
                    {profile.first[0]}{profile.last[0]}
                  </span>
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-medium leading-tight" style={{ color: "var(--ink-900)" }}>{profile.first} {profile.last}</h1>
                <p className="text-sm mt-1" style={{ color: "var(--ink-600)" }}>{profile.roleLabel} · {CLINIC_NAME}</p>
              </div>
            </div>
            {isAdmin && <EditToggle editing={isEditingPersonal} onClick={() => setIsEditingPersonal(true)} />}
          </div>

          <div className="mt-6 pt-6 grid grid-cols-2 gap-x-8 gap-y-5" style={{ borderTop: "1px solid var(--divider)" }}>
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={`+90 ${profile.phone}`} editing={isEditingPersonal && isAdmin}>
              <EditInput value={personalForm.phone} onChange={(e: any) => setPersonalForm({ ...personalForm, phone: e.target.value })} />
            </InfoRow>
            {isEditingPersonal && isAdmin && (
              <>
                <InfoRow label="First Name" editing>
                  <EditInput value={personalForm.first} onChange={(e: any) => setPersonalForm({ ...personalForm, first: e.target.value })} />
                </InfoRow>
                <InfoRow label="Last Name" editing>
                  <EditInput value={personalForm.last} onChange={(e: any) => setPersonalForm({ ...personalForm, last: e.target.value })} />
                </InfoRow>
              </>
            )}
          </div>

          {isEditingPersonal && isAdmin && (
            <div className="flex justify-end gap-3 mt-6">
              <GlassButton variant="secondary" onClick={cancelPersonal}>Cancel</GlassButton>
              <GlassButton variant="secondary" onClick={savePersonal}>Save Changes</GlassButton>
            </div>
          )}

          {!isAdmin && (
            <p className="text-[11px] mt-5 pt-5" style={{ color: "var(--ink-400)", borderTop: "1px solid var(--divider)" }}>
              Your profile information is managed by your clinic administrator.
            </p>
          )}
        </div>

        {/* PRIMARY: Security — the highest-stakes settings on this page,
            so it keeps real structure (a contained surface, a hairline
            between its two groups) even though it isn't the Hero. */}
        <div className="mt-10 frosted-stagger" style={{ animationDelay: "40ms" }}>
          <SectionTitle>Security</SectionTitle>
          <div className="frosted-surface rounded-[var(--radius-frosted-md)] p-5">
            <div className="flex items-start justify-between gap-4 pb-5" style={{ borderBottom: "1px solid var(--divider)" }}>
              <div>
                <div className="text-[15px] font-medium" style={{ color: "var(--ink-900)" }}>Two-Factor Authentication</div>
                <div className="text-xs mt-1" style={{ color: "var(--ink-600)" }}>Required for all staff · codes sent to a****z@example.com</div>
              </div>
              <div title="Required and cannot be disabled">
                <GlassStatusPill status="success" label="Enabled" icon={<ShieldCheck className="w-3.5 h-3.5" />} />
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--ink-400)" }}>Active Sessions</div>
                {showMacbook && (
                  <button onClick={() => setSignOutTarget('all')} className="text-xs font-medium hover:underline" style={{ color: "var(--status-danger)" }}>
                    Sign out all other devices
                  </button>
                )}
              </div>
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                <SessionRow device={'iPad Air 13" · Safari'} location="Istanbul, TR · Active now" tag="This device" />
                {showMacbook && (
                  <SessionRow
                    device="MacBook Pro · Chrome"
                    location="Istanbul, TR · 35 minutes ago"
                    action={
                      <button
                        onClick={() => setSignOutTarget('macbook')}
                        className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-white"
                        style={{ color: "var(--status-danger)" }}
                      >
                        Sign Out
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY: Preferences — Language/Region + Notifications merged
            into one lighter-weight section (one edit cycle, less card
            chrome) since neither is high-stakes on its own. */}
        <div className="mt-10 frosted-stagger" style={{ animationDelay: "80ms" }}>
          <SectionTitle action={<EditToggle editing={isEditingPreferences} onClick={() => setIsEditingPreferences(true)} />}>
            Preferences
          </SectionTitle>
          <div className="frosted-surface rounded-[var(--radius-frosted-md)] p-5 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <InfoRow label="Language" value="English (UK)" editing={isEditingPreferences}>
                <select
                  className="w-full pb-1.5 text-[15px] outline-none bg-transparent"
                  style={{ color: "var(--ink-900)", borderBottom: "1px solid var(--phenome-blue-300)" }}
                >
                  <option value="en">English (UK)</option>
                  <option value="tr">Türkçe</option>
                </select>
              </InfoRow>
              <InfoRow label="Time Zone" value="Europe/Istanbul" />
              <InfoRow label="Date Format" value="DD/MM/YYYY" editing={isEditingPreferences}>
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--ink-900)" }}>
                    <input type="radio" name="dateFormat" defaultChecked style={{ accentColor: "var(--phenome-blue-500)" }} /> DD/MM/YYYY
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--ink-900)" }}>
                    <input type="radio" name="dateFormat" style={{ accentColor: "var(--phenome-blue-500)" }} /> MM/DD/YYYY
                  </label>
                </div>
              </InfoRow>
            </div>

            <div className="pt-6" style={{ borderTop: "1px solid var(--divider)" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: "var(--ink-400)" }}>Notifications</div>
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {visibleEvents.map((eventObj, i) => {
                  const event = eventObj.name;
                  const isAppt = event === "Appointment updates";
                  const helperText = isAppt ? (role === "Clinician" ? "For your appointments only" : role === "Nurse" ? "For your assigned patients only" : "") : "";
                  return (
                    <div key={event} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm" style={{ color: "var(--ink-900)" }}>{event}</div>
                        {helperText && <div className="text-xs mt-0.5" style={{ color: "var(--ink-400)" }}>{helperText}</div>}
                      </div>
                      <div className="flex items-center gap-5 shrink-0">
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
              <div className="flex justify-end gap-3">
                <GlassButton variant="secondary" onClick={cancelPreferences}>Cancel</GlassButton>
                <GlassButton variant="secondary" onClick={savePreferences}>Save Preferences</GlassButton>
              </div>
            )}
          </div>
        </div>

        {/* UTILITY: Support + Recent Activity — deliberately the lightest
            thing on the page, a single text-link row rather than two more
            padded cards. */}
        <div className="mt-10 pt-6 frosted-stagger" style={{ borderTop: "1px solid var(--divider)", animationDelay: "120ms" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5 text-sm">
              {!isAdmin && (
                <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center gap-1.5 font-medium hover:underline" style={{ color: "var(--phenome-blue-500)" }}>
                  <Mail className="w-3.5 h-3.5" /> Contact Administrator
                </button>
              )}
              <button onClick={() => toast('Opening help centre...')} className="flex items-center gap-1.5 font-medium hover:underline" style={{ color: "var(--phenome-blue-500)" }}>
                <HelpCircle className="w-3.5 h-3.5" /> Help Centre
              </button>
            </div>
            <button
              onClick={() => setActivityExpanded(!activityExpanded)}
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: "var(--ink-400)" }}
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
                { time: "Yesterday, 09:15", desc: "Viewed patient record: M. Messineo" },
                { time: "Oct 12, 16:00", desc: "Changed notification preferences" },
                { time: "Oct 11, 11:30", desc: "Logged out" },
                { time: "Oct 11, 08:45", desc: "Logged in from iPhone 14 Pro · Istanbul" },
              ].map((log, i) => (
                <div key={i} className="flex text-xs gap-4">
                  <span className="w-28 shrink-0" style={{ color: "var(--ink-400)" }}>{log.time}</span>
                  <span style={{ color: "var(--ink-600)" }}>{log.desc}</span>
                </div>
              ))}
              <button className="text-xs font-medium hover:underline mt-1" style={{ color: "var(--phenome-blue-500)" }}>
                {role === 'Admin' ? 'View Audit Log' : 'View full activity log'}
              </button>
            </div>
          )}
        </div>

        {/* --- Confirmation Modal --- */}
        {signOutTarget && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(16,33,75,0.35)", backdropFilter: "blur(8px)" }}
          >
            <div className="frosted-card rounded-[var(--radius-frosted-lg)] p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium mb-2" style={{ color: "var(--ink-900)" }}>Confirm Sign Out</h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--ink-600)" }}>
                {signOutTarget === 'all'
                  ? "Sign out all other devices? This will end 2 sessions. You will remain signed in on this device."
                  : "Sign out this device? The session on MacBook Pro · Chrome will be ended immediately."}
              </p>
              <div className="flex justify-end space-x-3">
                <GlassButton variant="secondary" onClick={() => setSignOutTarget(null)}>Cancel</GlassButton>
                <GlassButton variant="destructive" onClick={confirmSignOut}>
                  {signOutTarget === 'all' ? 'Sign Out All' : 'Sign Out'}
                </GlassButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
