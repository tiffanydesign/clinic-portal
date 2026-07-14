import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserPlus, CalendarPlus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TODAY_LABEL, TODAY_SHORT, ROLE_GREETING } from "./dashboardData";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CalendarWidget } from "./CalendarWidget";
import { KpiBar } from "./KpiBar";
import { FrontDeskQueue } from "./FrontDeskQueue";
import { useAppointments } from "./appointmentsStore";

// The real collapse toggle sits above the calendar column only, but that
// gave the calendar column extra height Front Desk Queue's column doesn't
// have, so their headers no longer lined up — Front Desk Queue's title sat
// ~28px higher than Today's Schedule's. Rendering this exact same button
// again with `invisible` (keeps its layout box, hides the pixels) as a
// same-height spacer above Front Desk Queue guarantees the two columns'
// real headers start at the same Y regardless of the button's actual
// rendered height, rather than hand-guessing a pixel value that could
// drift out of sync if the button's own styling ever changes.
function ScheduleToggleButton({ collapsed, onToggle, invisible }: { collapsed: boolean; onToggle: () => void; invisible?: boolean }) {
  return (
    <div className={`shrink-0 pb-2 flex justify-center ${invisible ? "invisible" : ""}`} aria-hidden={invisible}>
      <button
        onClick={invisible ? undefined : onToggle}
        tabIndex={invisible ? -1 : 0}
        aria-label={collapsed ? "Expand Today's Schedule" : "Collapse Today's Schedule"}
        className="px-6 py-0.5 text-gray-300 hover:text-gray-500 transition-colors"
      >
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
}

function QuickActionButton({ label, icon, primary, onClick }: { label: string; icon: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold transition-colors min-h-[44px] ${
        primary ? "bg-slate-600 text-white hover:bg-slate-700" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon} {label}
    </button>
  );
}

// Reads/writes the shared appointmentsStore rather than local overrides, so
// a check-in here and a nurse checkout on the Nurse dashboard actually agree
// with each other. Zone 2 (Today's Schedule) scrolls internally; Zone 3
// (Front Desk Queue) renders at its natural content height and the page
// itself scrolls, same as every other surface on this dashboard.
export function ReceptionDashboardBody() {
  const navigate = useNavigate();
  const { apptId } = useParams();
  const appts = useAppointments();
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);

  const appt = useMemo(() => appts.find((a) => a.id === apptId), [appts, apptId]);

  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden bg-gray-50">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xl font-semibold text-gray-800">Good morning, {ROLE_GREETING.Reception}</span>
          <span className="text-sm text-gray-400 ml-2">· {TODAY_LABEL} · Istanbul Clinic</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <QuickActionButton primary label="Register Patient" icon={<UserPlus className="w-4 h-4" />} onClick={() => navigate("/patients/new")} />
          <QuickActionButton label="New Booking" icon={<CalendarPlus className="w-4 h-4" />} onClick={() => toast("New booking (demo)")} />
        </div>
      </div>

      {/* KPI cards — same catalog as Admin (minus New Registrations / Average Wait) */}
      <div className="px-6 pt-4">
        <KpiBar key="Reception" />
      </div>

      {/* Today's Schedule (left) + Front Desk Queue (right) — side by side so
          the queue's actions are always in view next to the day's shape.
          Neither column carries a forced height any more: the calendar shows
          its full 08:00-19:00 day (previously compressed to ~380px, which
          hid more than half the day behind an internal scrollbar), so the
          row now sizes to whichever column is naturally taller and the page
          itself scrolls the rest, same as every other surface here.
          `items-stretch` (the default — no `items-start`) lets the shorter
          Front Desk Queue card's own white background stretch to bottom-align
          with the calendar instead of leaving a bare gray gap beside it. */}
      <div className="shrink-0 flex gap-5 px-6 py-3">
        {/* overflow-x-hidden (not overflow-hidden) contains only CalendarWidget's
            horizontal bleed — it's designed for a full-width row (Admin's
            dashboard), so at this narrower shared-row width its 7 columns
            want to be wider than the space available. Y-axis is left open so
            the calendar's full-day height is never clipped. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
          <ScheduleToggleButton collapsed={scheduleCollapsed} onToggle={() => setScheduleCollapsed((v) => !v)} />
          {scheduleCollapsed ? (
            <div className="h-12 border border-gray-200 rounded-xl shadow-sm bg-white px-4 flex items-center gap-1 text-sm font-bold text-gray-800 shrink-0">
              Today's Schedule <span className="text-gray-400 font-medium ml-1">{TODAY_SHORT}</span>
              <span className="ml-auto text-xs text-gray-400 font-medium">Collapsed</span>
            </div>
          ) : (
            <div className="shrink-0">
              <CalendarWidget />
            </div>
          )}
        </div>

        <div className="w-[420px] shrink-0 flex flex-col">
          <ScheduleToggleButton collapsed={scheduleCollapsed} onToggle={() => setScheduleCollapsed((v) => !v)} invisible />
          <FrontDeskQueue
            appts={appts}
            onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
          />
        </div>
      </div>

      {appt && <AppointmentDrawer appt={appt} role="Reception" />}
    </div>
  );
}
