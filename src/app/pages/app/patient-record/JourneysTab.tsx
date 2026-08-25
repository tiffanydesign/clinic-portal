import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LayoutGrid, List } from "lucide-react";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { Journey, journeyStatusPillType, journeyProgress } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";
import { JourneyStationBar, journeyTally } from "./JourneyStationBar";

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
        <div className="h-full bg-ink-muted rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-ink-muted shrink-0">{done}/{total} steps</span>
    </div>
  );
}

// One journey, read as a whole: what it is and how far along (header), where
// it stands right now (banner), the shape of the whole visit (station bar),
// and who owns it (footer, inside JourneyStationBar).
//
// Open Journey is the card's primary affordance for an active journey and a
// secondary one for a finished journey — a completed visit is something you
// consult, not something you go and work on. It shows for every role: the
// detail page is read-only unless you're the assigned nurse, and the card no
// longer carries a clickable strip, so hiding the button would leave
// Clinician and Reception with no way into the journey at all.
function JourneyCard({ journey, patientId }: { journey: Journey; patientId: string }) {
  const navigate = useNavigate();
  const { done, total } = journeyProgress(journey);
  const tally = journeyTally(journey.steps);
  const isActive = journey.status === "Active";
  const open = () => navigate(`/patients/${patientId}/journeys/${journey.id}`);

  return (
    <div className="rounded-card bg-surface border border-divider overflow-hidden">
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-divider">
        <h3 className="text-section font-bold text-ink">{journey.name}</h3>
        <StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} />
        <span className="ml-auto flex items-baseline gap-1.5 shrink-0">
          <span className={`text-xs font-bold tabular-nums ${isActive ? "text-info-ink" : "text-success-ink"}`}>
            {done + tally.active} of {total}
          </span>
          <span className="text-xs text-ink-muted">stations</span>
        </span>
        <button
            onClick={open}
            className={`shrink-0 min-h-11 px-4 rounded-control text-xs font-bold transition-colors ${
              isActive ? "btn-primary" : "border border-divider bg-surface text-ink-soft hover:bg-surface-hover"
            }`}
          >
            Open Journey
          </button>
      </div>

      <div className="px-4 py-3.5">
        <JourneyStationBar journey={journey} />
      </div>
    </div>
  );
}

function JourneyTableRow({ journey, patientId }: { journey: Journey; patientId: string }) {
  const navigate = useNavigate();
  const { done, total } = journeyProgress(journey);
  return (
    <tr onClick={() => navigate(`/patients/${patientId}/journeys/${journey.id}`)} className="hover:bg-surface-hover cursor-pointer">
      <td className="px-3 py-2.5 font-bold text-ink-soft">{journey.name}</td>
      <td className="px-3 py-2.5"><StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} /></td>
      <td className="px-3 py-2.5 text-ink-soft">{journey.assignedClinician ?? "—"}</td>
      <td className="px-3 py-2.5 text-ink-soft">{journey.assignedNurse ?? "—"}</td>
      <td className="px-3 py-2.5 text-ink-soft">{journey.startedAt ?? "—"}</td>
      <td className="px-3 py-2.5 text-ink-soft">{journey.completedAt ?? "—"}</td>
      <td className="px-3 py-2.5 w-40"><ProgressBar done={done} total={total} /></td>
    </tr>
  );
}

export function JourneysTab() {
  const { patient, role } = usePatientOutletContext();
  const { patientId } = useParams();
  // The card — header, current/outcome banner, station bar, owners and legend
  // — is what a journey *is* on this page, so every role opens on it. Admin
  // previously landed on the table and never saw the designed surface at all;
  // the toggle still gets them to the compact many-journeys read, but that is
  // now the alternate view rather than the front door.
  const [view, setView] = useState<"cards" | "table">("cards");

  if (patient.journeys.length === 0) {
    return <div className="px-4 py-4 text-center text-ink-muted italic">No journeys started yet.</div>;
  }

  // Nurse works the journey one station at a time and has no use for a
  // spreadsheet of it, so she is never offered the table.
  const canSwitchView = role === "Admin";
  const asCards = !canSwitchView || view === "cards";

  return (
    <div className="px-4 py-4">
      {canSwitchView && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex bg-surface-hover rounded-control p-0.5 border border-divider">
            <button onClick={() => setView("cards")} className={`px-3 py-1 text-xs font-bold rounded-control flex items-center gap-1.5 ${view === "cards" ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted"}`}><LayoutGrid className="w-3.5 h-3.5" /> Cards</button>
            <button onClick={() => setView("table")} className={`px-3 py-1 text-xs font-bold rounded-control flex items-center gap-1.5 ${view === "table" ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted"}`}><List className="w-3.5 h-3.5" /> Table</button>
          </div>
        </div>
      )}

      {asCards ? (
        <div className="space-y-3">
          {patient.journeys.map((j) => <JourneyCard key={j.id} journey={j} patientId={patientId!} />)}
        </div>
      ) : (
        <div className="rounded-card bg-surface overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-page border-b border-divider text-ink-soft">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Journey</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Clinician</th>
                <th className="px-3 py-2.5 font-semibold">Nurse</th>
                <th className="px-3 py-2.5 font-semibold">Started</th>
                <th className="px-3 py-2.5 font-semibold">Completed</th>
                <th className="px-3 py-2.5 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {patient.journeys.map((j) => <JourneyTableRow key={j.id} journey={j} patientId={patientId!} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
