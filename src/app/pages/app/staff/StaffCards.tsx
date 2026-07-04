import React from "react";
import { useNavigate } from "react-router";
import { Mail, Phone } from "lucide-react";
import {
  Staff, StaffRole, ROLE_GROUP_LABEL,
  rolePillClass, statusPillClass, workloadColor, todayDotClass,
} from "./staffData";
import { StaffRowMenu } from "./StaffRowMenu";

type Group = { role: StaffRole; members: Staff[] };

// Card grid view — quick-scan summary card per staff member, three per row.
export function StaffCardsView({ groups, collapsed }: { groups: Group[]; collapsed: Set<StaffRole> }) {
  return (
    <div className="flex-1 overflow-y-auto pr-1">
      {groups.length === 0 && (
        <div className="p-16 text-center text-gray-500 bg-white border border-gray-300 rounded-xl">
          <div className="text-lg font-bold mb-2">No staff match your criteria</div>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      )}
      <div className="space-y-6">
        {groups.map(({ role, members }) => (
          <div key={role}>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              {ROLE_GROUP_LABEL[role]} ({members.length})
            </div>
            {!collapsed.has(role) && (
              <div className="grid grid-cols-3 gap-5">
                {members.map((s) => <StaffCard key={s.id} staff={s} />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffCard({ staff: s }: { staff: Staff }) {
  const navigate = useNavigate();
  const showLoad = s.workload !== null;

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm hover:border-slate-500 transition-colors flex flex-col">
      {/* Top: identity */}
      <div className="flex items-start mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-500 flex items-center justify-center text-base font-bold text-white shrink-0 mr-3">{s.avatar}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-800 truncate">{s.name}</div>
          <div className="text-[10px] text-gray-400 font-medium mb-1.5">{s.id}</div>
          <div className="flex items-center space-x-1.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${rolePillClass(s.role)}`}>{s.role}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusPillClass(s.status)}`}>{s.status}</span>
          </div>
        </div>
      </div>

      {/* Middle: contact + today + load */}
      <div className="space-y-1.5 text-xs text-gray-600 mb-4">
        <div className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" /><span className="truncate">{s.email}</span></div>
        <div className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />{s.phone}</div>
        <div className="flex items-center pt-1 font-medium text-gray-700">
          <span className={`w-2 h-2 rounded-full mr-1.5 ${todayDotClass(s.today)}`} />
          {s.today === "Off" && s.todayNote ? s.todayNote : s.today}
        </div>
        {showLoad && (
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">{s.patients} patients</span>
              <span className={`font-bold ${workloadColor(s.workload!).text}`}>{s.workload}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${workloadColor(s.workload!).bar}`} style={{ width: `${s.workload}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom: actions */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => navigate(`/staff/${s.id}`)}
          className="px-4 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
        <StaffRowMenu staff={s} />
      </div>
    </div>
  );
}
