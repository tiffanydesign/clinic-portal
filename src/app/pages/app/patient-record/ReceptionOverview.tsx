import React from "react";
import { useNavigate } from "react-router";
import { Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { PatientRecord } from "./patientRecordData";
import { Card, Field } from "./OverviewTab";
import { StatusPill } from "../dashboard/DashboardShared";

export function ReceptionOverview({ patient }: { patient: PatientRecord }) {
  const navigate = useNavigate();
  const today = patient.appointmentsUpcoming[0];
  const consentPill = patient.consent === "Signed" ? "success" : patient.consent === "Pending" ? "warning" : "error";
  const paymentPill = patient.payment === "Paid" ? "success" : patient.payment === "Partial" ? "warning" : "error";
  const checkInPill = patient.checkIn === "Checked In" ? "success" : patient.checkIn === "Waiting" ? "warning" : "default";

  return (
    <div className="px-4 py-4 space-y-3">
      <Card title="Patient Summary">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" value={patient.name} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Email" value={patient.email} />
          <Field label="Group" value={patient.group} />
          <Field label="Preferred Language" value={patient.preferredLanguage} />
        </div>
      </Card>

      <Card title="Today's Appointment Status">
        {today ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-divider rounded-card p-4 text-center">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-2">Check-in</div>
              <StatusPill status={patient.checkIn} type={checkInPill} />
            </div>
            <div className="border border-divider rounded-card p-4 text-center">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-2">Consent</div>
              <StatusPill status={patient.consent} type={consentPill} />
            </div>
            <div className="border border-divider rounded-card p-4 text-center">
              <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-2">Payment</div>
              <StatusPill status={patient.payment} type={paymentPill} />
            </div>
            <div className="col-span-3 text-sm text-ink-soft text-center">{today.dateLabel} · {today.type} · {today.clinician}</div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted italic">No appointment scheduled for today.</p>
        )}
      </Card>

      <Card title="Contact Information" action={<button onClick={() => toast("Contact patient (demo)")} className="text-xs font-bold text-ink-soft hover:underline">Contact Patient</button>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={<span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-ink-muted" />{patient.phone}</span>} />
          <Field label="Email" value={<span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-ink-muted" />{patient.email}</span>} />
          <Field label="Emergency Contact" value={`${patient.emergencyContact.name} (${patient.emergencyContact.relation})`} />
          <Field label="Emergency Phone" value={patient.emergencyContact.phone} />
        </div>
      </Card>

      <Card title="Payment Status" action={<button onClick={() => navigate("/billing")} className="text-xs font-bold text-ink-soft hover:underline">View Billing</button>}>
        <div className="flex items-center justify-between">
          <Field label="Outstanding Balance" value={<span className={patient.billing.outstanding === "₺0" ? "text-success-ink" : "text-danger-ink"}>{patient.billing.outstanding}</span>} />
          {patient.billing.outstanding !== "₺0" && (
            <button onClick={() => toast("Payment link sent")} className="px-3 py-1.5 bg-ink text-white text-xs font-bold rounded-control hover:bg-ink">Send Payment Link</button>
          )}
        </div>
      </Card>
    </div>
  );
}
