import React from "react";
import { useNavigate, Outlet } from "react-router";

export function CalendarLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-surface-page">
      <div className="flex-1 overflow-hidden relative">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export function CalendarScheduleSkeleton({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="p-4 w-full h-full flex flex-col">
      <h1 className="text-2xl font-bold text-ink mb-2">Calendar &gt; Schedule</h1>
      <p className="text-sm text-ink-muted mb-8 italic">Detailed content in a later pass</p>

      <div className="flex gap-6 h-[600px] relative flex-1">
        <div className="flex-1 border border-divider bg-surface flex flex-col relative overflow-hidden rounded-control">
           <div className="h-10 border-b border-divider bg-surface-page flex items-center px-4 text-xs font-bold text-ink-muted">
             Calendar Grid Placeholder
           </div>
           <div className="flex-1 flex items-center justify-center p-4">
             <button
                onClick={() => navigate('/calendar/schedule/appointment/A-101')}
                className="w-48 h-20 bg-surface-hover border border-divider rounded-control flex items-center justify-center text-xs text-ink-muted cursor-pointer hover:border-border-strong"
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
    <div className="p-4 w-full max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendar &gt; My Availability</h1>
          <p className="text-sm text-ink-muted mt-1">Configure times when you are available for bookings.</p>
        </div>
      </div>

      <div className="max-w-md">
        <div
          onClick={() => navigate("/calendar/my-availability/clinic")}
          className="bg-surface border border-divider rounded-card p-6 cursor-pointer hover:border-border-strong hover:shadow-md transition-all shadow-sm group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-ink group-hover:text-ink-soft">Clinic Availability</h3>
            <span className="px-2 py-1 bg-success/10 border border-success/30 text-success-ink text-overline rounded-full">Default</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-ink-soft font-medium">Mon – Fri, 9:00 AM – 5:00 PM</p>
            <p className="text-sm text-ink-muted flex items-center">🌐 Europe/Istanbul</p>
          </div>
        </div>
      </div>
    </div>
  );
}
