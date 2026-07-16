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
      <div className="p-8">
        <Link to="/staff" className="text-sm text-slate-500 hover:underline mb-4 inline-block">← Staff Management</Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Staff member not found</h1>
        <p className="text-sm text-gray-500">No staff member with ID “{staffId}”.</p>
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
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Identity header — fixed, does not scroll */}
      <div className="bg-white border-b border-gray-200 px-8 pt-5 pb-0 shrink-0">
        <Link to="/staff" className="flex items-center text-sm text-slate-500 hover:text-slate-800 hover:underline mb-4 w-max">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Staff Management
        </Link>

        <div className="flex justify-between items-start pb-5">
          <div className="flex items-center">
            <button
              onClick={() => toast("Change photo (demo)")}
              title="Change photo"
              className="w-16 h-16 rounded-full bg-slate-500 flex items-center justify-center text-xl font-bold text-white shrink-0 mr-4 relative group"
            >
              {staff.avatar}
              <span className="absolute inset-0 rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </span>
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-800">{staff.name}</h1>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${rolePillClass(staff.role)}`}>{staff.role}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusPillClass(staff.status)}`}>{staff.status}</span>
              </div>
              {/* Quick facts: the fields Admin looks up most — visible on
                  first paint, no scrolling to the Profile Details card below.
                  Employee ID appears here and ONLY here on the page. */}
              <div className="text-[13px] text-gray-500 font-medium mt-1 flex flex-wrap items-center gap-x-1.5">
                {[
                  staff.specialisation,
                  profile.contractType,
                  `Joined ${staff.joined}`,
                  staff.id,
                  staff.phone,
                ].filter(Boolean).map((fact, i, arr) => (
                  <React.Fragment key={i}>
                    <span>{fact}</span>
                    {i < arr.length - 1 && <span className="text-gray-300">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toast("Edit profile (demo)")}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4 mr-2 text-gray-500" /> Edit Profile
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 border border-gray-300 rounded-lg text-gray-500 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => menuAction(`${staff.name} set On Leave (demo)`)}>Set On Leave</button>
                    {isSelf ? (
                      <button disabled title="You cannot deactivate your own account" className="w-full text-left px-4 py-2 text-sm text-gray-300 cursor-not-allowed">Deactivate Account</button>
                    ) : (
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => menuAction(`${staff.name}'s account deactivated (demo)`)}>Deactivate Account</button>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => menuAction(`Password reset email sent to ${staff.email}`)}>Reset Password</button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => menuAction(`Invitation resent to ${staff.email}`)}>Resend Invitation</button>
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
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-slate-600 text-slate-800 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
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
