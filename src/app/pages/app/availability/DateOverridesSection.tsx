import React from "react";
import { Info, Pencil, Trash2 } from "lucide-react";
import { OverrideItem, overrideStatusPillClass, fmtSlots } from "./availabilityData";

export function DateOverridesSection({ overrides, onAdd, onEdit, onDelete }: {
  overrides: OverrideItem[];
  onAdd: () => void;
  onEdit: (o: OverrideItem) => void;
  onDelete: (o: OverrideItem) => void;
}) {
  const visible = overrides.filter((o) => o.status !== "Rejected");

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-2">
        <h3 className="text-base font-bold text-gray-800 mr-2">Date overrides</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Set different working hours for a specific date. For full days off, use Leave instead.
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Adjust your working hours for a specific date.</p>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-6">No date overrides yet.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {visible.map((o) => {
            const locked = o.status === "Pending";
            return (
              <div key={o.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{o.date}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${overrideStatusPillClass(o.status)}`}>{o.status}</span>
                  </div>
                  <div className="text-xs text-gray-600">{o.pendingAction === "delete" ? "Pending removal" : fmtSlots(o.slots)}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => !locked && onEdit(o)}
                    disabled={locked}
                    title={locked ? "Locked while pending approval" : "Edit"}
                    className={`p-1.5 rounded transition-colors ${locked ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-slate-600 hover:bg-gray-100"}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => !locked && onDelete(o)}
                    disabled={locked}
                    title={locked ? "Locked while pending approval" : "Delete"}
                    className={`p-1.5 rounded transition-colors ${locked ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onAdd} className="w-full py-2.5 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        + Add an override
      </button>
    </div>
  );
}
