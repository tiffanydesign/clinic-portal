// People tab data: staff weekly schedules (mirrors the old Team Availability
// page's mock model), migrated to feed the shared AvailabilityGrid. Only
// addition vs. the old model is `blockedTime` — the page's spec calls for a
// Blocked Time visual that the old mock never had data for; this is an
// additive mock enrichment, not a change to any real availability data model
// (the separate self-service `availability/availabilityStore.ts` feature is
// untouched and unrelated).
import React from "react";
import { getStaff } from "../staff/staffData";
import type { GridCell, GridRow, OverrideDetail } from "./types";

export type SlotType = "Clinic" | "Video";
export type AvailabilityBlock = { start: string; end: string; type: SlotType };
export type Appointment = { start: string; end: string; patient: string };
export type BlockedTimeEntry = { start: string; end: string; reason: string };

export type DaySchedule = {
  off?: boolean;
  onLeave?: boolean;
  override?: OverrideDetail;
  blocks?: AvailabilityBlock[];
  appointments?: Appointment[];
  blockedTime?: BlockedTimeEntry[];
  totalHours?: number;
  bookedHours?: number;
};

export type StaffMember = {
  id: string;
  name: string;
  role: "Clinician" | "Nurse";
  avatar: string;
  schedules: DaySchedule[]; // Index 0-6, Mon-Sun
};

const cl = (start: string, end: string): AvailabilityBlock => ({ start, end, type: "Clinic" });
const vi = (start: string, end: string): AvailabilityBlock => ({ start, end, type: "Video" });

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmtMin(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
}

function bookedDay(blocks: AvailabilityBlock[], totalHours: number, appointments: Appointment[], blockedTime?: BlockedTimeEntry[]): DaySchedule {
  const bookedHours = Math.round(appointments.reduce((sum, a) => sum + (toMin(a.end) - toMin(a.start)) / 60, 0) * 100) / 100;
  return { blocks, totalHours, bookedHours, appointments, blockedTime };
}

// Overlapping/touching blocks collapse into continuous availability windows
// (a 9-17 window containing a 10-16 video window reads as one span, not two).
function availabilityWindows(blocks?: AvailabilityBlock[]): { start: string; end: string }[] {
  if (!blocks || blocks.length === 0) return [];
  const ranges = blocks.map((b) => [toMin(b.start), toMin(b.end)] as [number, number]).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged.map(([s, e]) => ({ start: fmtMin(s), end: fmtMin(e) }));
}

function staffHeader(empId: string): { id: string; name: string; avatar: string } {
  const s = getStaff(empId);
  if (!s) throw new Error(`Unknown staff id in peopleAvailabilityData: ${empId}`);
  return { id: s.id, name: s.name, avatar: s.avatar };
}

