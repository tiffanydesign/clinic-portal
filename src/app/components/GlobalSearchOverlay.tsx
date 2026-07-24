import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { Patient } from "../pages/app/patientsData";
import { Staff } from "../pages/app/staff/staffData";
import { useGlobalSearchMatches } from "./globalSearchMatches";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

// Centered search overlay for the collapsed sidebar rail — there's no room
// for an inline field at 64px, so the search icon opens this instead: a
// modal-style panel with its own input and results, closed by Esc or a
// click outside the panel. Portalled so it always paints above the rail.
export function GlobalSearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { patientMatches, staffMatches } = useGlobalSearchMatches(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const goToPatient = (p: Patient) => { navigate(`/patients/${p.patientId}`); onClose(); };
  const goToStaff = (s: Staff) => { navigate(`/staff/${s.id}`); onClose(); };
  const trimmed = query.trim();

  return createPortal(
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-6">
      <div
        ref={panelRef}
        className="w-full max-w-[560px] bg-surface rounded-card shadow-2xl border border-divider overflow-hidden"
      >
        <div className="relative border-b border-divider">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, staff…"
            className="w-full h-14 pl-12 pr-4 text-base outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {trimmed ? (
            <GlobalSearchResultsList
              patientMatches={patientMatches}
              staffMatches={staffMatches}
              onSelectPatient={goToPatient}
              onSelectStaff={goToStaff}
            />
          ) : (
            <div className="text-sm text-ink-muted text-center px-4 py-6">Start typing to search patients or staff.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
