import React, { useState, useEffect } from "react";
import { useAppContext, Role } from "../../context/AppContext";
import { 
  Camera, Monitor, MapPin, 
  ChevronDown, ChevronUp, Bell, HelpCircle, Mail
} from "lucide-react";
import { toast } from "sonner";

// --- Mock Data ---

const ROLE_DATA: Record<Role, { first: string; last: string; email: string; phone: string; roleLabel: string; assignment: string | null }> = {
  Admin: { first: "Ayşe", last: "Hançer", email: "ayse@phenome.com", phone: "532 123 4567", roleLabel: "Admin", assignment: null },
  Clinician: { first: "Claudia", last: "Reis", email: "claudia@phenome.com", phone: "555 987 6543", roleLabel: "Clinician", assignment: "Assigned patients: 24" },
  Reception: { first: "Elif", last: "Yıldız", email: "elif@phenome.com", phone: "533 456 7890", roleLabel: "Receptionist", assignment: null },
  Nurse: { first: "Berna", last: "Koç", email: "berna@phenome.com", phone: "544 111 2222", roleLabel: "Nurse", assignment: "Assigned to: Dr. Claudia" }
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

// --- Subcomponents ---

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-300 rounded p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{children}</label>;
}

function Input({ type = "text", value, readOnly = false, onChange, className = "", ...props }: any) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded text-sm outline-none transition-colors
        ${readOnly ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 text-gray-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500'} 
        ${className}`}
      {...props}
    />
  );
}

function Button({ children, variant = "primary", onClick, className = "" }: any) {
  const base = "px-4 py-2 rounded text-sm font-bold transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500";
  const variants = {
    primary: "bg-slate-600 text-white border border-slate-600 hover:bg-slate-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    ghostDanger: "bg-transparent text-red-600 hover:underline"
  };
  return (
    <button onClick={onClick} className={`${base} ${(variants as any)[variant]} ${className}`}>
      {children}
    </button>
  );
}

// --- Main Page Component ---

  export function ProfilePage() {
  const { role, setFeedbackModalOpen } = useAppContext();
  const profile = ROLE_DATA[role];
  const isAdmin = role === "Admin";

  // SECTION 1: Personal Info State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState(profile);

  // SECTION 4: Notifications State
  const [isEditingNotifs, setIsEditingNotifs] = useState(false);
  const [notifsData, setNotifsData] = useState(INITIAL_NOTIFS);
  const [draftNotifs, setDraftNotifs] = useState(INITIAL_NOTIFS);

  const [activityExpanded, setActivityExpanded] = useState(false);

  // SECTION 2: Security State
  const [showMacbook, setShowMacbook] = useState(true);
  const [signOutTarget, setSignOutTarget] = useState<string | null>(null);

  // Reset states when role changes (for demo purposes)
  useEffect(() => {
    setPersonalForm(profile);
    setIsEditingPersonal(false);
    setIsEditingNotifs(false);
    setDraftNotifs(notifsData);
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

  const saveNotifs = () => {
    setNotifsData(draftNotifs);
    setIsEditingNotifs(false);
    toast.success("Notification Settings updated successfully.");
  };

  const cancelNotifs = () => {
    setDraftNotifs(notifsData);
    setIsEditingNotifs(false);
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

  return (
    <div className="w-full max-w-[720px] mx-auto py-8 space-y-8 pb-20">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences, security, and notifications.</p>
      </div>

      {/* SECTION 1: Personal Information */}
      <Card>
        <SectionHeader title="Personal Information" />
        
        <div className="flex items-start space-x-6 mb-8">
          <div 
            onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center relative cursor-pointer group shrink-0 overflow-hidden"
          >
            <span className="text-3xl font-bold text-gray-400 group-hover:opacity-0 transition-opacity">
              {profile.first[0]}{profile.last[0]}
            </span>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input 
                value={personalForm.first} 
                onChange={(e: any) => setPersonalForm({...personalForm, first: e.target.value})}
                readOnly={!isAdmin || !isEditingPersonal} 
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input 
                value={personalForm.last} 
                onChange={(e: any) => setPersonalForm({...personalForm, last: e.target.value})}
                readOnly={!isAdmin || !isEditingPersonal} 
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={personalForm.email} 
                onChange={(e: any) => setPersonalForm({...personalForm, email: e.target.value})}
                type="email" 
                readOnly={true} 
              />
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex">
                <select 
                  disabled={!isAdmin || !isEditingPersonal}
                  className={`px-2 py-2 border border-r-0 rounded-l text-sm outline-none transition-colors
                    ${(!isAdmin || !isEditingPersonal) ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 text-gray-800'}`}
                >
                  <option>+90</option>
                  <option>+44</option>
                  <option>+1</option>
                </select>
                <Input 
                  value={personalForm.phone} 
                  onChange={(e: any) => setPersonalForm({...personalForm, phone: e.target.value})}
                  readOnly={!isAdmin || !isEditingPersonal} 
                  className="rounded-l-none" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Role</Label>
            <div className="text-sm font-bold text-slate-700">{profile.roleLabel}</div>
          </div>
          <div>
            <Label>Clinic</Label>
            <div className="text-sm font-bold text-slate-700">{CLINIC_NAME}</div>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex justify-end space-x-3">
            {isEditingPersonal ? (
              <>
                <Button variant="secondary" onClick={cancelPersonal}>Cancel</Button>
                <Button onClick={savePersonal}>Save Changes</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditingPersonal(true)}>Edit</Button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 font-medium text-center bg-gray-50 py-3 rounded-lg border border-gray-100">
            Your profile information is managed by your clinic administrator. Contact your admin to request changes.
          </div>
        )}
      </Card>

      {/* SECTION 2: Security */}
      <Card>
        <SectionHeader title="Security" />
        
        {/* 2FA */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-700">Two-Factor Authentication</h3>
          <p className="text-xs text-gray-500 mt-1">Required for all staff accounts</p>
          <p className="text-xs text-gray-500 mt-1">Verification codes are sent to your registered email</p>
          <div className="text-sm font-medium text-gray-800 mt-3 cursor-default">a****z@example.com</div>
        </div>

        <hr className="border-gray-200 my-6" />

        {/* Active Sessions */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">Active Sessions</h3>
            {showMacbook && (
              <button onClick={() => setSignOutTarget('all')} className="text-xs font-bold text-red-600 hover:underline">
                Sign out all other devices
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-bold text-gray-800 flex items-center">
                    iPad Air 13" · Safari 
                    <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase rounded">This device</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center mt-0.5">
                    <MapPin className="w-3 h-3 mr-1" /> Istanbul, TR · Active now
                  </div>
                </div>
              </div>
            </div>
            
            {showMacbook && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded bg-white">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-bold text-gray-800">MacBook Pro · Chrome</div>
                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1" /> Istanbul, TR · 35 minutes ago
                    </div>
                  </div>
                </div>
                <button onClick={() => setSignOutTarget('macbook')} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 3: Language & Region */}
      <Card>
        <SectionHeader title="Language & Region" />
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <Label>Language</Label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-slate-500 bg-white">
              <option value="en">English (UK)</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
          <div>
            <Label>Time Zone</Label>
            <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-sm text-gray-500 cursor-not-allowed">
              Europe/Istanbul (Auto-detected)
            </div>
          </div>
          <div className="col-span-2">
            <Label>Date Format</Label>
            <div className="flex space-x-6 mt-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="dateFormat" defaultChecked className="text-slate-600 focus:ring-slate-500" />
                <span>DD/MM/YYYY</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="dateFormat" className="text-slate-600 focus:ring-slate-500" />
                <span>MM/DD/YYYY</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => toast.success('Regional preferences updated.')}>Save Preferences</Button>
        </div>
      </Card>

      {/* SECTION 4: Notification Preferences */}
      <Card>
        <SectionHeader title="Notification Preferences" />
        
        <div className="mb-6 border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Event</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">System</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">SMS</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {NOTIFICATION_EVENTS.filter(evt => evt.allowed?.includes(role)).map((eventObj, i) => {
                const event = eventObj.name;
                const isAppt = event === "Appointment updates";
                const helperText = isAppt ? (role === "Clinician" ? "For your appointments only" : role === "Nurse" ? "For your assigned patients only" : "") : "";
                
                return (
                <tr key={i} className={isEditingNotifs ? "bg-white" : "bg-gray-50/50"}>
                  <td className={`px-4 py-3 ${isEditingNotifs ? "text-gray-800" : "text-gray-500"}`}>
                    <div className="font-medium">{event}</div>
                    {helperText && <div className="text-[10px] text-gray-400 mt-0.5">{helperText}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked 
                      disabled 
                      className="rounded text-slate-600 focus:ring-slate-500 cursor-not-allowed opacity-50" 
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={isEditingNotifs ? draftNotifs[i].sms : notifsData[i].sms}
                      onChange={() => toggleNotifDraft(i, 'sms')}
                      disabled={!isEditingNotifs}
                      className={`rounded text-slate-600 focus:ring-slate-500 ${!isEditingNotifs && 'cursor-not-allowed opacity-50'}`} 
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={isEditingNotifs ? draftNotifs[i].email : notifsData[i].email}
                      onChange={() => toggleNotifDraft(i, 'email')}
                      disabled={!isEditingNotifs}
                      className={`rounded text-slate-600 focus:ring-slate-500 ${!isEditingNotifs && 'cursor-not-allowed opacity-50'}`} 
                    />
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-3">
          {isEditingNotifs ? (
            <>
              <Button variant="secondary" onClick={cancelNotifs}>Cancel</Button>
              <Button onClick={saveNotifs}>Save Settings</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditingNotifs(true)}>Edit Settings</Button>
          )}
        </div>
      </Card>

      {/* SECTION 5: Support */}
      <Card>
        <SectionHeader title="Support" />
        <div className="flex space-x-4 mb-6">
          {!isAdmin && (
            <Button variant="secondary" className="flex items-center" onClick={() => setFeedbackModalOpen(true)}>
              <Mail className="w-4 h-4 mr-2" /> Contact Administrator
            </Button>
          )}
          <Button variant="secondary" className="flex items-center" onClick={() => toast('Opening help centre...')}>
            <HelpCircle className="w-4 h-4 mr-2" /> Help Centre
          </Button>
        </div>
      </Card>

      {/* SECTION 6: Recent Activity */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <button 
          onClick={() => setActivityExpanded(!activityExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-sm font-bold text-gray-800">Recent Activity</h2>
          {activityExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {activityExpanded && (
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {[
                { time: "Just now", desc: "Viewed Profile Settings" },
                { time: "2 hours ago", desc: "Logged in from iPad Air · Istanbul" },
                { time: "Yesterday, 14:20", desc: "Updated password" },
                { time: "Yesterday, 09:15", desc: "Viewed patient record: M. Messineo" },
                { time: "Oct 12, 16:00", desc: "Changed notification preferences" },
                { time: "Oct 11, 11:30", desc: "Logged out" },
                { time: "Oct 11, 08:45", desc: "Logged in from iPhone 14 Pro · Istanbul" },
              ].map((log, i) => (
                <div key={i} className="px-6 py-3 flex items-start">
                  <span className="w-28 shrink-0 text-xs font-medium text-gray-400 pt-0.5">{log.time}</span>
                  <span className="text-sm text-gray-700">{log.desc}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
              <button className="text-sm font-bold text-slate-600 hover:underline">
                {role === 'Admin' ? 'View Audit Log' : 'View full activity log'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Confirmation Modal --- */}
      {signOutTarget && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Sign Out</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {signOutTarget === 'all' 
                ? "Sign out all other devices? This will end 2 sessions. You will remain signed in on this device."
                : "Sign out this device? The session on MacBook Pro · Chrome will be ended immediately."}
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setSignOutTarget(null)}>Cancel</Button>
              <button 
                onClick={confirmSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 transition-colors"
              >
                {signOutTarget === 'all' ? 'Sign Out All' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

