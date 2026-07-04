import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { getStaff } from "./staffData";

function InfoRow({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? "text-orange-600 font-bold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function SectionCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-800 mb-3">{title}</h3>
      {children}
      {footer && <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">{footer}</div>}
    </div>
  );
}

export function StaffOverviewTab() {
  const { staffId } = useParams();
  const staff = getStaff(staffId);
  const [accountActive, setAccountActive] = useState(staff?.status !== "Inactive");
  const [showSessions, setShowSessions] = useState(false);

  if (!staff) return null;
  const isClinical = staff.role === "Clinician" || staff.role === "Nurse";

  return (
    <div className="p-8 grid grid-cols-[55fr_45fr] gap-6 items-start">
      {/* Left column — personal & account */}
      <div className="space-y-6">
        <SectionCard
          title="Personal Information"
          footer={
            <button onClick={() => toast("Edit personal information (demo)")} className="px-4 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Edit
            </button>
          }
        >
          <InfoRow label="Full Name" value={staff.name} />
          <InfoRow label="Email" value={staff.email} />
          <InfoRow label="Phone" value={staff.phone} />
          <InfoRow label="Date of Birth" value="15 May 1988" />
          <InfoRow label="Nationality" value="Portuguese" />
          <InfoRow label="Preferred Language" value="English" />
        </SectionCard>

        <SectionCard title="Professional Information">
          <InfoRow label="Role" value={staff.role} />
          {staff.role === "Clinician" && <InfoRow label="Specialisation" value={staff.specialisation ?? "—"} />}
          {staff.role === "Clinician" && <InfoRow label="License Number" value={staff.licenseNumber ?? "—"} />}
          <InfoRow label="Employee ID" value={staff.id} />
          <InfoRow label="Start Date" value={staff.joined} />
          <InfoRow label="Contract Type" value="Full-time" />
        </SectionCard>

        <SectionCard title="Account Status">
          <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
            <span className="text-sm text-gray-500">Account Status</span>
            <div className="flex items-center">
              <span className={`text-sm font-bold mr-3 ${accountActive ? "text-emerald-600" : "text-gray-400"}`}>{accountActive ? "Active" : "Inactive"}</span>
              <button
                onClick={() => { setAccountActive(!accountActive); toast(accountActive ? "Account deactivated (demo)" : "Account activated (demo)"); }}
                className={`w-10 h-5 rounded-full relative transition-colors ${accountActive ? "bg-emerald-500" : "bg-gray-300"}`}
                aria-label="Toggle account status"
              >
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${accountActive ? "left-[22px]" : "left-[3px]"}`} />
              </button>
            </div>
          </div>
          <InfoRow label="Last Login" value={<>2 hours ago · iPad Air 13&quot; · Safari · Istanbul, TR</>} />
          <InfoRow label="2FA Status" value="Enabled via email" />
          <div className="flex justify-between items-baseline py-2.5">
            <span className="text-sm text-gray-500">Active Sessions</span>
            <span className="text-sm font-medium text-gray-800">
              2 devices · <button onClick={() => setShowSessions(!showSessions)} className="text-slate-600 font-bold hover:underline">View sessions</button>
            </span>
          </div>
          {showSessions && (
            <div className="mt-2 space-y-2">
              {[
                { device: "iPad Air 13” · Safari", loc: "Istanbul, TR · Current session", current: true },
                { device: "MacBook Pro · Chrome", loc: "Istanbul, TR · Last seen 1 day ago", current: false },
              ].map((s) => (
                <div key={s.device} className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{s.device}</div>
                    <div className="text-xs text-gray-500">{s.loc}</div>
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

      {/* Right column — operational snapshot (read-only) */}
      <div className="space-y-6">
        <SectionCard
          title="Assignment Summary"
          footer={<Link to="/patients" className="text-xs font-bold text-slate-600 hover:underline">View Patients →</Link>}
        >
          <InfoRow label="Assigned Patients" value={isClinical ? staff.patients : "—"} />
          <InfoRow label="Active Journeys" value={isClinical ? 6 : "—"} />
          <InfoRow label="Upcoming Appointments (7 days)" value={isClinical ? 8 : "—"} />
          <InfoRow label="Results Awaiting Review" value={isClinical ? 3 : "—"} highlight={isClinical} />
        </SectionCard>

        <SectionCard
          title="Monthly Activity"
          footer={
            <>
              <span className="text-xs text-gray-400 font-medium">Jul 2026</span>
              <button onClick={() => toast("Full report (demo)")} className="text-xs font-bold text-slate-600 hover:underline">View full report →</button>
            </>
          }
        >
          <InfoRow label="Appointments Completed" value={32} />
          <InfoRow label="Consultations (in-person / video)" value="18 / 14" />
          <InfoRow label="Reports Signed Off" value={28} />
          <InfoRow label="Average Consultation Duration" value="42 min" />
        </SectionCard>

        <SectionCard
          title="Attendance This Month"
          footer={
            <>
              <span className="text-xs text-gray-400 font-medium">Jul 2026</span>
              <Link to="/timesheet" className="text-xs font-bold text-slate-600 hover:underline">View timesheet →</Link>
            </>
          }
        >
          <InfoRow label="Days Scheduled" value={22} />
          <InfoRow label="Days Present" value={20} />
          <InfoRow label="Days On Leave" value={2} />
          <InfoRow label="Attendance Rate" value="91%" />
          <InfoRow label="Overtime Hours" value="4.5h" />
        </SectionCard>
      </div>
    </div>
  );
}
