import React from "react";
import { Info } from "lucide-react";
import { OverrideItem, statusPillClass } from "./availabilityData";

export function DateOverridesSection({ overrides, locked, onAdd }: { overrides: OverrideItem[]; locked: boolean; onAdd: () => void }) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-2">
        <h3 className="text-base font-bold text-gray-800 mr-2">Date overrides</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Booked appointments cannot be overridden. Date overrides are archived automatically when the date has passed.
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Add dates when your availability changes from your daily hours.</p>

      {overrides.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-6">No date overrides yet.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {overrides.map((o) => (
            <div key={o.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{o.date}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${statusPillClass(o.status)}`}>{o.status}</span>
                </div>
                {o.slots.length > 0 ? (
                  <div className="space-y-1">
                    {o.slots.map((s, idx) => (
                      <div key={idx} className="text-xs text-gray-600">{s.start} - {s.end}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 font-medium">Unavailable {o.reason && `(${o.reason})`}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAdd}
        disabled={locked}
        title={locked ? "Withdraw your pending request before adding another override." : undefined}
        className={`w-full py-2.5 border rounded text-sm font-bold transition-colors ${locked ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed" : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"}`}
      >
        + Add an override
      </button>
    </div>
  );
}
