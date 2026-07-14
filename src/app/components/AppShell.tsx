import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Bell, Map, HelpCircle, ChevronRight, ChevronDown,
  LayoutDashboard, Calendar, Users, UserCog, Settings, CreditCard,
  MessageSquare, Clock, ClipboardList, User, LogOut, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { SubmitFeedbackModal } from "./SubmitFeedbackModal";
import { GlobalSearch } from "./GlobalSearch";

const NAV_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/calendar": Calendar,
  "/patients": Users,
  "/staff": UserCog,
  "/clinic-settings": Settings,
  "/billing": CreditCard,
  "/feedback": MessageSquare,
  "/timesheet": Clock,
  "/notifications": Bell,
  "/approval": ClipboardList,
  "/profile": User,
};

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
    { label: "My Requests", path: "/approval" },
    { label: "Profile", path: "/profile" }
  ]
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, setRole, logout, isFeedbackModalOpen, setFeedbackModalOpen } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = NAV_ITEMS[role];
  
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <div className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-300 flex flex-col shrink-0 transition-[width] duration-200`}>
        <div className={`h-16 flex items-center border-b border-gray-300 shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-6"}`}>
          {!sidebarCollapsed && <span className="font-bold text-lg text-gray-800 tracking-tight truncate">Phenome Portal</span>}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {currentNav.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = NAV_ICON[item.path] ?? LayoutDashboard;

            if (item.children) {
              const isExpanded = calendarExpanded && !sidebarCollapsed;
              return (
                <div key={item.label} className="flex flex-col">
                  <div
                    onClick={() => {
                      if (sidebarCollapsed) { navigate(item.children[0].path); return; }
                      if (!isExpanded) {
                        navigate(item.children[0].path);
                      }
                      setCalendarExpanded(!isExpanded);
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center ${sidebarCollapsed ? "justify-center px-0 py-3" : "justify-between px-6 py-3"} text-sm font-medium cursor-pointer transition-colors ${isActive ? 'bg-slate-50 text-slate-800' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!sidebarCollapsed && (isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />)}
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
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center px-0 py-3" : "px-6 py-3"} text-sm font-medium transition-colors ${isActive && !item.children ? 'bg-slate-100 text-slate-800 border-r-4 border-slate-500' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="my-4 border-t border-gray-200"></div>

          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 ${sidebarCollapsed ? "justify-center px-0 py-3" : "px-6 py-3"} text-sm font-medium text-gray-600 hover:bg-gray-50 text-left`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-4 flex-1">
            <GlobalSearch />
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
