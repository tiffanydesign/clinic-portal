import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { LeaveDuration, LeaveReason, LEAVE_REASONS } from "./availabilityData";
import { FilterSelect } from "../../../components/FilterSelect";

const DATE_OPTIONS = Array.from({ length: 31 }, (_, i) => `${i + 1} Jul 2026`);
const DURATIONS: LeaveDuration[] = ["Full Day", "Morning", "Afternoon"];

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-surface-hover rounded-control p-0.5 border border-divider w-full">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-control transition-colors ${value === o ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}>
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
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <h2 className="text-lg font-bold text-ink">New Leave Request</h2>
          <button onClick={onClose} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">From</label>
              <FilterSelect
                value={dateFrom}
                onChange={(v) => { setDateFrom(v); if (DATE_OPTIONS.indexOf(v) > toIdx) setDateTo(v); }}
                options={DATE_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">To</label>
              <FilterSelect value={dateTo} onChange={setDateTo} options={DATE_OPTIONS} className="w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">Duration</label>
            <Segmented value={duration} options={DURATIONS} onChange={setDuration} />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">Reason <span className="text-danger-ink">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value as LeaveReason)} className="w-full px-3 py-2 border border-divider rounded-control text-sm text-ink-soft bg-surface outline-none focus:border-border-strong">
              {LEAVE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === "Other" && (
              <input type="text" value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} placeholder="Please describe…" className="w-full mt-2 px-3 py-2 border border-divider rounded-control text-sm outline-none bg-surface focus:border-border-strong" />
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="text-xs text-ink-muted">Leave requests require administrator approval.</p>
        </div>

        <div className="px-6 py-4 border-t border-divider flex justify-end space-x-3 bg-surface-page shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Submit Leave Request</button>
        </div>
      </div>
    </div>
  );
}
