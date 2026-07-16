import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LayoutGrid, List } from "lucide-react";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { Journey, journeyStatusPillType, journeyProgress } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";
import { JourneyProgressStrip } from "../dashboard/journey/JourneyProgress";

// Adapts patientRecordData.ts's own Journey/JourneyStep model (a separate
// shape from dashboard/journey's Appt-based model — see JourneyDetailPage.tsx
// for why) into the strip's plain steps/current/isDone/caption contract.
function journeyStripProps(journey: Journey) {
  const { currentIndex } = journeyProgress(journey);
  const current = journey.steps[currentIndex];
  const captionParts = current ? [current.status, current.by, current.at].filter(Boolean) : [];
  return {
    steps: journey.steps.map((s) => s.name),
    current: currentIndex,
    isDone: journey.status === "Completed",
    caption: captionParts.length > 0 ? captionParts.join(" · ") : undefined,
  };
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-500 shrink-0">{done}/{total} steps</span>
    </div>
  );
}

// Same unified stepper used on every dashboard card and drawer — done/
// current/next for this journey's full step list, not just a bare % bar, so
// "where is this patient right now" reads the same way everywhere it's asked.
function JourneyCard({ journey, patientId, showOpen }: { journey: Journey; patientId: string; showOpen: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="border border-gray-300 rounded-lg bg-white p-5 hover:border-slate-400 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">{journey.name}</h3>
        <StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} />
      </div>
      <JourneyProgressStrip {...journeyStripProps(journey)} onOpen={() => navigate(`/patients/${patientId}/journeys/${journey.id}`)} />
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span>
          {journey.startedAt && <>Started {journey.startedAt} · </>}
          {journey.assignedClinician ?? "—"} · {journey.assignedNurse ?? "—"}
        </span>
        {showOpen && (
          <button onClick={() => navigate(`/patients/${patientId}/journeys/${journey.id}`)} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700">
            Open Journey
          </button>
        )}
      </div>
    </div>
  );
}

function JourneyTableRow({ journey, patientId }: { journey: Journey; patientId: string }) {
  const navigate = useNavigate();
  const { done, total } = journeyProgress(journey);
  return (
    <tr onClick={() => navigate(`/patients/${patientId}/journeys/${journey.id}`)} className="hover:bg-gray-50 cursor-pointer">
      <td className="px-4 py-3 font-bold text-slate-700">{journey.name}</td>
      <td className="px-4 py-3"><StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} /></td>
      <td className="px-4 py-3 text-gray-600">{journey.assignedClinician ?? "—"}</td>
      <td className="px-4 py-3 text-gray-600">{journey.assignedNurse ?? "—"}</td>
      <td className="px-4 py-3 text-gray-600">{journey.startedAt ?? "—"}</td>
      <td className="px-4 py-3 text-gray-600">{journey.completedAt ?? "—"}</td>
      <td className="px-4 py-3 w-40"><ProgressBar done={done} total={total} /></td>
    </tr>
  );
}

export function JourneysTab() {
  const { patient, role } = usePatientOutletContext();
  const { patientId } = useParams();
  const [view, setView] = useState<"cards" | "table">(role === "Admin" ? "table" : "cards");

  if (patient.journeys.length === 0) {
    return <div className="p-8 text-center text-gray-400 italic">No journeys started yet.</div>;
  }

  // Nurse: card-based work queue. Clinician/Reception: compact read-oriented list.
  if (role === "Nurse" || (role !== "Admin" && view === "cards")) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {patient.journeys.map((j) => (
          <JourneyCard key={j.id} journey={j} patientId={patientId!} showOpen={role === "Nurse"} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {role === "Admin" && (
        <div className="flex justify-end mb-4">
          <div className="inline-flex bg-gray-100 rounded p-0.5 border border-gray-200">
            <button onClick={() => setView("table")} className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${view === "table" ? "bg-white text-slate-700 shadow-sm" : "text-gray-500"}`}><List className="w-3.5 h-3.5" /> Table</button>
            <button onClick={() => setView("cards")} className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${view === "cards" ? "bg-white text-slate-700 shadow-sm" : "text-gray-500"}`}><LayoutGrid className="w-3.5 h-3.5" /> Cards</button>
          </div>
        </div>
      )}

      {view === "table" ? (
        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Journey</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Clinician</th>
                <th className="px-4 py-3 font-semibold">Nurse</th>
                <th className="px-4 py-3 font-semibold">Started</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patient.journeys.map((j) => <JourneyTableRow key={j.id} journey={j} patientId={patientId!} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {patient.journeys.map((j) => <JourneyCard key={j.id} journey={j} patientId={patientId!} showOpen={role === "Admin"} />)}
        </div>
      )}
    </div>
  );
}
