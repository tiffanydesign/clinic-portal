import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { UserPlus, CalendarPlus, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TODAY_LABEL, TODAY_SHORT, ROLE_GREETING } from "./dashboardData";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CalendarWidget } from "./CalendarWidget";
import { KpiBar } from "./KpiBar";
import { FrontDeskQueue } from "./FrontDeskQueue";
import { useAppointments } from "./appointmentsStore";
import { ChipId, chipValue, matchesChip } from "./receptionDashboardData";

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

// Live stat chip: a ≥44pt tappable filter onto the queue below, filled when
// active with an inline clear. "Unpaid" hides entirely at zero — a healthy
// front desk shouldn't have a permanent zero sitting in view; "In Clinic"
// always shows, since knowing who's in is a standing fact, not a problem.
function StatChip({ id, label, dotColor, count, sublabel, active, onClick }: {
  id: ChipId;
  label: string;
  dotColor: string;
  count: number;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold transition-colors min-h-[44px] border ${
        active ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-white" : dotColor}`} />
      {label} · {count}{sublabel ? ` · ${sublabel}` : ""}
      {active && <X className="w-3.5 h-3.5" />}
    </button>
  );
}

// Reads/writes the shared appointmentsStore rather than local overrides, so
// a check-in here and a nurse checkout on the Nurse dashboard actually agree
// with each other. Zone 2 (Today's Schedule) and Zone 3 (Front Desk Queue)
// each scroll internally; the page itself only scrolls if the KPI row +
// enlarged schedule genuinely don't fit a shorter viewport, same as Admin's
// own dashboard.
export function ReceptionDashboardBody() {
  const navigate = useNavigate();
  const { apptId } = useParams();
  const appts = useAppointments();
  const [activeFilter, setActiveFilter] = useState<ChipId | null>(null);
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);

  const visibleAppts = activeFilter ? appts.filter((a) => matchesChip(a, activeFilter)) : appts;
  const appt = useMemo(() => appts.find((a) => a.id === apptId), [appts, apptId]);

  const toggleFilter = (f: ChipId) => setActiveFilter((prev) => (prev === f ? null : f));

  const inClinic = chipValue("in-clinic", appts);
  const unpaid = chipValue("unpaid", appts);

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xl font-semibold text-gray-800">Good morning, {ROLE_GREETING.Reception}</span>
          <span className="text-sm text-gray-400 ml-2">· {TODAY_LABEL} · Istanbul Clinic</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatChip id="in-clinic" label="In Clinic" dotColor="bg-blue-500" count={inClinic.count} active={activeFilter === "in-clinic"} onClick={() => toggleFilter("in-clinic")} />
          {unpaid.count > 0 && (
            <StatChip id="unpaid" label="Unpaid" dotColor="bg-red-500" count={unpaid.count} sublabel={unpaid.sublabel} active={activeFilter === "unpaid"} onClick={() => toggleFilter("unpaid")} />
          )}
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

      {/* Today's Schedule — collapsible from the outside; CalendarWidget's
          own internals are untouched either way, per the redesign's hard
          constraint. The chevron strip is the sole toggle affordance. */}
      <div className="shrink-0 px-6 pt-3 flex justify-center">
        <button
          onClick={() => setScheduleCollapsed((v) => !v)}
          aria-label={scheduleCollapsed ? "Expand Today's Schedule" : "Collapse Today's Schedule"}
          className="px-6 py-0.5 text-gray-300 hover:text-gray-500 transition-colors"
        >
          {scheduleCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      {scheduleCollapsed ? (
        <div className="shrink-0 px-6 pb-1">
          <div className="h-12 border border-gray-200 rounded-xl shadow-sm bg-white px-4 flex items-center gap-1 text-sm font-bold text-gray-800">
            Today's Schedule <span className="text-gray-400 font-medium ml-1">{TODAY_SHORT}</span>
            <span className="ml-auto text-xs text-gray-400 font-medium">Collapsed</span>
          </div>
        </div>
      ) : (
        <div className="h-[440px] shrink-0 px-6 pb-1">
          <CalendarWidget />
        </div>
      )}

      {/* Front Desk Queue — the hero surface */}
      <div className="flex-1 min-h-[380px] px-6 py-4">
        <FrontDeskQueue
          appts={visibleAppts}
          activeFilter={activeFilter}
          onClearFilter={() => setActiveFilter(null)}
          onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
        />
      </div>

      {appt && <AppointmentDrawer appt={appt} role="Reception" />}
    </div>
  );
}
