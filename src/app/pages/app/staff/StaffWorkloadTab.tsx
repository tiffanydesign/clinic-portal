import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, LineChart, Line, ReferenceLine,
  CartesianGrid, ResponsiveContainer, Cell, Tooltip as ChartTooltip,
} from "recharts";
import {
  getStaff, workloadColor, ASSIGNED_PATIENTS, AssignedPatient,
  APPOINTMENT_DISTRIBUTION, WEEKLY_TREND, CAPACITY_THRESHOLD, OTHER_CLINICIANS,
} from "./staffData";
import { FilterSelect } from "../../../components/FilterSelect";

const nearCapacity = WEEKLY_TREND.some((w) => w.appointments >= CAPACITY_THRESHOLD - 1);

export function StaffWorkloadTab() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const staff = getStaff(staffId);
  const [range, setRange] = useState("This Month");
  const [selected, setSelected] = useState<AssignedPatient | null>(null);
  const [showReassign, setShowReassign] = useState(false);

  if (!staff) return null;
  const utilisation = staff.workload ?? 0;
  const utilColor = workloadColor(utilisation);

  return (
    <div className="p-4 space-y-6">
      {/* Heading */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-ink">Workload — {staff.name}</h2>
          <p className="text-sm text-ink-muted mt-1">Patient load, appointment volume, and capacity analysis</p>
        </div>
        <FilterSelect value={range} onChange={setRange} options={["This Month", "Last Month", "Last 3 Months", "This Year"]} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface rounded-card p-5">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Patient Load</div>
          <div className="text-3xl font-bold text-ink">{staff.patients ?? 0} <span className="text-lg font-medium text-ink-muted">patients</span></div>
          <div className="text-sm mt-1 font-medium text-ink-muted">
            Team avg: 18
            {(staff.patients ?? 0) > 18 * 1.3 && <span className="ml-2 text-danger-ink font-bold">Above capacity</span>}
          </div>
        </div>
        <div className="bg-surface rounded-card p-5">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Weekly Appointments</div>
          <div className="text-3xl font-bold text-ink">8.5 <span className="text-lg font-medium text-ink-muted">avg/week</span></div>
          <div className="text-sm text-ink-muted mt-1 font-medium">Team avg: 6.2</div>
        </div>
        <div className="bg-surface rounded-card p-5">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Utilisation Rate</div>
          <div className={`text-3xl font-bold ${utilColor.text}`}>{utilisation}%</div>
          <div className="text-sm text-ink-muted mt-1 font-medium">of available hours booked</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-[55fr_45fr] gap-6">
        <div className="bg-surface rounded-card p-6">
          <h3 className="text-base font-bold text-ink mb-1">Appointment Distribution</h3>
          <p className="text-xs text-ink-muted mb-4">Appointments by type · {range.toLowerCase()}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={APPOINTMENT_DISTRIBUTION} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" width={158} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{ fill: "var(--surface-hover)" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border-strong)" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} label={{ position: "right", fontSize: 11, fill: "var(--text-secondary)" }}>
                {APPOINTMENT_DISTRIBUTION.map((d) => <Cell key={d.type} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-card p-6">
          <h3 className="text-base font-bold text-ink mb-1">Weekly Trend</h3>
          <p className="text-xs text-ink-muted mb-4">Appointments per week · past 8 weeks</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={WEEKLY_TREND} margin={{ left: -18, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-hover)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 14]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border-strong)" }} />
              <ReferenceLine
                y={CAPACITY_THRESHOLD}
                stroke="var(--status-danger)"
                strokeDasharray="6 4"
                label={{ value: "Capacity threshold", position: "insideTopRight", fontSize: 10, fill: "var(--status-danger)" }}
              />
              <Line
                type="monotone" dataKey="appointments"
                stroke={nearCapacity ? "var(--status-danger)" : "var(--text-secondary)"}
                strokeWidth={2}
                dot={{ r: 3, fill: nearCapacity ? "var(--status-danger)" : "var(--text-secondary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment table */}
      <div className="bg-surface border border-divider rounded-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-divider bg-surface-page flex justify-between items-center">
          <h3 className="text-base font-bold text-ink">Patient Assignment Detail</h3>
          <button
            onClick={() => selected ? setShowReassign(true) : toast("Select a patient row first.")}
            disabled={!selected}
            className={`px-4 py-2 rounded-control text-sm font-bold transition-colors shadow-sm ${selected ? "bg-ink text-white" : "bg-surface-hover text-ink-muted cursor-not-allowed"}`}
          >
            Reassign Patient
          </button>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-page border-b border-divider">
            <tr>
              <th className="px-6 py-3 font-bold text-ink-soft w-[160px]">Patient</th>
              <th className="px-6 py-3 font-bold text-ink-soft w-[80px]">Since</th>
              <th className="px-6 py-3 font-bold text-ink-soft w-[90px]">Last Visit</th>
              <th className="px-6 py-3 font-bold text-ink-soft w-[100px]">Next Appt</th>
              <th className="px-6 py-3 font-bold text-ink-soft w-[120px]">Journey Status</th>
              <th className="px-6 py-3 font-bold text-ink-soft w-[80px]">Complexity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {ASSIGNED_PATIENTS.map((p) => {
              const isSelected = selected?.name === p.name;
              return (
                <tr
                  key={p.name}
                  onClick={() => setSelected(isSelected ? null : p)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-surface-hover" : "hover:bg-surface-page"}`}
                >
                  <td className="px-6 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(p.patientRoute); }}
                      className="font-bold text-ink hover:underline"
                    >
                      {p.name}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{p.since}</td>
                  <td className="px-6 py-3 text-ink-soft">{p.lastVisit}</td>
                  <td className="px-6 py-3 text-ink-soft">{p.nextAppt}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-overline rounded-control border
                      ${p.journeyStatus === "Active" ? "bg-info/10 text-info-ink border-info/30" :
                        p.journeyStatus === "Completed" ? "bg-success/10 text-success-ink border-success/30" :
                        "bg-surface-page text-ink-muted border-divider"}`}>
                      {p.journeyStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-overline rounded-control border
                      ${p.complexity === "Low" ? "bg-success/10 text-success-ink border-success/30" :
                        p.complexity === "Medium" ? "bg-warning/10 text-warning-ink border-warning/30" :
                        "bg-danger/10 text-danger-ink border-danger/30"}`}>
                      {p.complexity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="h-11 border-t border-divider bg-surface flex items-center px-6">
          <span className="text-xs text-ink-muted font-medium">Showing {ASSIGNED_PATIENTS.length} of {staff.patients} assigned patients</span>
        </div>
      </div>

      {showReassign && selected && (
        <ReassignModal
          patient={selected}
          fromClinician={staff.name}
          onClose={() => setShowReassign(false)}
          onDone={() => { setShowReassign(false); setSelected(null); }}
        />
      )}
    </div>
  );
}

function ReassignModal({ patient, fromClinician, onClose, onDone }: { patient: AssignedPatient; fromClinician: string; onClose: () => void; onDone: () => void }) {
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!target) { toast.error("Please select a target clinician."); return; }
    if (!reason.trim()) { toast.error("Please provide a reason for the reassignment."); return; }
    toast.success(`${patient.name} reassigned to ${target}.`);
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page">
          <h2 className="text-lg font-bold text-ink">Reassign Patient</h2>
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-ink-soft">
            Move <span className="font-bold text-ink">{patient.name}</span> from <span className="font-bold text-ink">{fromClinician}</span> to another clinician.
          </p>
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Target Clinician <span className="text-danger-ink">*</span></label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 border border-divider rounded-control text-sm outline-none focus:border-border-strong bg-surface">
              <option value="" disabled>Select clinician...</option>
              {OTHER_CLINICIANS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Reason <span className="text-danger-ink">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Balancing workload across the team..." className="w-full px-3 py-2 border border-divider rounded-control text-sm outline-none focus:border-border-strong resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="px-6 py-2 btn-primary rounded-control text-sm font-bold transition-colors shadow-sm">Confirm Reassignment</button>
        </div>
      </div>
    </div>
  );
}