export const ALL_STAFF: StaffMember[] = [
  {
    ...staffHeader("EMP-003"), role: "Clinician",
    schedules: [
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [
        { start: "9:00", end: "10:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "12:30", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "14:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "16:30", patient: "Sena Yavuz" },
      ]),
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [
        { start: "9:00", end: "10:30", patient: "Ece Yıldırım" },
        { start: "10:30", end: "12:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "16:30", patient: "Sena Yavuz" },
      ]),
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [
        { start: "10:00", end: "11:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "15:00", patient: "Sena Yavuz" },
      ], [{ start: "11:00", end: "11:30", reason: "Admin time" }]),
      {
        totalHours: 8, bookedHours: 3.5,
        blocks: [cl("9:00", "17:00"), vi("10:00", "16:00")],
        appointments: [
          { start: "10:00", end: "11:00", patient: "Ece Yıldırım" },
          { start: "14:00", end: "15:30", patient: "Aslı Kutlu" },
          { start: "16:00", end: "17:00", patient: "Tarkan Solmaz" },
        ],
      },
      bookedDay([cl("9:00", "17:00"), vi("10:00", "16:00")], 8, [
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Yasemin Kaplan" },
        { start: "15:00", end: "17:00", patient: "Sena Yavuz" },
      ]),
      { off: true },
      { off: true },
    ],
  },
  {
    ...staffHeader("EMP-004"), role: "Clinician",
    schedules: [
      bookedDay([cl("8:00", "16:00")], 8, [
        { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
        { start: "11:00", end: "12:30", patient: "Hakan Bulut" },
        { start: "13:00", end: "14:00", patient: "Serkan Çetin" },
      ]),
      bookedDay([cl("8:00", "16:00"), vi("9:00", "12:00")], 8, [
        { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
        { start: "9:30", end: "11:00", patient: "Hakan Bulut" },
        { start: "11:00", end: "13:00", patient: "Serkan Çetin" },
        { start: "13:00", end: "14:00", patient: "Derya Toprak" },
      ]),
      bookedDay([cl("8:00", "16:00")], 8, [
        { start: "10:00", end: "11:30", patient: "Derya Toprak" },
      ]),
      {
        totalHours: 8, bookedHours: 3,
        blocks: [cl("8:00", "16:00"), vi("9:00", "12:00")],
        appointments: [
          { start: "8:00", end: "9:30", patient: "Gül Korkmaz" },
          { start: "11:00", end: "12:00", patient: "Hakan Bulut" },
          { start: "13:00", end: "14:00", patient: "Serkan Çetin" },
        ],
      },
      { off: true },
      { off: true },
      { off: true },
    ],
  },
  {
    ...staffHeader("EMP-005"), role: "Clinician",
    schedules: [
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [
        { start: "9:00", end: "10:30", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
        { start: "14:00", end: "15:30", patient: "Umut Erdem" },
        { start: "16:00", end: "17:00", patient: "Volkan Turan" },
      ]),
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [
        { start: "9:00", end: "10:30", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:30", patient: "Cem Polat" },
        { start: "14:00", end: "16:00", patient: "Umut Erdem" },
        { start: "16:00", end: "17:00", patient: "Volkan Turan" },
      ]),
      bookedDay([cl("9:00", "18:00"), vi("14:00", "17:00")], 9, [
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
      ]),
      {
        override: { by: "Ayşe Hançer (Admin)", at: "Mon, 30 Jun · 08:12", reason: "Shortened to a half-day per clinician request (personal appointment)." },
        totalHours: 3, bookedHours: 1,
        blocks: [cl("9:00", "12:00")],
        appointments: [{ start: "9:00", end: "10:00", patient: "Burak Kocaman" }],
      },
      bookedDay([cl("9:00", "18:00")], 9, [
        { start: "9:00", end: "11:00", patient: "Burak Kocaman" },
        { start: "11:00", end: "13:00", patient: "Cem Polat" },
        { start: "13:00", end: "15:30", patient: "Umut Erdem" },
        { start: "15:30", end: "18:00", patient: "Volkan Turan" },
      ]),
      { off: true },
      { off: true },
    ],
  },
  {
    ...staffHeader("EMP-006"), role: "Clinician",
    schedules: [
      bookedDay([cl("10:00", "18:00")], 8, [
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "15:00", end: "16:30", patient: "Defne Korkut" },
      ]),
      bookedDay([cl("10:00", "18:00")], 8, [
        { start: "11:00", end: "13:00", patient: "Ozan Bilgin" },
      ]),
      bookedDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8, [
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "14:00", end: "16:00", patient: "Defne Korkut" },
        { start: "16:00", end: "16:30", patient: "Ozan Bilgin" },
      ]),
      bookedDay([cl("10:00", "18:00")], 8, [
        { start: "10:00", end: "11:30", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "15:00", end: "15:30", patient: "Defne Korkut" },
      ]),
      bookedDay([cl("10:00", "18:00"), vi("13:00", "17:00")], 8, [
        { start: "10:00", end: "12:00", patient: "Barış Güneş" },
        { start: "12:00", end: "14:00", patient: "Nazlı Çakır" },
        { start: "14:00", end: "16:00", patient: "Defne Korkut" },
        { start: "16:00", end: "18:00", patient: "Ozan Bilgin" },
      ]),
      { off: true },
      { off: true },
    ],
  },
  {
    ...staffHeader("EMP-007"), role: "Nurse",
    schedules: [
      bookedDay([cl("8:30", "17:30")], 9, [
        { start: "8:30", end: "10:00", patient: "Ceyda Aksu" },
        { start: "10:30", end: "12:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:00", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "16:30", patient: "Yasemin Kaplan" },
      ]),
      bookedDay([cl("8:30", "17:30")], 9, [
        { start: "8:30", end: "10:30", patient: "Ceyda Aksu" },
        { start: "10:30", end: "12:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:30", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "16:30", patient: "Yasemin Kaplan" },
      ]),
      bookedDay([cl("8:30", "17:30")], 9, [
        { start: "13:30", end: "16:00", patient: "İpek Sarıkaya" },
      ], [{ start: "10:00", end: "10:30", reason: "Supply restock" }]),
      {
        override: { by: "Berna Koç", at: "Wed, 1 Jul · 17:40", reason: "Traded a shift block with a colleague — approved by Admin." },
        totalHours: 9, bookedHours: 2.5,
        blocks: [cl("8:30", "10:00"), cl("11:30", "14:00")],
        appointments: [
          { start: "10:00", end: "11:30", patient: "Patient" },
          { start: "14:00", end: "15:00", patient: "Patient" },
        ],
      },
      bookedDay([cl("8:30", "17:30")], 9, [
        { start: "8:30", end: "11:00", patient: "Ceyda Aksu" },
        { start: "11:00", end: "13:30", patient: "Emir Tekin" },
        { start: "13:30", end: "15:30", patient: "İpek Sarıkaya" },
        { start: "15:30", end: "17:30", patient: "Yasemin Kaplan" },
      ]),
      { off: true },
      { off: true },
    ],
  },
  {
    ...staffHeader("EMP-008"), role: "Nurse",
    schedules: [
      bookedDay([cl("9:00", "17:00")], 8, [
        { start: "9:00", end: "10:30", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "15:30", patient: "Hakan Bulut" },
      ]),
      bookedDay([cl("9:00", "17:00")], 8, [
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "14:00", end: "16:00", patient: "Hakan Bulut" },
      ]),
      bookedDay([cl("9:00", "17:00")], 8, [
        { start: "14:00", end: "16:00", patient: "Aslı Kutlu" },
      ]),
      { onLeave: true },
      bookedDay([cl("9:00", "17:00")], 8, [
        { start: "9:00", end: "11:00", patient: "Ece Yıldırım" },
        { start: "11:00", end: "13:00", patient: "Tarkan Solmaz" },
        { start: "13:00", end: "15:00", patient: "Hakan Bulut" },
        { start: "15:00", end: "17:00", patient: "Aslı Kutlu" },
      ]),
      { off: true },
      { off: true },
    ],
  },
];

