import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Bell, Search, Map, HelpCircle, X, ChevronRight, ChevronDown } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { SubmitFeedbackModal } from "./SubmitFeedbackModal";

const NAV_ITEMS = {
  Admin: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "Team Availability", path: "/calendar/team-availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Staff", path: "/staff" },
    { label: "Clinic Settings", path: "/clinic-settings" },
    { label: "Billing", path: "/billing" },
    { label: "Feedback", path: "/feedback" },
    { label: "Timesheet", path: "/timesheet" },
    { label: "Notifications", path: "/notifications" },
    { label: "Approval", path: "/approval" },
    { label: "Profile", path: "/profile" }
  ],
  Reception: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "Team Availability", path: "/calendar/team-availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Billing", path: "/billing" },
    { label: "Notifications", path: "/notifications" },
    { label: "Profile", path: "/profile" }
  ],
  Nurse: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "My Availability", path: "/calendar/my-availability" },
      { label: "Team Availability", path: "/calendar/team-availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Notifications", path: "/notifications" },
    { label: "Profile", path: "/profile" }
  ],
  Clinician: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Calendar", path: "/calendar", children: [
      { label: "Schedule", path: "/calendar/schedule" },
      { label: "My Availability", path: "/calendar/my-availability" },
      { label: "Team Availability", path: "/calendar/team-availability" }
    ]},
    { label: "Patients", path: "/patients" },
    { label: "Notifications", path: "/notifications" },
    { label: "Approval", path: "/approval" },
    { label: "Profile", path: "/profile" }
  ]
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, setRole, logout, isFeedbackModalOpen, setFeedbackModalOpen } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = NAV_ITEMS[role];
  
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/calendar')) {
      setCalendarExpanded(true);
    }
  }, [location.pathname]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as any);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-screen min-w-[1024px] bg-white text-gray-800 font-sans overflow-hidden">
      <div className="w-64 bg-white border-r border-gray-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-300 font-bold text-lg text-gray-800 tracking-tight">
          Phenome Portal
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {currentNav.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            
            if (item.children) {
              const isExpanded = calendarExpanded;
              return (
                <div key={item.label} className="flex flex-col">
                  <div 
                    onClick={() => {
                      if (!isExpanded) {
                        navigate(item.children[0].path);
                      }
                      setCalendarExpanded(!isExpanded);
                    }}
                    className={`flex items-center justify-between px-6 py-3 text-sm font-medium cursor-pointer transition-colors ${isActive ? 'bg-slate-50 text-slate-800' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{item.label}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                  {isExpanded && (
                    <div className="flex flex-col bg-slate-50/50 py-1">
                      {item.children.map(child => {
                        const isChildActive = location.pathname.startsWith(child.path);
                        return (
                          <Link
                            key={child.label}
                            to={child.path}
                            className={`flex items-center pl-10 pr-6 py-2.5 text-sm font-medium transition-colors ${isChildActive ? 'bg-slate-200 text-slate-800 border-r-4 border-slate-500' : 'text-gray-500 hover:bg-slate-100 hover:text-gray-700'}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-slate-400 mr-2 shrink-0"></span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive && !item.children ? 'bg-slate-100 text-slate-800 border-r-4 border-slate-500' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <div className="my-4 border-t border-gray-200"></div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 text-left"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search patients, staff..." 
                className="w-full pl-8 pr-4 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {role !== "Admin" && (
              <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                <HelpCircle className="w-4 h-4 mr-1.5" /> Help
              </button>
            )}
            
            <Link to="/site-map" className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800">
              <Map className="w-4 h-4 mr-1.5" /> Site Map
            </Link>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demo Role:</span>
              <select 
                value={role}
                onChange={handleRoleChange}
                className="border border-gray-300 rounded text-sm px-2 py-1 outline-none focus:border-slate-500 bg-white"
              >
                <option value="Admin">Admin</option>
                <option value="Reception">Reception</option>
                <option value="Nurse">Nurse</option>
                <option value="Clinician">Clinician</option>
              </select>
            </div>
            
            <Link to="/notifications" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-600 rounded-full border-2 border-white"></div>
            </Link>
            
            <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
              {role.charAt(0)}
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 relative">
          {children}
        </div>
      </div>
      
      {isFeedbackModalOpen && <SubmitFeedbackModal />}
    </div>
  );
}
