import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Download, Plus, Upload, ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  MOCK_STAFF, ROLE_GROUP_ORDER, ROLE_GROUP_LABEL, Staff, StaffRole,
  rolePillClass, statusPillClass, workloadColor, todayDotClass,
} from "./staffData";
import { StaffRowMenu } from "./StaffRowMenu";
import { AddStaffModal } from "./AddStaffModal";
import { ImportStaffModal } from "./ImportStaffModal";

type SortKey = "name" | "patients" | "workload" | "lastActive" | "joined";

const ROLE_OPTIONS: StaffRole[] = ["Admin", "Clinician", "Nurse", "Receptionist"];

export function StaffListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Set<StaffRole>>(new Set());
  const [statusFilter, setStatusFilter] = useState("All");
  const [todayFilter, setTodayFilter] = useState("All");
  const [collapsed, setCollapsed] = useState<Set<StaffRole>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<Staff[]>([]);

  const allStaff = useMemo(() => [...MOCK_STAFF, ...createdStaff], [createdStaff]);

  const filtered = useMemo(() => {
    let list = allStaff;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    if (roleFilter.size > 0) list = list.filter((s) => roleFilter.has(s.role));
    if (statusFilter !== "All") list = list.filter((s) => s.status === statusFilter);
    if (todayFilter !== "All") {
      if (todayFilter === "On Duty") list = list.filter((s) => s.today === "On Duty");
      if (todayFilter === "Off Today") list = list.filter((s) => s.today === "Off");
      if (todayFilter === "On Leave") list = list.filter((s) => s.today === "On Leave" || s.status === "On Leave");
    }
    return list;
  }, [allStaff, search, roleFilter, statusFilter, todayFilter]);

  const sorter = (a: Staff, b: Staff) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "patients": cmp = (a.patients ?? -1) - (b.patients ?? -1); break;
      case "workload": cmp = (a.workload ?? -1) - (b.workload ?? -1); break;
      case "lastActive": cmp = a.lastActiveDays - b.lastActiveDays; break;
      case "joined": cmp = a.joined.localeCompare(b.joined); break;
    }
    return sortAsc ? cmp : -cmp;
  };

  const groups = ROLE_GROUP_ORDER
    .map((role) => ({ role, members: filtered.filter((s) => s.role === role).sort(sorter) }))
    .filter((g) => g.members.length > 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggleGroup = (role: StaffRole) => {
    const next = new Set(collapsed);
    if (next.has(role)) next.delete(role); else next.add(role);
    setCollapsed(next);
  };

  const toggleRoleFilter = (role: StaffRole) => {
    const next = new Set(roleFilter);
    if (next.has(role)) next.delete(role); else next.add(role);
    setRoleFilter(next);
  };

  const roleFilterLabel = roleFilter.size === 0 ? "All Roles" : [...roleFilter].join(", ");

  const SortableTh = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`p-4 font-bold text-gray-600 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none ${className}`}
    >
      <span className="flex items-center">
        {label}
        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortKey === k ? "text-slate-700" : "text-gray-300"}`} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage clinic staff, roles, permissions, and workload</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2 text-gray-500" /> Export <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1" onMouseLeave={() => setShowExportMenu(false)}>
                <button onClick={() => setShowExportMenu(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as Excel</button>
                <button onClick={() => setShowExportMenu(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2 text-gray-500" /> Import Staff
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Staff Member
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="px-8 py-5 shrink-0 grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Staff</div>
          <div className="text-3xl font-bold text-gray-800">{allStaff.length}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">
            {ROLE_GROUP_ORDER.map((role) => {
              const count = allStaff.filter((s) => s.role === role).length;
              const label = ROLE_GROUP_LABEL[role].toLowerCase();
              return `${count} ${count === 1 ? label.replace(/s$/, "") : label}`;
            }).join(" · ")}
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">On Duty Today</div>
          <div className="text-3xl font-bold text-emerald-600">9</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">3 off today</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avg. Workload</div>
          <div className="text-3xl font-bold text-orange-600">74%</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">across clinicians &amp; nurses</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Actions</div>
          <div className="text-3xl font-bold text-orange-600">3</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">1 permission review · 2 availability unconfirmed</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-y border-gray-200 px-8 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm"
          />
        </div>

        {/* Role multi-select */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm hover:border-slate-400 max-w-[220px]"
          >
            <span className="truncate">{roleFilterLabel}</span> <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400 shrink-0" />
          </button>
          {showRoleMenu && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1" onMouseLeave={() => setShowRoleMenu(false)}>
              {ROLE_OPTIONS.map((r) => (
                <label key={r} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={roleFilter.has(r)} onChange={() => toggleRoleFilter(r)} className="rounded text-slate-600 focus:ring-slate-500 mr-2.5" />
                  {r}
                </label>
              ))}
            </div>
          )}
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm">
          <option value="All">Status: All</option>
          <option>Active</option>
          <option>On Leave</option>
          <option>Inactive</option>
        </select>

        <select value={todayFilter} onChange={(e) => setTodayFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm">
          <option value="All">Availability Today: All</option>
          <option>On Duty</option>
          <option>Off Today</option>
          <option>On Leave</option>
        </select>

        <div className="flex-1" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden px-8 py-5 pb-8 flex flex-col min-h-0">
        <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="flex-1 overflow-auto relative">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-gray-50 sticky top-0 z-30 shadow-[0_1px_0_#e5e7eb]">
                  <tr>
                    <SortableTh label="Staff" k="name" className="sticky left-0 z-40 bg-gray-50 w-[200px] shadow-[1px_0_0_#e5e7eb]" />
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[100px]">Role</th>
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[150px]">Contact</th>
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[90px]">Status</th>
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[80px]">Today</th>
                    <SortableTh label="Patients" k="patients" className="w-[70px]" />
                    <SortableTh label="Workload" k="workload" className="w-[100px]" />
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[100px]">Next Shift</th>
                    <SortableTh label="Last Active" k="lastActive" className="w-[90px]" />
                    <SortableTh label="Joined" k="joined" className="w-[80px]" />
                    <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-center w-[60px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-16 text-center text-gray-500">
                        <div className="text-lg font-bold mb-2">No staff match your criteria</div>
                        <p>Try adjusting your filters or search terms.</p>
                      </td>
                    </tr>
                  )}
                  {groups.map(({ role, members }) => (
                    <React.Fragment key={role}>
                      <tr className="bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleGroup(role)}>
                        <td colSpan={11} className="px-4 py-2 sticky left-0">
                          <span className="flex items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            {collapsed.has(role) ? <ChevronRight className="w-3.5 h-3.5 mr-1.5" /> : <ChevronDown className="w-3.5 h-3.5 mr-1.5" />}
                            {ROLE_GROUP_LABEL[role]} ({members.length})
                          </span>
                        </td>
                      </tr>
                      {!collapsed.has(role) && members.map((s) => <StaffRow key={s.id} staff={s} onOpen={() => navigate(`/staff/${s.id}`)} />)}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="text-xs text-gray-500 font-medium">Showing {filtered.length} of {allStaff.length} staff</div>
            </div>
        </div>
      </div>

      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onCreated={(s) => { setCreatedStaff((prev) => [...prev, s]); setShowAddModal(false); }}
        />
      )}

      {showImportModal && (
        <ImportStaffModal
          onClose={() => setShowImportModal(false)}
          onImported={(staff) => { setCreatedStaff((prev) => [...prev, ...staff]); setShowImportModal(false); }}
        />
      )}
    </div>
  );
}

function StaffRow({ staff: s, onOpen }: { staff: Staff; onOpen: () => void }) {
  const overCapacity = s.workload !== null && s.workload > 85;
  const staleLogin = s.lastActiveDays > 7;

  return (
    <tr onClick={onOpen} className="cursor-pointer group relative transition-colors bg-white hover:bg-slate-50">
      {overCapacity && <td className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 z-40" />}
      <td className="p-4 border-r border-gray-200 sticky left-0 z-10 shadow-[1px_0_0_#e5e7eb] bg-white group-hover:bg-slate-50 transition-colors w-[200px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3">{s.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:underline">{s.name}</div>
            <div className="text-[10px] text-gray-400 font-medium">{s.id}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${rolePillClass(s.role)}`}>{s.role}</span>
      </td>
      <td className="p-4">
        <div className="font-medium text-gray-800">{s.email}</div>
        <div className="text-[10px] text-gray-500">{s.phone}</div>
      </td>
      <td className="p-4">
        <span
          title={s.status === "On Leave" && s.leaveRange ? `On leave: ${s.leaveRange}` : undefined}
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusPillClass(s.status)}`}
        >
          {s.status}
        </span>
      </td>
      <td className="p-4">
        <span className="flex items-center text-xs font-medium text-gray-700">
          <span className={`w-2 h-2 rounded-full mr-1.5 shrink-0 ${todayDotClass(s.today)}`} />
          {s.today === "Off" && s.todayNote ? s.todayNote : s.today}
        </span>
      </td>
      <td className="p-4 text-gray-700 font-medium">{s.patients ?? "—"}</td>
      <td className="p-4">
        {s.workload !== null ? (
          <div className="flex items-center">
            <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-2">
              <div className={`h-full rounded-full ${workloadColor(s.workload).bar}`} style={{ width: `${s.workload}%` }} />
            </div>
            <span className={`text-xs font-bold ${workloadColor(s.workload).text}`}>{s.workload}%</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="p-4 text-gray-600 font-medium">{s.nextShift}</td>
      <td className={`p-4 font-medium ${staleLogin ? "text-red-600 font-bold" : "text-gray-600"}`}>{s.lastActive}</td>
      <td className="p-4 text-gray-600">{s.joined}</td>
      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <StaffRowMenu staff={s} />
      </td>
    </tr>
  );
}