export const ALL_STAFF_IDS = ALL_STAFF.map((s) => s.id);

function blockedHours(blockedTime?: BlockedTimeEntry[]): number {
  return (blockedTime ?? []).reduce((sum, b) => sum + (toMin(b.end) - toMin(b.start)) / 60, 0);
}

function abbreviateReason(reason: string): string {
  return `Blocked · ${reason}`;
}

function dayToCell(day: DaySchedule, onClick: (e: React.MouseEvent) => void): GridCell {
  if (day.off) return { status: "off" };
  if (day.onLeave) return { status: "leave" };

  const totalHours = day.totalHours ?? 8;
  const bookedHrs = day.bookedHours ?? 0;
  const blockedHrs = blockedHours(day.blockedTime);
  const freeHours = Math.max(0, Math.round((totalHours - bookedHrs - blockedHrs) * 10) / 10);
  const freeRatio = totalHours > 0 ? freeHours / totalHours : 0;

  if (day.blocks && bookedHrs + blockedHrs >= totalHours) {
    return { status: "full", override: day.override, onClick };
  }

  return {
    status: "normal",
    freeRatio,
    freeHours,
    freeLabel: `${freeHours}h free`,
    lines: availabilityWindows(day.blocks).map((w) => `${w.start} – ${w.end}`),
    override: day.override,
    blocked: day.blockedTime?.map((b) => ({ label: `${abbreviateReason(b.reason)} · ${b.start}–${b.end}` })),
    onClick,
  };
}

function RowHeader({ staff }: { staff: StaffMember }) {
  return (
    <div className="min-w-0 flex-1 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
        {staff.avatar}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-800 leading-tight truncate">{staff.name}</div>
        <span className="text-[11px] font-medium text-gray-400">{staff.role}</span>
      </div>
    </div>
  );
}

// Builds one GridRow per selected staff member, grouped by role (Clinicians,
// then Nurses) so the shared grid's group-header rendering kicks in.
// `onDayClick` receives the staff member + day index + click event, so the
// page can position the existing per-day detail popover exactly as before.
export function buildPeopleRows(
  staff: StaffMember[],
  onDayClick: (staff: StaffMember, dayIndex: number, e: React.MouseEvent) => void
): GridRow[] {
  const ordered = [...staff].sort((a, b) => (a.role === b.role ? 0 : a.role === "Clinician" ? -1 : 1));
  return ordered.map((s) => ({
    id: s.id,
    groupLabel: s.role === "Clinician" ? "Clinicians" : "Nurses",
    header: <RowHeader staff={s} />,
    cells: s.schedules.map((day, i) => dayToCell(day, (e) => onDayClick(s, i, e))),
  }));
}
