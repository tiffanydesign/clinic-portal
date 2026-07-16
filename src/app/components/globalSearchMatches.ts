// Shared fuzzy-match logic for global search, used by both the expanded
// sidebar's inline search field and the collapsed sidebar's overlay panel
// (GlobalSearchOverlay) so the two surfaces can never drift out of sync.
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

export function useGlobalSearchMatches(query: string): {
  patientMatches: Patient[];
  staffMatches: Staff[];
  hasResults: boolean;
} {
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

  return { patientMatches, staffMatches, hasResults: patientMatches.length > 0 || staffMatches.length > 0 };
}
