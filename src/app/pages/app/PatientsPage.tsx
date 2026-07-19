import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Search, ChevronDown, Download, Plus, MoreHorizontal, FileText, Phone, Mail, UserPlus, X, Filter, Check, ArrowRight,
  Users, UserCheck, UserX, Clock, CalendarCheck, CalendarClock, FlaskConical, Activity, type LucideIcon,
} from "lucide-react";
import { Stat, StatStripGroup, type StatIconTone } from "../../components/stat";
import { toast } from "sonner";
import { useAppContext, Role } from "../../context/AppContext";
import { FilterSelect } from "../../components/FilterSelect";
import { MOCK_PATIENTS, Patient, ageSexLabel } from "./patientsData";
import { usePatients } from "./patientsStore";
import { RegisterPatientModal } from "./patients/RegisterPatientModal";
import { NewAppointmentModal } from "./calendar/CreateModals";
import { addAppointment } from "./dashboard/appointmentsStore";
import { primaryApptForPatient } from "./dashboard/dashboardData";
import { useAppointments } from "./dashboard/appointmentsStore";
import { JourneyProgressChip } from "./dashboard/journey/JourneyProgress";
import { MOCK_STAFF } from "./staff/staffData";

export type { Patient };
export { MOCK_PATIENTS };

const CLINICIAN_NAME_OPTIONS = ["Assigned Clinician: All", ...MOCK_STAFF.filter((s) => s.role === "Clinician").map((s) => s.name)];
const NURSE_NAME_OPTIONS = ["Assigned Nurse: All", ...MOCK_STAFF.filter((s) => s.role === "Nurse").map((s) => s.name)];

// Per-role summary rendered through the Stat family's T3 `strip` tier. These
// are `count` semantics — a roster snapshot with no period switcher behind it
// — so per the family's discipline they may never become T1 cards.
type StripItem = {
  id: string;
  value: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  tone: StatIconTone;
  alert?: boolean;
};

function KpiStrip({ items }: { items: StripItem[] }) {
  return (
    <div className="px-8 py-4 shrink-0">
      <StatStripGroup>
        {items.map((s) => (
          <Stat
            key={s.id}
            stat={{ id: s.id, label: s.label, kind: "count", variant: "strip", value: s.value, suffix: s.sub, alert: s.alert }}
            icon={s.icon}
            iconTone={s.tone}
          />
        ))}
      </StatStripGroup>
    </div>
  );
}

