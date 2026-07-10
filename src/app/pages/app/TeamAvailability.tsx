import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, ChevronDown, Users, Search, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";

// --- Types ---
type SlotType = 'Clinic' | 'Video';

type AvailabilityBlock = { start: string; end: string; type: SlotType };
type Appointment = { start: string; end: string; patient: string };

type DaySchedule = { 
  off?: boolean; 
  onLeave?: boolean; 
  override?: boolean; 
  blocks?: AvailabilityBlock[];
  appointments?: Appointment[];
  totalHours?: number;
  bookedHours?: number;
  summary?: string;
};

type StaffMember = {
  id: string;
  name: string;
  role: 'Clinician' | 'Nurse';
  avatar: string;
  schedules: DaySchedule[]; // Index 0-6 matching Mon-Sun
};

// --- Mock Data Helpers ---
const regularDay = (blocks: AvailabilityBlock[], totalHours: number): DaySchedule => ({
  blocks,
  totalHours,
  bookedHours: 0,
  appointments: []
});

const cl = (start: string, end: string): AvailabilityBlock => ({ start, end, type: 'Clinic' });
const vi = (start: string, end: string): AvailabilityBlock => ({ start, end, type: 'Video' });

// --- Detailed Mock Data ---
const ALL_STAFF: StaffMember[] = [
  {
    id: "C1", name: "Dr. Claudia Reis", role: "Clinician", avatar: "CR",
    schedules: [
      regularDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8), // Mon
      regularDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8), // Tue
      regularDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8), // Wed
      { // Thu - Fragmented Mock
        totalHours: 8, bookedHours: 3.5,
        blocks: [cl("9:00", "17:00"), vi("10:00", "16:00")],
        appointments: [
          { start: "10:00", end: "11:00", patient: "Mackenzie Messineo" },
          { start: "14:00", end: "15:30", patient: "Penny Pelargonium" },
          { start: "16:00", end: "17:00", patient: "Riley Guarana" }
        ],
        summary: "Available: 8h · Booked: 3.5h · Remaining: 4.5h (3 open slots)"
      },
      regularDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8), // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    id: "C2", name: "Dr. Chad Okonkwo", role: "Clinician", avatar: "CO",
    schedules: [
      regularDay([cl("8:00", "16:00")], 8), // Mon
      regularDay([cl("8:00", "16:00"), vi("9:00", "12:00")], 8), // Tue
      regularDay([cl("8:00", "16:00")], 8), // Wed
      { // Thu
        totalHours: 8, bookedHours: 3,
        blocks: [cl("8:00", "16:00"), vi("9:00", "12:00")],
        appointments: [
          { start: "8:00", end: "9:30", patient: "Arysse Arcerola" },
          { start: "11:00", end: "12:00", patient: "Gustavo Propolis" },
          { start: "13:00", end: "14:00", patient: "Bob Bromelain" }
        ],
        summary: "Available: 8h · Booked: 3h · Remaining: 5h (3 open slots)"
      },
      { off: true }, // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    id: "C3", name: "Dr. Felix Andersen", role: "Clinician", avatar: "FA",
    schedules: [
      regularDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9), // Mon
      regularDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9), // Tue
      regularDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9), // Wed
      { // Thu (Override)
        override: true, totalHours: 3, bookedHours: 1,
        blocks: [cl("9:00", "12:00")],
        appointments: [
          { start: "9:00", end: "10:00", patient: "Dylan Daniel" }
        ],
        summary: "Available: 3h · Booked: 1h · Remaining: 2h (1 open slot)"
      },
      regularDay([cl("9:00", "18:00")], 9), // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    id: "C4", name: "Dr. Adobe Martinez", role: "Clinician", avatar: "AM",
    schedules: [
      regularDay([cl("10:00", "18:00")], 8), // Mon
      regularDay([cl("10:00", "18:00")], 8), // Tue
      regularDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8), // Wed
      regularDay([cl("10:00", "18:00")], 8), // Thu
      regularDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8), // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    id: "N1", name: "Berna Koç", role: "Nurse", avatar: "BK",
    schedules: [
      regularDay([cl("8:30", "17:30")], 9), // Mon
      regularDay([cl("8:30", "17:30")], 9), // Tue
      regularDay([cl("8:30", "17:30")], 9), // Wed
      { // Thu (Override)
        override: true, totalHours: 9, bookedHours: 2.5,
        blocks: [cl("8:30", "10:00"), cl("11:30", "14:00")],
        appointments: [
          { start: "10:00", end: "11:30", patient: "Patient" },
          { start: "14:00", end: "15:00", patient: "Patient" }
        ],
        summary: "Available: 9h · Booked: 2.5h · Remaining: 6.5h (3 open slots)"
      },
      regularDay([cl("8:30", "17:30")], 9), // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    id: "N2", name: "Aylin Demir", role: "Nurse", avatar: "AD",
    schedules: [
      regularDay([cl("9:00", "17:00")], 8), // Mon
      regularDay([cl("9:00", "17:00")], 8), // Tue
      regularDay([cl("9:00", "17:00")], 8), // Wed
      { onLeave: true }, // Thu - On Leave
      regularDay([cl("9:00", "17:00")], 8), // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  }
];

const WEEK_DAYS = [
  { label: "Mon 30", full: "Mon, 30 Jun 2026" },
  { label: "Tue 1", full: "Tue, 1 Jul 2026" },
  { label: "Wed 2", full: "Wed, 2 Jul 2026" },
  { label: "Thu 3", full: "Thu, 3 Jul 2026" },
  { label: "Fri 4", full: "Fri, 4 Jul 2026" },
  { label: "Sat 5", full: "Sat, 5 Jul 2026" },
  { label: "Sun 6", full: "Sun, 6 Jul 2026" }
];
const TODAY_INDEX = 3; // Thu 3

export function TeamAvailability() {
  const { role: currentUserRole } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [weekLabel, setWeekLabel] = useState("30 Jun – 6 Jul 2026");
  
  // Popover State
  const [popover, setPopover] = useState<{
    staff: StaffMember, day: DaySchedule, dateStr: string, x: number, y: number
  } | null>(null);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Filter & Group staff
  const clinicians = ALL_STAFF.filter(s => s.role === 'Clinician' && s.name.toLowerCase().includes(search.toLowerCase()));
  const nurses = ALL_STAFF.filter(s => s.role === 'Nurse' && s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedStaff = ALL_STAFF.filter(s => selectedIds.includes(s.id));

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStaff = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length < 6) setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAllClinicians = () => {
    const ids = ALL_STAFF.filter(s => s.role === 'Clinician').map(s => s.id);
    const toSelect = ids.slice(0, 6);
    setSelectedIds(toSelect);
    if (ids.length > 6) toast("Showing first 6 clinicians. Remove someone to add others.");
    setPickerOpen(false);
  };

  const handleAllNurses = () => {
    const ids = ALL_STAFF.filter(s => s.role === 'Nurse').map(s => s.id);
    setSelectedIds(ids.slice(0, 6));
    setPickerOpen(false);
  };

  const handleClear = () => {
    setSelectedIds([]);
    setPickerOpen(false);
  };

  const handleCellClick = (e: React.MouseEvent, staff: StaffMember, day: DaySchedule, dateStr: string) => {
    e.stopPropagation();
    if (day.off || day.onLeave) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setPopover({ staff, day, dateStr, x, y });
  };

  // Close popover
  useEffect(() => {
    const closePopover = () => setPopover(null);
    document.addEventListener('click', closePopover);
    return () => document.removeEventListener('click', closePopover);
  }, []);

  const selectWeek = () => {
    setWeekLabel("13 Jul – 19 Jul 2026");
    setCalendarOpen(false);
  };

  // Dynamic row sizing
  let rowHeightClass = 'h-[160px]';
  let blockHeightClass = 'h-[36px]';
  let isCompact = false;
  if (selectedIds.length >= 5) {
    rowHeightClass = 'h-[90px]';
    blockHeightClass = 'h-[28px]';
    isCompact = true;
  } else if (selectedIds.length >= 3) {
    rowHeightClass = 'h-[120px]';
  }

  // Generate simple calendar rows for the week picker popover
  const calWeeks = [
    [29, 30, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, 1, 2]
  ];

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* TOOLBAR */}
      <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
        
        {/* Left: Navigator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm text-gray-500 relative">
            <button className="px-2 py-1.5 hover:bg-gray-100 border-r border-gray-200 rounded-l-lg"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-4 text-sm font-bold text-gray-700 whitespace-nowrap tabular-nums">{weekLabel}</span>
            <button className="px-2 py-1.5 hover:bg-gray-100 border-l border-gray-200"><ChevronRight className="w-4 h-4" /></button>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="px-2 py-1.5 hover:bg-gray-100 border-l border-gray-200 rounded-r-lg flex items-center justify-center"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Calendar Popover */}
            {calendarOpen && (
              <div ref={calendarRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-30 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /></button>
                  <div className="text-sm font-bold text-gray-800">July 2026</div>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-7 mb-1">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-gray-400">{d}</div>
                    ))}
                  </div>
                  {calWeeks.map((week, wIdx) => {
                    const isSelectedWeek = wIdx === 0 && weekLabel.startsWith("30 Jun");
                    return (
                      <div 
                        key={wIdx} 
                        onClick={selectWeek}
                        className={`grid grid-cols-7 py-1 cursor-pointer transition-colors rounded ${isSelectedWeek ? 'bg-slate-200' : 'hover:bg-gray-100'}`}
                      >
                        {week.map((day, dIdx) => {
                          const isToday = wIdx === 0 && day === 3;
                          return (
                            <div key={dIdx} className="h-6 flex flex-col items-center justify-center relative">
                              <span className={`text-xs ${wIdx === 0 && dIdx < 2 ? 'text-gray-300' : (wIdx === 4 && dIdx > 4 ? 'text-gray-300' : 'text-gray-700')} ${isToday ? 'font-bold' : ''}`}>{day}</span>
                              {isToday && <div className="w-1 h-1 bg-slate-600 rounded-full absolute bottom-0"></div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 p-2 bg-gray-50">
                  <button onClick={() => setWeekLabel("30 Jun – 6 Jul 2026")} className="w-full py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors">
                    This Week
                  </button>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setWeekLabel("30 Jun – 6 Jul 2026")} className="px-3 py-1.5 text-sm font-bold text-gray-600 border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50">
            Today
          </button>
        </div>

        {/* Center: Staff Picker */}
        <div className="relative" ref={pickerRef}>
          <div
            onClick={() => setPickerOpen(true)}
            className="w-[500px] min-h-[38px] border border-slate-300 bg-white rounded-lg shadow-sm flex items-center px-2 cursor-text transition-colors hover:border-slate-400 relative"
          >
            {selectedStaff.length === 0 ? (
              <span className="text-sm text-gray-400 pl-2">Add staff to compare...</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 py-1.5 w-[420px]">
                {selectedStaff.map(s => (
                  <div key={s.id} className={`flex items-center rounded pl-0.5 pr-1.5 py-0.5 border ${s.role === 'Clinician' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`w-1 h-4 mr-1.5 rounded-sm ${s.role === 'Clinician' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] font-bold text-gray-600 mr-1.5 shrink-0">
                      {s.avatar}
                    </div>
                    <span className={`text-xs font-medium mr-1.5 ${s.role === 'Clinician' ? 'text-blue-800' : 'text-emerald-800'} truncate max-w-[80px]`}>{s.name.split(' ').pop()}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleStaff(s.id); }} className="hover:bg-white/50 rounded-full p-0.5 text-gray-400 hover:text-gray-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="absolute right-3 text-xs font-bold text-gray-400 flex items-center">
              <span className={selectedIds.length === 6 ? 'text-slate-600' : ''}>{selectedIds.length} / 6</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* Dropdown Panel */}
          {pickerOpen && (
            <div className="absolute top-full left-0 mt-1 w-[500px] bg-white border border-gray-200 rounded-lg shadow-xl z-20 flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search by name..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {clinicians.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span> Clinicians
                    </div>
                    {clinicians.map(s => {
                      const isSelected = selectedIds.includes(s.id);
                      const isDisabled = selectedIds.length >= 6 && !isSelected;
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => !isDisabled && toggleStaff(s.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md mb-0.5 
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                            ${isSelected ? 'bg-slate-50' : ''}`}
                        >
                          <div className="flex items-center">
                            <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-0" />
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                              {s.avatar}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded">Clinician</span>
                            {isDisabled && <span className="text-[10px] text-gray-400 ml-2">Limit reached</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {nurses.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> Nurses
                    </div>
                    {nurses.map(s => {
                      const isSelected = selectedIds.includes(s.id);
                      const isDisabled = selectedIds.length >= 6 && !isSelected;
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => !isDisabled && toggleStaff(s.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md mb-0.5 
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                            ${isSelected ? 'bg-slate-50' : ''}`}
                        >
                          <div className="flex items-center">
                            <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-0" />
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                              {s.avatar}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded">Nurse</span>
                            {isDisabled && <span className="text-[10px] text-gray-400 ml-2">Limit reached</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-100 bg-gray-50 text-center text-xs font-medium text-gray-500 shrink-0">
                Select up to 6 staff to compare
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Presets */}
        <div className="flex items-center space-x-2">
          <button onClick={handleAllClinicians} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
            All Clinicians
          </button>
          <button onClick={handleAllNurses} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
            All Nurses
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button onClick={handleClear} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-0 bg-white relative">
        
        {selectedIds.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select staff to view availability</h2>
            <p className="text-gray-500 mb-8 max-w-md text-center">Add up to 6 team members using the picker above to compare their weekly schedules.</p>
            <div className="flex space-x-4">
              <button onClick={handleAllClinicians} className="px-6 py-3 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-bold text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                All Clinicians
              </button>
              <button onClick={handleAllNurses} className="px-6 py-3 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-bold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                All Nurses
              </button>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex border-b border-gray-200 bg-white shrink-0">
              <div className="w-[200px] shrink-0 border-r border-gray-200"></div>
              {WEEK_DAYS.map((day, i) => (
                <div key={day.label} className={`flex-1 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0 ${i === TODAY_INDEX ? 'bg-slate-100/50' : ''}`}>
                  {day.label}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {selectedStaff.map((staff, idx) => {
                const isNextNurse = selectedStaff[idx + 1]?.role === 'Nurse' && staff.role === 'Clinician';
                const rowBorderClass = isNextNurse ? 'border-b-2 border-gray-300' : 'border-b border-gray-200';

                return (
                  <div key={staff.id} className={`flex w-full group ${rowBorderClass} last:border-b-0 ${rowHeightClass}`}>
                    {/* Left Info Col */}
                    <div className="w-[200px] shrink-0 border-r border-gray-200 flex items-center px-4 relative bg-white">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3 ring-2 ring-offset-1 ${staff.role === 'Clinician' ? 'bg-blue-500 ring-blue-200' : 'bg-emerald-500 ring-emerald-200'}`}>
                        {staff.avatar}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="text-sm font-bold text-gray-800 mb-1 truncate" title={staff.name}>
                          {staff.name.length > 14 ? staff.name.substring(0, 14) + '...' : staff.name}
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${staff.role === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {staff.role}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => toggleStaff(staff.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded ml-1 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day Cells */}
                    {staff.schedules.map((day, i) => {
                      const isToday = i === TODAY_INDEX;
                      let cellBg = isToday ? 'bg-slate-50/50' : 'bg-white';
                      let cellContent = null;

                      if (day.off) {
                        cellBg = 'bg-[#F3F4F6]';
                        cellContent = <div className="text-sm font-bold text-gray-400 flex items-center justify-center h-full">Day Off</div>;
                      } else if (day.onLeave) {
                        cellContent = (
                          <div className="flex flex-col h-full w-full relative">
                            {/* Dummy spacer for summary bar height to keep blocks aligned */}
                            <div className="h-[4px] w-full mb-[6px] mt-0.5"></div>
                            <div className={`w-full ${blockHeightClass} rounded-lg border border-red-200 px-2 flex ${isCompact ? 'flex-row items-center space-x-1.5' : 'flex-col justify-center'} bg-red-50 text-red-700 shrink-0`}>
                              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> ON LEAVE
                              </div>
                              {!isCompact && <div className="h-1" />}
                              <div className={`font-medium leading-none ${isCompact ? 'text-[11px]' : 'text-xs'}`}>All Day</div>
                            </div>
                          </div>
                        );
                      } else if (day.blocks) {
                        
                        const totalHrs = day.totalHours || 8;
                        const bookedHrs = day.bookedHours || 0;
                        const freeHrs = totalHrs - bookedHrs;
                        const pct = totalHrs > 0 ? (bookedHrs / totalHrs) : 0;
                        const isFullyBooked = pct >= 1;

                        let barColorHex = '#10B981'; // Green < 30%
                        if (isFullyBooked) {
                          cellBg = 'bg-orange-50';
                          barColorHex = '#EF4444'; // Red 100%
                        } else if (pct > 0.7) {
                          barColorHex = '#EF4444'; // Red > 70%
                        } else if (pct >= 0.3) {
                          barColorHex = '#F59E0B'; // Orange 30-70%
                        }

                        cellContent = (
                          <div className="flex flex-col h-full w-full relative">
                            
                            {/* Override Indicator */}
                            {day.override && (
                              <div className="absolute -top-1 -left-2 flex items-center group/tooltip z-10 cursor-help">
                                <span className="text-[14px] text-[#1E3A8A] leading-none">◆</span>
                                <div className="absolute left-3 top-0 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                                  Date override active
                                </div>
                              </div>
                            )}
                            
                            {/* Summary Bar */}
                            <div className="flex items-center w-full mb-[6px] mt-0.5">
                              <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-[2px] overflow-hidden ml-[2px]">
                                <div className="h-full" style={{ width: `${pct * 100}%`, backgroundColor: barColorHex }} />
                              </div>
                              <span className="text-[10px] font-bold ml-1.5 shrink-0" style={{ color: barColorHex }}>{freeHrs}h free</span>
                            </div>

                            {/* Blocks or Fully Booked state */}
                            {isFullyBooked ? (
                              <div className="flex-1 flex items-center justify-center text-sm font-bold text-orange-600">
                                Fully Booked
                              </div>
                            ) : (
                              <div className={`flex-1 flex flex-col overflow-hidden gap-[${isCompact ? '2px' : '4px'}]`}>
                                {day.blocks.map((block, bIdx) => {
                                  const isClinic = block.type === 'Clinic';
                                  const isBlue = staff.role === 'Clinician' && isClinic;
                                  const isPurple = staff.role === 'Clinician' && !isClinic;
                                  const isGreen = staff.role === 'Nurse';

                                  let bg = '';
                                  let border = '';
                                  let text = '';
                                  let dot = '';
                                  let labelText = block.type.toUpperCase();

                                  if (isBlue) { bg = 'bg-blue-50'; border = 'border-blue-200'; text = 'text-blue-800'; dot = 'bg-blue-500'; }
                                  if (isPurple) { bg = 'bg-purple-50'; border = 'border-purple-200'; text = 'text-purple-800'; dot = 'bg-purple-500'; }
                                  if (isGreen) { bg = 'bg-emerald-50'; border = 'border-emerald-200'; text = 'text-emerald-800'; dot = 'bg-emerald-500'; }

                                  return (
                                    <div
                                      key={bIdx}
                                      className={`w-full ${blockHeightClass} rounded-lg border px-2 flex ${isCompact ? 'flex-row items-center space-x-1.5' : 'flex-col justify-center'} ${bg} ${border} ${text} shrink-0`}
                                    >
                                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} /> {labelText}
                                      </div>
                                      {!isCompact && <div className="h-1" />}
                                      <div className={`font-medium leading-none ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{block.start} – {block.end}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={i} 
                          onClick={(e) => handleCellClick(e, staff, day, WEEK_DAYS[i].full)}
                          className={`flex-1 border-r border-gray-100 last:border-r-0 ${cellBg} ${!day.off && !day.onLeave ? 'cursor-pointer hover:bg-slate-100/50 transition-colors' : ''} p-2 relative`}
                        >
                          {cellContent}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Popover */}
      {popover && (
        <div 
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl w-[320px] text-gray-800 transform -translate-x-1/2 mt-2 animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            left: Math.min(Math.max(popover.x, 160), window.innerWidth - 160), 
            top: popover.y,
            ...(popover.y > window.innerHeight - 300 ? { transform: 'translate(-50%, -100%)', marginTop: '-10px' } : {}) 
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Layer 1: Header & Staff info */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="font-bold text-sm text-gray-800 mb-1">{popover.staff.name} · {popover.dateStr}</div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${popover.staff.role === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {popover.staff.role}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Scheduled Availability Layer */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Scheduled Availability</h4>
              <div className="space-y-2">
                {popover.day.blocks?.map((b, idx) => (
                  <div key={idx} className="flex items-center text-sm font-medium text-gray-700">
                    <div className={`w-2 h-2 rounded-full mr-2 ${b.type === 'Video' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                    {b.type}: {b.start} – {b.end}
                  </div>
                ))}
              </div>
            </div>

            {/* Booked Appointments Layer */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Booked Appointments</h4>
              <div className="space-y-2">
                {(!popover.day.appointments || popover.day.appointments.length === 0) ? (
                  <div className="text-sm text-gray-500 italic">No appointments booked</div>
                ) : (
                  popover.day.appointments.map((appt, idx) => {
                    // Patient Privacy Masking
                    const isOwnPatient = popover.staff.name.includes("Claudia"); // Mock logic
                    const showNames = currentUserRole === 'Admin' || currentUserRole === 'Reception' || (currentUserRole === 'Clinician' && isOwnPatient);
                    const patientDisplay = showNames ? appt.patient : 'Patient';

                    return (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2 shrink-0" />
                        <span className="font-medium mr-2">{appt.start} – {appt.end}</span>
                        <span className="text-gray-500 truncate">· {patientDisplay}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Block 3: Summary */}
          {popover.day.summary && (
            <div className="p-4 bg-gray-50 rounded-b-lg text-xs space-y-1">
              <div className="font-medium text-gray-700">{popover.day.summary}</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
