import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Slot } from "./availabilityData";

// Reuses the existing Add Date Override calendar UI. Restricted to a single
// selected date (rather than the original multi-date picker) because the
// resulting request can only ever be one Pending item at a time.
export function OverrideModal({ onClose, onApply, existingDates }: {
  onClose: () => void;
  onApply: (date: string, slots: Slot[], reason: string | undefined, unavailable: boolean) => string | null;
  existingDates: number[];
}) {
  const blanks = Array(3).fill(null); // Sun, Mon, Tue lead-in for July 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([{ start: "10:00am", end: "2:00pm" }]);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [reason, setReason] = useState("");

  const updateSlot = (index: number, field: "start" | "end", val: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = val;
    setSlots(newSlots);
  };

  const addSlot = () => setSlots([...slots, { start: "2:00pm", end: "5:00pm" }]);
  const removeSlot = (index: number) => setSlots(slots.filter((_, i) => i !== index));

  const handleApply = () => {
    if (selectedDate === null) {
      toast.error("Please select a date.");
      return;
    }
    if (isUnavailable && !reason.trim()) {
      toast.error("Please enter a reason for being unavailable.");
      return;
    }
    const date = `${selectedDate} Jul 2026`;
    const error = onApply(date, isUnavailable ? [] : slots, isUnavailable ? reason : undefined, isUnavailable);
    if (error) { toast.error(error); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Add Date Override</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Calendar */}
          <div className="w-1/2 p-8 border-r border-gray-200 bg-white overflow-y-auto">
            <h3 className="text-base font-bold text-gray-800 mb-6">Select the date to override</h3>
            <div className="border border-gray-200 rounded p-4">
              <div className="flex justify-between items-center mb-6">
                <button className="p-1 text-gray-400 hover:text-gray-800"><ChevronLeft className="w-5 h-5" /></button>
                <div className="font-bold text-gray-800">July 2026</div>
                <button className="p-1 text-gray-400 hover:text-gray-800"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10"></div>)}
                {days.map((d) => {
                  const isSelected = selectedDate === d;
                  const hasOverride = existingDates.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`h-10 w-full rounded-full flex flex-col items-center justify-center relative text-sm font-medium transition-colors
                        ${isSelected ? "bg-slate-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}
                        ${hasOverride && !isSelected ? "font-bold" : ""}`}
                    >
                      {d}
                      {hasOverride && <div className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? "bg-white" : "bg-slate-500"}`}></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Time slots */}
          <div className="w-1/2 p-8 bg-gray-50 overflow-y-auto flex flex-col">
            <h3 className="text-base font-bold text-gray-800 mb-6">Unavailable Hours</h3>
            {isUnavailable ? (
              <div className="flex-1 flex flex-col">
                <div className="text-sm font-bold text-gray-500 bg-gray-100 p-4 rounded text-center mb-6">Unavailable on selected date</div>
                <div className="mb-4 group">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 group-hover:text-slate-800 transition-colors">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Sick leave, Conference…"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white focus:border-slate-500 transition-colors"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">A reason is required to mark the day as unavailable.</div>
                </div>
                <button onClick={() => setIsUnavailable(false)} className="text-sm font-bold text-slate-600 hover:underline self-start mt-2">
                  + Add specific hours instead
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="space-y-4 mb-6">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <select value={slot.start} onChange={(e) => updateSlot(i, "start", e.target.value)} className="flex-1 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm outline-none focus:border-slate-500">
                        <option value="8:00am">8:00am</option>
                        <option value="9:00am">9:00am</option>
                        <option value="10:00am">10:00am</option>
                        <option value="11:00am">11:00am</option>
                        <option value="12:00pm">12:00pm</option>
                      </select>
                      <span className="text-gray-400 font-medium">-</span>
                      <select value={slot.end} onChange={(e) => updateSlot(i, "end", e.target.value)} className="flex-1 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm outline-none focus:border-slate-500">
                        <option value="1:00pm">1:00pm</option>
                        <option value="2:00pm">2:00pm</option>
                        <option value="3:00pm">3:00pm</option>
                        <option value="4:00pm">4:00pm</option>
                        <option value="5:00pm">5:00pm</option>
                        <option value="6:00pm">6:00pm</option>
                      </select>
                      {slots.length > 1 && (
                        <button onClick={() => removeSlot(i)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={addSlot} className="flex items-center text-sm font-bold text-slate-600 hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> Add time
                  </button>
                </div>
                <div className="mt-auto pt-6 border-t border-gray-200">
                  <button onClick={() => setIsUnavailable(true)} className="w-full py-2 bg-transparent text-gray-500 hover:text-gray-700 hover:underline rounded text-xs transition-colors">
                    Mark unavailable (All day)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Apply Override</button>
        </div>
      </div>
    </div>
  );
}
