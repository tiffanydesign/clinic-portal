import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { MOCK_PATIENTS, Patient } from "../pages/app/patientsData";
import { MOCK_STAFF, Staff } from "../pages/app/staff/staffData";

// Every mock identity in this app is a Turkish name, so "fuzzy" has to
// tolerate a plain-ASCII keyboard: fold the Turkish letters that have no
// Latin keyboard key (ı/İ, ş, ğ, ü, ö, ç) to their closest ASCII form before
// comparing, so typing "yildirm" still finds "Yıldırım".
function foldTurkish(s: string): string {
  return s
    .replace(/[İI]/g, "i")
    .replace(/ı/g, "i")
    .replace(/[Şş]/g, "s")
    .replace(/[Ğğ]/g, "g")
    .replace(/[Üü]/g, "u")
    .replace(/[Öö]/g, "o")
    .replace(/[Çç]/g, "c")
    .toLowerCase();
}

// Lightweight fuzzy match: a direct substring hit ranks best; failing that,
// every query character still appearing in order (a subsequence) counts as
// a weaker hit — the same idea as a command-palette "Goto Anything" filter,
// without pulling in a matching library for a ~35-person mock directory.
function fuzzyScore(query: string, target: string | undefined): number | null {
  if (!target) return null;
  const q = foldTurkish(query);
  const t = foldTurkish(target);
  if (t.includes(q)) return 0;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : null;
}

function bestScore(query: string, fields: (string | undefined)[]): number | null {
  const scores = fields.map((f) => fuzzyScore(query, f)).filter((s): s is number => s !== null);
  return scores.length ? Math.min(...scores) : null;
}

const MAX_PER_GROUP = 5;

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

  const patientMatches: Patient[] = trimmed
    ? MOCK_PATIENTS
        .map((p) => ({ p, score: bestScore(trimmed, [p.name, p.patientId, p.email]) }))
        .filter((r): r is { p: Patient; score: number } => r.score !== null)
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX_PER_GROUP)
        .map((r) => r.p)
    : [];

  const staffMatches: Staff[] = trimmed
    ? MOCK_STAFF
        .map((s) => ({ s, score: bestScore(trimmed, [s.name, s.id, s.email]) }))
        .filter((r): r is { s: Staff; score: number } => r.score !== null)
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX_PER_GROUP)
        .map((r) => r.s)
    : [];

  const hasResults = patientMatches.length > 0 || staffMatches.length > 0;

  const close = () => { setQuery(""); setOpen(false); };
  const goToPatient = (p: Patient) => { navigate(`/patients/${p.patientId}`); close(); };
  const goToStaff = (s: Staff) => { navigate(`/staff/${s.id}`); close(); };

  return (
    <div className="relative w-64" ref={rootRef}>
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (trimmed) setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Escape") close(); }}
        placeholder="Search patients, staff..."
        className="w-full pl-8 pr-7 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white"
      />
      {trimmed && (
        <button
          onClick={close}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-600 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && trimmed && (
        <div className="absolute left-0 top-full mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[420px] overflow-y-auto py-1">
          {!hasResults ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No results found.</div>
          ) : (
            <>
              {patientMatches.length > 0 && (
                <div className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patients</div>
                  {patientMatches.map((p) => (
                    <button
                      key={p.patientId}
                      onClick={() => goToPatient(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">{p.avatar}</div>
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
                      onClick={() => goToStaff(s)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{s.avatar}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-800 truncate">{s.name}</div>
                        <div className="text-xs text-gray-400 truncate">{s.role} · {s.id}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
