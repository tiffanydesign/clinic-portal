import React from "react";
import { useNavigate, Outlet } from "react-router";

export function CalendarLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-hidden relative">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export function CalendarScheduleSkeleton({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="p-8 w-full h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Calendar &gt; Schedule</h1>
      <p className="text-sm text-gray-500 mb-8 italic">Detailed content in a later pass</p>

      <div className="flex gap-6 h-[600px] relative flex-1">
        <div className="flex-1 border border-gray-300 bg-white flex flex-col relative overflow-hidden rounded">
           <div className="h-10 border-b border-gray-200 bg-gray-50 flex items-center px-4 text-xs font-bold text-gray-500">
             Calendar Grid Placeholder
           </div>
           <div className="flex-1 flex items-center justify-center p-8">
             <button
                onClick={() => navigate('/calendar/schedule/appointment/A-101')}
                className="w-48 h-20 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-slate-500"
             >
               Clickable Appointment Block
             </button>
           </div>
        </div>

        {/* The overlay is rendered via children */}
        {children}
      </div>
    </div>
  );
}

export function AvailabilityList() {
  const navigate = useNavigate();

  return (
    <div className="p-8 w-full max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar &gt; My Availability</h1>
          <p className="text-sm text-gray-500 mt-1">Configure times when you are available for bookings.</p>
        </div>
      </div>

      <div className="max-w-md">
        <div
          onClick={() => navigate("/calendar/my-availability/clinic")}
          className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:border-slate-500 transition-colors shadow-sm group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-slate-700">Clinic Availability</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">Default</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">Mon – Fri, 9:00 AM – 5:00 PM</p>
            <p className="text-sm text-gray-500 flex items-center">🌐 Europe/Istanbul</p>
          </div>
        </div>
      </div>
    </div>
  );
}
