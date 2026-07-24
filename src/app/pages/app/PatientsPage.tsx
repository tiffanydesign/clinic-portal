import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Search, ChevronDown, Download, Plus, FileText, Phone, Mail, UserPlus, X, Filter, Check, ArrowRight,
  Users, UserCheck, UserX, Clock, CalendarCheck, CalendarClock, FlaskConical, Activity, Flag, AlertTriangle, Eye, type LucideIcon,
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
import { Input } from "../../components/ui/input";
import { PageTitleIcon, PAGE_TITLE_CLASS } from "../../components/PageTitleIcon";

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
  // When set, the strip item becomes a quick-filter toggle for the table
  // below (SaaS pattern: click "5 Results to Review" to filter to those 5).
  onClick?: () => void;
  active?: boolean;
};

function KpiStrip({ items }: { items: StripItem[] }) {
  return (
    <div className="px-4 py-4 shrink-0">
      <StatStripGroup>
        {items.map((s) => (
          <Stat
            key={s.id}
            stat={{ id: s.id, label: s.label, kind: "count", variant: "strip", value: s.value, suffix: s.sub, alert: s.alert, onClick: s.onClick }}
            icon={s.icon}
            iconTone={s.tone}
            active={s.active}
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
  // Clinician quick-filter driven by the KPI strip: clicking a stat card
  // ("Results to Review" / "Follow-ups Due") filters the table to those rows.
  const [quickFilter, setQuickFilter] = useState<null | "review" | "followup">(null);

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

  // KPI quick-filter (Clinician): the "Results to Review" / "Follow-ups Due"
  // cards act as one-click filters onto the table below.
  if (role === 'Clinician' && quickFilter) {
    patients = patients.filter(p =>
      quickFilter === 'review'
        ? (p.reviewStatus === 'Results Pending' || p.reviewStatus === 'Awaiting Sign-off')
        : p.reviewStatus === 'Follow-up Due'
    );
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
      <div className="bg-surface border-b border-divider px-4 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <PageTitleIcon icon={Users} />
          <div>
            <h1 className={PAGE_TITLE_CLASS}>{t.title}</h1>
            <p className="text-sm text-ink-muted mt-1">{t.sub}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {role === 'Admin' && (
            <button className="flex items-center px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2 text-ink-muted" /> Export
            </button>
          )}
          {/* Admin + Reception only — Nurse/Clinician never see a register entry. */}
          {(role === 'Admin' || role === 'Reception') && (
            <button
              onClick={() => openRegister()}
              className="inline-flex items-center gap-2 h-9 px-3.5 btn-primary rounded-control text-sm font-bold transition-colors"
            >
              <UserPlus className="w-4 h-4" /> New Patient
            </button>
          )}
        </div>
      </div>
    );
  };

  const Toolbar = () => {
    if (role === 'Admin') return (
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, email..." className="pl-9 focus:border-info shadow-sm" />
        </div>
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["Status: All", "Active", "Inactive", "New", "Pending Onboarding"]} />
        <FilterSelect value={clinicianFilter} onChange={setClinicianFilter} options={CLINICIAN_NAME_OPTIONS} />
        <FilterSelect value={nurseFilter} onChange={setNurseFilter} options={NURSE_NAME_OPTIONS} />
        <FilterSelect value={groupFilter} onChange={setGroupFilter} options={["Group: All", "VIP", "Corporate", "Insurance", "Walk-in"]} />
      </div>
    );

    if (role === 'Reception') return (
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, appt..." className="pl-9 focus:border-info shadow-sm" />
        </div>
        <div className="flex bg-surface-hover p-1 rounded-control mr-2">
          <button className="px-4 py-1 text-sm font-medium rounded-control text-ink-muted hover:text-ink-soft">All Patients</button>
          <button className="px-4 py-1 text-sm font-bold rounded-control bg-surface text-ink shadow-sm">Today's Appointments</button>
          <button className="px-4 py-1 text-sm font-medium rounded-control text-ink-muted hover:text-ink-soft">Awaiting Check-in</button>
        </div>
        <FilterSelect value={consentFilter} onChange={setConsentFilter} options={["Consent: All", "Signed", "Pending"]} />
        <FilterSelect value={paymentFilter} onChange={setPaymentFilter} options={["Payment: All", "Paid", "Unpaid"]} />
      </div>
    );

    if (role === 'Clinician') return (
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search my patients..." className="pl-9 focus:border-info shadow-sm" />
        </div>
        <FilterSelect value={reviewFilter} onChange={setReviewFilter} options={["Review Status: All", "Results Pending Review", "Awaiting Sign-off"]} />
        <FilterSelect value={flagFilter} onChange={setFlagFilter} options={["Flag: All", "Urgent", "Follow-up"]} />
        <FilterSelect value={nextApptFilter} onChange={setNextApptFilter} options={["Next Appt: All", "This Week", "This Month"]} />
      </div>
    );

    if (role === 'Nurse') return (
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search my patients..." className="pl-9 focus:border-info shadow-sm" />
        </div>
        <div className="flex bg-surface-hover p-1 rounded-control mr-2">
          <button className="px-4 py-1 text-sm font-bold rounded-control bg-surface text-ink shadow-sm">Today's Patients</button>
          <button className="px-4 py-1 text-sm font-medium rounded-control text-ink-muted hover:text-ink-soft">All Assigned</button>
        </div>
        <FilterSelect value={journeyFilter} onChange={setJourneyFilter} options={["Journey Status: All", "In Progress", "Awaiting Start"]} />
      </div>
    );
    return null;
  };

  const KPICards = () => {
    if (role === 'Admin') return <KpiStrip items={[
      { id: "total-patients", value: "247", label: "Total Patients", sub: "+12 this month", icon: Users, tone: "slate" },
      { id: "active-patients", value: "189", label: "Active Patients", sub: "76% of total", icon: UserCheck, tone: "emerald" },
      { id: "unassigned", value: "3", label: "Unassigned", sub: "no clinician", icon: UserX, tone: "amber", alert: true },
      { id: "pending-onboarding", value: "8", label: "Pending Onboarding", sub: "no first visit yet", icon: Clock, tone: "blue" },
    ]} />;

    if (role === 'Reception') return <KpiStrip items={[
      { id: "todays-appointments", value: "14", label: "Today's Appointments", sub: "6 in · 3 waiting · 5 upcoming", icon: CalendarCheck, tone: "blue" },
      { id: "awaiting-check-in", value: "3", label: "Awaiting Check-in", sub: "consent or payment pending", icon: Clock, tone: "amber" },
      { id: "new-registrations", value: "2", label: "New Registrations Today", sub: "registered today", icon: UserPlus, tone: "emerald" },
    ]} />;

    if (role === 'Clinician') return <KpiStrip items={[
      { id: "my-patients", value: String(patients.length), label: "My Patients", sub: "assigned to you", icon: Users, tone: "slate", onClick: () => setQuickFilter(null), active: quickFilter === null },
      { id: "results-to-review", value: "5", label: "Results to Review", sub: "2 urgent", icon: FlaskConical, tone: "red", alert: true, onClick: () => setQuickFilter(q => q === "review" ? null : "review"), active: quickFilter === "review" },
      { id: "follow-ups-due", value: "3", label: "Follow-ups Due", sub: "within next 7 days", icon: CalendarClock, tone: "blue", onClick: () => setQuickFilter(q => q === "followup" ? null : "followup"), active: quickFilter === "followup" },
    ]} />;

    if (role === 'Nurse') return <KpiStrip items={[
      { id: "my-patients-today", value: String(patients.length), label: "My Patients Today", sub: "assigned to you today", icon: Users, tone: "slate" },
      { id: "active-journeys", value: "4", label: "Active Journeys", sub: "2 awaiting you", icon: Activity, tone: "emerald" },
    ]} />;

    return null;
  };

  return (
    <div className="flex flex-col min-h-full bg-surface-page">
      <Header />
      <Toolbar />
      <KPICards />

      {/* Table Area — grows with content; the page (AppShell) is the only
          scroll surface, so the card never grows its own inner scrollbar.
          border-t + pt-5/pb-5 (--page-padding-y, 20px) matches BillingPage's
          table-card inset so the card reads as a distinct framed surface,
          not flush with the KPI row. */}
      <div className="px-4 pb-4 border-t border-divider pt-4 flex flex-col relative">
        <div className="bg-surface border border-divider rounded-card shadow-sm overflow-hidden flex flex-col relative">
          
          {/* Bulk Actions Bar (Admin only) */}
          {selectedIds.size > 0 && role === 'Admin' && (
            <div className="bg-info/10 border-b border-info/30 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40">
              <span className="text-sm font-bold text-info-ink">{selectedIds.size} selected</span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-surface border border-info/30 text-info-ink text-xs font-bold rounded-control shadow-sm hover:bg-info/15">Assign Clinician</button>
                <button className="px-3 py-1.5 bg-surface border border-info/30 text-info-ink text-xs font-bold rounded-control shadow-sm hover:bg-info/15">Assign Nurse</button>
                <button className="px-3 py-1.5 bg-surface border border-info/30 text-info-ink text-xs font-bold rounded-control shadow-sm hover:bg-info/15">Change Group</button>
                <button className="px-3 py-1.5 bg-surface border border-info/30 text-info-ink text-xs font-bold rounded-control shadow-sm hover:bg-info/15">Export Selected</button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-info-ink hover:opacity-90 text-xs font-bold ml-2">Deselect All</button>
              </div>
            </div>
          )}

          <div className="relative">
            <table className="w-full text-left border-collapse text-sm [&_th]:!px-3 [&_td]:!px-3 [&_th]:!py-2.5 [&_td]:!py-2.5">
              <thead className="bg-surface-page sticky top-0 z-30 shadow-[0_1px_0_var(--border-strong)]">
                <tr>
                  {role === 'Admin' && <th className="p-4 w-[40px] border-b border-divider sticky left-0 z-40 bg-surface-page shadow-[1px_0_0_var(--border-strong)]"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === patients.length && patients.length > 0} className="rounded-control text-ink-soft focus:ring-info" /></th>}
                  <th className={`p-4 font-bold text-ink-soft border-b border-divider sticky left-[${role==='Admin'?'40px':'0px'}] z-40 bg-surface-page w-[180px] shadow-[1px_0_0_var(--border-strong)] cursor-pointer hover:bg-surface-hover`}>Patient</th>
                  
                  {role === 'Admin' && (
                    <>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Contact</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Age / Sex</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Group</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Assigned Clinician</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Assigned Nurse</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Status</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Last Visit</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Next Appt</th>
                    </>
                  )}

                  {role === 'Reception' && (
                    <>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Phone</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Today's Appt</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Clinician</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Consent</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Payment</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Check-in</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Journey</th>
                    </>
                  )}

                  {role === 'Clinician' && (
                    <>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Age / Sex</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Flag</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Review Status</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Last Visit</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Next Appt</th>
                    </>
                  )}

                  {role === 'Nurse' && (
                    <>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Today's Appt</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Clinician</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Journey</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Waiting Since</th>
                      <th className="p-4 font-bold text-ink-soft border-b border-divider">Room</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-ink-muted">
                      {/* A search that finds nobody is the walk-in signal: offer to
                          register the typed name straight away. Filter-only misses
                          keep the plain message — there's no name to seed. */}
                      {search && (role === 'Admin' || role === 'Reception') ? (
                        <>
                          <div className="text-lg font-bold mb-2 text-ink-soft">No patients found</div>
                          <p className="mb-4">Nobody matches “{search}”.</p>
                          <button
                            onClick={() => openRegister(search)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover hover:border-border-strong transition-colors shadow-sm"
                          >
                            <UserPlus className="w-4 h-4 text-ink-muted" /> Register “{search}” as new patient
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
                  let rowBg = "bg-surface hover:bg-surface-hover";
                  if (isSelected) rowBg = "bg-surface-page";

                  // Reception visual cue: today's appointment date shown in the
                  // Today's Appt column (see below) — no longer a distinct row tint.
                  const isTodayRec = role === 'Reception' && p.nextAppt?.includes("3 Jul");

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => navigate(`/patients/${p.patientId}`)}
                      className={`cursor-pointer group relative transition-colors ${rowBg}`}
                    >
                      {role === 'Admin' && (
                        <td className="p-4 border-r border-divider sticky left-0 z-10 shadow-[1px_0_0_var(--border-strong)] bg-surface group-hover:bg-surface-hover transition-colors w-[40px]" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(p.id, e as any)} className="rounded-control text-ink-soft focus:ring-info" />
                        </td>
                      )}
                      
                      <td className={`p-4 border-r border-divider sticky z-10 shadow-[1px_0_0_var(--border-strong)] bg-surface group-hover:bg-surface-hover transition-colors w-[180px] ${role === 'Admin' ? 'left-[40px]' : 'left-0'}`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft shrink-0 mr-3">
                            {p.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-ink truncate leading-tight group-hover:underline">{p.name}</div>
                            <div className="text-label text-ink-muted tabular-nums">{p.patientId}</div>
                          </div>
                        </div>
                      </td>

                      {/* --- Admin Cols --- */}
                      {role === 'Admin' && (
                        <>
                          <td className="p-4">
                            <div className="font-medium text-ink tabular-nums">{p.phone}</div>
                            <div className="text-label text-ink-muted">{p.email}</div>
                          </td>
                          <td className="p-4 text-ink-soft font-medium tabular-nums">{ageSexLabel(p)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-label font-bold rounded-control
                              ${p.group === 'VIP' ? 'bg-warning/15 text-warning-ink' :
                                p.group === 'Corporate' ? 'bg-info/15 text-info-ink' :
                                p.group === 'Insurance' ? 'bg-success/15 text-success-ink' :
                                p.group === 'Walk-in' ? 'bg-surface-sunken text-ink-soft' : 'text-ink-muted'}`}>
                              {p.group}
                            </span>
                          </td>
                          <td className={`p-4 font-medium ${!p.clinician ? 'text-warning-ink' : 'text-ink-soft'}`}>{p.clinician || 'Unassigned'}</td>
                          <td className="p-4 text-ink-soft">{p.nurse || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-overline rounded-control border
                              ${p.status === 'Active' ? 'bg-success/10 text-success-ink border-success/30' :
                                p.status === 'Inactive' ? 'bg-surface-page text-ink-muted border-divider' :
                                p.status === 'New' ? 'bg-info/10 text-info-ink border-info/30' :
                                'bg-warning/10 text-warning-ink border-warning/30'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className={`p-4 tabular-nums ${p.lastVisit === 'Never' ? 'text-ink-muted italic' : 'text-ink-soft font-medium'}`}>{p.lastVisit}</td>
                          <td className="p-4 text-ink-soft tabular-nums">{p.nextAppt || '—'}</td>
                        </>
                      )}

                      {/* --- Reception Cols --- */}
                      {role === 'Reception' && (
                        <>
                          <td className="p-4 text-info-ink font-medium">
                            <span className="flex items-center whitespace-nowrap"><Phone className="w-3.5 h-3.5 mr-1 shrink-0" /> {p.phone}</span>
                          </td>
                          <td className="p-4 font-bold text-ink">{isTodayRec ? p.nextAppt : '—'}</td>
                          <td className="p-4 text-ink-soft">{p.clinician}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-overline rounded-control border flex items-center w-max
                              ${p.consent === 'Signed' ? 'bg-success/10 text-success-ink border-success/30' :
                                p.consent === 'Pending' ? 'bg-warning/10 text-warning-ink border-warning/30' :
                                p.consent === 'Not Sent' ? 'bg-danger/10 text-danger-ink border-danger/30' :
                                'bg-surface-page text-ink-muted border-divider'}`}>
                              {p.consent === 'Signed' && <Check className="w-3 h-3 mr-1" />}
                              {p.consent}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-overline rounded-control border flex items-center w-max
                              ${p.payment === 'Paid' ? 'bg-success/10 text-success-ink border-success/30' :
                                p.payment === 'Partial' ? 'bg-warning/10 text-warning-ink border-warning/30' :
                                p.payment === 'Unpaid' ? 'bg-danger/10 text-danger-ink border-danger/30' :
                                'bg-surface-page text-ink-muted border-divider'}`}>
                              {p.payment === 'Paid' && <Check className="w-3 h-3 mr-1" />}
                              {p.payment}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-overline rounded-control border flex items-center w-max
                              ${p.checkIn === 'Checked In' ? 'bg-success/10 text-success-ink border-success/30' :
                                p.checkIn === 'Waiting' ? 'bg-warning/10 text-warning-ink border-warning/30' :
                                p.checkIn === 'Completed' ? 'bg-info/10 text-info-ink border-info/30' :
                                'bg-surface-page text-ink-muted border-transparent'}`}>
                              {p.checkIn}
                            </span>
                          </td>
                          <td className="p-4">
                            {p.journeyStep ? (
                              <div className="text-xs text-ink-soft font-medium">Consent → <span className="font-bold text-ink">{p.journeyStep}</span></div>
                            ) : <span className="text-ink-muted">—</span>}
                          </td>
                        </>
                      )}

                      {/* --- Clinician Cols --- */}
                      {role === 'Clinician' && (
                        <>
                          <td className="p-4 text-ink-soft font-medium tabular-nums">{ageSexLabel(p)}</td>
                          {/* Not colour-only: each flag pairs a distinct outline icon
                              (shape) with its tone, so colour-blind users still read it. */}
                          <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                            {p.flag === 'Urgent' && <span title="Urgent" className="inline-flex items-center justify-center w-8 h-8 rounded-control text-danger-ink hover:bg-danger/10 cursor-pointer touch-extend"><AlertTriangle className="w-4 h-4" /></span>}
                            {p.flag === 'Follow-up' && <span title="Follow-up" className="inline-flex items-center justify-center w-8 h-8 rounded-control text-warning-ink hover:bg-warning/10 cursor-pointer touch-extend"><Flag className="w-4 h-4" /></span>}
                            {p.flag === 'Watch' && <span title="Watch" className="inline-flex items-center justify-center w-8 h-8 rounded-control text-warning-ink hover:bg-warning/10 cursor-pointer touch-extend"><Eye className="w-4 h-4" /></span>}
                            {p.flag === 'No flag' && <span className="text-ink-muted">—</span>}
                          </td>
                          <td className="p-4">
                            {/* The normal/default "Up to Date" state must not consume
                                attention: render it as the faintest plain grey text (no
                                pill, no colour). Saturated status pills are reserved for
                                the states a clinician must act on. */}
                            {(p.reviewStatus === 'Results Pending' || p.reviewStatus === 'Awaiting Sign-off' || p.reviewStatus === 'Follow-up Due') ? (
                              <span className={`px-2 py-0.5 text-overline rounded-control border
                                ${p.reviewStatus === 'Results Pending' ? 'bg-info/10 text-info-ink border-info/30' :
                                  p.reviewStatus === 'Awaiting Sign-off' ? 'bg-warning/10 text-warning-ink border-warning/30' :
                                  'bg-special/10 text-special-ink border-special/30'}`}>
                                {p.reviewStatus}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-muted">{p.reviewStatus}</span>
                            )}
                          </td>
                          <td className="p-4 text-ink-soft font-medium tabular-nums">{p.lastVisit}</td>
                          <td className="p-4">
                            {p.nextAppt ? (
                              <div>
                                <div className="font-bold text-ink">{p.nextAppt}</div>
                                <div className="text-overline text-ink-muted mt-1">in 2 days</div>
                              </div>
                            ) : <span className="text-ink-muted">—</span>}
                          </td>
                        </>
                      )}

                      {/* --- Nurse Cols --- */}
                      {role === 'Nurse' && (
                        <>
                          <td className="p-4 font-bold text-ink">{p.nextAppt}</td>
                          <td className="p-4 text-ink-soft font-medium">{p.clinician}</td>
                          <td className="p-4">
                            {(() => {
                              const appt = primaryApptForPatient(appts, p.patientId);
                              return appt ? <JourneyProgressChip appt={appt} /> : <span className="text-ink-muted">—</span>;
                            })()}
                          </td>
                          <td className="p-4 font-bold text-warning-ink">12 min</td>
                          <td className="p-4 text-ink-soft font-medium">Room 3</td>
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
            <div className="h-12 border-t border-divider bg-surface flex items-center justify-between px-4 shrink-0">
              <div className="text-xs text-ink-muted font-medium">Showing 1–{patients.length} of {patients.length} patients</div>
              <div className="flex items-center space-x-1">
                <button className="px-2 py-1 text-xs font-bold text-ink-muted hover:text-ink-soft border border-transparent hover:bg-surface-sunken rounded-control transition-colors" disabled>Previous</button>
                <button className="px-2 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface-page rounded-control shadow-sm">1</button>
                <button className="px-2 py-1 text-xs font-bold text-ink-soft hover:text-ink border border-transparent hover:bg-surface-sunken rounded-control transition-colors">Next</button>
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
