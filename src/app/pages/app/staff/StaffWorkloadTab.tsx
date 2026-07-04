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
    <div className="p-8 space-y-6">
      {/* Heading */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Workload — {staff.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Patient load, appointment volume, and capacity analysis</p>
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm">
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
          <option>This Year</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Load</div>
          <div className="text-3xl font-bold text-gray-800">{staff.patients ?? 0} <span className="text-lg font-medium text-gray-500">patients</span></div>
          <div className="text-sm mt-1 font-medium text-gray-500">
            Team avg: 18
            {(staff.patients ?? 0) > 18 * 1.3 && <span className="ml-2 text-red-600 font-bold">Above capacity</span>}
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weekly Appointments</div>
          <div className="text-3xl font-bold text-gray-800">8.5 <span className="text-lg font-medium text-gray-500">avg/week</span></div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Team avg: 6.2</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Utilisation Rate</div>
          <div className={`text-3xl font-bold ${utilColor.text}`}>{utilisation}%</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">of available hours booked</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-[55fr_45fr] gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-1">Appointment Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Appointments by type · {range.toLowerCase()}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={APPOINTMENT_DISTRIBUTION} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" width={158} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={{ fill: "#f3f4f6" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} label={{ position: "right", fontSize: 11, fill: "#374151" }}>
                {APPOINTMENT_DISTRIBUTION.map((d) => <Cell key={d.type} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-1">Weekly Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Appointments per week · past 8 weeks</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={WEEKLY_TREND} margin={{ left: -18, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 14]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <ReferenceLine
                y={CAPACITY_THRESHOLD}
                stroke="#dc2626"
                strokeDasharray="6 4"
                label={{ value: "Capacity threshold", position: "insideTopRight", fontSize: 10, fill: "#dc2626" }}
              />
              <Line
                type="monotone" dataKey="appointments"
                stroke={nearCapacity ? "#dc2626" : "#475569"}
                strokeWidth={2}
                dot={{ r: 3, fill: nearCapacity ? "#dc2626" : "#475569" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment table */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-800">Patient Assignment Detail</h3>
          <button
            onClick={() => selected ? setShowReassign(true) : toast("Select a patient row first.")}
            disabled={!selected}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm ${selected ? "bg-slate-600 hover:bg-slate-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            Reassign Patient
          </button>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-bold text-gray-600 w-[160px]">Patient</th>
              <th className="px-6 py-3 font-bold text-gray-600 w-[80px]">Since</th>
              <th className="px-6 py-3 font-bold text-gray-600 w-[90px]">Last Visit</th>
              <th className="px-6 py-3 font-bold text-gray-600 w-[100px]">Next Appt</th>
              <th className="px-6 py-3 font-bold text-gray-600 w-[120px]">Journey Status</th>
              <th className="px-6 py-3 font-bold text-gray-600 w-[80px]">Complexity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ASSIGNED_PATIENTS.map((p) => {
              const isSelected = selected?.name === p.name;
              return (
                <tr
                  key={p.name}
                  onClick={() => setSelected(isSelected ? null : p)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <td className="px-6 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(p.patientRoute); }}
                      className="font-bold text-gray-800 hover:underline"
                    >
                      {p.name}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{p.since}</td>
                  <td className="px-6 py-3 text-gray-600">{p.lastVisit}</td>
                  <td className="px-6 py-3 text-gray-600">{p.nextAppt}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                      ${p.journeyStatus === "Active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        p.journeyStatus === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {p.journeyStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                      ${p.complexity === "Low" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        p.complexity === "Medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-red-50 text-red-700 border-red-200"}`}>
                      {p.complexity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="h-11 border-t border-gray-200 bg-white flex items-center px-6">
          <span className="text-xs text-gray-500 font-medium">Showing {ASSIGNED_PATIENTS.length} of {staff.patients} assigned patients</span>
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Reassign Patient</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Move <span className="font-bold text-gray-800">{patient.name}</span> from <span className="font-bold text-gray-800">{fromClinician}</span> to another clinician.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Target Clinician <span className="text-red-500">*</span></label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
              <option value="" disabled>Select clinician...</option>
              {OTHER_CLINICIANS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Balancing workload across the team..." className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleConfirm} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">Confirm Reassignment</button>
        </div>
      </div>
    </div>
  );
}
