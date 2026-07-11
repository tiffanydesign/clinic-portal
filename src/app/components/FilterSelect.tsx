import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

// Shared single-select control for every filter dropdown and time/date
// picker in the app. Wraps Radix Select (portal-rendered, so it can never be
// clipped by a scrolling/blurred ancestor the way a plain absolutely
// positioned popover can — see the Schedule filter dropdown fix earlier this
// session) but skins it entirely in the app's own visual language rather
// than the vendored shadcn defaults.
//
// Radix Select disallows an Item with value="" (it's reserved to mean "no
// selection"), but this codebase's filters rely on "" as the "All ..."
// sentinel throughout. ALL_SENTINEL bridges that: internally swapped in for
// any option whose real value is "", and swapped back out in onChange, so
// every call site's existing state/logic needs zero changes.
const ALL_SENTINEL = "__all__";

export type FilterSelectOption = { value: string; label: string } | string;

function normalize(options: FilterSelectOption[]): { value: string; label: string }[] {
  return options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

export function FilterSelect({
  value, onChange, options, placeholder, className, disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const normalized = normalize(options);
  const radixValue = value === "" ? ALL_SENTINEL : value;

  return (
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(v) => onChange(v === ALL_SENTINEL ? "" : v)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white shadow-sm outline-none transition-colors hover:border-gray-400 focus:border-slate-500 data-[state=open]:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 ${className ?? ""}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] max-h-72 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100"
        >
          <SelectPrimitive.Viewport className="p-1 overflow-y-auto max-h-72">
            {normalized.map((o) => {
              const v = o.value === "" ? ALL_SENTINEL : o.value;
              return (
                <SelectPrimitive.Item
                  key={v}
                  value={v}
                  className="relative flex items-center gap-2 pl-7 pr-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer select-none outline-none data-[highlighted]:bg-gray-50 data-[state=checked]:font-bold data-[state=checked]:text-slate-700"
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
                    <Check className="w-3.5 h-3.5" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
