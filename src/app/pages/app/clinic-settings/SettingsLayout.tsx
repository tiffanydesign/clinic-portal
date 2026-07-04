import React from "react";
import { Link, useLocation, Outlet } from "react-router";
import { Settings, FileText, Activity, PenTool, Folder } from "lucide-react";

export function SettingsLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { label: "Reports", path: "/clinic-settings/reports", icon: <FileText className="w-4 h-4 mr-3" /> },
    { label: "Diagnoses", path: "/clinic-settings/diagnoses", icon: <Activity className="w-4 h-4 mr-3" /> },
    { label: "Signed Form Templates", path: "/clinic-settings/form-templates", icon: <PenTool className="w-4 h-4 mr-3" /> },
    { label: "Consent Files", path: "/clinic-settings/consent-files", icon: <Folder className="w-4 h-4 mr-3" /> },
  ];

  return (
    <div className="flex h-full bg-white text-gray-800">
      
      {/* Left Sidebar (220px) */}
      <div className="w-[220px] bg-gray-50 border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-1">
            <Settings className="w-5 h-5 mr-2" /> Clinic Settings
          </h2>
          <p className="text-xs text-gray-500 leading-tight">Manage clinic templates and configurations</p>
        </div>
        
        <div className="px-6 mb-4">
          <div className="h-px bg-gray-200 w-full" />
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors relative
                    ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />}
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {children || <Outlet />}
      </div>
    </div>
  );
}
