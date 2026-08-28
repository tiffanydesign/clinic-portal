import React from "react";
import { MapPin, Stethoscope, UserRound } from "lucide-react";
import type { StationConfig } from "./stationJourney";

// Room, devices and staff, rendered from the three separate fields rather
// than one dot-separated string. Three facts of three different kinds get
// three icons, so "Diagnostic Room A" reads as a place and "Berna Koç" reads
// as a person at a glance — which the flat string could never do: at seven
// fragments ("Diagnostic Room A · Generic Tonometer · Generic Vital Signs
// Monitor · Generic ECG System · Generic ABI System · Generic Indirect
// Calorimeter · Berna Koç") it was one unparseable ribbon of text.
//
// Two densities off one source, so the now card and the drawer can never
// disagree about where a station happens:
//   inline  — one tinted block; place and person on a line, devices beneath
//   stacked — a labelled row each, for the drawer's own vertical rhythm

export function hasWhere(cfg: StationConfig): boolean {
  return !!(cfg.room || cfg.staff || cfg.devices?.length);
}

function DeviceList({ devices, className = "" }: { devices: string[]; className?: string }) {
  return (
    <span className={`flex items-start gap-1.5 min-w-0 ${className}`}>
      <Stethoscope className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-px" />
      <span className="text-xs text-ink-muted leading-relaxed text-pretty">{devices.join(" · ")}</span>
    </span>
  );
}

export function StationWhereInline({ cfg }: { cfg: StationConfig }) {
  if (!hasWhere(cfg)) return null;
  return (
    <div className="mt-3 bg-surface-hover rounded-control px-3 py-2.5 flex flex-col gap-1.5">
      {(cfg.room || cfg.staff) && (
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
          {cfg.room && (
            <span className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[color:var(--phenome-blue-500)] shrink-0" />
              <span className="text-label font-bold text-ink-soft truncate">{cfg.room}</span>
            </span>
          )}
          {cfg.staff && (
            <span className="flex items-center gap-1.5 min-w-0">
              <UserRound className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span className="text-label font-semibold text-ink-soft truncate">{cfg.staff}</span>
            </span>
          )}
        </div>
      )}
      {!!cfg.devices?.length && <DeviceList devices={cfg.devices} />}
    </div>
  );
}

function StackedRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-ink-muted">{label}</span>
        <span className="block text-label font-semibold text-ink-soft leading-relaxed text-pretty">{value}</span>
      </span>
    </div>
  );
}

export function StationWhereStacked({ cfg }: { cfg: StationConfig }) {
  if (!hasWhere(cfg)) return null;
  // No container: the icon-plus-label rows already structure themselves, and
  // a third --surface-page box stacked under the drawer's tinted header and
  // its tinted timing well made the whole panel one tone. Instructions below
  // carries no box either, so the two sections now read as one rhythm.
  return (
    <div className="flex flex-col gap-3">
      {cfg.room && (
        <StackedRow
          icon={<MapPin className="w-4 h-4 text-[color:var(--phenome-blue-500)]" />}
          label="Room"
          value={cfg.room}
        />
      )}
      {!!cfg.devices?.length && (
        <StackedRow
          icon={<Stethoscope className="w-4 h-4 text-ink-muted" />}
          label={cfg.devices.length === 1 ? "Device" : `Devices · ${cfg.devices.length}`}
          value={cfg.devices.join(" · ")}
        />
      )}
      {cfg.staff && (
        <StackedRow
          icon={<UserRound className="w-4 h-4 text-ink-muted" />}
          label="Staff"
          value={cfg.staff}
        />
      )}
    </div>
  );
}
