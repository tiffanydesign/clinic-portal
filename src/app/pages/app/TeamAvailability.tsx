import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, ChevronDown, Search, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { getStaff } from "./staff/staffData";

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
const cl = (start: string, end: string): AvailabilityBlock => ({ start, end, type: 'Clinic' });
const vi = (start: string, end: string): AvailabilityBlock => ({ start, end, type: 'Video' });

// A day with real bookings — every working day (bar off/leave/override
// special cases) gets one of these rather than the old zero-booked
// placeholder, so the week reads as an actually-staffed clinic instead of
// six mostly-idle people who only happen to have appointments on Thursday.
function bookedDay(blocks: AvailabilityBlock[], totalHours: number, appointments: Appointment[]): DaySchedule {
  const bookedHours = Math.round(appointments.reduce((sum, a) => sum + (toMin(a.end) - toMin(a.start)) / 60, 0) * 100) / 100;
  const remaining = Math.round((totalHours - bookedHours) * 100) / 100;
  const openSlots = Math.max(0, Math.round(remaining / 1.5));
  const summary = bookedHours >= totalHours
    ? `Available: ${totalHours}h · Booked: ${bookedHours}h · Remaining: 0h (fully booked)`
    : `Available: ${totalHours}h · Booked: ${bookedHours}h · Remaining: ${remaining}h (${openSlots} open slot${openSlots === 1 ? "" : "s"})`;
  return { blocks, totalHours, bookedHours, appointments, summary };
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// The clinic/video distinction was dropped, so a day's blocks now just
// describe when the person is available — overlapping or touching blocks
// (e.g. a 9–17 window with a 10–16 window inside it) collapse into a single
// continuous availability window rather than two coloured bars the reader
// has to mentally union.
function availabilityWindows(blocks?: AvailabilityBlock[]): { start: string; end: string }[] {
  if (!blocks || blocks.length === 0) return [];
  const ranges = blocks
    .map((b) => [toMin(b.start), toMin(b.end)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged.map(([s, e]) => ({ start: fmtMin(s), end: fmtMin(e) }));
}

// Pulls id/name/avatar from the canonical staff registry (staffData.ts) by
// real EMP-id, so renaming a staff member only ever needs to happen there —
// only the schedule-specific `role`/`schedules` stay local to this page.
function staffHeader(empId: string): { id: string; name: string; avatar: string } {
  const s = getStaff(empId);
  if (!s) throw new Error(`Unknown staff id in TeamAvailability: ${empId}`);
  return { id: s.id, name: s.name, avatar: s.avatar };
}

// --- Detailed Mock Data ---
const ALL_STAFF: StaffMember[] = [
  {
    ...staffHeader("EMP-003"), role: "Clinician",
    schedules: [
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [ // Mon
        { start: "9:00", end: "10:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "12:30", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "14:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "16:30", patient: "Sena Yavuz" },
      ]),
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [ // Tue
        { start: "9:00", end: "10:30", patient: "Ece Yıldırım" },
        { start: "10:30", end: "12:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "16:30", patient: "Sena Yavuz" },
      ]),
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [ // Wed
        { start: "10:00", end: "11:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "15:00", patient: "Sena Yavuz" },
      ]),
      { // Thu - Fragmented Mock
        totalHours: 8, bookedHours: 3.5,
        blocks: [cl("9:00", "17:00"), vi("10:00", "16:00")],
        appointments: [
          { start: "10:00", end: "11:00", patient: "Ece Yıldırım" },
          { start: "14:00", end: "15:30", patient: "Aslı Kutlu" },
          { start: "16:00", end: "17:00", patient: "Tarkan Solmaz" }
        ],
        summary: "Available: 8h · Booked: 3.5h · Remaining: 4.5h (3 open slots)"
      },
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [ // Fri — fully booked
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "17:00", patient: "Sena Yavuz" },
      ]),
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    ...staffHeader("EMP-004"), role: "Clinician",
    schedules: [
      bookedDay([cl("8:00", "16:00")], 8, [ // Mon
        { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
        { start: "11:00", end: "12:30", patient: "Hakan Bulut" },
        { start: "13:00", end: "14:00", patient: "Serkan Çetin" },
      ]),
      bookedDay([cl("8:00", "16:00"), vi("9:00", "12:00")], 8, [ // Tue
        { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
        { start: "9:30", end: "11:00", patient: "Hakan Bulut" },
        { start: "11:00", end: "13:00", patient: "Serkan Çetin" },
        { start: "13:00", end: "14:00", patient: "Derya Toprak" },
      ]),
      bookedDay([cl("8:00", "16:00")], 8, [ // Wed
        { start: "10:00", end: "11:30", patient: "Derya Toprak" },
      ]),
      { // Thu
        totalHours: 8, bookedHours: 3,
        blocks: [cl("8:00", "16:00"), vi("9:00", "12:00")],
        appointments: [
          { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
          { start: "11:00", end: "12:00", patient: "Hakan Bulut" },
          { start: "13:00", end: "14:00", patient: "Serkan Çetin" }
        ],
        summary: "Available: 8h · Booked: 3h · Remaining: 5h (3 open slots)"
      },
      { off: true }, // Fri
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    ...staffHeader("EMP-005"), role: "Clinician",
    schedules: [
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [ // Mon
        { start: "9:00", end: "10:30", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
        { start: "14:00", end: "15:30", patient: "Umut Erdem" },
        { start: "16:00", end: "17:00", patient: "Volkan Turan" },
      ]),
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [ // Tue
        { start: "9:00", end: "10:30", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:30", patient: "Cem Polat" },
        { start: "14:00", end: "16:00", patient: "Umut Erdem" },
        { start: "16:00", end: "17:00", patient: "Volkan Turan" },
      ]),
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [ // Wed
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
      ]),
      { // Thu (Override)
        override: true, totalHours: 3, bookedHours: 1,
        blocks: [cl("9:00", "12:00")],
        appointments: [
          { start: "9:00", end: "10:00", patient: "Burak Kocaman" }
        ],
        summary: "Available: 3h · Booked: 1h · Remaining: 2h (1 open slot)"
      },
      bookedDay([cl("9:00", "18:00")], 9, [ // Fri — fully booked
        { start: "9:00", end: "11:00", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
        { start: "13:00", end: "15:30", patient: "Umut Erdem" },
        { start: "15:30", end: "18:00", patient: "Volkan Turan" },
      ]),
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    ...staffHeader("EMP-006"), role: "Clinician",
    schedules: [
      bookedDay([cl("10:00", "18:00")], 8, [ // Mon
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "15:00", end: "16:30", patient: "Defne Korkut" },
      ]),
      bookedDay([cl("10:00", "18:00")], 8, [ // Tue
        { start: "11:00", end: "13:00", patient: "Ozan Bilgin" },
      ]),
      bookedDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8, [ // Wed
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "14:00", end: "16:00", patient: "Defne Korkut" },
        { start: "16:00", end: "16:30", patient: "Ozan Bilgin" },
      ]),
      bookedDay([cl("10:00", "18:00")], 8, [ // Thu
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "15:00", end: "15:30", patient: "Defne Korkut" },
      ]),
      bookedDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8, [ // Fri — fully booked
        { start: "10:00", end: "12:00", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "14:00", end: "16:00", patient: "Defne Korkut" },
        { start: "16:00", end: "18:00", patient: "Ozan Bilgin" },
      ]),
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    ...staffHeader("EMP-007"), role: "Nurse",
    schedules: [
      bookedDay([cl("8:30", "17:30")], 9, [ // Mon
        { start: "8:30", end: "10:00", patient: "Ceyda Aksu" },
        { start: "10:30", end: "12:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:00", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "16:30", patient: "Yasemin Kaplan" },
      ]),
      bookedDay([cl("8:30", "17:30")], 9, [ // Tue
        { start: "8:30", end: "10:30", patient: "Ceyda Aksu" },
        { start: "10:30", end: "12:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:30", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "16:30", patient: "Yasemin Kaplan" },
      ]),
      bookedDay([cl("8:30", "17:30")], 9, [ // Wed
        { start: "13:30", end: "16:00", patient: "İpek Sarıkaya" },
      ]),
      { // Thu (Override)
        override: true, totalHours: 9, bookedHours: 2.5,
        blocks: [cl("8:30", "10:00"), cl("11:30", "14:00")],
        appointments: [
          { start: "10:00", end: "11:30", patient: "Patient" },
          { start: "14:00", end: "15:00", patient: "Patient" }
        ],
        summary: "Available: 9h · Booked: 2.5h · Remaining: 6.5h (3 open slots)"
      },
      bookedDay([cl("8:30", "17:30")], 9, [ // Fri — fully booked
        { start: "8:30", end: "11:00", patient: "Ceyda Aksu" },
        { start: "11:00", end: "13:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:30", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "17:30", patient: "Yasemin Kaplan" },
      ]),
      { off: true }, // Sat
      { off: true }, // Sun
    ]
  },
  {
    ...staffHeader("EMP-008"), role: "Nurse",
    schedules: [
      bookedDay([cl("9:00", "17:00")], 8, [ // Mon
        { start: "9:00", end: "10:30", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "15:30", patient: "Hakan Bulut" },
      ]),
      bookedDay([cl("9:00", "17:00")], 8, [ // Tue
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "16:00", patient: "Hakan Bulut" },
      ]),
      bookedDay([cl("9:00", "17:00")], 8, [ // Wed
        { start: "14:00", end: "16:00", patient: "Aslı Kutlu" },
      ]),
      { onLeave: true }, // Thu - On Leave
      bookedDay([cl("9:00", "17:00")], 8, [ // Fri — fully booked
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Hakan Bulut" },
        { start: "15:00", end: "17:00", patient: "Aslı Kutlu" },
      ]),
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

// Shared with both the per-cell popover and the full-week detail modal below,
// so "click one day" and "click the whole week" render the exact same
// availability/appointments/summary layout instead of two drifting copies.
function DayDetailBody({ staff, day, currentUserRole }: { staff: StaffMember; day: DaySchedule; currentUserRole: string }) {
  return (
    <>
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Scheduled Availability</h4>
        <div className="space-y-2">
          {availabilityWindows(day.blocks).map((w, idx) => (
            <div key={idx} className="flex items-center text-sm font-semibold text-gray-800">
              <div className="w-2 h-2 rounded-full mr-2 bg-emerald-500" />
              {w.start} – {w.end}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100 last:border-b-0">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Booked Appointments</h4>
        <div className="space-y-2">
          {(!day.appointments || day.appointments.length === 0) ? (
            <div className="text-sm text-gray-500 italic">No appointments booked</div>
          ) : (
            day.appointments.map((appt, idx) => {
              // Patient Privacy Masking
              const isOwnPatient = staff.name.includes("Ebru"); // Mock logic
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

      {day.summary && (
        <div className="p-4 bg-gray-50 text-xs space-y-1">
          <div className="font-medium text-gray-700">{day.summary}</div>
        </div>
      )}
    </>
  );
}

// Centered modal (not a route, not a side panel — per explicit request) that
// opens when a staff member's name/avatar is clicked, showing their whole
// week's availability at a glance instead of one day at a time.
function StaffDetailModal({ staff, onClose, currentUserRole }: { staff: StaffMember; onClose: () => void; currentUserRole: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mr-3 ring-2 ring-offset-1 ${staff.role === 'Clinician' ? 'bg-blue-500 ring-blue-200' : 'bg-emerald-500 ring-emerald-200'}`}>
              {staff.avatar}
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">{staff.name}</div>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded ${staff.role === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {staff.role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {staff.schedules.map((day, i) => (
            <div key={i} className={`px-5 py-4 ${i === TODAY_INDEX ? 'bg-slate-50/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">{WEEK_DAYS[i].full}</span>
                {i === TODAY_INDEX && (
                  <span className="px-1.5 py-0.5 bg-slate-700 text-white text-[9px] font-bold uppercase tracking-wider rounded">Today</span>
                )}
              </div>
              {day.off ? (
                <div className="text-sm font-medium text-gray-400">Day Off</div>
              ) : day.onLeave ? (
                <div className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> On Leave — All Day
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <DayDetailBody staff={staff} day={day} currentUserRole={currentUserRole} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The three "whole-day" cell states — Day Off, On Leave, Fully Booked — each
// render as one soft-tinted block filling the cell with centred black text,
// so they read as a clear status at a glance rather than as data to parse.
function StatusBlock({ tone, label, sub, medium }: { tone: "gray" | "red" | "orange"; label: string; sub?: string; medium?: boolean }) {
  const bg = tone === "red" ? "bg-red-100" : tone === "orange" ? "bg-orange-100" : "bg-gray-100";
  return (
    <div className={`h-full min-h-[80px] rounded-lg ${bg} flex flex-col items-center justify-center text-center px-2`}>
      <span className={`text-gray-900 text-sm leading-tight ${medium ? "font-medium" : "font-bold"}`}>{label}</span>
      {sub && <span className="text-gray-900 text-xs font-bold mt-0.5">{sub}</span>}
    </div>
  );
}

// Every staff member fits within the picker's own 6-person compare limit
// (4 clinicians + 2 nurses), so defaulting to everyone selected shows the
// full team's availability the moment the page loads — no empty landing
// state to click through first.
const ALL_STAFF_IDS = ALL_STAFF.map((s) => s.id);

export function TeamAvailability() {
  const { role: currentUserRole } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<string[]>(ALL_STAFF_IDS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [weekLabel, setWeekLabel] = useState("30 Jun – 6 Jul 2026");
  
  // Popover State
  const [popover, setPopover] = useState<{
    staff: StaffMember, day: DaySchedule, dateStr: string, x: number, y: number
  } | null>(null);

  // Full-week detail modal — opened from a staff member's name/avatar,
  // separate from the per-day popover above.
  const [detailStaff, setDetailStaff] = useState<StaffMember | null>(null);

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

  // One comfortable row height for every staff row — the main area scrolls,
  // so there's no need to crush rows to fit more people without scrolling.
  const rowHeightClass = "min-h-[112px]";

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
      <div className="px-8 py-3.5 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0 bg-white">
        
        {/* Left: Navigator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm relative">
            <button className="pl-3 pr-2 py-2 hover:bg-gray-50 rounded-l-full text-gray-500 hover:text-gray-700 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 text-sm font-bold text-gray-800 whitespace-nowrap tabular-nums">{weekLabel}</span>
            <button className="px-2 py-2 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="pl-2 pr-3 py-2 hover:bg-gray-50 rounded-r-full border-l border-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <Calendar className="w-4 h-4" />
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
          <button onClick={() => setWeekLabel("30 Jun – 6 Jul 2026")} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            Today
          </button>
        </div>

        {/* Center: Staff Picker */}
        <div className="relative" ref={pickerRef}>
          <div
            onClick={() => setPickerOpen(true)}
            className="w-[460px] min-h-[42px] border border-gray-200 bg-white rounded-xl shadow-sm flex items-center px-2.5 cursor-text transition-colors hover:border-gray-300 relative"
          >
            {selectedStaff.length === 0 ? (
              <span className="text-sm text-gray-400 pl-2">Add staff to compare...</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 py-1.5 w-[420px]">
                {selectedStaff.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 rounded-full pl-1 pr-1.5 py-1 border border-gray-200 bg-gray-50">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ${s.role === 'Clinician' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                      {s.avatar}
                    </div>
                    <span className="text-xs font-bold text-gray-700 truncate max-w-[90px]">{s.name.split(' ').pop()}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleStaff(s.id); }} className="hover:bg-gray-200 rounded-full p-0.5 text-gray-400 hover:text-gray-700">
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
                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold rounded-full">Clinician</span>
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
                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold rounded-full">Nurse</span>
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
          <button onClick={handleAllClinicians} className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors">
            All Clinicians
          </button>
          <button onClick={handleAllNurses} className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors">
            All Nurses
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <button onClick={handleClear} className="px-3.5 py-2 text-xs font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-0 bg-white relative">
        
        {selectedIds.length === 0 ? (
          // Everyone starts selected on page load (see ALL_STAFF_IDS above),
          // so this only shows if the team is manually cleared — a plain,
          // low-key fallback rather than a full landing state to click
          // through, consistent with other empty lists in this app.
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-gray-400">No staff selected. Use the picker above to add team members.</span>
          </div>
        ) : (
          // Grid View
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex border-b border-gray-200 bg-gray-50/60 shrink-0">
              <div className="w-[220px] shrink-0 border-r border-gray-200 flex items-center px-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Staff</span>
              </div>
              {WEEK_DAYS.map((day, i) => (
                <div key={day.label} className={`flex-1 py-3 text-center border-r border-gray-100 last:border-r-0 ${i === TODAY_INDEX ? 'bg-slate-100/70' : ''}`}>
                  <div className={`text-xs font-extrabold uppercase tracking-wider ${i === TODAY_INDEX ? 'text-slate-800' : 'text-gray-500'}`}>{day.label}</div>
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
                    {/* Left Info Col — full name, no truncation. The remove-X is
                        absolutely positioned so it never steals width from the
                        name (which would force long names onto a second line). */}
                    <div className="w-[220px] shrink-0 border-r border-gray-200 flex items-center gap-3 px-4 relative bg-white">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${staff.role === 'Clinician' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                        {staff.avatar}
                      </div>
                      <button
                        onClick={() => setDetailStaff(staff)}
                        title={`View ${staff.name}'s availability`}
                        className="min-w-0 flex-1 text-left pr-2 group/name"
                      >
                        <div className="text-sm font-bold text-gray-800 leading-tight group-hover/name:underline">{staff.name}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          {staff.role}
                        </span>
                      </button>
                      <button onClick={() => toggleStaff(staff.id)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day Cells */}
                    {staff.schedules.map((day, i) => {
                      const isToday = i === TODAY_INDEX;
                      const totalHrs = day.totalHours || 8;
                      const bookedHrs = day.bookedHours || 0;
                      const freeHrs = Math.round((totalHrs - bookedHrs) * 10) / 10;
                      const pct = totalHrs > 0 ? bookedHrs / totalHrs : 0;
                      const isFullyBooked = !!day.blocks && pct >= 1;

                      let cellContent: React.ReactNode = null;
                      if (day.off) {
                        cellContent = <StatusBlock tone="gray" label="Day Off" medium />;
                      } else if (day.onLeave) {
                        cellContent = <StatusBlock tone="red" label="ON LEAVE" sub="All Day" />;
                      } else if (isFullyBooked) {
                        cellContent = <StatusBlock tone="orange" label="Fully Booked" />;
                      } else if (day.blocks) {
                        const freeColor = pct > 0.7 ? "text-red-600" : pct >= 0.3 ? "text-amber-600" : "text-emerald-600";
                        cellContent = (
                          <div className="h-full flex flex-col justify-center gap-2">
                            <div className="flex items-center justify-between px-0.5">
                              <span className={`text-[11px] font-bold ${freeColor}`}>{freeHrs}h free</span>
                              {day.override && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">OVERRIDE</span>
                              )}
                            </div>
                            {availabilityWindows(day.blocks).map((w, wi) => (
                              <div key={wi} className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 text-center">
                                <span className="text-xs font-bold text-slate-700 tabular-nums">{w.start} – {w.end}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      const interactive = !day.off && !day.onLeave;
                      return (
                        <div
                          key={i}
                          onClick={(e) => handleCellClick(e, staff, day, WEEK_DAYS[i].full)}
                          className={`flex-1 border-r border-gray-100 last:border-r-0 p-2 ${isToday ? "bg-slate-50/40" : ""} ${interactive ? "cursor-pointer hover:bg-slate-100/40 transition-colors" : ""}`}
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
          {/* Header & Staff info */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="font-bold text-sm text-gray-800 mb-1">{popover.staff.name} · {popover.dateStr}</div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${popover.staff.role === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {popover.staff.role}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-b-lg">
            <DayDetailBody staff={popover.staff} day={popover.day} currentUserRole={currentUserRole} />
          </div>
        </div>
      )}

      {detailStaff && (
        <StaffDetailModal staff={detailStaff} onClose={() => setDetailStaff(null)} currentUserRole={currentUserRole} />
      )}

    </div>
  );
}