export function PatientsPage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const appts = useAppointments();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allPatients = usePatients();
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  // Seeds the register form from the search box ("Register '{term}' as new patient").
  const [registerPrefill, setRegisterPrefill] = useState("");
  // Set when the operator picks "Book first appointment" on the success step —
  // closes registration and hands the new patient straight to the booking flow.
  const [bookFor, setBookFor] = useState<Patient | null>(null);

  const openRegister = (prefill = "") => { setRegisterPrefill(prefill); setShowNewPatientModal(true); };
  const [statusFilter, setStatusFilter] = useState("Status: All");
  // Deep-link support (see the Staff Overview page's stat tiles): ?clinician=
  // or ?nurse= (by display name — see patientsData.ts's Patient.clinician/
  // .nurse fields) pre-selects that person in the matching filter dropdown.
  const [clinicianFilter, setClinicianFilter] = useState(searchParams.get("clinician") ?? "Assigned Clinician: All");
  const [nurseFilter, setNurseFilter] = useState(searchParams.get("nurse") ?? "Assigned Nurse: All");
  const [groupFilter, setGroupFilter] = useState("Group: All");
  const [consentFilter, setConsentFilter] = useState("Consent: All");
  const [paymentFilter, setPaymentFilter] = useState("Payment: All");
  const [reviewFilter, setReviewFilter] = useState("Review Status: All");
  const [flagFilter, setFlagFilter] = useState("Flag: All");
  const [nextApptFilter, setNextApptFilter] = useState("Next Appt: All");
  const [journeyFilter, setJourneyFilter] = useState("Journey Status: All");

  // Filters based on Role. Reads the live registry (not the static
  // MOCK_PATIENTS array) so a patient registered a second ago is immediately
  // searchable here.
  let patients: Patient[] = allPatients;
  if (role === 'Clinician') patients = patients.filter(p => p.clinician === "Dr. Ebru Reis");
  if (role === 'Nurse') patients = patients.filter(p => p.nurse === "Berna Koç" && p.nextAppt?.includes("3 Jul"));
  if (role === 'Admin') {
    if (clinicianFilter !== "Assigned Clinician: All") patients = patients.filter(p => p.clinician === clinicianFilter);
    if (nurseFilter !== "Assigned Nurse: All") patients = patients.filter(p => p.nurse === nurseFilter);
  }

  if (search) {
    patients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.patientId.toLowerCase().includes(search.toLowerCase()));
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === patients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(patients.map(p => p.id)));
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const Header = () => {
    const titles = {
      Admin: { title: "Patients", sub: "All clinic patients" },
      Reception: { title: "Patients", sub: "Patient check-in and registration" },
      Clinician: { title: "My Patients", sub: "Patients assigned to you" },
      Nurse: { title: "My Patients", sub: "Patients assigned to you today" },
    };
    const t = titles[role];

    return (
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.sub}</p>
        </div>
        <div className="flex space-x-3">
          {role === 'Admin' && (
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2 text-gray-500" /> Export
            </button>
          )}
          {/* Admin + Reception only — Nurse/Clinician never see a register entry. */}
          {(role === 'Admin' || role === 'Reception') && (
            <button
              onClick={() => openRegister()}
              className="flex items-center min-h-11 px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Register Patient
            </button>
          )}
        </div>
      </div>
    );
  };

  const Toolbar = () => {
    if (role === 'Admin') return (
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, email..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["Status: All", "Active", "Inactive", "New", "Pending Onboarding"]} />
        <FilterSelect value={clinicianFilter} onChange={setClinicianFilter} options={CLINICIAN_NAME_OPTIONS} />
        <FilterSelect value={nurseFilter} onChange={setNurseFilter} options={NURSE_NAME_OPTIONS} />
        <FilterSelect value={groupFilter} onChange={setGroupFilter} options={["Group: All", "VIP", "Corporate", "Insurance", "Walk-in"]} />
      </div>
    );

    if (role === 'Reception') return (
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, appt..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
          <button className="px-4 py-1 text-sm font-medium rounded text-gray-500 hover:text-gray-700">All Patients</button>
          <button className="px-4 py-1 text-sm font-bold rounded bg-white text-gray-800 shadow-sm">Today's Appointments</button>
          <button className="px-4 py-1 text-sm font-medium rounded text-gray-500 hover:text-gray-700">Awaiting Check-in</button>
        </div>
        <FilterSelect value={consentFilter} onChange={setConsentFilter} options={["Consent: All", "Signed", "Pending"]} />
        <FilterSelect value={paymentFilter} onChange={setPaymentFilter} options={["Payment: All", "Paid", "Unpaid"]} />
      </div>
    );

    if (role === 'Clinician') return (
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search my patients..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        <FilterSelect value={reviewFilter} onChange={setReviewFilter} options={["Review Status: All", "Results Pending Review", "Awaiting Sign-off"]} />
        <FilterSelect value={flagFilter} onChange={setFlagFilter} options={["Flag: All", "Urgent", "Follow-up"]} />
        <FilterSelect value={nextApptFilter} onChange={setNextApptFilter} options={["Next Appt: All", "This Week", "This Month"]} />
      </div>
    );

    if (role === 'Nurse') return (
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search my patients..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
          <button className="px-4 py-1 text-sm font-bold rounded bg-white text-gray-800 shadow-sm">Today's Patients</button>
          <button className="px-4 py-1 text-sm font-medium rounded text-gray-500 hover:text-gray-700">All Assigned</button>
        </div>
        <FilterSelect value={journeyFilter} onChange={setJourneyFilter} options={["Journey Status: All", "In Progress", "Awaiting Start"]} />
      </div>
    );
    return null;
  };

  const KPICards = () => {
    if (role === 'Admin') return <KpiStrip items={[
      { id: "total-patients", value: "247", label: "Total Patients", sub: "12 new this month", icon: Users, tone: "slate" },
      { id: "active-patients", value: "189", label: "Active Patients", sub: "76% of total", icon: UserCheck, tone: "emerald" },
      { id: "unassigned", value: "3", label: "Unassigned", sub: "no clinician assigned", icon: UserX, tone: "amber", alert: true },
      { id: "pending-onboarding", value: "8", label: "Pending Onboarding", sub: "registered but no first visit", icon: Clock, tone: "blue" },
    ]} />;

    if (role === 'Reception') return <KpiStrip items={[
      { id: "todays-appointments", value: "14", label: "Today's Appointments", sub: "6 checked in · 3 waiting · 5 upcoming", icon: CalendarCheck, tone: "blue" },
      { id: "awaiting-check-in", value: "3", label: "Awaiting Check-in", sub: "consent or payment pending", icon: Clock, tone: "amber" },
      { id: "new-registrations", value: "2", label: "New Registrations Today", sub: "registered today", icon: UserPlus, tone: "emerald" },
    ]} />;

    if (role === 'Clinician') return <KpiStrip items={[
      { id: "my-patients", value: String(patients.length), label: "My Patients", sub: "assigned to you", icon: Users, tone: "slate" },
      { id: "results-to-review", value: "5", label: "Results to Review", sub: "2 urgent", icon: FlaskConical, tone: "red", alert: true },
      { id: "follow-ups-due", value: "3", label: "Follow-ups Due", sub: "within next 7 days", icon: CalendarClock, tone: "blue" },
    ]} />;

    if (role === 'Nurse') return <KpiStrip items={[
      { id: "my-patients-today", value: String(patients.length), label: "My Patients Today", sub: "assigned to you today", icon: Users, tone: "slate" },
      { id: "active-journeys", value: "4", label: "Active Journeys", sub: "2 awaiting you", icon: Activity, tone: "emerald" },
    ]} />;

    return null;
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <Header />
      <Toolbar />
      <KPICards />

      {/* Table Area — grows with content; the page (AppShell) is the only
          scroll surface, so the card never grows its own inner scrollbar. */}
      <div className="px-8 pb-8 flex flex-col relative">
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm relative">
          
          {/* Bulk Actions Bar (Admin only) */}
          {selectedIds.size > 0 && role === 'Admin' && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between shrink-0 sticky top-0 z-40">
              <span className="text-sm font-bold text-blue-800">{selectedIds.size} selected</span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded shadow-sm hover:bg-blue-100">Assign Clinician</button>
                <button className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded shadow-sm hover:bg-blue-100">Assign Nurse</button>
                <button className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded shadow-sm hover:bg-blue-100">Change Group</button>
                <button className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded shadow-sm hover:bg-blue-100">Export Selected</button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold ml-2">Deselect All</button>
              </div>
            </div>
          )}

          <div className="relative">
            <table className="w-full text-left border-collapse text-sm [&_th]:!px-3 [&_td]:!px-3">
              <thead className="bg-gray-50 sticky top-0 z-30 shadow-[0_1px_0_#e5e7eb]">
                <tr>
                  {role === 'Admin' && <th className="p-4 w-[40px] border-b border-gray-200 sticky left-0 z-40 bg-gray-50 shadow-[1px_0_0_#e5e7eb]"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === patients.length && patients.length > 0} className="rounded text-slate-600 focus:ring-slate-500" /></th>}
                  <th className={`p-4 font-bold text-gray-600 border-b border-gray-200 sticky left-[${role==='Admin'?'40px':'0px'}] z-40 bg-gray-50 w-[180px] shadow-[1px_0_0_#e5e7eb] cursor-pointer hover:bg-gray-100`}>Patient</th>
                  
                  {role === 'Admin' && (
                    <>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Contact</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Age / Sex</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Group</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Assigned Clinician</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Assigned Nurse</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Status</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Last Visit</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Next Appt</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Actions</th>
                    </>
                  )}

                  {role === 'Reception' && (
                    <>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Phone</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Today's Appt</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Clinician</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Consent</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Payment</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Check-in</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Journey</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center w-[120px]">Actions</th>
                    </>
                  )}

                  {role === 'Clinician' && (
                    <>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Age / Sex</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Flag</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Review Status</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Last Visit</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Next Appt</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center">Actions</th>
                    </>
                  )}

                  {role === 'Nurse' && (
                    <>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Today's Appt</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Clinician</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Journey</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Waiting Since</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Room</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center w-[100px]">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-16 text-center text-gray-500">
                      {/* A search that finds nobody is the walk-in signal: offer to
                          register the typed name straight away. Filter-only misses
                          keep the plain message — there's no name to seed. */}
                      {search && (role === 'Admin' || role === 'Reception') ? (
                        <>
                          <div className="text-lg font-bold mb-2 text-gray-700">No patients found</div>
                          <p className="mb-5">Nobody matches “{search}”.</p>
                          <button
                            onClick={() => openRegister(search)}
                            className="inline-flex items-center gap-2 min-h-11 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-slate-400 transition-colors shadow-sm"
                          >
                            <UserPlus className="w-4 h-4 text-gray-500" /> Register “{search}” as new patient
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-bold mb-2">No patients match your criteria</div>
                          <p>Try adjusting your filters or search terms.</p>
                        </>
                      )}
                    </td>
                  </tr>
                ) : patients.map(p => {
                  const isSelected = selectedIds.has(p.id);
                  let rowBg = "bg-white hover:bg-slate-50";
                  if (isSelected) rowBg = "bg-slate-50";

                  // Reception visual cues
                  const isTodayRec = role === 'Reception' && p.nextAppt?.includes("3 Jul");
                  const hasIssueRec = role === 'Reception' && isTodayRec && (p.consent !== 'Signed' || p.payment === 'Unpaid');
                  if (isTodayRec && hasIssueRec) rowBg = "bg-red-50/50 hover:bg-red-50";

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => navigate(`/patients/${p.patientId}`)}
                      className={`cursor-pointer group relative transition-colors ${rowBg}`}
                    >
                      {role === 'Admin' && (
                        <td className="p-4 border-r border-gray-200 sticky left-0 z-10 shadow-[1px_0_0_#e5e7eb] bg-white group-hover:bg-slate-50 transition-colors w-[40px]" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(p.id, e as any)} className="rounded text-slate-600 focus:ring-slate-500" />
                        </td>
                      )}
                      
                      <td className={`p-4 border-r border-gray-200 sticky z-10 shadow-[1px_0_0_#e5e7eb] bg-white group-hover:bg-slate-50 transition-colors w-[180px] ${role === 'Admin' ? 'left-[40px]' : 'left-0'}`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3">
                            {p.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:underline">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{p.patientId}</div>
                          </div>
                        </div>
                      </td>

                      {/* --- Admin Cols --- */}
                      {role === 'Admin' && (
                        <>
                          <td className="p-4">
                            <div className="font-medium text-gray-800">{p.phone}</div>
                            <div className="text-[10px] text-gray-500">{p.email}</div>
                          </td>
                          <td className="p-4 text-gray-600 font-medium">{ageSexLabel(p)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded 
                              ${p.group === 'VIP' ? 'bg-amber-100 text-amber-800' : 
                                p.group === 'Corporate' ? 'bg-blue-100 text-blue-800' : 
                                p.group === 'Insurance' ? 'bg-emerald-100 text-emerald-800' : 
                                p.group === 'Walk-in' ? 'bg-gray-200 text-gray-700' : 'text-gray-400'}`}>
                              {p.group}
                            </span>
                          </td>
                          <td className={`p-4 font-medium ${!p.clinician ? 'text-orange-600' : 'text-gray-700'}`}>{p.clinician || 'Unassigned'}</td>
                          <td className="p-4 text-gray-600">{p.nurse || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                              ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                p.status === 'Inactive' ? 'bg-gray-50 text-gray-500 border-gray-200' : 
                                p.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-orange-50 text-orange-700 border-orange-200'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className={`p-4 ${p.lastVisit === 'Never' ? 'text-gray-400 italic' : 'text-gray-600 font-medium'}`}>{p.lastVisit}</td>
                          <td className="p-4 text-gray-600">{p.nextAppt || '—'}</td>
                          <td className="p-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toast('Open actions menu'); }} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}

                      {/* --- Reception Cols --- */}
                      {role === 'Reception' && (
                        <>
                          <td className="p-4 text-blue-600 font-medium hover:underline flex items-center pt-5">
                            <Phone className="w-3.5 h-3.5 mr-1" /> {p.phone}
                          </td>
                          <td className="p-4 font-bold text-gray-800">{isTodayRec ? p.nextAppt : '—'}</td>
                          <td className="p-4 text-gray-600">{p.clinician}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border flex items-center w-max
                              ${p.consent === 'Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                p.consent === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                p.consent === 'Not Sent' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-400 border-gray-200'}`}>
                              {p.consent === 'Signed' && <Check className="w-3 h-3 mr-1" />}
                              {p.consent}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border flex items-center w-max
                              ${p.payment === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                p.payment === 'Partial' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                p.payment === 'Unpaid' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-400 border-gray-200'}`}>
                              {p.payment === 'Paid' && <Check className="w-3 h-3 mr-1" />}
                              {p.payment}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border flex items-center w-max
                              ${p.checkIn === 'Checked In' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                p.checkIn === 'Waiting' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                p.checkIn === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-400 border-transparent'}`}>
                              {p.checkIn}
                            </span>
                          </td>
                          <td className="p-4">
                            {p.journeyStep ? (
                              <div className="text-xs text-gray-600 font-medium">Consent → <span className="font-bold text-gray-800">{p.journeyStep}</span></div>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="p-4 text-center">
                            {p.checkIn === 'Waiting' && p.consent === 'Signed' && p.payment === 'Paid' && (
                              <button onClick={e => { e.stopPropagation(); toast('Checked in'); }} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-emerald-700">Check In</button>
                            )}
                            {p.checkIn === 'Waiting' && (p.consent !== 'Signed' || p.payment !== 'Paid') && (
                              <button onClick={e => e.stopPropagation()} className="px-3 py-1.5 bg-gray-200 text-gray-400 text-[10px] font-bold rounded cursor-not-allowed" title="Complete consent and payment first">Check In</button>
                            )}
                            {p.checkIn === 'Checked In' && (
                              <button onClick={e => { e.stopPropagation(); toast('Checked out'); }} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-blue-700">Check Out</button>
                            )}
                            {p.checkIn !== 'Waiting' && p.checkIn !== 'Checked In' && <span className="text-gray-400">—</span>}
                          </td>
                        </>
                      )}

                      {/* --- Clinician Cols --- */}
                      {role === 'Clinician' && (
                        <>
                          <td className="p-4 text-gray-600 font-medium">{ageSexLabel(p)}</td>
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            {p.flag === 'Urgent' && <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center cursor-pointer"><div className="w-2.5 h-2.5 bg-red-600 rounded-full" /></div>}
                            {p.flag === 'Follow-up' && <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center cursor-pointer"><div className="w-2.5 h-2.5 bg-orange-500 rounded-full" /></div>}
                            {p.flag === 'Watch' && <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center cursor-pointer"><div className="w-2.5 h-2.5 bg-amber-400 rounded-full" /></div>}
                            {p.flag === 'No flag' && <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300" />}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                              ${p.reviewStatus === 'Results Pending' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                p.reviewStatus === 'Awaiting Sign-off' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                p.reviewStatus === 'Follow-up Due' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              {p.reviewStatus}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 font-medium">{p.lastVisit}</td>
                          <td className="p-4">
                            {p.nextAppt ? (
                              <div>
                                <div className="font-bold text-gray-800">{p.nextAppt}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">in 2 days</div>
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toast('Open actions menu'); }} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}

                      {/* --- Nurse Cols --- */}
                      {role === 'Nurse' && (
                        <>
                          <td className="p-4 font-bold text-gray-800">{p.nextAppt}</td>
                          <td className="p-4 text-gray-600 font-medium">{p.clinician}</td>
                          <td className="p-4">
                            {(() => {
                              const appt = primaryApptForPatient(appts, p.patientId);
                              return appt ? <JourneyProgressChip appt={appt} /> : <span className="text-gray-400">—</span>;
                            })()}
                          </td>
                          <td className="p-4 font-bold text-orange-600">12 min</td>
                          <td className="p-4 text-gray-600 font-medium">Room 3</td>
                          <td className="p-4 text-center">
                            <button onClick={e => { e.stopPropagation(); toast('Action clicked'); }} className="px-3 py-1.5 bg-slate-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-slate-700">Continue</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination */}
          {patients.length > 0 && (
            <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="text-xs text-gray-500 font-medium">Showing 1–{patients.length} of {patients.length} patients</div>
              <div className="flex items-center space-x-1">
                <button className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-gray-700 border border-transparent hover:bg-gray-200 rounded transition-colors" disabled>Previous</button>
                <button className="px-2 py-1 text-xs font-bold text-slate-600 border border-slate-300 bg-gray-50 rounded shadow-sm">1</button>
                <button className="px-2 py-1 text-xs font-bold text-gray-600 hover:text-gray-800 border border-transparent hover:bg-gray-200 rounded transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Patient — the shared 2-step form (patients/RegisterPatientModal),
          same component the Reception dashboard and the booking flow use. */}
      {showNewPatientModal && (
        <RegisterPatientModal
          prefillName={registerPrefill}
          onClose={() => { setShowNewPatientModal(false); setRegisterPrefill(""); }}
          onBookFirst={(p) => setBookFor(p)}
        />
      )}

      {/* Walk-in closure: "Book first appointment" hands the just-registered
          patient straight to the existing booking flow, already selected. */}
      {bookFor && (
        <NewAppointmentModal
          onClose={() => setBookFor(null)}
          onCreate={(a) => { addAppointment(a); setBookFor(null); }}
          currentAppts={appts}
          defaults={{ patientName: bookFor.name }}
        />
      )}
    </div>
  );
}
