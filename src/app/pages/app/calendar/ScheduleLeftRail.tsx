// Left rail for the My Schedule view: mini month calendar, patient search, and
// the layer toggles that show/hide appointment types, video, and the
// availability overlay. Pure presentational + callbacks; the parent owns state.
import React from "react";
import { Search, X, Check } from "lucide-react";
import { MiniCalendar } from "./MiniCalendar";
import {
  ScheduleRole, LayerState, TypeBucket, TYPE_BUCKETS, TYPE_LAYER_COLOR,
} from "./myScheduleData";

export type LayerKey = "mine" | "video" | "availability" | TypeBucket;

function LayerRow({ label, count, color, checked, onToggle, striped }: {
  label: string; count?: number; color: string; checked: boolean; onToggle: () => void; striped?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-card hover:bg-surface-hover transition-colors text-left group"
    >
      <span
        className={`w-4 h-4 rounded-control shrink-0 flex items-center justify-center border transition-colors ${
          checked ? `${color} border-transparent` : "bg-surface border-divider group-hover:border-border-strong"
        } ${striped && checked ? "bg-[repeating-linear-gradient(45deg,var(--text-muted),var(--text-muted)_2px,#d1d5db_2px,#d1d5db_4px)]" : ""}`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className={`flex-1 text-sm truncate ${checked ? "text-ink-soft font-medium" : "text-ink-muted"}`}>{label}</span>
      {count !== undefined && (
        <span className={`text-xs font-bold tabular-nums shrink-0 ${checked ? "text-ink-muted" : "text-ink-muted"}`}>{count}</span>
      )}
    </button>
  );
}

export function ScheduleLeftRail({
  role, selectedDate, today, onSelectDate, hasApptsOn,
  search, onSearch, layers, onToggleLayer, counts,
  possessive = true, showAvailabilityToggle = true,
}: {
  role: ScheduleRole;
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  hasApptsOn: (d: Date) => boolean;
  search: string;
  onSearch: (v: string) => void;
  layers: LayerState;
  onToggleLayer: (key: LayerKey) => void;
  counts: { mine: number; video: number; types: Record<TypeBucket, number> };
  // Staff Management views someone else's schedule read-only — "My
  // appointments" / "My availability" wording (and the availability layer
  // itself, which has no real per-staff data behind it yet) only make sense
  // when the viewer is looking at their own Calendar.
  possessive?: boolean;
  showAvailabilityToggle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto">
      <MiniCalendar selectedDate={selectedDate} today={today} onSelectDate={onSelectDate} hasApptsOn={hasApptsOn} />

      {/* patient search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={possessive ? "Search my patients…" : "Search patients…"}
          className="w-full pl-9 pr-9 py-2 border border-divider rounded-card text-sm text-ink bg-surface outline-none focus:border-border-strong focus:ring-2 focus:ring-divider"
        />
        {search && (
          <button onClick={() => onSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-full">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* layers */}
      <div>
        <h4 className="text-label font-bold text-ink-muted uppercase tracking-wider px-2 mb-1">Layers</h4>
        <LayerRow label={possessive ? "My appointments" : "Appointments"} count={counts.mine} color="bg-surface-sunken" checked={layers.mine} onToggle={() => onToggleLayer("mine")} />
        {role === "Clinician" && (
          <>
            <LayerRow label="Video consultations" count={counts.video} color="bg-info-ink" checked={layers.video} onToggle={() => onToggleLayer("video")} />
            {showAvailabilityToggle && (
              <LayerRow label={possessive ? "My availability" : "Availability"} color="bg-ink-muted" checked={layers.availability} onToggle={() => onToggleLayer("availability")} striped />
            )}
          </>
        )}
      </div>

      <div>
        <h4 className="text-label font-bold text-ink-muted uppercase tracking-wider px-2 mb-1">Appointment types</h4>
        {TYPE_BUCKETS.map((t) => (
          <LayerRow
            key={t}
            label={t}
            count={counts.types[t]}
            color={TYPE_LAYER_COLOR[t]}
            checked={layers.types[t]}
            onToggle={() => onToggleLayer(t)}
          />
        ))}
      </div>
    </div>
  );
}
