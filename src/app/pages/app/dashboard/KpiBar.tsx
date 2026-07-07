import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, X, Check, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../../context/AppContext";
import { KPI_CONFIG, Kpi, metricKindLabel } from "./kpiData";
import { Sparkline, DeltaLine, AnimatedNumber, sentimentFor } from "./DashboardShared";
import { TimeRange, useKpiRange, setKpiRange, RANGE_LABEL, RANGE_PILL } from "./kpiRangeStore";

function RangeSwitcher({ range }: { range: TimeRange }) {
  const options: TimeRange[] = ["today", "7d", "30d"];
  return (
    <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-lg p-0.5 shrink-0">
      {options.map((r) => (
        <button
          key={r}
          onClick={() => setKpiRange(r)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
            range === r ? "bg-slate-800 text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {RANGE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

function Card({
  kpi,
  locked,
  range,
  onOpen,
}: {
  kpi: Kpi;
  locked: boolean;
  range: TimeRange;
  onOpen: (route?: string) => void;
}) {
  const rv = kpi.byRange[range];
  const label = rv.label ?? kpi.label;
  const isLive = kpi.kind === "live";
  const pillText = isLive ? "LIVE" : RANGE_PILL[range];
  const inverse = rv.inverse ?? kpi.inverse ?? false;
  const sparkSentiment = rv.informational ? "neutral" : sentimentFor(rv.trend, inverse);

  return (
    <button
      onClick={() => onOpen(kpi.route)}
      className="text-left border border-gray-300 rounded bg-white p-4 flex flex-col justify-between relative hover:border-slate-400 hover:shadow-sm transition-all"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isLive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
            }`}
          >
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {pillText}
          </span>
          {locked && (
            <span className="relative group/lock">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span className="absolute right-0 top-full mt-1 w-44 bg-gray-800 text-white text-[10px] font-medium normal-case tracking-normal px-2.5 py-1.5 rounded shadow-lg opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-20">
                Default metric — set by your clinic
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-800 leading-none mb-3">
        <AnimatedNumber value={rv.value} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <DeltaLine text={rv.deltaText} trend={rv.trend} inverse={inverse} informational={rv.informational} />
        <Sparkline data={rv.spark} trend={rv.trend} inverse={inverse} sentiment={rv.informational ? "neutral" : undefined} />
      </div>
    </button>
  );
}

// The KPI Bar owns the global time-range selection (shared store) and the
// "Customise" modal's open state, so it is a fully self-contained region of
// the dashboard — the rest of the page never needs to know about either.
export function KpiBar() {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const range = useKpiRange();
  const config = KPI_CONFIG[role];
  const [selected, setSelected] = useState<string[]>(config.defaultSelected);
  const [customiseOpen, setCustomiseOpen] = useState(false);

  const configurableCards = selected
    .map((id) => config.pool.find((k) => k.id === id))
    .filter((k): k is Kpi => Boolean(k));

  const openRoute = (route?: string) => {
    if (route) navigate(route);
    else toast("Opening filtered list (demo)");
  };

  return (
    <>
      <div className="flex justify-end items-center gap-3 mb-3">
        <RangeSwitcher range={range} />
        <button
          onClick={() => setCustomiseOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50 hover:border-slate-400 transition-colors"
        >
          <Settings2 className="w-4 h-4" /> Customise KPIs
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {config.locked.map((kpi) => (
          <Card key={kpi.id} kpi={kpi} locked range={range} onOpen={openRoute} />
        ))}
        {configurableCards.map((kpi) => (
          <Card key={kpi.id} kpi={kpi} locked={false} range={range} onOpen={openRoute} />
        ))}
      </div>

      {customiseOpen && (
        <CustomiseModal
          locked={config.locked}
          pool={config.pool}
          selected={selected}
          range={range}
          onClose={() => setCustomiseOpen(false)}
          onSave={(next) => {
            setSelected(next);
            setCustomiseOpen(false);
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
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Customise Your KPI Cards</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              The first two cards are set by your clinic and cannot be changed. Choose two additional metrics below.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            Live metrics always show current values regardless of the selected time range.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* Locked preview */}
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Default metrics (locked)</div>
            <div className="grid grid-cols-2 gap-3">
              {locked.map((kpi) => (
                <div key={kpi.id} className="border border-gray-200 rounded bg-gray-50 p-3 flex items-center justify-between opacity-80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">
                        {metricKindLabel(kpi.kind)}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gray-700 mt-1">{kpi.byRange[range].value}</div>
                  </div>
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Configurable choices */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional metrics</div>
            <div className="text-xs font-medium text-gray-400">{draft.length} / 2 selected</div>
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
                  className={`text-left border rounded p-3 transition-all relative
                    ${isSelected ? "border-slate-500 bg-slate-50 ring-1 ring-slate-200" : isDisabled ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" : "border-gray-300 bg-white hover:border-slate-400"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-bold text-gray-800">{kpi.label}</div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                        {metricKindLabel(kpi.kind)}
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "bg-slate-600 border-slate-600" : "border-gray-300 bg-white"}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{kpi.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={draft.length !== 2}
            className={`px-6 py-2 rounded text-sm font-bold text-white transition-colors ${draft.length === 2 ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
