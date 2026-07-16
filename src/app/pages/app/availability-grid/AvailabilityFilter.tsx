// Single multi-select Filter dropdown shared by both tabs — replaces the old
// page's full-row name-chips + "All Clinicians"/"All Nurses" button group.
// Grouped by role (People) or room type (Rooms); selection applies
// immediately as each checkbox is toggled, no separate "Apply" step.
import React, { useRef, useState } from "react";
import { ChevronDown, Filter as FilterIcon } from "lucide-react";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";

export type FilterGroup = { label: string; options: { value: string; label: string }[] };

export function AvailabilityFilter({
  groups, selected, onToggle, onClear,
}: {
  groups: FilterGroup[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const active = selected.size > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        ref={ref}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-lg border text-sm font-bold transition-colors ${
          active ? "border-slate-300 bg-slate-50 text-slate-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <FilterIcon className="w-4 h-4" />
        Filter{active ? ` · ${selected.size}` : ""}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {active && (
        <button onClick={onClear} className="min-h-[44px] px-3 text-sm font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          Clear
        </button>
      )}

      {open && (
        <FloatingPopover anchorRef={ref} onClose={() => setOpen(false)} align="right">
          <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{g.label}</div>
                {g.options.map((o) => {
                  const checked = selected.has(o.value);
                  return (
                    <label
                      key={o.value}
                      className="flex items-center gap-2.5 px-2.5 py-2 min-h-[44px] rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(o.value)}
                        className="rounded border-gray-300 text-slate-600 focus:ring-0"
                      />
                      <span className="text-sm text-gray-700">{o.label}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </FloatingPopover>
      )}
    </div>
  );
}
