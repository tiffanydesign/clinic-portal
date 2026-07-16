import React from "react";
import { Patient } from "../pages/app/patientsData";
import { Staff } from "../pages/app/staff/staffData";

// Shared result rows for both the inline sidebar dropdown and the overlay
// panel — same avatars, same grouping, same empty state, just sized via
// `compact` so the overlay (more breathing room, touch-first) doesn't have
// to duplicate this markup.
export function GlobalSearchResultsList({
  patientMatches, staffMatches, onSelectPatient, onSelectStaff, compact = false,
}: {
  patientMatches: Patient[];
  staffMatches: Staff[];
  onSelectPatient: (p: Patient) => void;
  onSelectStaff: (s: Staff) => void;
  compact?: boolean;
}) {
  const hasResults = patientMatches.length > 0 || staffMatches.length > 0;
  const rowPad = compact ? "px-3 py-2" : "px-4 py-3";
  const avatarSize = compact ? "w-7 h-7" : "w-9 h-9";

  if (!hasResults) {
    return <div className={`text-sm text-gray-400 text-center ${compact ? "px-4 py-6" : "px-4 py-10"}`}>No results found.</div>;
  }

  return (
    <>
      {patientMatches.length > 0 && (
        <div className="mb-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patients</div>
          {patientMatches.map((p) => (
            <button
              key={p.patientId}
              onClick={() => onSelectPatient(p)}
              className={`w-full flex items-center gap-3 ${rowPad} text-left hover:bg-gray-50 transition-colors rounded-lg`}
            >
              <div className={`${avatarSize} rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0`}>{p.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                <div className="text-xs text-gray-400 truncate">{p.patientId}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {staffMatches.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Staff</div>
          {staffMatches.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectStaff(s)}
              className={`w-full flex items-center gap-3 ${rowPad} text-left hover:bg-gray-50 transition-colors rounded-lg`}
            >
              <div className={`${avatarSize} rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>{s.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{s.name}</div>
                <div className="text-xs text-gray-400 truncate">{s.role} · {s.id}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
