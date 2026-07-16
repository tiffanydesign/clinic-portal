import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TODAY_LABEL, TODAY_SHORT, ROLE_GREETING } from "./dashboardData";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CalendarWidget } from "./CalendarWidget";
import { useKpiBar, KpiControls, KpiCards } from "./KpiBar";
import { FrontDeskQueue } from "./FrontDeskQueue";
import { useAppointments } from "./appointmentsStore";
import { QueueGroup } from "./receptionDashboardData";

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
  const [tab, setTab] = useState<QueueGroup>("needs-action");
  // Called unconditionally like Admin's DashboardPage — Reception now uses
  // the exact same KpiBar cards/config (KPI_CONFIG.Reception) and the same
  // greeting-row + controls layout Admin's dashboard uses.
  const kpi = useKpiBar();

  const appt = useMemo(() => appts.find((a) => a.id === apptId), [appts, apptId]);

  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden bg-gray-50">
      {/* Header — same layout as Admin's dashboard: greeting + date on the
          left, KPI range/customise controls on the right of that same row,
          no bordered bar underneath (KPI_CONFIG.Reception mirrors Admin's
          locked+pool minus New Registrations/Average Wait, which would be
          redundant next to the Front Desk Queue's own registration and
          wait-time signal). */}
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Good morning, {ROLE_GREETING.Reception}</h1>
            <p className="text-sm text-gray-500 mt-1">{TODAY_LABEL} · Istanbul Clinic</p>
          </div>
          <KpiControls kpi={kpi} />
        </div>
        <KpiCards kpi={kpi} />
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
            tab={tab}
            onTabChange={setTab}
            onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
          />
        </div>
      </div>

      {appt && <AppointmentDrawer appt={appt} role="Reception" />}
    </div>
  );
}
