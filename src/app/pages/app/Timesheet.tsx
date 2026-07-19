import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown, Download, Calendar as CalendarIcon, Users, Search, X,
  CalendarClock, Timer, UserCheck, Zap, Clock, Repeat, Moon, Plane, type LucideIcon,
} from "lucide-react";
import { Stat, StatStripGroup, type StatIconTone } from "../../components/stat";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { Link } from "react-router";
import { RangeDatePicker } from "../../components/RangeDatePicker";
import { format } from "date-fns";
import { getStaff } from "./staff/staffData";

// --- Types ---
type Role = 'Clinician' | 'Nurse' | 'Receptionist';

type DailyRecord = {
  id: string;
  date: string; // e.g., "Wed, 1 Jul"
  type: 'Regular' | 'Override' | 'Day Off' | 'On Leave';
  scheduled: string; // e.g., "9:00 – 17:00" or "—"
  scheduledHours: number;
  actualStart: string;
  actualEnd: string;
  actualHours: number;
  variance: number;
  overtime: number;
  appointments: number;
  notes: string;
};

type WeeklySummary = {
  daysScheduled: number;
  daysPresent: number;
  daysLeave: number;
  totalScheduled: number;
  totalActual: number;
  totalVariance: number;
  totalOvertime: number;
  totalAppointments: number;
  attendanceRate: number;
};

type StaffMember = {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  dailyRecords: DailyRecord[];
  weeklySummary: WeeklySummary;
};

// Pulls id/name/avatar from the canonical staff registry (staffData.ts) by
// real EMP-id — fixes the staff-profile link below, which used to point at
// a fake "/staff/C1"-style id instead of a real one.
function staffHeader(empId: string): { id: string; name: string; avatar: string } {
  const s = getStaff(empId);
  if (!s) throw new Error(`Unknown staff id in Timesheet: ${empId}`);
  return { id: s.id, name: s.name, avatar: s.avatar };
}

