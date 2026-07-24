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
import { Input } from "../../components/ui/input";
import { PageTitleIcon, PAGE_TITLE_CLASS } from "../../components/PageTitleIcon";

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
  Regular: { icon: Clock, cls: "bg-info/10 text-info-ink border-info/30" },
  Override: { icon: Repeat, cls: "bg-special/10 text-special-ink border-special/30" },
  "Day Off": { icon: Moon, cls: "bg-surface-hover text-ink-muted border-divider" },
  "On Leave": { icon: Plane, cls: "bg-danger/10 text-danger-ink border-danger/30" },
};

// Role → pill classes, shared by the picker and the table's staff column.
const ROLE_PILL: Record<Role, string> = {
  Clinician: "bg-info/10 text-info-ink border-info/30",
  Nurse: "bg-success/10 text-success-ink border-success/30",
  Receptionist: "bg-special/10 text-special-ink border-special/30",
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
  const varianceText = variance < 0 ? `${Math.abs(variance)}h under` : variance > 0 ? `${variance}h over` : "on track";
  const recordedTone: StatIconTone = variance < 0 ? "red" : variance > 0 ? "amber" : "emerald";
  const attendanceTone: StatIconTone = attendanceRate >= 100 ? "emerald" : attendanceRate >= 80 ? "amber" : "red";
  const staffCount = selectedStaff.length;

  return (
    <div className="flex flex-col h-full bg-surface-page">

      {/* Top Header Row */}
      <div className="bg-surface border-b border-divider px-4 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <PageTitleIcon icon={Clock} />
          <div>
            <h1 className={`${PAGE_TITLE_CLASS} leading-tight`}>Timesheet</h1>
            <p className="text-sm text-ink-muted mt-1">Staff working hours and attendance records</p>
          </div>
        </div>

        <div className="relative" ref={exportRef}>
          <button 
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-ink-muted" /> Export <ChevronDown className="w-4 h-4 ml-2 text-ink-muted" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-divider shadow-xl rounded-card z-30 py-1 overflow-hidden">
              <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover font-medium">Export as Excel (.xlsx)</button>
              <button onClick={() => handleExport('CSV')} className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover font-medium">Export as CSV (.csv)</button>
              <div className="border-t border-divider my-1"></div>
              <button onClick={() => handleExport('Print')} className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover font-medium">Print View</button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Row */}
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          
          {/* Staff Picker */}
          <div className="relative" ref={pickerRef}>
            <div 
              onClick={() => setPickerOpen(true)}
              className="w-[400px] min-h-[38px] border border-divider bg-surface rounded-control shadow-sm flex items-center px-2 cursor-text transition-colors hover:border-border-strong"
            >
              {selectedStaff.length === 0 ? (
                <span className="text-sm text-ink-muted pl-2">All staff · none selected</span>
              ) : (
                <div className="flex flex-wrap gap-2 py-2 w-[360px] max-h-24 overflow-y-auto">
                  {selectedStaff.map(s => (
                    <div key={s.id} className={`flex items-center rounded-control pl-1 pr-2 py-1 border bg-surface-page border-divider`}>
                      <div className="w-4 h-4 rounded-full bg-surface border border-divider flex items-center justify-center text-label text-ink-soft mr-2 shrink-0">
                        {s.avatar}
                      </div>
                      <span className="text-xs font-medium text-ink-soft mr-2 truncate max-w-[80px]">{s.name.split(' ').pop()}</span>
                      <button onClick={(e) => { e.stopPropagation(); toggleStaff(s.id); }} className="hover:bg-surface-sunken rounded-full p-1 text-ink-muted hover:text-ink-soft">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute right-3 text-xs font-bold text-ink-muted flex items-center bg-surface pl-2">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Dropdown Panel */}
            {pickerOpen && (
              <div className="absolute top-full left-0 mt-1 w-[400px] bg-surface border border-divider rounded-card shadow-xl z-30 flex flex-col max-h-[450px]">
                <div className="p-3 border-b border-divider shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      autoFocus
                      type="text"
                      placeholder="Search by name..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-4 focus:border-info"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {/* Clinicians */}
                  {clinicians.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-bold text-ink-muted uppercase tracking-wider">Clinicians</div>
                      {clinicians.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-control mb-1 cursor-pointer hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded-control border-divider text-ink-soft focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-ink">{s.name}</span>
                            </div>
                            <span className={`px-2 py-1 border text-overline rounded-control ${ROLE_PILL.Clinician}`}>Clinician</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Nurses */}
                  {nurses.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-bold text-ink-muted uppercase tracking-wider">Nurses</div>
                      {nurses.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-control mb-1 cursor-pointer hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded-control border-divider text-ink-soft focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-ink">{s.name}</span>
                            </div>
                            <span className={`px-2 py-1 border text-overline rounded-control ${ROLE_PILL.Nurse}`}>Nurse</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Receptionists */}
                  {receptionists.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-bold text-ink-muted uppercase tracking-wider">Receptionists</div>
                      {receptionists.map(s => {
                        const isSelected = selectedIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} onClick={() => toggleStaff(s.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-control mb-1 cursor-pointer hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                          >
                            <div className="flex items-center">
                              <input type="checkbox" checked={isSelected} readOnly className="mr-3 rounded-control border-divider text-ink-soft focus:ring-0" />
                              <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft mr-3">{s.avatar}</div>
                              <span className="text-sm font-medium text-ink">{s.name}</span>
                            </div>
                            <span className={`px-2 py-1 border text-overline rounded-control ${ROLE_PILL.Receptionist}`}>Receptionist</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Presets */}
                <div className="p-2 border-t border-divider bg-surface-page flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => handleSelectGroup('All')} className="px-2 py-1 text-label text-ink-soft bg-surface border border-divider rounded-control hover:bg-surface-hover">All Staff</button>
                  <button onClick={() => handleSelectGroup('Clinician')} className="px-2 py-1 text-label text-info-ink bg-surface border border-divider rounded-control hover:bg-info/10">Clinicians</button>
                  <button onClick={() => handleSelectGroup('Nurse')} className="px-2 py-1 text-label text-success-ink bg-surface border border-divider rounded-control hover:bg-success/10">Nurses</button>
                  <button onClick={() => handleSelectGroup('Receptionist')} className="px-2 py-1 text-label text-special-ink bg-surface border border-divider rounded-control hover:bg-special/10">Receptionists</button>
                  <div className="flex-1"></div>
                  <button onClick={() => setSelectedIds([])} className="px-2 py-1 text-label text-ink-muted hover:text-ink">Clear</button>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="relative" ref={dateRef}>
            <div 
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="w-[350px] h-[38px] border border-divider bg-surface rounded-control shadow-sm flex items-center px-3 cursor-pointer hover:border-border-strong"
            >
              <CalendarIcon className="w-4 h-4 text-ink-muted mr-2" />
              <span className="text-sm font-bold text-ink-soft flex-1 truncate">
                {dateRange.preset === "Custom Range" 
                  ? `${format(dateRange.start, "d MMM")} – ${format(dateRange.end, "d MMM yyyy")}`
                  : `${dateRange.preset} · ${format(dateRange.start, "d MMM")} – ${format(dateRange.end, "d MMM yyyy")}`}
              </span>
              <ChevronDown className="w-4 h-4 text-ink-muted ml-2 shrink-0" />
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
        <div className="flex bg-surface-hover p-1 rounded-control">
          <button
            onClick={() => setView('Daily')}
            className={`px-4 py-2 text-sm font-bold rounded-control transition-colors ${view === 'Daily' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink-soft'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('Weekly')}
            className={`px-4 py-2 text-sm font-bold rounded-control transition-colors ${view === 'Weekly' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink-soft'}`}
          >
            Weekly Summary
          </button>
        </div>
      </div>

      {/* Overview — Stat family T3 `strip`. Every figure below is computed in
          the aggregation block above from the existing ALL_STAFF records; the
          Stat components never derive a value themselves. */}
      {selectedStaff.length > 0 && (
        <div className="px-4 py-4 shrink-0">
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
      <div className="flex-1 overflow-hidden px-4 pb-4 flex flex-col min-h-0 relative">
        {selectedStaff.length === 0 ? (
          <div className="flex-1 bg-surface rounded-card flex flex-col items-center justify-center py-6">
            <div className="w-14 h-14 bg-surface-hover rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-ink-muted" />
            </div>
            <h2 className="text-base font-bold text-ink mb-1">No staff selected</h2>
            <p className="text-ink-muted mb-4 text-sm">Add team members with the picker above, or view everyone.</p>
            <button onClick={() => handleSelectGroup('All')} className="inline-flex items-center gap-2 px-4 py-2 btn-primary text-sm rounded-control transition-colors shadow-sm">
              <Users className="w-4 h-4" /> View All Staff
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-surface border border-divider rounded-card shadow-sm overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-auto relative">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap [&_th]:!px-3 [&_td]:!px-3 [&_th]:!py-2.5 [&_td]:!py-2.5">
                <thead className="bg-surface-page sticky top-0 z-20 shadow-[0_1px_0_var(--border-strong)]">
                  {view === 'Daily' ? (
                    <tr>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider sticky left-0 z-30 bg-surface-page w-[200px] shadow-[1px_0_0_var(--border-strong)]">Staff</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider hover:bg-surface-hover cursor-pointer">Date</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Schedule Type</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Scheduled</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Sched. Hours</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Actual Start</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Actual End</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Actual Hours</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Variance</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Overtime</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Appointments</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider w-full">Notes</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider sticky left-0 z-30 bg-surface-page w-[200px] shadow-[1px_0_0_var(--border-strong)]">Staff</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Week</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-center">Days Sched.</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-center">Days Present</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-center">Days Leave</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Total Sched.</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Total Actual</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Variance</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Overtime</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Appointments</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider text-right">Attendance</th>
                    </tr>
                  )}
                </thead>
                
                <tbody className="divide-y divide-divider">
                  {view === 'Daily' && selectedStaff.flatMap(staff => 
                    staff.dailyRecords.map((rec, i) => {
                      const isFirst = i === 0;
                      let bgClass = "bg-surface";
                      if (rec.type === 'On Leave') bgClass = "bg-danger/10";
                      else if (rec.type === 'Day Off') bgClass = "bg-surface-hover";
                      
                      let varColor = "text-ink-muted";
                      if (rec.variance > 0) varColor = "text-success-ink font-bold";
                      else if (rec.variance < 0) varColor = "text-danger-ink font-bold";

                      return (
                        <tr key={`${staff.id}-${rec.id}`} className={`group hover:bg-surface-hover transition-colors ${bgClass}`}>
                          {/* Sticky Staff Col */}
                          <td className={`p-4 border-r border-divider sticky left-0 z-10 shadow-[1px_0_0_var(--border-strong)] group-hover:bg-surface-hover transition-colors ${isFirst ? 'bg-surface' : bgClass}`}>
                            {isFirst && (
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft shrink-0 mr-3">
                                  {staff.avatar}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/staff/${staff.id}`} className="text-sm font-bold text-ink truncate hover:underline hover:text-ink-soft block">
                                    {staff.name}
                                  </Link>
                                  <span className={`px-1.5 py-0.5 text-overline rounded-control border mt-0.5 inline-block ${ROLE_PILL[staff.role]}`}>
                                    {staff.role}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-medium text-ink-soft">{rec.date}</td>
                          <td className="p-4">
                            {(() => {
                              const meta = SCHEDULE_TYPE_META[rec.type];
                              const TypeIcon = meta.icon;
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-overline rounded-control border ${meta.cls}`}>
                                  <TypeIcon className="w-3 h-3" /> {rec.type}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-ink-soft">{rec.scheduled}</td>
                          <td className="p-4 text-right text-ink-soft">{rec.scheduledHours > 0 ? `${rec.scheduledHours}h` : '—'}</td>
                          <td className="p-4 text-right text-ink font-medium">
                            {rec.actualStart} 
                            {rec.actualStart === rec.scheduled.split(' – ')[0] && rec.actualStart !== '—' && <span className="ml-1 text-overline text-ink-muted font-normal">(auto)</span>}
                          </td>
                          <td className="p-4 text-right text-ink font-medium">{rec.actualEnd}</td>
                          <td className="p-4 text-right font-bold text-ink">{rec.actualHours > 0 ? `${rec.actualHours}h` : '—'}</td>
                          <td className={`p-4 text-right ${varColor}`}>
                            {rec.variance > 0 ? '+' : ''}{rec.variance === 0 ? '0h' : `${rec.variance}h`}
                          </td>
                          <td className={`p-4 text-right font-bold ${rec.overtime > 0 ? 'text-warning-ink' : 'text-ink-muted'}`}>
                            {rec.overtime > 0 ? `${rec.overtime}h` : '0h'}
                          </td>
                          <td className="p-4 text-right text-ink-soft">{rec.appointments > 0 ? rec.appointments : '—'}</td>
                          <td className="p-4 text-ink-muted italic max-w-xs truncate" title={rec.notes}>{rec.notes}</td>
                        </tr>
                      );
                    })
                  )}

                  {view === 'Weekly' && selectedStaff.map(staff => {
                    const ws = staff.weeklySummary;
                    const varColor = ws.totalVariance > 0 ? "text-success-ink font-bold" : ws.totalVariance < 0 ? "text-danger-ink font-bold" : "text-ink-muted";
                    
                    return (
                      <tr key={staff.id} className="hover:bg-surface-hover transition-colors bg-surface group">
                        <td className="p-4 border-r border-divider sticky left-0 z-10 bg-surface group-hover:bg-surface-hover transition-colors shadow-[1px_0_0_var(--border-strong)]">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft shrink-0 mr-3">
                              {staff.avatar}
                            </div>
                            <div className="min-w-0">
                              <Link to={`/staff/${staff.id}`} className="text-sm font-bold text-ink truncate hover:underline hover:text-ink-soft block">
                                {staff.name}
                              </Link>
                              <span className={`px-1.5 py-0.5 text-overline rounded-control mt-0.5 inline-block
                                ${staff.role === 'Clinician' ? 'bg-info/10 text-info-ink border border-info/30' : 
                                  staff.role === 'Nurse' ? 'bg-success/10 text-success-ink border border-success/30' : 
                                  'bg-special/10 text-special-ink border border-special/30'}`}>
                                {staff.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-ink-soft font-medium">1 Jul – 7 Jul 2026</td>
                        <td className="p-4 text-center text-ink-soft">{ws.daysScheduled}</td>
                        <td className="p-4 text-center font-bold text-ink">{ws.daysPresent}</td>
                        <td className="p-4 text-center text-danger-ink">{ws.daysLeave > 0 ? ws.daysLeave : '0'}</td>
                        <td className="p-4 text-right text-ink-soft">{ws.totalScheduled}h</td>
                        <td className="p-4 text-right font-bold text-ink">{ws.totalActual}h</td>
                        <td className={`p-4 text-right ${varColor}`}>{ws.totalVariance > 0 ? '+' : ''}{ws.totalVariance}h</td>
                        <td className={`p-4 text-right font-bold ${ws.totalOvertime > 0 ? 'text-warning-ink' : 'text-ink-muted'}`}>{ws.totalOvertime}h</td>
                        <td className="p-4 text-right text-ink-soft">{ws.totalAppointments}</td>
                        <td className="p-4 text-right font-bold text-ink">{ws.attendanceRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="h-12 border-t border-divider bg-surface-page flex items-center justify-between px-6 shrink-0">
              <div className="text-xs text-ink-muted font-medium">
                {view === 'Daily' ? `Showing 1–${selectedStaff.length * 7} of ${selectedStaff.length * 7} records` : `Showing 1–${selectedStaff.length} of ${selectedStaff.length} records`}
              </div>
              <div className="flex items-center space-x-1">
                <button className="px-2 py-1 text-xs font-bold text-ink-muted hover:text-ink-soft border border-transparent hover:bg-surface-sunken rounded-control transition-colors" disabled>Previous</button>
                <button className="px-2 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface rounded-control shadow-sm">1</button>
                <button className="px-2 py-1 text-xs font-bold text-ink-muted hover:text-ink-soft border border-transparent hover:bg-surface-sunken rounded-control transition-colors" disabled>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
