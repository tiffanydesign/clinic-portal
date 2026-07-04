import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet, useParams } from "react-router";
import { Copy, Trash2, Plus, Info, X, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";

export function CalendarLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-hidden relative">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export function CalendarScheduleSkeleton({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="p-8 w-full h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Calendar &gt; Schedule</h1>
      <p className="text-sm text-gray-500 mb-8 italic">Detailed content in a later pass</p>
      
      <div className="flex gap-6 h-[600px] relative flex-1">
        <div className="flex-1 border border-gray-300 bg-white flex flex-col relative overflow-hidden rounded">
           <div className="h-10 border-b border-gray-200 bg-gray-50 flex items-center px-4 text-xs font-bold text-gray-500">
             Calendar Grid Placeholder
           </div>
           <div className="flex-1 flex items-center justify-center p-8">
             <button 
                onClick={() => navigate('/calendar/schedule/appointment/A-101')}
                className="w-48 h-20 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-slate-500"
             >
               Clickable Appointment Block
             </button>
           </div>
        </div>
        
        {/* The overlay is rendered via children */}
        {children}
      </div>
    </div>
  );
}

export function AvailabilityList() {
  const navigate = useNavigate();

  return (
    <div className="p-8 w-full max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar &gt; My Availability</h1>
          <p className="text-sm text-gray-500 mt-1">Configure times when you are available for bookings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div 
          onClick={() => navigate("/calendar/my-availability/clinic")}
          className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:border-slate-500 transition-colors shadow-sm group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-slate-700">Clinic Availability</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">Default</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">Mon – Fri, 9:00 AM – 5:00 PM</p>
            <p className="text-sm text-gray-500 flex items-center">🌐 Europe/Istanbul</p>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => navigate("/calendar/my-availability/video")}
          className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:border-slate-500 transition-colors shadow-sm group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-slate-700">Video Call Availability</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">Default</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">Mon – Fri, 10:00 AM – 4:00 PM</p>
            <p className="text-sm text-gray-500 flex items-center">🌐 Europe/Istanbul</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Slot = { start: string; end: string };
type DayConfig = { active: boolean; slots: Slot[] };
type WeekSchedule = Record<string, DayConfig>;

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-slate-600' : 'bg-gray-300'}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? 'left-[22px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function AvailabilityEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isVideo = id === "video";
  const defaultStartTime = isVideo ? "10:00am" : "9:00am";
  const defaultEndTime = isVideo ? "4:00pm" : "5:00pm";

  const [title, setTitle] = useState(isVideo ? "Video Call Availability" : "Clinic Availability");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Initialize schedule
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const init: WeekSchedule = {};
    DAYS.forEach(day => {
      const isWeekend = day === "Sunday" || day === "Saturday";
      init[day] = {
        active: !isWeekend,
        slots: [{ start: defaultStartTime, end: defaultEndTime }]
      };
    });
    return init;
  });

  // Date overrides state
  const [overrides, setOverrides] = useState<{date: string, slots: Slot[], reason?: string}[]>([
    { date: "15 July 2026", slots: [{ start: "10:00am", end: "2:00pm" }] }
  ]);

  const handleApplyOverride = (dates: string[], slots: Slot[], reason?: string) => {
    const newOverrides = dates.map(d => ({
      date: `${d} July 2026`,
      slots: [...slots],
      reason
    }));
    
    setOverrides(prev => [...prev, ...newOverrides].sort((a, b) => parseInt(a.date) - parseInt(b.date)));
    setShowOverrideModal(false);
    markDirty();
    toast.success("Overrides applied.");
  };

  const removeOverride = (index: number) => {
    setOverrides(prev => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const markDirty = () => { if (!isDirty) setIsDirty(true); };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) {
        navigate("/calendar/my-availability");
      }
    } else {
      navigate("/calendar/my-availability");
    }
  };

  const handleSave = () => {
    setIsDirty(false);
    toast.success("Availability schedule saved successfully.");
    navigate("/calendar/my-availability");
  };

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active }
    }));
    markDirty();
  };

  const handleAddSlot = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { start: "9:00am", end: "5:00pm" }] }
    }));
    markDirty();
  };

  const handleRemoveSlot = (day: string, slotIndex: number) => {
    setSchedule(prev => {
      const newSlots = [...prev[day].slots];
      newSlots.splice(slotIndex, 1);
      if (newSlots.length === 0) {
        return { ...prev, [day]: { active: false, slots: [{ start: "9:00am", end: "5:00pm" }] } };
      }
      return { ...prev, [day]: { ...prev[day], slots: newSlots } };
    });
    markDirty();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <button onClick={handleBack} className="p-2 mr-2 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              {isEditingTitle ? (
                <input 
                  autoFocus
                  type="text" 
                  value={title} 
                  onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-xl font-bold text-gray-800 border-b border-slate-500 outline-none bg-transparent"
                />
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-800 mr-2">{title}</h1>
                  <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Mon – Fri, {defaultStartTime} – {defaultEndTime}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div title="Default schedules cannot be deleted" className="cursor-not-allowed">
            <button disabled className="p-2 text-gray-300 border border-transparent rounded">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-slate-600 text-white font-bold text-sm rounded hover:bg-slate-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side (65%) */}
        <div className="w-[65%] h-full overflow-y-auto p-8 border-r border-gray-300 bg-white">
          <div className="max-w-2xl mx-auto space-y-6">
            {DAYS.map(day => {
              const config = schedule[day];
              return (
                <div key={day} className="flex items-start py-4 border-b border-gray-100 last:border-0">
                  <div className="w-32 flex items-center shrink-0 pt-2">
                    <Toggle checked={config.active} onChange={() => handleToggleDay(day)} />
                    <span className={`ml-3 text-sm font-bold ${config.active ? 'text-gray-800' : 'text-gray-400'}`}>{day}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col space-y-3">
                    {config.active ? (
                      config.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center group">
                          <div className="flex items-center space-x-2">
                            <input type="text" value={slot.start} readOnly className="w-24 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500 cursor-text" />
                            <span className="text-gray-400">-</span>
                            <input type="text" value={slot.end} readOnly className="w-24 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500 cursor-text" />
                          </div>
                          
                          <div className="flex items-center ml-4 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx === 0 && <button onClick={() => handleAddSlot(day)} className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100"><Plus className="w-4 h-4" /></button>}
                            {config.slots.length > 1 && <button onClick={() => handleRemoveSlot(day, idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                            {idx === 0 && <button title="Copy to all" className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100 ml-2"><Copy className="w-4 h-4" /></button>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="pt-2 text-sm text-gray-400 font-medium">Unavailable</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (35%) */}
        <div className="w-[35%] h-full overflow-y-auto bg-gray-50 p-8">
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Timezone</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 bg-white rounded text-sm text-gray-800 outline-none focus:border-slate-500">
              <option value="Europe/Istanbul">Europe/Istanbul</option>
            </select>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-2">
              <h3 className="text-base font-bold text-gray-800 mr-2">Date overrides</h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Booked appointments cannot be overridden. Date overrides are archived automatically when the date has passed.
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">Add dates when your availability changes from your daily hours.</p>
            
            {overrides.length > 0 && (
              <div className="space-y-4 mb-6">
                {overrides.map((override, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm font-bold text-gray-800 mb-1">{override.date}</div>
                      {override.slots.length > 0 ? (
                        <div className="space-y-1">
                          {override.slots.map((s, idx) => (
                            <div key={idx} className="text-xs text-gray-600">{s.start} - {s.end}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-medium">Unavailable {override.reason && `(${override.reason})`}</div>
                      )}
                    </div>
                    <button onClick={() => removeOverride(i)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setShowOverrideModal(true)}
              className="w-full py-2.5 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              + Add an override
            </button>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <DateOverrideModal 
          onClose={() => setShowOverrideModal(false)} 
          onApply={handleApplyOverride}
          existingDates={overrides.map(o => parseInt(o.date))}
        />
      )}
    </div>
  );
}

function DateOverrideModal({ onClose, onApply, existingDates = [] }: { onClose: () => void, onApply: (dates: string[], slots: Slot[], reason?: string) => void, existingDates: number[] }) {
  // Calendar grid mock for July 2026 (Starts Wed, 31 days)
  const blanks = Array(3).fill(null); // Sun, Mon, Tue
  const days = Array.from({length: 31}, (_, i) => i + 1);

  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [slots, setSlots] = useState<Slot[]>([{ start: "10:00am", end: "2:00pm" }]);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [reason, setReason] = useState("");

  const toggleDate = (d: number) => {
    if (selectedDates.includes(d)) {
      setSelectedDates(selectedDates.filter(x => x !== d));
    } else {
      setSelectedDates([...selectedDates, d]);
    }
  };

  const updateSlot = (index: number, field: 'start'|'end', val: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = val;
    setSlots(newSlots);
  };

  const addSlot = () => setSlots([...slots, { start: "2:00pm", end: "5:00pm" }]);
  const removeSlot = (index: number) => setSlots(slots.filter((_, i) => i !== index));

  const handleApply = () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date.");
      return;
    }
    if (isUnavailable && !reason.trim()) {
      toast.error("Please enter a reason for being unavailable.");
      return;
    }
    onApply(selectedDates.map(String), isUnavailable ? [] : slots, isUnavailable ? reason : undefined);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Add Date Override</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Calendar */}
          <div className="w-1/2 p-8 border-r border-gray-200 bg-white overflow-y-auto">
            <h3 className="text-base font-bold text-gray-800 mb-6">Select the dates to override</h3>
            
            <div className="border border-gray-200 rounded p-4">
              <div className="flex justify-between items-center mb-6">
                <button className="p-1 text-gray-400 hover:text-gray-800"><ChevronLeft className="w-5 h-5" /></button>
                <div className="font-bold text-gray-800">July 2026</div>
                <button className="p-1 text-gray-400 hover:text-gray-800"><ChevronRight className="w-5 h-5" /></button>
              </div>
              
              <div className="grid grid-cols-7 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10"></div>)}
                {days.map(d => {
                  const isSelected = selectedDates.includes(d);
                  const hasOverride = existingDates.includes(d);
                  return (
                    <button 
                      key={d} 
                      onClick={() => toggleDate(d)}
                      className={`h-10 w-full rounded-full flex flex-col items-center justify-center relative text-sm font-medium transition-colors
                        ${isSelected ? 'bg-slate-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                        ${hasOverride && !isSelected ? 'font-bold' : ''}`}
                    >
                      {d}
                      {hasOverride && <div className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-slate-500'}`}></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Time slots */}
          <div className="w-1/2 p-8 bg-gray-50 overflow-y-auto flex flex-col">
            <h3 className="text-base font-bold text-gray-800 mb-6">Which hours are you free?</h3>
            
            {isUnavailable ? (
              <div className="flex-1 flex flex-col">
                <div className="text-sm font-bold text-gray-500 bg-gray-100 p-4 rounded text-center mb-6">Unavailable on selected dates</div>
                <div className="mb-4 group">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 group-hover:text-slate-800 transition-colors">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="e.g. Sick leave, Conference..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none bg-white focus:border-slate-500 transition-colors" 
                    title="Please enter a reason for being unavailable"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">A reason is required to mark the entire day as unavailable.</div>
                </div>
                <button onClick={() => setIsUnavailable(false)} className="text-sm font-bold text-slate-600 hover:underline self-start mt-2">
                  + Add specific hours instead
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="space-y-4 mb-6">
                  {slots.length === 0 ? (
                    <div className="text-sm font-bold text-gray-500 bg-gray-100 p-4 rounded text-center">No hours set</div>
                  ) : (
                    slots.map((slot, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <select 
                          value={slot.start} 
                          onChange={(e) => updateSlot(i, 'start', e.target.value)}
                          className="flex-1 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm outline-none focus:border-slate-500"
                        >
                          <option value="8:00am">8:00am</option>
                          <option value="9:00am">9:00am</option>
                          <option value="10:00am">10:00am</option>
                          <option value="11:00am">11:00am</option>
                          <option value="12:00pm">12:00pm</option>
                        </select>
                        <span className="text-gray-400 font-medium">-</span>
                        <select 
                          value={slot.end} 
                          onChange={(e) => updateSlot(i, 'end', e.target.value)}
                          className="flex-1 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm outline-none focus:border-slate-500"
                        >
                          <option value="1:00pm">1:00pm</option>
                          <option value="2:00pm">2:00pm</option>
                          <option value="3:00pm">3:00pm</option>
                          <option value="4:00pm">4:00pm</option>
                          <option value="5:00pm">5:00pm</option>
                          <option value="6:00pm">6:00pm</option>
                        </select>
                        <button onClick={() => removeSlot(i)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  <button onClick={addSlot} className="flex items-center text-sm font-bold text-slate-600 hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> Add time
                  </button>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => setIsUnavailable(true)} 
                    className="w-full py-2 bg-transparent text-gray-500 hover:text-gray-700 hover:underline rounded text-xs transition-colors"
                  >
                    Mark unavailable (All day)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Apply Override</button>
        </div>
      </div>
    </div>
  );
}
