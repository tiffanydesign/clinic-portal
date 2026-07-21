import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams, Outlet } from "react-router";
import { ArrowLeft, MoreHorizontal, Pencil, Camera } from "lucide-react";
import { toast } from "sonner";
import { getStaff, rolePillClass, statusPillClass, getProfileDetails, CURRENT_ADMIN_ID } from "./staffData";

// Staff Details shell: fixed identity header + horizontal tab nav.
// Tab content renders below via children / Outlet.
export function StaffDetailLayout({ children }: { children?: React.ReactNode }) {
  const { staffId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const staff = getStaff(staffId);

  if (!staff) {
    return (
      <div className="p-4">
        <Link to="/staff" className="text-sm text-ink-muted hover:underline mb-4 inline-block">← Staff Management</Link>
        <h1 className="text-2xl font-bold text-ink mb-2">Staff member not found</h1>
        <p className="text-sm text-ink-muted">No staff member with ID “{staffId}”.</p>
      </div>
    );
  }

  const profile = getProfileDetails(staff.id);
  const isSelf = staff.id === CURRENT_ADMIN_ID;
  const showAvailability = staff.role === "Clinician" || staff.role === "Nurse";

  const tabs = [
    { label: "Overview", path: `/staff/${staff.id}/overview` },
    ...(showAvailability ? [{ label: "Availability", path: `/staff/${staff.id}/availability` }] : []),
    { label: "Permissions", path: `/staff/${staff.id}/permissions` },
    { label: "Workload", path: `/staff/${staff.id}/workload` },
  ];

  const menuAction = (msg: string) => { setShowMenu(false); toast(msg); };

  return (
    <div className="flex flex-col h-full bg-surface-page overflow-hidden">
      {/* Identity header — fixed, does not scroll */}
      <div className="bg-surface border-b border-divider px-6 pt-5 pb-0 shrink-0">
        <Link to="/staff" className="flex items-center text-sm text-ink-muted hover:text-ink hover:underline mb-4 w-max">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Staff Management
        </Link>

        <div className="flex justify-between items-start pb-5">
          <div className="flex items-center">
            <button
              onClick={() => toast("Change photo (demo)")}
              title="Change photo"
              className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center text-xl font-bold text-ink-soft shrink-0 mr-4 relative group"
            >
              {staff.avatar}
              <span className="absolute inset-0 rounded-full bg-surface-sunken/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </span>
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-ink">{staff.name}</h1>
                <span className={`px-2 py-0.5 text-overline rounded-control border ${rolePillClass(staff.role)}`}>{staff.role}</span>
                <span className={`px-2 py-0.5 text-overline rounded-control border ${statusPillClass(staff.status)}`}>{staff.status}</span>
              </div>
              {/* Quick facts: the fields Admin looks up most — visible on
                  first paint, no scrolling to the Profile Details card below.
                  Employee ID appears here and ONLY here on the page. */}
              <div className="text-data text-ink-muted font-medium mt-1 flex flex-wrap items-center gap-x-1.5">
                {[
                  staff.specialisation,
                  profile.contractType,
                  `Joined ${staff.joined}`,
                  staff.id,
                  staff.phone,
                ].filter(Boolean).map((fact, i, arr) => (
                  <React.Fragment key={i}>
                    <span>{fact}</span>
                    {i < arr.length - 1 && <span className="text-ink-muted">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toast("Edit profile (demo)")}
              className="flex items-center px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-page transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4 mr-2 text-ink-muted" /> Edit Profile
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 border border-divider rounded-control text-ink-muted bg-surface hover:bg-surface-page transition-colors shadow-sm"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-divider rounded-card shadow-lg z-50 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-page" onClick={() => menuAction(`${staff.name} set On Leave (demo)`)}>Set On Leave</button>
                    {isSelf ? (
                      <button disabled title="You cannot deactivate your own account" className="w-full text-left px-4 py-2 text-sm text-ink-muted cursor-not-allowed">Deactivate Account</button>
                    ) : (
                      <button className="w-full text-left px-4 py-2 text-sm text-danger-ink hover:bg-danger/10" onClick={() => menuAction(`${staff.name}'s account deactivated (demo)`)}>Deactivate Account</button>
                    )}
                    <div className="border-t border-divider my-1" />
                    <button className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-page" onClick={() => menuAction(`Password reset email sent to ${staff.email}`)}>Reset Password</button>
                    <button className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-page" onClick={() => menuAction(`Invitation resent to ${staff.email}`)}>Resend Invitation</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const active = location.pathname.startsWith(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-border-strong text-ink font-bold" : "border-transparent text-ink-muted hover:text-ink-soft"}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {children || <Outlet />}
      </div>
    </div>
  );
}
