import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, Plus, Video, MapPin } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { RecordAppt } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";
import { statusPillType } from "../dashboard/dashboardData";
import { roomName } from "../clinic-settings/roomsStore";

function ApptTable({ title, appts, expandable, editable, action }: {
  title: string; appts: RecordAppt[]; expandable?: boolean; editable?: boolean; action?: React.ReactNode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="border border-divider rounded-card bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-divider flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {action}
      </div>
      {appts.length === 0 ? (
        <div className="p-6 text-center text-sm text-ink-muted italic">No appointments.</div>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-page border-b border-divider text-ink-soft">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Date / Time</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Clinician</th>
              <th className="px-4 py-2.5 font-semibold">Room</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {appts.map((a) => (
              <React.Fragment key={a.id}>
                <tr onClick={() => expandable && setExpandedId((id) => (id === a.id ? null : a.id))} className={expandable ? "hover:bg-surface-page cursor-pointer" : ""}>
                  <td className="px-4 py-3 font-medium text-ink">{a.dateLabel}</td>
                  <td className="px-4 py-3 text-ink-soft"><span className="flex items-center gap-1.5">{a.isVideo ? <Video className="w-3.5 h-3.5 text-ink-muted" /> : <MapPin className="w-3.5 h-3.5 text-ink-muted" />}{a.type}</span></td>
                  <td className="px-4 py-3 text-ink-soft">{a.clinician}</td>
                  <td className="px-4 py-3 text-ink-soft">{roomName(a.room)}</td>
                  <td className="px-4 py-3"><StatusPill status={a.status} type={statusPillType(a.status as any)} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {editable && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); toast("Reschedule (demo)"); }} className="px-2.5 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface-page rounded-control hover:bg-surface-hover">Reschedule</button>
                          <button onClick={(e) => { e.stopPropagation(); toast.error("Appointment cancelled (demo)"); }} className="px-2.5 py-1 text-xs font-bold text-danger-ink border border-danger/30 bg-danger/10 rounded-control hover:bg-danger/15">Cancel</button>
                        </>
                      )}
                      {expandable && <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${expandedId === a.id ? "rotate-180" : ""}`} />}
                    </div>
                  </td>
                </tr>
                {expandable && expandedId === a.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 bg-surface-page text-xs text-ink-muted">
                      <div className="flex gap-4">
                        <button onClick={() => toast("Opening results (demo)")} className="font-bold text-ink-soft hover:underline">View Results</button>
                        <button onClick={() => toast("Opening notes (demo)")} className="font-bold text-ink-soft hover:underline">View Notes</button>
                        <button onClick={() => toast("Opening billing (demo)")} className="font-bold text-ink-soft hover:underline">View Billing Summary</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NurseTodayCard({ appt }: { appt?: RecordAppt }) {
  return (
    <div className="border border-divider rounded-card bg-surface p-5 max-w-md">
      <h3 className="text-sm font-bold text-ink mb-3">Today&#39;s Appointment Information</h3>
      {appt ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Time</span><span className="font-medium text-ink">{appt.dateLabel}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Type</span><span className="font-medium text-ink">{appt.type}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Clinician</span><span className="font-medium text-ink">{appt.clinician}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Room</span><span className="font-medium text-ink">{roomName(appt.room)}</span></div>
          <div className="flex justify-between items-center"><span className="text-ink-muted">Status</span><StatusPill status={appt.status} type={statusPillType(appt.status as any)} /></div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted italic">No appointment with you today.</p>
      )}
    </div>
  );
}

export function AppointmentsTab() {
  const { patient, role } = usePatientOutletContext();
  const navigate = useNavigate();
  const { patientId } = useParams();

  if (role === "Nurse") {
    return (
      <div className="p-4">
        <NurseTodayCard appt={patient.appointmentsUpcoming.find((a) => a.dateLabel.startsWith("3 Jul"))} />
      </div>
    );
  }

  const editable = role === "Admin" || role === "Reception";
  const expandable = role === "Admin" || role === "Clinician";

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <ApptTable
        title="Upcoming Appointments"
        appts={patient.appointmentsUpcoming}
        editable={editable}
        action={role === "Reception" && (
          <button onClick={() => navigate("/calendar/schedule")} className="px-3 py-1.5 bg-ink text-white text-xs font-bold rounded-control hover:bg-ink flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New Appointment</button>
        )}
      />
      <ApptTable title="Previous Appointments" appts={patient.appointmentsPrevious} expandable={expandable} />
    </div>
  );
}
