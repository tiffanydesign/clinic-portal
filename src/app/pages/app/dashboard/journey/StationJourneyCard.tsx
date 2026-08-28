import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { StationJourney } from "./useStationJourney";
import { StationPhaseRail } from "./StationPhaseRail";
import { StationNowCard } from "./StationNowCard";
import { StationDoneGroup, StationNextGroup } from "./StationJourneySections";
import { StationDetailDrawer } from "./StationDetailDrawer";
import { StationDialogs } from "./StationDialogs";

// Identity bar. The meta string arrives as "Full-day assessment · 08:00 ·
// Berna Koç · Diagnostic Room A"; the procedure leads it and is what the
// nurse scans for, so it carries the weight and the rest stays a quiet
// dotted trail.
function PatientHeader({
  patientName, patientTag, patientMeta, patientRoute, flagged,
}: {
  patientName: string; patientTag: string; patientMeta: string; patientRoute: string; flagged: boolean;
}) {
  const initials = patientName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const [procedure, ...rest] = patientMeta.split(" · ");

  return (
    <header className="flex items-center gap-3 px-5 py-3 border-b border-divider shrink-0">
      <div className="w-10 h-10 rounded-full bg-surface-hover text-ink-soft flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>

      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-section text-ink truncate">{patientName}</h2>
          <span className="text-xs font-semibold text-ink-muted shrink-0">{patientTag}</span>
          {flagged && (
            <span className="text-xs font-bold text-white bg-danger-fill rounded-full px-2 py-0.5 shrink-0">⚑ Flagged</span>
          )}
        </div>
        <div className="text-xs text-ink-muted flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-ink-soft">{procedure}</span>
          {rest.map((part) => (
            <React.Fragment key={part}>
              <span className="text-ink-muted/50">·</span>
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Link
        to={patientRoute}
        className="ml-auto shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3 rounded-control border border-divider bg-surface text-xs font-bold text-ink-soft hover:bg-surface-hover transition-colors"
      >
        Open Patient Record
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </header>
  );
}

// The redesigned Patient Journey panel. Four densities, top to bottom:
//   1. the phase rail — all sixteen stations, always visible, one tick each
//   2. the done group — collapsed to a count, a span and eight ticks
//   3. the now card — the one station she can act on, in full
//   4. the next group — the next station named, the rest behind a disclosure
// plus a drawer (any station, on demand) layered over the whole panel.
//
// What this replaces: a single flat list that printed all sixteen stations
// with their instructions inline. It was correct and unusable — several
// screens tall, with the one actionable station and its CTA below the fold.
export function StationJourneyCard({
  journey, patientName, patientTag, patientMeta, patientRoute,
}: {
  journey: StationJourney;
  patientName: string;
  patientTag: string;
  patientMeta: string;
  patientRoute: string;
}) {
  return (
    <div className="relative h-full bg-surface rounded-card flex flex-col overflow-hidden">
      <PatientHeader
        patientName={patientName}
        patientTag={patientTag}
        patientMeta={patientMeta}
        patientRoute={patientRoute}
        flagged={journey.flagged}
      />

      <StationPhaseRail journey={journey} />

      <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
        <StationDoneGroup journey={journey} />
        <StationNowCard journey={journey} />
        <StationNextGroup journey={journey} />
      </div>

      <StationDetailDrawer journey={journey} />
      <StationDialogs journey={journey} />
    </div>
  );
}
