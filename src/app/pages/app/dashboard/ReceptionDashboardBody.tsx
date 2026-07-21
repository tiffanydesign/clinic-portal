import React, { useMemo, useState } from "react";
import { UserPlus, CalendarPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { RegisterPatientModal } from "../patients/RegisterPatientModal";
import { NewAppointmentModal } from "../calendar/CreateModals";
import { addAppointment, useAppointments } from "./appointmentsStore";
import type { Patient } from "../patientsData";
import { TODAY_LABEL, ROLE_GREETING } from "./dashboardData";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { CalendarWidget } from "./CalendarWidget";
import { useKpiBar, KpiControls, KpiCards } from "./KpiBar";
import { FrontDeskQueue } from "./FrontDeskQueue";
import { QueueGroup } from "./receptionDashboardData";

// Reads/writes the shared appointmentsStore rather than local overrides, so
// a check-in here and a nurse checkout on the Nurse dashboard actually agree
// with each other. Today's Schedule and Front Desk Queue each carry a small
// "+" quick-add in their header (New Booking / Register Patient); the queue
// column renders at its natural content height and the page itself scrolls.
export function ReceptionDashboardBody() {
  const navigate = useNavigate();
  const { apptId } = useParams();
  const appts = useAppointments();
  const [tab, setTab] = useState<QueueGroup>("needs-action");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  // Walk-in closure: register -> "Book first appointment" hands the new
  // patient straight into the booking modal, already selected.
  const [bookFor, setBookFor] = useState<Patient | null>(null);
  // Called unconditionally like Admin's DashboardPage — Reception now uses
  // the exact same KpiBar cards/config (KPI_CONFIG.Reception) and the same
  // greeting-row + controls layout Admin's dashboard uses.
  const kpi = useKpiBar();

  const appt = useMemo(() => appts.find((a) => a.id === apptId), [appts, apptId]);

  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden bg-surface-page">
      {/* Header — same layout as Admin's dashboard: greeting + date on the
          left, KPI range/customise controls on the right of that same row. */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          {/* Greeting + the two front-desk quick actions sit together on the
              left; KPI range/customise controls stay on the far right. Buttons
              reuse the same modal state the panel "+" quick-adds already drive
              (one source of truth). New Booking is primary, New Patient
              secondary. Wraps gracefully at narrow iPad widths. */}
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap min-w-0">
            <div className="shrink-0">
              <h1 className="text-2xl font-bold text-ink whitespace-nowrap">Good morning, {ROLE_GREETING.Reception}</h1>
              <p className="text-sm text-ink-muted mt-1 whitespace-nowrap">{TODAY_LABEL} · Istanbul Clinic</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setRegisterOpen(true)}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-control text-sm font-medium text-ink-soft border border-divider bg-surface hover:bg-surface-page hover:text-ink transition-colors"
              >
                <UserPlus className="w-4 h-4" /> New Patient
              </button>
              <button
                onClick={() => setBookingOpen(true)}
                className="inline-flex items-center gap-2 h-9 px-3.5 btn-primary rounded-control text-sm font-bold transition-colors"
              >
                <CalendarPlus className="w-4 h-4" /> New Booking
              </button>
            </div>
          </div>
          <KpiControls kpi={kpi} />
        </div>
        <KpiCards kpi={kpi} />
      </div>

      {/* Today's Schedule (left) + Front Desk Queue (right) — side by side so
          the queue's actions are always in view next to the day's shape. Both
          panels start at the row's top edge, so their headers line up; each
          header owns a small "+" quick-add. The calendar shows its full
          08:00-19:00 day and the page itself scrolls the rest. */}
      <div className="shrink-0 flex gap-5 px-6 py-3">
        {/* overflow-x-clip contains only CalendarWidget's horizontal bleed —
            it's designed for a full-width row (Admin's dashboard), so at this
            narrower shared-row width its 7 columns want to be wider than the
            space available. Y-axis is left open so the full-day height is
            never clipped. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-x-clip">
          <div className="shrink-0">
            <CalendarWidget onAdd={() => setBookingOpen(true)} />
          </div>
        </div>

        <div className="w-[420px] shrink-0 flex flex-col">
          <FrontDeskQueue
            appts={appts}
            tab={tab}
            onTabChange={setTab}
            onOpen={(id) => navigate(`/dashboard/appointment/${id}`)}
            onAdd={() => setRegisterOpen(true)}
          />
        </div>
      </div>

      {appt && <AppointmentDrawer appt={appt} role="Reception" />}

      {registerOpen && (
        <RegisterPatientModal
          onClose={() => setRegisterOpen(false)}
          onBookFirst={(p) => setBookFor(p)}
        />
      )}

      {(bookingOpen || bookFor) && (
        <NewAppointmentModal
          onClose={() => { setBookingOpen(false); setBookFor(null); }}
          onCreate={addAppointment}
          currentAppts={appts}
          defaults={bookFor ? { patientName: bookFor.name } : undefined}
        />
      )}
    </div>
  );
}
