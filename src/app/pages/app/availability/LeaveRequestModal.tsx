import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { LeaveDuration, LeaveReason, LEAVE_REASONS } from "./availabilityData";
import { FilterSelect } from "../../../components/FilterSelect";

const DATE_OPTIONS = Array.from({ length: 31 }, (_, i) => `${i + 1} Jul 2026`);
const DURATIONS: LeaveDuration[] = ["Full Day", "Morning", "Afternoon"];

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded p-0.5 border border-gray-200 w-full">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${value === o ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          {o === "Morning" ? "Morning (until 1pm)" : o === "Afternoon" ? "Afternoon (from 1pm)" : o}
        </button>
      ))}
    </div>
  );
}

// `onSubmit` owns validation feedback and closing this modal (it may need to
// layer a Conflict modal on top first), matching OverrideModal's contract.
export function LeaveRequestModal({ onClose, onSubmit, initialDate }: {
  onClose: () => void;
  onSubmit: (dateFrom: string, dateTo: string, duration: LeaveDuration, reason: LeaveReason, reasonOther: string | undefined) => void;
  initialDate?: string;
}) {
  const [dateFrom, setDateFrom] = useState(initialDate ?? DATE_OPTIONS[0]);
  const [dateTo, setDateTo] = useState(initialDate ?? DATE_OPTIONS[0]);
  const [duration, setDuration] = useState<LeaveDuration>("Full Day");
  const [reason, setReason] = useState<LeaveReason>("Annual Leave");
  const [reasonOther, setReasonOther] = useState("");

  const fromIdx = DATE_OPTIONS.indexOf(dateFrom);
  const toIdx = DATE_OPTIONS.indexOf(dateTo);

  const handleSubmit = () => {
    if (toIdx < fromIdx) { toast.error("End date must be on or after the start date."); return; }
    if (reason === "Other" && !reasonOther.trim()) { toast.error("Please describe the reason."); return; }
    onSubmit(dateFrom, dateTo, duration, reason, reason === "Other" ? reasonOther.trim() : undefined);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">New Leave Request</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">From</label>
              <FilterSelect
                value={dateFrom}
                onChange={(v) => { setDateFrom(v); if (DATE_OPTIONS.indexOf(v) > toIdx) setDateTo(v); }}
                options={DATE_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">To</label>
              <FilterSelect value={dateTo} onChange={setDateTo} options={DATE_OPTIONS} className="w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Duration</label>
            <Segmented value={duration} options={DURATIONS} onChange={setDuration} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-red-500">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value as LeaveReason)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500">
              {LEAVE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === "Other" && (
              <input type="text" value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} placeholder="Please describe…" className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white focus:border-slate-500" />
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400">Leave requests require administrator approval.</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Submit Leave Request</button>
        </div>
      </div>
    </div>
  );
}
