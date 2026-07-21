import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Lock, X, Check, Settings2, CalendarClock, FileClock, UserCheck, Gauge, ScanLine, UserX,
  UserPlus, Clock, Users, BellRing, Activity, TestTube, FileSignature, DoorOpen,
  FileSearch, FileCheck2, Video, CalendarPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../../context/AppContext";
import { KPI_CONFIG, Kpi, metricKindLabel } from "./kpiData";
import { Stat, type StatIconTone } from "../../../components/stat";
import { TimeRange, useKpiRange, setKpiRange, RANGE_LABEL } from "./kpiRangeStore";

// A small semantic icon+color per KPI — not a status/trend indicator (the
// sparkline/delta already own that), just "what kind of thing is this
// number" at a glance, so the bar reads faster than label text alone. Colors
// are the app's existing 5-color semantic set (emerald/amber/blue/red), never
// a new palette. Anything not listed here (a KPI added later) falls back to
// a neutral slate icon rather than breaking.
const KPI_ICON: Record<string, { icon: LucideIcon; tone: StatIconTone }> = {
  "appts-today": { icon: CalendarClock, tone: "blue" },
  "results-pending": { icon: FileClock, tone: "amber" },
  "checked-in-now": { icon: UserCheck, tone: "emerald" },
  "utilisation": { icon: Gauge, tone: "blue" },
  "scans-today": { icon: ScanLine, tone: "blue" },
  "no-show-rate": { icon: UserX, tone: "red" },
  "new-registrations": { icon: UserPlus, tone: "emerald" },
  "average-wait": { icon: Clock, tone: "amber" },
  "my-patients-today": { icon: Users, tone: "blue" },
  "awaiting-me": { icon: BellRing, tone: "amber" },
  "in-journey-now": { icon: Activity, tone: "blue" },
  "samples-to-collect": { icon: TestTube, tone: "amber" },
  "consents-pending": { icon: FileSignature, tone: "amber" },
  "rooms-in-use": { icon: DoorOpen, tone: "blue" },
  "results-to-review": { icon: FileSearch, tone: "amber" },
  "awaiting-sign-off": { icon: FileCheck2, tone: "amber" },
  "my-appointments": { icon: CalendarClock, tone: "blue" },
  "video-calls-today": { icon: Video, tone: "blue" },
  "patients-triaged": { icon: UserCheck, tone: "emerald" },
  "follow-ups-to-book": { icon: CalendarPlus, tone: "amber" },
};

