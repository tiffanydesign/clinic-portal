import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-slate-600" : "bg-gray-300"}`}>
      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

const DATE_OPTIONS = Array.from({ length: 31 }, (_, i) => `${i + 1} Jul 2026`);
const TIME_OPTIONS = ["8:00am", "9:00am", "10:00am", "11:00am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm", "6:00pm"];

export function LeaveRequestModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (date: string, fullDay: boolean, start: string | undefined, end: string | undefined, reason: string | undefined) => string | null;
}) {
  const [date, setDate] = useState(DATE_OPTIONS[0]);
  const [fullDay, setFullDay] = useState(true);
  const [start, setStart] = useState("9:00am");
  const [end, setEnd] = useState("5:00pm");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    const error = onSubmit(date, fullDay, fullDay ? undefined : start, fullDay ? undefined : end, reason.trim() || undefined);
    if (error) { toast.error(error); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">New Leave Request</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Date</label>
            <select value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500">
              {DATE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
            <span className="text-sm font-bold text-gray-800">Full Day</span>
            <Toggle checked={fullDay} onChange={() => setFullDay((v) => !v)} />
          </div>

          {!fullDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Start Time</label>
                <select value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">End Time</label>
                <select value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-gray-400 normal-case font-medium">(optional)</span></label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual leave, Medical appointment…" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white focus:border-slate-500" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Submit</button>
        </div>
      </div>
    </div>
  );
}