// --- Mock Data ---
const ALL_STAFF: StaffMember[] = [
  {
    ...staffHeader("EMP-003"), role: "Clinician",
    weeklySummary: { daysScheduled: 5, daysPresent: 5, daysLeave: 0, totalScheduled: 40, totalActual: 40, totalVariance: 0, totalOvertime: 0, totalAppointments: 32, attendanceRate: 100 },
    dailyRecords: [
      { id: "1", date: "Wed, 1 Jul", type: "Regular", scheduled: "9:00 – 17:00", scheduledHours: 8, actualStart: "8:55", actualEnd: "17:05", actualHours: 8.1, variance: 0.1, overtime: 0, appointments: 6, notes: "" },
      { id: "2", date: "Thu, 2 Jul", type: "Regular", scheduled: "9:00 – 17:00", scheduledHours: 8, actualStart: "9:00", actualEnd: "17:00", actualHours: 8, variance: 0, overtime: 0, appointments: 7, notes: "" },
      { id: "3", date: "Fri, 3 Jul", type: "Regular", scheduled: "9:00 – 17:00", scheduledHours: 8, actualStart: "9:00", actualEnd: "17:00", actualHours: 8, variance: 0, overtime: 0, appointments: 5, notes: "" },
      { id: "4", date: "Sat, 4 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "5", date: "Sun, 5 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "6", date: "Mon, 6 Jul", type: "Regular", scheduled: "9:00 – 17:00", scheduledHours: 8, actualStart: "9:00", actualEnd: "17:00", actualHours: 8, variance: 0, overtime: 0, appointments: 7, notes: "" },
      { id: "7", date: "Tue, 7 Jul", type: "Regular", scheduled: "9:00 – 17:00", scheduledHours: 8, actualStart: "9:00", actualEnd: "17:00", actualHours: 8, variance: 0, overtime: 0, appointments: 7, notes: "" },
    ]
  },
  {
    ...staffHeader("EMP-004"), role: "Clinician",
    weeklySummary: { daysScheduled: 5, daysPresent: 4, daysLeave: 1, totalScheduled: 40, totalActual: 32, totalVariance: -8, totalOvertime: 0, totalAppointments: 22, attendanceRate: 80 },
    dailyRecords: [
      { id: "1", date: "Wed, 1 Jul", type: "Regular", scheduled: "8:00 – 16:00", scheduledHours: 8, actualStart: "8:00", actualEnd: "16:00", actualHours: 8, variance: 0, overtime: 0, appointments: 6, notes: "" },
      { id: "2", date: "Thu, 2 Jul", type: "Regular", scheduled: "8:00 – 16:00", scheduledHours: 8, actualStart: "7:55", actualEnd: "16:15", actualHours: 8.3, variance: 0.3, overtime: 0, appointments: 5, notes: "" },
      { id: "3", date: "Fri, 3 Jul", type: "On Leave", scheduled: "—", scheduledHours: 8, actualStart: "—", actualEnd: "—", actualHours: 0, variance: -8, overtime: 0, appointments: 0, notes: "Annual leave" },
      { id: "4", date: "Sat, 4 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "5", date: "Sun, 5 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "6", date: "Mon, 6 Jul", type: "Regular", scheduled: "8:00 – 16:00", scheduledHours: 8, actualStart: "8:00", actualEnd: "16:00", actualHours: 8, variance: 0, overtime: 0, appointments: 5, notes: "" },
      { id: "7", date: "Tue, 7 Jul", type: "Regular", scheduled: "8:00 – 16:00", scheduledHours: 8, actualStart: "8:00", actualEnd: "16:00", actualHours: 8, variance: 0, overtime: 0, appointments: 6, notes: "" },
    ]
  },
  {
    ...staffHeader("EMP-007"), role: "Nurse",
    weeklySummary: { daysScheduled: 5, daysPresent: 5, daysLeave: 0, totalScheduled: 45, totalActual: 40.5, totalVariance: -4.5, totalOvertime: 0, totalAppointments: 18, attendanceRate: 100 },
    dailyRecords: [
      { id: "1", date: "Wed, 1 Jul", type: "Override", scheduled: "8:30 – 13:00", scheduledHours: 4.5, actualStart: "8:30", actualEnd: "13:00", actualHours: 4.5, variance: -4.5, overtime: 0, appointments: 3, notes: "Override: family commitment" },
      { id: "2", date: "Thu, 2 Jul", type: "Regular", scheduled: "8:30 – 17:30", scheduledHours: 9, actualStart: "8:30", actualEnd: "17:30", actualHours: 9, variance: 0, overtime: 0, appointments: 4, notes: "" },
      { id: "3", date: "Fri, 3 Jul", type: "Regular", scheduled: "8:30 – 17:30", scheduledHours: 9, actualStart: "8:25", actualEnd: "17:35", actualHours: 9.1, variance: 0.1, overtime: 0, appointments: 3, notes: "" },
      { id: "4", date: "Sat, 4 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "5", date: "Sun, 5 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "6", date: "Mon, 6 Jul", type: "Regular", scheduled: "8:30 – 17:30", scheduledHours: 9, actualStart: "8:30", actualEnd: "17:30", actualHours: 9, variance: 0, overtime: 0, appointments: 4, notes: "" },
      { id: "7", date: "Tue, 7 Jul", type: "Regular", scheduled: "8:30 – 17:30", scheduledHours: 9, actualStart: "8:30", actualEnd: "17:30", actualHours: 9, variance: 0, overtime: 0, appointments: 4, notes: "" },
    ]
  },
  {
    ...staffHeader("EMP-010"), role: "Receptionist",
    weeklySummary: { daysScheduled: 5, daysPresent: 5, daysLeave: 0, totalScheduled: 50, totalActual: 60, totalVariance: 10, totalOvertime: 10, totalAppointments: 0, attendanceRate: 100 },
    dailyRecords: [
      { id: "1", date: "Wed, 1 Jul", type: "Regular", scheduled: "8:00 – 18:00", scheduledHours: 10, actualStart: "8:00", actualEnd: "20:00", actualHours: 12, variance: 2, overtime: 2, appointments: 0, notes: "Extended shift" },
      { id: "2", date: "Thu, 2 Jul", type: "Regular", scheduled: "8:00 – 18:00", scheduledHours: 10, actualStart: "8:00", actualEnd: "20:00", actualHours: 12, variance: 2, overtime: 2, appointments: 0, notes: "Extended shift" },
      { id: "3", date: "Fri, 3 Jul", type: "Regular", scheduled: "8:00 – 18:00", scheduledHours: 10, actualStart: "8:00", actualEnd: "20:00", actualHours: 12, variance: 2, overtime: 2, appointments: 0, notes: "Extended shift" },
      { id: "4", date: "Sat, 4 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "5", date: "Sun, 5 Jul", type: "Day Off", scheduled: "—", scheduledHours: 0, actualStart: "—", actualEnd: "—", actualHours: 0, variance: 0, overtime: 0, appointments: 0, notes: "" },
      { id: "6", date: "Mon, 6 Jul", type: "Regular", scheduled: "8:00 – 18:00", scheduledHours: 10, actualStart: "8:00", actualEnd: "20:00", actualHours: 12, variance: 2, overtime: 2, appointments: 0, notes: "Extended shift" },
      { id: "7", date: "Tue, 7 Jul", type: "Regular", scheduled: "8:00 – 18:00", scheduledHours: 10, actualStart: "8:00", actualEnd: "20:00", actualHours: 12, variance: 2, overtime: 2, appointments: 0, notes: "Extended shift" },
    ]
  }
];

// Icon + colour per schedule-type, so the daily table reads at a glance.
const SCHEDULE_TYPE_META: Record<DailyRecord["type"], { icon: LucideIcon; cls: string }> = {
  Regular: { icon: Clock, cls: "bg-blue-50 text-blue-700 border-blue-200" },
  Override: { icon: Repeat, cls: "bg-purple-50 text-purple-700 border-purple-200" },
  "Day Off": { icon: Moon, cls: "bg-gray-100 text-gray-500 border-gray-300" },
  "On Leave": { icon: Plane, cls: "bg-red-50 text-red-700 border-red-200" },
};

// Role → pill classes, shared by the picker and the table's staff column.
const ROLE_PILL: Record<Role, string> = {
  Clinician: "bg-blue-50 text-blue-700 border-blue-200",
  Nurse: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Receptionist: "bg-purple-50 text-purple-700 border-purple-200",
};

export function TimesheetPage() {
  const [view, setView] = useState<'Daily' | 'Weekly'>('Daily');
  // Default to viewing all staff — no "select staff first" empty state.
  const [selectedIds, setSelectedIds] = useState<string[]>(ALL_STAFF.map(s => s.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [exportOpen, setExportOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: new Date(2026, 6, 1), end: new Date(2026, 6, 7), preset: "This Week" });

  const pickerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clinicians = ALL_STAFF.filter(s => s.role === 'Clinician' && s.name.toLowerCase().includes(search.toLowerCase()));
  const nurses = ALL_STAFF.filter(s => s.role === 'Nurse' && s.name.toLowerCase().includes(search.toLowerCase()));
  const receptionists = ALL_STAFF.filter(s => s.role === 'Receptionist' && s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedStaff = ALL_STAFF.filter(s => selectedIds.includes(s.id));

  const toggleStaff = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectGroup = (role: Role | 'All') => {
    if (role === 'All') {
      setSelectedIds(ALL_STAFF.map(s => s.id));
    } else {
      const ids = ALL_STAFF.filter(s => s.role === role).map(s => s.id);
      const newIds = new Set([...selectedIds, ...ids]);
      setSelectedIds(Array.from(newIds));
    }
    setPickerOpen(false);
  };

  const handleExport = (type: string) => {
    toast.success(`Exporting as ${type}...`);
    setExportOpen(false);
  };

  // Aggregated Stats
  let totalScheduled = 0;
  let totalActual = 0;
  let totalOvertime = 0;
  let totalDaysScheduled = 0;
  let totalDaysLeave = 0;
  let totalAppointments = 0;

  selectedStaff.forEach(staff => {
    totalScheduled += staff.weeklySummary.totalScheduled;
    totalActual += staff.weeklySummary.totalActual;
    totalOvertime += staff.weeklySummary.totalOvertime;
    totalDaysScheduled += staff.weeklySummary.daysScheduled;
    totalDaysLeave += staff.weeklySummary.daysLeave;
    totalAppointments += staff.weeklySummary.totalAppointments;
  });

  const variance = totalActual - totalScheduled;
  const attendanceRate = totalDaysScheduled > 0 ? Math.round(((totalDaysScheduled - totalDaysLeave) / totalDaysScheduled) * 100) : 0;

  // Overview strip: state-driven icon tone so the bar signals at a glance.
  // Tone always rides alongside the suffix text, never carrying meaning alone.
  const varianceText = variance < 0 ? `${Math.abs(variance)}h under scheduled` : variance > 0 ? `${variance}h over scheduled` : "on track with schedule";
  const recordedTone: StatIconTone = variance < 0 ? "red" : variance > 0 ? "amber" : "emerald";
  const attendanceTone: StatIconTone = attendanceRate >= 100 ? "emerald" : attendanceRate >= 80 ? "amber" : "red";
  const staffCount = selectedStaff.length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Top Header Row */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">Timesheet</h1>
            <p className="text-sm text-gray-500 mt-0.5">Staff working hours and attendance records</p>
          </div>
        </div>

        <div className="relative" ref={exportRef}>
          <button 
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-gray-500" /> Export <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-30 py-1 overflow-hidden">
              <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Export as Excel (.xlsx)</button>
              <button onClick={() => handleExport('CSV')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Export as CSV (.csv)</button>
              <div className="border-t border-gray-100 my-1"></div>
              <button onClick={() => handleExport('Print')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Print View</button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Row */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          
          {/* Staff Picker */}
          <div className="relative" ref={pickerRef}>
            <div 
              onClick={() => setPickerOpen(true)}
              className="w-[400px] min-h-[38px] border border-gray-300 bg-white rounded shadow-sm flex items-center px-2 cursor-text transition-colors hover:border-gray-400"
            >
              {selectedStaff.length === 0 ? (
                <span className="text-sm text-gray-400 pl-2">All staff · none selected</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 py-1.5 w-[360px] max-h-24 overflow-y-auto">
                  {selectedStaff.map(s => (
                    <div key={s.id} className={`flex items-center rounded pl-1 pr-1.5 py-0.5 border bg-gray-50 border-gray-200`}>
                      <div className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600 mr-1.5 shrink-0">
                        {s.avatar}
                      </div>
                      <span className="text-xs font-medium text-gray-700 mr-1.5 truncate max-w-[80px]">{s.name.split(' ').pop()}</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleStaff(s.id); }} className="hover:bg-gray-200 rounded-full p-0.5 text-gray-400 hover:text-gray-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute right-3 text-xs font-bold text-gray-400 flex items-center bg-white pl-2">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Dropdown Panel */}
            {pickerOpen && (
              <div className="absolute top-full left-0 mt-1 w-[400px] bg-white border border-gray-200 rounded-lg shadow-xl z-30 flex flex-col max-h-[450px]">
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
                  {/* Clinicians */}
                  {clinicians.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Clinicians</div>
                      {clinicians.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-md mb-0.5 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-slate-50' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-gray-800">{s.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${ROLE_PILL.Clinician}`}>Clinician</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Nurses */}
                  {nurses.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nurses</div>
                      {nurses.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-md mb-0.5 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-slate-50' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-gray-800">{s.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${ROLE_PILL.Nurse}`}>Nurse</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Receptionists */}
                  {receptionists.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Receptionists</div>
                      {receptionists.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-md mb-0.5 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-slate-50' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-gray-800">{s.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${ROLE_PILL.Receptionist}`}>Receptionist</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Presets */}
                <div className="p-2 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => handleSelectGroup('All')} className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-white border border-gray-200 rounded hover:bg-slate-50">All Staff</button>
                  <button onClick={() => handleSelectGroup('Clinician')} className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-white border border-gray-200 rounded hover:bg-blue-50">Clinicians</button>
                  <button onClick={() => handleSelectGroup('Nurse')} className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-white border border-gray-200 rounded hover:bg-emerald-50">Nurses</button>
                  <button onClick={() => handleSelectGroup('Receptionist')} className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-white border border-gray-200 rounded hover:bg-purple-50">Receptionists</button>
                  <div className="flex-1"></div>
                  <button onClick={() => setSelectedIds([])} className="px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-800">Clear</button>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="relative" ref={dateRef}>
            <div 
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="w-[350px] h-[38px] border border-gray-300 bg-white rounded shadow-sm flex items-center px-3 cursor-pointer hover:border-gray-400"
            >
              <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm font-bold text-gray-700 flex-1 truncate">
                {dateRange.preset === "Custom Range" 
                  ? `${format(dateRange.start, "d MMM")} – ${format(dateRange.end, "d MMM yyyy")}`
                  : `${dateRange.preset} · ${format(dateRange.start, "d MMM")} – ${format(dateRange.end, "d MMM yyyy")}`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
            </div>
            
            {datePickerOpen && (
              <RangeDatePicker 
                initialStart={dateRange.start}
                initialEnd={dateRange.end}
                initialPreset={dateRange.preset}
                onCancel={() => setDatePickerOpen(false)}
                onApply={(start, end, preset) => {
                  setDateRange({ start, end, preset });
                  setDatePickerOpen(false);
                }}
              />
            )}
          </div>

        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setView('Daily')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${view === 'Daily' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setView('Weekly')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${view === 'Weekly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Weekly Summary
          </button>
        </div>
      </div>

      {/* Overview — Stat family T3 `strip`. Every figure below is computed in
          the aggregation block above from the existing ALL_STAFF records; the
          Stat components never derive a value themselves. */}
      {selectedStaff.length > 0 && (
        <div className="px-8 py-4 shrink-0">
          <StatStripGroup>
            <Stat
              stat={{ id: "scheduled", label: "Scheduled", kind: "count", variant: "strip",
                      value: `${totalScheduled}h`, suffix: `across ${staffCount} staff` }}
              icon={CalendarClock}
              iconTone="slate"
            />
            <Stat
              stat={{ id: "recorded", label: "Recorded", kind: "count", variant: "strip",
                      value: `${totalActual}h`, suffix: varianceText }}
              icon={Timer}
              iconTone={recordedTone}
            />
            <Stat
              stat={{ id: "attendance", label: "Attendance", kind: "count", variant: "strip",
                      value: `${attendanceRate}%`,
                      suffix: totalDaysLeave > 0 ? `${totalDaysLeave} day${totalDaysLeave === 1 ? "" : "s"} on leave` : "no leave taken" }}
              icon={UserCheck}
              iconTone={attendanceTone}
            />
            <Stat
              stat={{ id: "overtime", label: "Overtime", kind: "count", variant: "strip",
                      value: `${totalOvertime}h`, suffix: `${totalAppointments} appointments` }}
              icon={Zap}
              iconTone={totalOvertime > 0 ? "amber" : "slate"}
            />
          </StatStripGroup>
        </div>
      )}

      {/* Data Table Area */}
      <div className="flex-1 overflow-hidden px-8 pb-8 flex flex-col min-h-0 relative">
        {selectedStaff.length === 0 ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-1">No staff selected</h2>
            <p className="text-gray-500 mb-5 text-sm">Add team members with the picker above, or view everyone.</p>
            <button onClick={() => handleSelectGroup('All')} className="inline-flex items-center gap-2 px-5 py-2 bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
              <Users className="w-4 h-4" /> View All Staff
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm relative">
            <div className="flex-1 overflow-auto relative">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-gray-50 sticky top-0 z-20 shadow-[0_1px_0_#e5e7eb]">
                  {view === 'Daily' ? (
                    <tr>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 sticky left-0 z-30 bg-gray-50 w-[200px] shadow-[1px_0_0_#e5e7eb]">Staff</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">Date</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Schedule Type</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Scheduled</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Sched. Hours</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Actual Start</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Actual End</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Actual Hours</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Variance</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Overtime</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Appointments</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-full">Notes</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 sticky left-0 z-30 bg-gray-50 w-[200px] shadow-[1px_0_0_#e5e7eb]">Staff</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Week</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Days Sched.</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Days Present</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Days Leave</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Total Sched.</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Total Actual</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Variance</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Overtime</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Appointments</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right">Attendance</th>
                    </tr>
                  )}
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {view === 'Daily' && selectedStaff.flatMap(staff => 
                    staff.dailyRecords.map((rec, i) => {
                      const isFirst = i === 0;
                      let bgClass = "bg-white";
                      if (rec.type === 'On Leave') bgClass = "bg-[#FEE2E2]";
                      else if (rec.type === 'Day Off') bgClass = "bg-[#F3F4F6]";
                      
                      let varColor = "text-gray-500";
                      if (rec.variance > 0) varColor = "text-green-600 font-bold";
                      else if (rec.variance < 0) varColor = "text-red-600 font-bold";

                      return (
                        <tr key={`${staff.id}-${rec.id}`} className={`group hover:bg-slate-50 transition-colors ${bgClass}`}>
                          {/* Sticky Staff Col */}
                          <td className={`p-4 border-r border-gray-200 sticky left-0 z-10 shadow-[1px_0_0_#e5e7eb] group-hover:bg-slate-50 transition-colors ${isFirst ? 'bg-white' : bgClass}`}>
                            {isFirst && (
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3">
                                  {staff.avatar}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/staff/${staff.id}`} className="text-sm font-bold text-gray-800 truncate hover:underline hover:text-slate-600 block">
                                    {staff.name}
                                  </Link>
                                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border mt-0.5 inline-block ${ROLE_PILL[staff.role]}`}>
                                    {staff.role}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-medium text-gray-700">{rec.date}</td>
                          <td className="p-4">
                            {(() => {
                              const meta = SCHEDULE_TYPE_META[rec.type];
                              const TypeIcon = meta.icon;
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${meta.cls}`}>
                                  <TypeIcon className="w-3 h-3" /> {rec.type}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-gray-600">{rec.scheduled}</td>
                          <td className="p-4 text-right text-gray-600">{rec.scheduledHours > 0 ? `${rec.scheduledHours}h` : '—'}</td>
                          <td className="p-4 text-right text-gray-800 font-medium">
                            {rec.actualStart} 
                            {rec.actualStart === rec.scheduled.split(' – ')[0] && rec.actualStart !== '—' && <span className="ml-1 text-[10px] text-gray-400 font-normal">(auto)</span>}
                          </td>
                          <td className="p-4 text-right text-gray-800 font-medium">{rec.actualEnd}</td>
                          <td className="p-4 text-right font-bold text-gray-800">{rec.actualHours > 0 ? `${rec.actualHours}h` : '—'}</td>
                          <td className={`p-4 text-right ${varColor}`}>
                            {rec.variance > 0 ? '+' : ''}{rec.variance === 0 ? '0h' : `${rec.variance}h`}
                          </td>
                          <td className={`p-4 text-right font-bold ${rec.overtime > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {rec.overtime > 0 ? `${rec.overtime}h` : '0h'}
                          </td>
                          <td className="p-4 text-right text-gray-600">{rec.appointments > 0 ? rec.appointments : '—'}</td>
                          <td className="p-4 text-gray-500 italic max-w-xs truncate" title={rec.notes}>{rec.notes}</td>
                        </tr>
                      );
                    })
                  )}

                  {view === 'Weekly' && selectedStaff.map(staff => {
                    const ws = staff.weeklySummary;
                    const varColor = ws.totalVariance > 0 ? "text-green-600 font-bold" : ws.totalVariance < 0 ? "text-red-600 font-bold" : "text-gray-500";
                    
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors bg-white group">
                        <td className="p-4 border-r border-gray-200 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_#e5e7eb]">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3">
                              {staff.avatar}
                            </div>
                            <div className="min-w-0">
                              <Link to={`/staff/${staff.id}`} className="text-sm font-bold text-gray-800 truncate hover:underline hover:text-slate-600 block">
                                {staff.name}
                              </Link>
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded mt-0.5 inline-block
                                ${staff.role === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                                  staff.role === 'Nurse' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                                  'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                {staff.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">1 Jul – 7 Jul 2026</td>
                        <td className="p-4 text-center text-gray-700">{ws.daysScheduled}</td>
                        <td className="p-4 text-center font-bold text-gray-800">{ws.daysPresent}</td>
                        <td className="p-4 text-center text-red-600">{ws.daysLeave > 0 ? ws.daysLeave : '0'}</td>
                        <td className="p-4 text-right text-gray-600">{ws.totalScheduled}h</td>
                        <td className="p-4 text-right font-bold text-gray-800">{ws.totalActual}h</td>
                        <td className={`p-4 text-right ${varColor}`}>{ws.totalVariance > 0 ? '+' : ''}{ws.totalVariance}h</td>
                        <td className={`p-4 text-right font-bold ${ws.totalOvertime > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{ws.totalOvertime}h</td>
                        <td className="p-4 text-right text-gray-600">{ws.totalAppointments}</td>
                        <td className="p-4 text-right font-bold text-gray-800">{ws.attendanceRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="h-12 border-t border-gray-200 bg-gray-50 flex items-center justify-between px-6 shrink-0">
              <div className="text-xs text-gray-500 font-medium">
                {view === 'Daily' ? `Showing 1–${selectedStaff.length * 7} of ${selectedStaff.length * 7} records` : `Showing 1–${selectedStaff.length} of ${selectedStaff.length} records`}
              </div>
              <div className="flex items-center space-x-1">
                <button className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-gray-700 border border-transparent hover:bg-gray-200 rounded transition-colors" disabled>Previous</button>
                <button className="px-2 py-1 text-xs font-bold text-slate-600 border border-slate-300 bg-white rounded shadow-sm">1</button>
                <button className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-gray-700 border border-transparent hover:bg-gray-200 rounded transition-colors" disabled>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
