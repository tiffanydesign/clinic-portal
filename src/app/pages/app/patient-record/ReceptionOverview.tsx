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
    <div className="p-8 max-w-4xl mx-auto space-y-6">
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
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Check-in</div>
              <StatusPill status={patient.checkIn} type={checkInPill} />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Consent</div>
              <StatusPill status={patient.consent} type={consentPill} />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payment</div>
              <StatusPill status={patient.payment} type={paymentPill} />
            </div>
            <div className="col-span-3 text-sm text-gray-600 text-center">{today.dateLabel} · {today.type} · {today.clinician}</div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No appointment scheduled for today.</p>
        )}
      </Card>

      <Card title="Contact Information" action={<button onClick={() => toast("Contact patient (demo)")} className="text-xs font-bold text-slate-600 hover:underline">Contact Patient</button>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={<span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{patient.phone}</span>} />
          <Field label="Email" value={<span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{patient.email}</span>} />
          <Field label="Emergency Contact" value={`${patient.emergencyContact.name} (${patient.emergencyContact.relation})`} />
          <Field label="Emergency Phone" value={patient.emergencyContact.phone} />
        </div>
      </Card>

      <Card title="Payment Status" action={<button onClick={() => navigate("/billing")} className="text-xs font-bold text-slate-600 hover:underline">View Billing</button>}>
        <div className="flex items-center justify-between">
          <Field label="Outstanding Balance" value={<span className={patient.billing.outstanding === "₺0" ? "text-emerald-600" : "text-red-600"}>{patient.billing.outstanding}</span>} />
          {patient.billing.outstanding !== "₺0" && (
            <button onClick={() => toast("Payment link sent")} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700">Send Payment Link</button>
          )}
        </div>
      </Card>
    </div>
  );
}
