import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { Patient } from "../pages/app/patientsData";
import { Staff } from "../pages/app/staff/staffData";
import { useGlobalSearchMatches } from "./globalSearchMatches";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

// Inline search field for the sidebar's expanded state — fills the rail's
// width (240px minus padding) rather than a fixed pixel width, since it now
// lives in a narrow column instead of a wide top bar. The collapsed state
// uses GlobalSearchOverlay instead of this component.
export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const trimmed = query.trim();
  const { patientMatches, staffMatches } = useGlobalSearchMatches(query);

  const close = () => { setQuery(""); setOpen(false); };
  const goToPatient = (p: Patient) => { navigate(`/patients/${p.patientId}`); close(); };
  const goToStaff = (s: Staff) => { navigate(`/staff/${s.id}`); close(); };

  return (
    <div className="relative w-full" ref={rootRef}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (trimmed) setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Escape") close(); }}
        placeholder="Search patients, staff…"
        className="w-full h-11 pl-8 pr-7 border border-gray-300 rounded-lg text-sm outline-none focus:border-slate-500 bg-white"
      />
      {trimmed && (
        <button
          onClick={close}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-600 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && trimmed && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[420px] overflow-y-auto py-1">
          <GlobalSearchResultsList
            patientMatches={patientMatches}
            staffMatches={staffMatches}
            onSelectPatient={goToPatient}
            onSelectStaff={goToStaff}
            compact
          />
        </div>
      )}
    </div>
  );
}
