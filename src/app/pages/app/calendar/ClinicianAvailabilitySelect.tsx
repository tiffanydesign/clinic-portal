import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../../components/ui/tooltip";

export type ClinicianOption = { id: string; name: string; available: boolean; reason?: string };

// A single-select popover purpose-built for "assign clinician" pickers:
// available clinicians sort to the top so Admin sees who they CAN pick
// before scrolling past who they can't, and unavailable rows use
// aria-disabled (never the native `disabled` attribute, which suppresses
// hover in some browsers) so a Tooltip explaining why still works on mouse
// hover, per the same "gate button" idea as the rest of the app: an
// unavailable option stays inspectable, it just can't be activated.
export function ClinicianAvailabilitySelect({
  options, value, onChange,
}: {
  options: ClinicianOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const sorted = [...options].sort((a, b) => Number(b.available) - Number(a.available));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 bg-white outline-none transition-colors hover:border-gray-400 focus:border-slate-500"
      >
        <span className="truncate">{selected?.name ?? "Select clinician…"}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {sorted.map((o) => {
              const isSelected = o.id === value;
              const row = (
                <button
                  key={o.id}
                  type="button"
                  aria-disabled={!o.available}
                  onClick={() => { if (o.available) { onChange(o.id); setOpen(false); } }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md mx-1 transition-colors
                    ${o.available ? "text-gray-700 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}
                    ${isSelected ? "font-bold text-slate-700 bg-slate-50" : ""}`}
                  style={{ width: "calc(100% - 8px)" }}
                >
                  <span className="w-3.5 shrink-0">{isSelected && <Check className="w-3.5 h-3.5" />}</span>
                  <span className="truncate">{o.name}</span>
                </button>
              );
              if (o.available) return row;
              return (
                <Tooltip key={o.id}>
                  <TooltipTrigger asChild>{row}</TooltipTrigger>
                  <TooltipContent side="right">{o.reason}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