function RangeSwitcher({ range }: { range: TimeRange }) {
  const options: TimeRange[] = ["today", "7d", "30d"];
  return (
    <div className="inline-flex items-center bg-surface-hover border border-divider rounded-card p-0.5 shrink-0">
      {options.map((r) => (
        <button
          key={r}
          onClick={() => setKpiRange(r)}
          className={`px-3 py-1.5 text-xs font-bold rounded-control transition-colors ${
            range === r ? "bg-ink text-white" : "text-ink-muted hover:text-ink-soft"
          }`}
        >
          {RANGE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

// Every catalog entry renders as the Stat family's T1 `card` tier — the
// catalog itself is variant-agnostic data (see kpiData.ts), so the tier is
// chosen here, at the render site.
function KpiCard({ kpi, locked, range, onOpen }: {
  kpi: Kpi;
  locked: boolean;
  range: TimeRange;
  onOpen: (route?: string) => void;
}) {
  const entry = KPI_ICON[kpi.id];
  return (
    <Stat
      stat={{ ...kpi, variant: "card" }}
      range={range}
      locked={locked}
      // Today's cards are a live glance at right-now counts, not a drill-down
      // entry point — only 7d/30d have a real filtered list behind them.
      clickable={range !== "today"}
      icon={entry?.icon ?? Activity}
      iconTone={entry?.tone ?? "blue"}
      onOpen={onOpen}
    />
  );
}

// The KPI Bar owns the global time-range selection (shared store) and the
// "Customise" modal's open state, so it is a fully self-contained region of
// the dashboard — the rest of the page never needs to know about either.
// Split into a hook + two presentational pieces (KpiControls / KpiCards) so
// the caller can place the range switcher and Customise button on the
// greeting row instead of their own dedicated line, while the card grid
// still renders as a single block underneath.
export function useKpiBar() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const range = useKpiRange();
  const config = KPI_CONFIG[role];
  const [selected, setSelected] = useState<string[]>(config.defaultSelected);
  const [customiseOpen, setCustomiseOpen] = useState(false);

  // DashboardPage never remounts on a role switch (it's the same route), so
  // without this, switching roles could leave `selected` holding stale ids
  // from the previous role's pool.
  useEffect(() => {
    setSelected(config.defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const configurableCards = selected
    .map((id) => config.pool.find((k) => k.id === id))
    .filter((k): k is Kpi => Boolean(k));

  const openRoute = (route?: string) => {
    if (route) navigate(route);
    else toast("Opening filtered list (demo)");
  };

  return { range, config, selected, setSelected, customiseOpen, setCustomiseOpen, configurableCards, openRoute };
}

export type KpiBarState = ReturnType<typeof useKpiBar>;

export function KpiControls({ kpi }: { kpi: KpiBarState }) {
  return (
    <div className="flex items-center gap-3">
      <RangeSwitcher range={kpi.range} />
      <button
        onClick={() => kpi.setCustomiseOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-page hover:border-border-strong transition-colors"
      >
        <Settings2 className="w-4 h-4" /> Customise KPIs
      </button>
    </div>
  );
}

export function KpiCards({ kpi }: { kpi: KpiBarState }) {
  return (
    <>
      <div className="@container">
        <div className="grid grid-cols-2 @[760px]:grid-cols-4 gap-4">
          {kpi.config.locked.map((k) => (
            <KpiCard key={k.id} kpi={k} locked range={kpi.range} onOpen={kpi.openRoute} />
          ))}
          {kpi.configurableCards.map((k) => (
            <KpiCard key={k.id} kpi={k} locked={false} range={kpi.range} onOpen={kpi.openRoute} />
          ))}
        </div>
      </div>

      {kpi.customiseOpen && (
        <CustomiseModal
          locked={kpi.config.locked}
          pool={kpi.config.pool}
          selected={kpi.selected}
          range={kpi.range}
          onClose={() => kpi.setCustomiseOpen(false)}
          onSave={(next) => {
            kpi.setSelected(next);
            kpi.setCustomiseOpen(false);
            toast.success("KPI cards updated.");
          }}
        />
      )}
    </>
  );
}

function CustomiseModal({
  locked,
  pool,
  selected,
  range,
  onClose,
  onSave,
}: {
  locked: Kpi[];
  pool: Kpi[];
  selected: string[];
  range: TimeRange;
  onClose: () => void;
  onSave: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const atLimit = draft.length >= 2;

  const toggle = (id: string) => {
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, id];
    });
  };

  return (
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <div>
            <h2 className="text-lg font-bold text-ink">Customise Your KPI Cards</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              The first two cards are set by your clinic and cannot be changed. Choose two additional metrics below.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="text-xs text-ink-muted bg-surface-page border border-divider rounded-control px-3 py-2">
            Live metrics always show current values regardless of the selected time range.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* Locked preview */}
          <div className="mb-6">
            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Default metrics (locked)</div>
            <div className="grid grid-cols-2 gap-3">
              {locked.map((kpi) => (
                <div key={kpi.id} className="border border-divider rounded-control bg-surface-page p-3 flex items-center justify-between opacity-80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-label font-bold text-ink-muted uppercase tracking-wider">{kpi.label}</span>
                      <span className="px-1.5 py-0.5 rounded-control text-overline bg-surface-sunken text-ink-soft">
                        {metricKindLabel(kpi.kind)}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-ink-soft mt-1">{kpi.byRange[range].value}</div>
                  </div>
                  <Lock className="w-4 h-4 text-ink-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Configurable choices */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Additional metrics</div>
            <div className="text-xs font-medium text-ink-muted">{draft.length} / 2 selected</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pool.map((kpi) => {
              const isSelected = draft.includes(kpi.id);
              const isDisabled = !isSelected && atLimit;
              return (
                <button
                  key={kpi.id}
                  onClick={() => toggle(kpi.id)}
                  disabled={isDisabled}
                  className={`text-left border rounded-control p-3 transition-all relative
                    ${isSelected ? "border-border-strong bg-surface-page ring-1 ring-divider" : isDisabled ? "border-divider bg-surface-page opacity-50 cursor-not-allowed" : "border-divider bg-surface hover:border-border-strong"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-bold text-ink">{kpi.label}</div>
                      <span className="px-1.5 py-0.5 rounded-control text-overline bg-surface-hover text-ink-muted">
                        {metricKindLabel(kpi.kind)}
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-control border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "bg-surface-sunken border-border-strong" : "border-divider bg-surface"}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted mt-1 leading-snug">{kpi.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-divider flex justify-end gap-3 bg-surface-page shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={draft.length !== 2}
            className={`px-6 py-2 rounded-control text-sm font-bold text-white transition-colors ${draft.length === 2 ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
