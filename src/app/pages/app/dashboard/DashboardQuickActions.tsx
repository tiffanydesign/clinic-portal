import React, { useState } from "react";
import { UserPlus, CalendarPlus } from "lucide-react";
import { RegisterPatientModal } from "../patients/RegisterPatientModal";
import { NewAppointmentModal } from "../calendar/CreateModals";
import { addAppointment, useAppointments } from "./appointmentsStore";
import type { Patient } from "../patientsData";

// The two primary front-desk actions, surfaced together at the top of the
// Admin and Reception dashboards. Self-contained: it owns the two create
// modals and the walk-in closure (New Patient -> "Book first appointment"
// hands the new patient straight into the booking modal, already selected),
// so a dashboard just drops <DashboardQuickActions /> into its header.
//
// Hierarchy: New Booking is the primary (solid) action — the most frequent
// front-desk task; New Patient is secondary (outline) so the pair reads as
// one calm action group, not two competing CTAs.
export function DashboardQuickActions() {
  const appts = useAppointments();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookFor, setBookFor] = useState<Patient | null>(null);

  return (
    <>
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
    </>
  );
}
