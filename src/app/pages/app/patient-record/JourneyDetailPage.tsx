import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, Check, Clock, Circle, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { JourneyStep, journeyStatusPillType, journeyProgress } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";

function StepIcon({ status }: { status: JourneyStep["status"] }) {
  if (status === "Completed") return <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check className="w-4 h-4 text-white" /></div>;
  if (status === "In Progress") return <div className="w-8 h-8 rounded-full bg-slate-600 ring-4 ring-slate-100 flex items-center justify-center shrink-0 animate-pulse"><Clock className="w-4 h-4 text-white" /></div>;
  return <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shrink-0"><Circle className="w-3 h-3 text-gray-300" /></div>;
}

function StepNode({ step, index, isLast, nurseControls, onMarkStarted, onMarkComplete }: {
  step: JourneyStep; index: number; isLast: boolean; nurseControls: boolean;
  onMarkStarted: () => void; onMarkComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(step.status === "In Progress");
  const [note, setNote] = useState("");

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} />
        {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${step.status === "Completed" ? "bg-emerald-300" : "bg-gray-200"}`} />}
      </div>
      <div className="flex-1 pb-6 min-w-0">
        <button onClick={() => setExpanded((e) => !e)} className="w-full text-left">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${step.status === "Pending" ? "text-gray-400" : "text-gray-800"}`}>{step.name}</span>
            <span className="text-xs font-medium text-gray-400">{step.status}</span>
          </div>
          {step.at && <div className="text-xs text-gray-500 mt-0.5">{step.by} · {step.at}</div>}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {step.notes && step.notes.length > 0 && (
              <div className="space-y-1.5">
                {step.notes.map((n, i) => <div key={i} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">{n}</div>)}
              </div>
            )}
            {step.attachments && step.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.attachments.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1"><Paperclip className="w-3 h-3" />{a}</span>
                ))}
              </div>
            )}

            {nurseControls && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2.5">
                <div className="flex gap-2">
                  {step.status === "Pending" && (
                    <button onClick={onMarkStarted} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700">Mark as Started</button>
                  )}
                  {step.status === "In Progress" && (
                    <button onClick={onMarkComplete} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700">Mark as Complete</button>
                  )}
                  <button onClick={() => toast("Attachment upload (demo)")} className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded hover:bg-gray-50 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Add Attachment</button>
                </div>
                <div className="flex gap-2">
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for this step…" className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs outline-none focus:border-slate-500 bg-white" />
                  <button onClick={() => { if (note.trim()) { toast.success("Note added."); setNote(""); } }} className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded hover:bg-gray-50">Add Note</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function JourneyDetailPage() {
  const { patient, role } = usePatientOutletContext();
  const { patientId, journeyId } = useParams();
  const journey = patient.journeys.find((j) => j.id === journeyId);
  const [steps, setSteps] = useState(journey?.steps ?? []);

  if (!journey) return <div className="p-8 text-center text-gray-400 italic">Journey not found.</div>;

  const { done, total } = journeyProgress({ ...journey, steps });
  const nurseControls = role === "Nurse";

  const markStarted = (idx: number) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, status: "In Progress", by: "Berna Koç", at: "Now" } : s)));
  const markComplete = (idx: number) => setSteps((prev) => prev.map((s, i) => {
    if (i === idx) return { ...s, status: "Completed", at: s.at ?? "Now" };
    if (i === idx + 1 && s.status === "Pending") return { ...s, status: "In Progress" as const };
    return s;
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to={`/patients/${patientId}/journeys`} className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Journeys
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-800">{journey.name}</h2>
        <StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-500 shrink-0">{done}/{total} steps</span>
      </div>

      {!nurseControls && (
        <p className="text-xs text-gray-400 italic mb-4">Read-only — journey steps are managed by the assigned nurse.</p>
      )}

      <div>
        {steps.map((step, i) => (
          <StepNode
            key={step.name}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
            nurseControls={nurseControls}
            onMarkStarted={() => markStarted(i)}
            onMarkComplete={() => markComplete(i)}
          />
        ))}
      </div>
    </div>
  );
}
