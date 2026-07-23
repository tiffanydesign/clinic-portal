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
        className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-card border text-sm font-bold transition-colors ${
          active ? "border-divider bg-surface-page text-ink-soft" : "border-divider bg-surface text-ink-soft hover:bg-surface-hover"
        }`}
      >
        <FilterIcon className="w-4 h-4" />
        Filter{active ? ` · ${selected.size}` : ""}
        <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
      </button>
      {active && (
        <button onClick={onClear} className="min-h-[44px] px-3 text-sm font-bold text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-card transition-colors">
          Clear
        </button>
      )}

      {open && (
        <FloatingPopover anchorRef={ref} onClose={() => setOpen(false)} align="right">
          <div className="w-72 bg-surface border border-divider rounded-card shadow-xl max-h-96 overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <div className="px-2.5 py-1.5 text-label font-bold text-ink-muted uppercase tracking-wider">{g.label}</div>
                {g.options.map((o) => {
                  const checked = selected.has(o.value);
                  return (
                    <label
                      key={o.value}
                      className="flex items-center gap-2.5 px-2.5 py-2 min-h-[44px] rounded-card cursor-pointer hover:bg-surface-hover"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(o.value)}
                        className="rounded-control border-divider text-ink-soft focus:ring-0"
                      />
                      <span className="text-sm text-ink-soft">{o.label}</span>
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
