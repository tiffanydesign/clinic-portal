import React, { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { NewAppointmentModal } from "../calendar/CreateModals";
import { addAppointment, useAppointments } from "./appointmentsStore";

// The primary front-desk action, surfaced at the top of the Admin dashboard.
// Self-contained: it owns the New Booking create modal, so the dashboard
// just drops <DashboardQuickActions /> into its header.
export function DashboardQuickActions() {
  const appts = useAppointments();
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setBookingOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-3.5 btn-primary rounded-control text-sm font-bold transition-colors"
        >
          <CalendarPlus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {bookingOpen && (
        <NewAppointmentModal
          onClose={() => setBookingOpen(false)}
          onCreate={addAppointment}
          currentAppts={appts}
        />
      )}
    </>
  );
}
