import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Plus, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Slot, OverrideItem } from "./availabilityData";
import { FilterSelect } from "../../../components/FilterSelect";

const TIME_OPTIONS = ["8:00am", "9:00am", "10:00am", "11:00am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm", "6:00pm"];

// Reuses the existing Add Date Override calendar UI. Overrides now only ever
// represent "different hours on a specific day" — full-day unavailability is
// handled exclusively by Leave requests (see the guidance link below).
// `onApply` owns the full lifecycle (validation, direct-save vs. opening a
// Conflict modal on top of this one, and finally closing this modal) — it
// does not return a value, and this modal never closes itself on submit.
export function OverrideModal({ onClose, onApply, onRequestLeaveInstead, existingDates, editing }: {
  onClose: () => void;
  onApply: (date: string, slots: Slot[]) => void;
  onRequestLeaveInstead: (date: string) => void;
  existingDates: number[];
  editing?: OverrideItem;
}) {
  const blanks = Array(3).fill(null); // Sun, Mon, Tue lead-in for July 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const editingDay = editing ? parseInt(editing.date.split(" ")[0], 10) : null;

  const [selectedDate, setSelectedDate] = useState<number | null>(editingDay);
  const [slots, setSlots] = useState<Slot[]>(editing ? editing.slots.map((s) => ({ ...s })) : [{ start: "10:00am", end: "2:00pm" }]);

  const updateSlot = (index: number, field: "start" | "end", val: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = val;
    setSlots(newSlots);
  };

  const addSlot = () => setSlots([...slots, { start: "2:00pm", end: "5:00pm" }]);
  const removeSlot = (index: number) => setSlots(slots.filter((_, i) => i !== index));

  const dateStr = selectedDate !== null ? `${selectedDate} Jul 2026` : null;

  const handleApply = () => {
    if (selectedDate === null) {
      toast.error("Please select a date.");
      return;
    }
    if (slots.length === 0) {
      toast.error("Add at least one time slot, or request leave for a full day off.");
      return;
    }
    onApply(dateStr!, slots);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{editing ? "Edit Date Override" : "Add Date Override"}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Calendar */}
          <div className="w-1/2 p-8 border-r border-gray-200 bg-white overflow-y-auto">
            <h3 className="text-base font-bold text-gray-800 mb-6">{editing ? "Date" : "Select the date to override"}</h3>
            <div className={`border border-gray-200 rounded p-4 ${editing ? "opacity-60 pointer-events-none" : ""}`}>
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
            <h3 className="text-base font-bold text-gray-800 mb-6">Working hours for this date</h3>
            <div className="flex-1 flex flex-col">
              <div className="space-y-4 mb-6">
                {slots.length === 0 ? (
                  <div className="text-sm font-bold text-gray-500 bg-gray-100 p-4 rounded text-center">No hours set</div>
                ) : (
                  slots.map((slot, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <FilterSelect value={slot.start} onChange={(v) => updateSlot(i, "start", v)} options={TIME_OPTIONS} className="flex-1 justify-center" />
                      <span className="text-gray-400 font-medium">-</span>
                      <FilterSelect value={slot.end} onChange={(v) => updateSlot(i, "end", v)} options={TIME_OPTIONS} className="flex-1 justify-center" />
                      <button onClick={() => removeSlot(i)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
                <button onClick={addSlot} className="flex items-center text-sm font-bold text-slate-600 hover:underline">
                  <Plus className="w-4 h-4 mr-1" /> Add time
                </button>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200">
                <button
                  onClick={() => { onRequestLeaveInstead(dateStr ?? `1 Jul 2026`); onClose(); }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-slate-700 transition-colors"
                >
                  Need a full day off? <span className="font-bold text-slate-600 hover:underline flex items-center gap-1">Request Leave instead <ArrowRight className="w-3.5 h-3.5" /></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">{editing ? "Save Override" : "Apply Override"}</button>
        </div>
      </div>
    </div>
  );
}
