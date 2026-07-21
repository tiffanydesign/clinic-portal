import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, Upload, UserPlus, ChevronDown, ChevronRight, ArrowUpDown,
  Users, Stethoscope, HeartPulse, Headset, ShieldCheck, UserCheck, Moon, Plane,
  type LucideIcon,
} from "lucide-react";
import { Stat, StatStripGroup, type StatIconTone } from "../../../components/stat";
import {
  MOCK_STAFF, ROLE_GROUP_ORDER, ROLE_GROUP_LABEL, Staff, StaffRole,
  rolePillClass, statusPillClass, workloadColor,
} from "./staffData";
import { StaffRowMenu } from "./StaffRowMenu";
import { AddStaffModal } from "./AddStaffModal";
import { ImportStaffModal } from "./ImportStaffModal";
import { FilterSelect } from "../../../components/FilterSelect";

type SortKey = "name" | "patients" | "workload" | "joined";

const ROLE_OPTIONS: StaffRole[] = ["Admin", "Clinician", "Nurse", "Receptionist"];

// Semantic icon + tone per role for the roster summary strip. Tones come from
// the Stat family's shared 5-colour set, never a bespoke palette.
const ROLE_META: Record<StaffRole, { icon: LucideIcon; tone: StatIconTone }> = {
  Clinician: { icon: Stethoscope, tone: "blue" },
  Nurse: { icon: HeartPulse, tone: "emerald" },
  Receptionist: { icon: Headset, tone: "amber" },
  Admin: { icon: ShieldCheck, tone: "slate" },
};

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
  const [showAddMenu, setShowAddMenu] = useState(false);
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
      case "joined": cmp = a.joined.localeCompare(b.joined); break;
    }
    return sortAsc ? cmp : -cmp;
  };

  const groups = ROLE_GROUP_ORDER
    .map((role) => ({ role, members: filtered.filter((s) => s.role === role).sort(sorter) }))
    .filter((g) => g.members.length > 0);

  // Roster summary counts — derived from data, not hardcoded.
  const onDuty = allStaff.filter((s) => s.today === "On Duty").length;
  const offToday = allStaff.filter((s) => s.today === "Off" && s.status !== "On Leave").length;
  const onLeave = allStaff.filter((s) => s.today === "On Leave" || s.status === "On Leave").length;

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

  // Roster strip actions — each segment drives the existing filter state
  // rather than deep-linking, so the table below reacts in place.
  const showOnlyRole = (role: StaffRole) => {
    const only = roleFilter.size === 1 && roleFilter.has(role);
    setRoleFilter(only ? new Set() : new Set([role]));
    setTodayFilter("All");
  };

  const clearRosterFilters = () => {
    setRoleFilter(new Set());
    setTodayFilter("All");
  };

  const SortableTh = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`p-4 font-bold text-ink-soft border-b border-divider cursor-pointer hover:bg-surface-hover select-none ${className}`}
    >
      <span className="flex items-center">
        {label}
        <ArrowUpDown className={`w-3 h-3 ml-1 ${sortKey === k ? "text-ink-soft" : "text-ink-muted"}`} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col min-h-full bg-surface-page">
      {/* Header */}
      <div className="bg-surface border-b border-divider px-6 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-ink">Staff Management</h1>
          <p className="text-sm text-ink-muted mt-1">Manage clinic staff, roles, permissions, and workload</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center px-4 py-2 btn-primary rounded-control text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Staff <ChevronDown className="w-3.5 h-3.5 ml-2" />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-divider rounded-card shadow-lg z-50 py-1" onMouseLeave={() => setShowAddMenu(false)}>
              <button
                onClick={() => { setShowAddMenu(false); setShowAddModal(true); }}
                className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-page"
              >
                <UserPlus className="w-4 h-4 text-ink-muted" /> Add Individually
              </button>
              <button
                onClick={() => { setShowAddMenu(false); setShowImportModal(true); }}
                className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-page"
              >
                <Upload className="w-4 h-4 text-ink-muted" /> Import from File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster summary — Stat family T3 `strip`. Clicking a segment drives the
          existing role / availability filters rather than navigating away. */}
      <div className="px-6 py-4 shrink-0">
        <StatStripGroup>
          <Stat
            stat={{ id: "total-staff", label: "Total Staff", kind: "count", variant: "strip",
                    value: String(allStaff.length), onClick: clearRosterFilters }}
            icon={Users}
            iconTone="slate"
            active={roleFilter.size === 0 && todayFilter === "All"}
          />
          {ROLE_GROUP_ORDER.map((role) => {
            const count = allStaff.filter((s) => s.role === role).length;
            if (count === 0) return null;
            const label = count === 1 ? ROLE_GROUP_LABEL[role].replace(/s$/, "") : ROLE_GROUP_LABEL[role];
            return (
              <Stat
                key={role}
                stat={{ id: `role-${role}`, label, kind: "count", variant: "strip",
                        value: String(count), onClick: () => showOnlyRole(role) }}
                icon={ROLE_META[role].icon}
                iconTone={ROLE_META[role].tone}
                active={roleFilter.size === 1 && roleFilter.has(role)}
              />
            );
          })}
          <Stat
            stat={{ id: "on-duty", label: "On Duty", kind: "count", variant: "strip",
                    value: String(onDuty), onClick: () => setTodayFilter("On Duty") }}
            icon={UserCheck}
            iconTone="emerald"
            active={todayFilter === "On Duty"}
          />
          <Stat
            stat={{ id: "off-today", label: "Off", kind: "count", variant: "strip",
                    value: String(offToday), onClick: () => setTodayFilter("Off Today") }}
            icon={Moon}
            iconTone="slate"
            active={todayFilter === "Off Today"}
          />
          {onLeave > 0 && (
            <Stat
              stat={{ id: "on-leave", label: "On Leave", kind: "count", variant: "strip",
                      value: String(onLeave), onClick: () => setTodayFilter("On Leave") }}
              icon={Plane}
              iconTone="amber"
              active={todayFilter === "On Leave"}
            />
          )}
        </StatStripGroup>
      </div>

      {/* Toolbar */}
      <div className="bg-surface border-y border-divider px-6 py-3 flex items-center shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-9 pr-3 py-1.5 border border-divider rounded-control text-sm outline-none focus:border-border-strong bg-surface shadow-sm"
          />
        </div>

        {/* Role multi-select */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center px-3 py-1.5 border border-divider rounded-control text-sm text-ink-soft bg-surface shadow-sm hover:border-border-strong max-w-[220px]"
          >
            <span className="truncate">{roleFilterLabel}</span> <ChevronDown className="w-3.5 h-3.5 ml-2 text-ink-muted shrink-0" />
          </button>
          {showRoleMenu && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-surface border border-divider rounded-card shadow-lg z-50 py-1" onMouseLeave={() => setShowRoleMenu(false)}>
              {ROLE_OPTIONS.map((r) => (
                <label key={r} className="flex items-center px-4 py-2 text-sm text-ink-soft hover:bg-surface-page cursor-pointer">
                  <input type="checkbox" checked={roleFilter.has(r)} onChange={() => toggleRoleFilter(r)} className="rounded-control text-ink-soft focus:ring-info mr-2.5" />
                  {r}
                </label>
              ))}
            </div>
          )}
        </div>

        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "All", label: "Status: All" },
            { value: "Active", label: "Active" },
            { value: "On Leave", label: "On Leave" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />

        <FilterSelect
          value={todayFilter}
          onChange={setTodayFilter}
          options={[
            { value: "All", label: "Availability Today: All" },
            { value: "On Duty", label: "On Duty" },
            { value: "Off Today", label: "Off Today" },
            { value: "On Leave", label: "On Leave" },
          ]}
        />

        <div className="flex-1" />
      </div>

      {/* Body */}
      <div className="px-6 py-5 pb-4 flex flex-col">
        <div className="bg-surface border border-divider rounded-card overflow-hidden flex flex-col shadow-sm">
            <div className="relative">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-surface-page sticky top-0 z-30 shadow-[0_1px_0_var(--border-strong)]">
                  <tr>
                    <SortableTh label="Staff" k="name" className="sticky left-0 z-40 bg-surface-page w-[200px] shadow-[1px_0_0_var(--border-strong)]" />
                    <th className="p-4 font-bold text-ink-soft border-b border-divider w-[100px]">Role</th>
                    <th className="p-4 font-bold text-ink-soft border-b border-divider w-[90px]">Status</th>
                    <SortableTh label="Patients" k="patients" className="w-[70px]" />
                    <SortableTh label="Workload" k="workload" className="w-[100px]" />
                    <SortableTh label="Joined" k="joined" className="w-[80px]" />
                    <th className="p-4 font-bold text-ink-soft border-b border-divider text-center w-[60px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-ink-muted">
                        <div className="text-lg font-bold mb-2">No staff match your criteria</div>
                        <p>Try adjusting your filters or search terms.</p>
                      </td>
                    </tr>
                  )}
                  {groups.map(({ role, members }) => (
                    <React.Fragment key={role}>
                      <tr className="bg-surface-page/80 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => toggleGroup(role)}>
                        <td colSpan={7} className="px-4 py-2 sticky left-0">
                          <span className="flex items-center text-xs font-bold text-ink-soft uppercase tracking-wider">
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
            <div className="h-12 border-t border-divider bg-surface flex items-center justify-between px-6 shrink-0">
              <div className="text-xs text-ink-muted font-medium">Showing {filtered.length} of {allStaff.length} staff</div>
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

  return (
    <tr onClick={onOpen} className="cursor-pointer group relative transition-colors bg-surface hover:bg-surface-page">
      {overCapacity && <td className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger-ink z-40" />}
      <td className="p-4 border-r border-divider sticky left-0 z-10 shadow-[1px_0_0_var(--border-strong)] bg-surface group-hover:bg-surface-page transition-colors w-[200px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft shrink-0 mr-3">{s.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink truncate leading-tight group-hover:underline">{s.name}</div>
            <div className="text-label text-ink-muted font-medium">{s.id}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-2 py-0.5 text-overline rounded-control border ${rolePillClass(s.role)}`}>{s.role}</span>
      </td>
      <td className="p-4">
        <span
          title={s.status === "On Leave" && s.leaveRange ? `On leave: ${s.leaveRange}` : undefined}
          className={`px-2 py-0.5 text-overline rounded-control border ${statusPillClass(s.status)}`}
        >
          {s.status === "Active" ? "On Duty" : s.status}
        </span>
      </td>
      <td className="p-4 text-ink-soft font-medium">{s.patients ?? "—"}</td>
      <td className="p-4">
        {s.workload !== null ? (
          <div className="flex items-center">
            <div className="w-14 h-1.5 bg-surface-sunken rounded-full overflow-hidden mr-2">
              <div className={`h-full rounded-full ${workloadColor(s.workload).bar}`} style={{ width: `${s.workload}%` }} />
            </div>
            <span className={`text-xs font-bold ${workloadColor(s.workload).text}`}>{s.workload}%</span>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="p-4 text-ink-soft">{s.joined}</td>
      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <StaffRowMenu staff={s} />
      </td>
    </tr>
  );
}
