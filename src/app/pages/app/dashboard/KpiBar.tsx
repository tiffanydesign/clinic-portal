import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../../context/AppContext";
import { KPI_CONFIG, Kpi } from "./kpiData";
import { Sparkline, DeltaLine } from "./DashboardShared";

function Card({ kpi, locked, onOpen }: { kpi: Kpi; locked: boolean; onOpen: (route?: string) => void }) {
  return (
    <button
      onClick={() => onOpen(kpi.route)}
      className="text-left border border-gray-300 rounded bg-white p-4 flex flex-col justify-between relative hover:border-slate-400 hover:shadow-sm transition-all"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{kpi.label}</span>
        {locked && (
          <span className="relative group/lock shrink-0">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span className="absolute right-0 top-full mt-1 w-44 bg-gray-800 text-white text-[10px] font-medium normal-case tracking-normal px-2.5 py-1.5 rounded shadow-lg opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-20">
              Default metric — set by your clinic
            </span>
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-800 leading-none mb-3">{kpi.value}</div>
      <div className="flex items-end justify-between gap-2">
        {kpi.delta ? <DeltaLine text={kpi.delta.text} trend={kpi.delta.trend} /> : <span />}
        <Sparkline data={kpi.spark} trend={kpi.delta?.trend ?? "flat"} />
      </div>
    </button>
  );
}

// The KPI Bar keeps which 2 configurable cards are shown in local state.
// The "Customise" modal is toggled by the page header via the `open` prop.
export function KpiBar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { role } = useAppContext();
  const navigate = useNavigate();
  const config = KPI_CONFIG[role];
  const [selected, setSelected] = useState<string[]>(config.defaultSelected);

  const configurableCards = selected
    .map((id) => config.pool.find((k) => k.id === id))
    .filter((k): k is Kpi => Boolean(k));

  const openRoute = (route?: string) => {
    if (route) navigate(route);
    else toast("Opening filtered list (demo)");
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {config.locked.map((kpi) => (
          <Card key={kpi.id} kpi={kpi} locked onOpen={openRoute} />
        ))}
        {configurableCards.map((kpi) => (
          <Card key={kpi.id} kpi={kpi} locked={false} onOpen={openRoute} />
        ))}
      </div>

      {open && (
        <CustomiseModal
          locked={config.locked}
          pool={config.pool}
          selected={selected}
          onClose={() => onOpenChange(false)}
          onSave={(next) => {
            setSelected(next);
            onOpenChange(false);
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
  onClose,
  onSave,
}: {
  locked: Kpi[];
  pool: Kpi[];
  selected: string[];
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

        <div className="flex-1 overflow-y-auto p-6">
          {/* Locked preview */}
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Default metrics (locked)</div>
            <div className="grid grid-cols-2 gap-3">
              {locked.map((kpi) => (
                <div key={kpi.id} className="border border-gray-200 rounded bg-gray-50 p-3 flex items-center justify-between opacity-80">
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</div>
                    <div className="text-xl font-bold text-gray-700 mt-1">{kpi.value}</div>
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
                    <div className="text-sm font-bold text-gray-800">{kpi.label}</div>
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
