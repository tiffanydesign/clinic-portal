// Tiny external store for the KPI Bar's global time-range switcher
// (Today / 7d / 30d). Session-persisted via sessionStorage so the choice
// survives navigating away and back within the same browser tab/session,
// but resets on a fresh session — matching "记住选择，仅限本次会话".
import { useSyncExternalStore } from "react";
import type { TimeRange } from "../../../components/stat";

// Canonical shape lives with the Stat family (components/stat/types.ts);
// re-exported here so existing `from "./kpiRangeStore"` imports keep working.
export type { TimeRange };

const STORAGE_KEY = "phenome_kpi_range";
const VALID: TimeRange[] = ["today", "7d", "30d"];

function readInitial(): TimeRange {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && (VALID as string[]).includes(stored)) return stored as TimeRange;
  } catch {
    // sessionStorage unavailable (e.g. private mode) — fall back silently
  }
  return "today";
}

let range: TimeRange = readInitial();
const listeners = new Set<() => void>();

export function setKpiRange(next: TimeRange) {
  if (next === range) return;
  range = next;
  try { sessionStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useKpiRange(): TimeRange {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => range
  );
}

export const RANGE_LABEL: Record<TimeRange, string> = { today: "Today", "7d": "7d", "30d": "30d" };
export const RANGE_PILL: Record<TimeRange, string> = { today: "TODAY", "7d": "7D", "30d": "30D" };
