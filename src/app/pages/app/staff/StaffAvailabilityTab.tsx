import React, { useState } from "react";
import { useParams } from "react-router";
import { ChevronLeft, Copy, Info, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getStaff } from "./staffData";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Slot = { start: string; end: string };
type DayConfig = { active: boolean; slots: Slot[] };
type WeekSchedule = Record<string, DayConfig>;

function buildSchedule(start: string, end: string): WeekSchedule {
  const init: WeekSchedule = {};
  DAYS.forEach((day) => {
    const isWeekend = day === "Sunday" || day === "Saturday";
    init[day] = { active: !isWeekend, slots: [{ start, end }] };
  });
  return init;
}

function Toggle({ checked, onChange, activeColor = "bg-slate-600" }: { checked: boolean; onChange: () => void; activeColor?: string }) {
  return (
    <button onClick={onChange} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? activeColor : "bg-gray-300"}`}>
      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

// Admin view of a staff member's availability. Mirrors "My Availability"
// (cards → weekly editor + overrides) with admin-only override controls.
export function StaffAvailabilityTab() {
  const { staffId } = useParams();
  const staff = getStaff(staffId);
  const [editing, setEditing] = useState<"clinic" | "video" | null>(null);

  if (!staff) return null;
  const showVideo = staff.role === "Clinician";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Admin context banner */}
      <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
        <Info className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
        You are managing availability for <span className="font-bold ml-1">{staff.name}</span>
      </div>

      {editing ? (
        <ScheduleEditor
          kind={editing}
          staffName={staff.name}
          onBack={() => setEditing(null)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div
              onClick={() => setEditing("clinic")}
              className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:border-slate-500 transition-colors shadow-sm group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-slate-700">Clinic Availability</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">Default</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">Mon – Fri, 9:00 AM – 5:00 PM</p>
                <p className="text-sm text-gray-500">🌐 Europe/Istanbul</p>
              </div>
            </div>

            {showVideo && (
              <div
                onClick={() => setEditing("video")}
                className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:border-slate-500 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-slate-700">Video Call Availability</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">Default</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 font-medium">Mon – Fri, 10:00 AM – 4:00 PM</p>
                  <p className="text-sm text-gray-500">🌐 Europe/Istanbul</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Last modified by: <span className="font-bold text-gray-700">Ayşe Hançer (Admin)</span> · 28 Jun 2026, 14:30</span>
            <button onClick={() => toast("Change history (demo)")} className="font-bold text-slate-600 hover:underline">View change history</button>
          </div>
        </>
      )}
    </div>
  );
}

function ScheduleEditor({ kind, staffName, onBack }: { kind: "clinic" | "video"; staffName: string; onBack: () => void }) {
  const isVideo = kind === "video";
  const [schedule, setSchedule] = useState<WeekSchedule>(() => buildSchedule(isVideo ? "10:00am" : "9:00am", isVideo ? "4:00pm" : "5:00pm"));
  const [overrideEmployee, setOverrideEmployee] = useState(false);
  const [overrides] = useState([{ date: "15 July 2026", hours: "10:00am - 2:00pm" }]);

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
  };

  const addSlot = (day: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], slots: [...prev[day].slots, { start: "9:00am", end: "5:00pm" }] } }));
  };

  const removeSlot = (day: string, idx: number) => {
    setSchedule((prev) => {
      const slots = prev[day].slots.filter((_, i) => i !== idx);
      if (slots.length === 0) return { ...prev, [day]: { active: false, slots: [{ start: "9:00am", end: "5:00pm" }] } };
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const handleSave = () => {
    toast.success(
      overrideEmployee
        ? `Availability saved. ${staffName} has been notified of the change.`
        : "Availability schedule saved successfully."
    );
    onBack();
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
      {/* Editor top bar */}
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 mr-2 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors" aria-label="Back to availability cards">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{isVideo ? "Video Call Availability" : "Clinic Availability"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Mon – Fri, {isVideo ? "10:00am – 4:00pm" : "9:00am – 5:00pm"}</p>
          </div>
        </div>
        <button onClick={handleSave} className="px-6 py-2 bg-slate-600 text-white font-bold text-sm rounded hover:bg-slate-700 transition-colors">Save</button>
      </div>

      <div className="flex">
        {/* Week schedule */}
        <div className="w-[62%] p-6 border-r border-gray-200">
          {DAYS.map((day) => {
            const config = schedule[day];
            return (
              <div key={day} className="flex items-start py-3.5 border-b border-gray-100 last:border-0">
                <div className="w-40 flex items-center shrink-0 pt-1.5">
                  <Toggle checked={config.active} onChange={() => toggleDay(day)} />
                  <span className={`ml-3 text-sm font-bold ${config.active ? "text-gray-800" : "text-gray-400"}`}>{day}</span>
                </div>
                <div className="flex-1 flex flex-col space-y-2.5">
                  {config.active ? (
                    config.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center group">
                        <input type="text" value={slot.start} readOnly className="w-24 text-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500" />
                        <span className="text-gray-400 mx-2">-</span>
                        <input type="text" value={slot.end} readOnly className="w-24 text-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500" />
                        <div className="flex items-center ml-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx === 0 && <button onClick={() => addSlot(day)} className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100"><Plus className="w-4 h-4" /></button>}
                          {config.slots.length > 1 && <button onClick={() => removeSlot(day, idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                          {idx === 0 && <button title="Copy to all" className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100"><Copy className="w-4 h-4" /></button>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pt-1.5 text-sm text-gray-400 font-medium">Unavailable</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timezone, overrides, admin controls */}
        <div className="w-[38%] p-6 bg-gray-50 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Timezone</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 bg-white rounded text-sm text-gray-800 outline-none focus:border-slate-500">
              <option value="Europe/Istanbul">Europe/Istanbul</option>
            </select>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1.5">Date overrides</h3>
            <p className="text-xs text-gray-500 mb-4">Dates when availability changes from the daily hours.</p>
            {overrides.map((o) => (
              <div key={o.date} className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                <div>
                  <div className="text-sm font-bold text-gray-800">{o.date}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{o.hours}</div>
                </div>
                <button onClick={() => toast("Override removed (demo)")} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => toast("Add override (demo)")} className="w-full py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              + Add an override
            </button>
          </div>

          {/* Admin-only */}
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="pr-3">
                <h3 className="text-sm font-bold text-gray-800 mb-1">Override Employee Settings</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Your changes will replace the employee's own schedule, and they will be notified: “Your availability has been updated by your administrator”.</p>
              </div>
              <Toggle checked={overrideEmployee} onChange={() => setOverrideEmployee(!overrideEmployee)} activeColor="bg-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
        <span>Last modified by: <span className="font-bold text-gray-700">Ayşe Hançer (Admin)</span> · 28 Jun 2026, 14:30</span>
        <button onClick={() => toast("Change history (demo)")} className="font-bold text-slate-600 hover:underline">View change history</button>
      </div>
    </div>
  );
}
