import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, ChevronDown, Download, Plus, MoreHorizontal, FileText, Phone, Mail, UserPlus, X, Filter, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAppContext, Role } from "../../context/AppContext";
import { FilterSelect } from "../../components/FilterSelect";
import { MOCK_PATIENTS, Patient } from "./patientsData";

export type { Patient };
export { MOCK_PATIENTS };

export function PatientsPage() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [clinicianFilter, setClinicianFilter] = useState("Assigned Clinician: All");
  const [groupFilter, setGroupFilter] = useState("Group: All");
  const [consentFilter, setConsentFilter] = useState("Consent: All");
  const [paymentFilter, setPaymentFilter] = useState("Payment: All");
  const [reviewFilter, setReviewFilter] = useState("Review Status: All");
  const [flagFilter, setFlagFilter] = useState("Flag: All");
  const [nextApptFilter, setNextApptFilter] = useState("Next Appt: All");
  const [journeyFilter, setJourneyFilter] = useState("Journey Status: All");

  // Filters based on Role
  let patients = MOCK_PATIENTS;
  if (role === 'Clinician') patients = patients.filter(p => p.clinician === "Dr. Ebru Reis");
  if (role === 'Nurse') patients = patients.filter(p => p.nurse === "Berna Koç" && p.nextAppt?.includes("3 Jul"));
  
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
          {(role === 'Admin' || role === 'Reception') && (
            <button 
              onClick={() => setShowNewPatientModal(true)}
              className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> {role === 'Admin' ? 'New Patient' : 'Register New Patient'}
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
        <FilterSelect value={clinicianFilter} onChange={setClinicianFilter} options={["Assigned Clinician: All", "Dr. Ebru Reis", "Dr. Emre Yalçın"]} />
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
    if (role === 'Admin') return (
      <div className="px-8 py-5 shrink-0 grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Patients</div>
          <div className="text-3xl font-bold text-gray-800">247</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">12 new this month</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Patients</div>
          <div className="text-3xl font-bold text-gray-800">189</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">76% of total</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unassigned</div>
          <div className="text-3xl font-bold text-gray-800">3</div>
          <div className="text-sm text-orange-600 mt-1 font-bold">no clinician assigned</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Onboarding</div>
          <div className="text-3xl font-bold text-gray-800">8</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">registered but no first visit</div>
        </div>
      </div>
    );

    if (role === 'Reception') return (
      <div className="px-8 py-5 shrink-0 grid grid-cols-3 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Today's Appointments</div>
          <div className="text-3xl font-bold text-gray-800">14</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">6 checked in · 3 waiting · 5 upcoming</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Awaiting Check-in</div>
          <div className="text-3xl font-bold text-gray-800">3</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">consent or payment pending</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Registrations Today</div>
          <div className="text-3xl font-bold text-gray-800">2</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">registered today</div>
        </div>
      </div>
    );

    if (role === 'Clinician') return (
      <div className="px-8 py-5 shrink-0 grid grid-cols-3 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">My Patients</div>
          <div className="text-3xl font-bold text-gray-800">{patients.length}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">assigned to you</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Results to Review</div>
          <div className="text-3xl font-bold text-gray-800">5</div>
          <div className="text-sm text-red-600 mt-1 font-bold">2 urgent</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Follow-ups Due</div>
          <div className="text-3xl font-bold text-gray-800">3</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">within next 7 days</div>
        </div>
      </div>
    );

    if (role === 'Nurse') return (
      <div className="px-8 py-5 shrink-0 grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">My Patients Today</div>
          <div className="text-3xl font-bold text-gray-800">{patients.length}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">assigned to you today</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Journeys</div>
          <div className="text-3xl font-bold text-gray-800">4</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">2 awaiting you</div>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <Header />
      <Toolbar />
      <KPICards />

      {/* Table Area */}
      <div className="flex-1 overflow-hidden px-8 pb-8 flex flex-col min-h-0 relative">
        <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm relative">
          
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

          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
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
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Journey Status</th>
                      <th className="p-4 font-bold text-gray-600 border-b border-gray-200">Current Step</th>
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
                      <div className="text-lg font-bold mb-2">No patients match your criteria</div>
                      <p>Try adjusting your filters or search terms.</p>
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
                          <td className="p-4 text-gray-600 font-medium">{p.age} · {p.sex}</td>
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
                          <td className="p-4 text-gray-600 font-medium">{p.age} · {p.sex}</td>
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
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <div className="w-4 h-px bg-emerald-500"></div>
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <div className="w-4 h-px bg-emerald-500"></div>
                              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-100 animate-pulse"></div>
                              <div className="w-4 h-px bg-gray-200"></div>
                              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                              <div className="w-4 h-px bg-gray-200"></div>
                              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-gray-800">{p.journeyStep || '—'}</td>
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

      {/* New Patient Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Register New Patient</h2>
              <button onClick={() => setShowNewPatientModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="flex items-center text-blue-700 font-bold text-sm"><div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">1</div> Personal</div>
                <div className="w-12 h-px bg-gray-200"></div>
                <div className="flex items-center text-gray-400 font-bold text-sm"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">2</div> Contact</div>
                <div className="w-12 h-px bg-gray-200"></div>
                <div className="flex items-center text-gray-400 font-bold text-sm"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">3</div> Clinic</div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Title</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                    <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">First Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" />
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Sex <span className="text-red-500">*</span></label>
                  <select defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                    <option value="" disabled>Select sex...</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
              <button onClick={() => { toast.success("Patient registered (Demo)."); setShowNewPatientModal(false); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm flex items-center">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
