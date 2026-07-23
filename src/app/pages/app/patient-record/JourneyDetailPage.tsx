import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, Check, Clock, Circle, SkipForward, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { JourneyStep, journeyStatusPillType, journeyProgress } from "./patientRecordData";
import { StatusPill } from "../dashboard/DashboardShared";

function StepIcon({ status }: { status: JourneyStep["status"] }) {
  if (status === "Completed") return <div className="w-8 h-8 rounded-full bg-success-ink flex items-center justify-center shrink-0"><Check className="w-4 h-4 text-white" /></div>;
  if (status === "In Progress") return <div className="w-8 h-8 rounded-full bg-surface-sunken ring-4 ring-divider flex items-center justify-center shrink-0 animate-pulse"><Clock className="w-4 h-4 text-white" /></div>;
  if (status === "Skipped") return <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center shrink-0"><SkipForward className="w-4 h-4 text-white" /></div>;
  return <div className="w-8 h-8 rounded-full border-2 border-divider bg-surface flex items-center justify-center shrink-0"><Circle className="w-3 h-3 text-ink-muted" /></div>;
}

function StepNode({ step, isLast, nurseControls, onMarkStarted, onMarkComplete, onSkip }: {
  step: JourneyStep; isLast: boolean; nurseControls: boolean;
  onMarkStarted: () => void; onMarkComplete: () => void; onSkip: () => void;
}) {
  const [expanded, setExpanded] = useState(step.status === "In Progress");
  const [note, setNote] = useState("");
  const muted = step.status === "Pending" || step.status === "Skipped";

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} />
        {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${step.status === "Completed" ? "bg-success" : "bg-surface-sunken"}`} />}
      </div>
      <div className="flex-1 pb-6 min-w-0">
        <button onClick={() => setExpanded((e) => !e)} className="w-full text-left">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-bold ${muted ? "text-ink-muted" : "text-ink"}`}>{step.name}</span>
            <span className="text-xs font-medium text-ink-muted shrink-0">{step.status}</span>
          </div>
          {step.status === "Skipped" && step.skipReason && <div className="text-xs text-ink-muted mt-0.5">{step.skipReason}</div>}
          {step.at && <div className="text-xs text-ink-muted mt-0.5">{step.by} · {step.at}</div>}
          {step.waitedMin != null && step.waitedMin > 0 && (
            <span className="inline-flex items-center text-label font-bold text-warning-ink bg-warning/10 border border-warning/30 rounded-control px-1.5 py-0.5 mt-1">
              Waited {step.waitedMin} min
            </span>
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {step.notes && step.notes.length > 0 && (
              <div className="space-y-1.5">
                {step.notes.map((n, i) => <div key={i} className="text-xs text-ink-soft bg-surface-page border border-divider rounded-control px-3 py-2">{n}</div>)}
              </div>
            )}
            {step.attachments && step.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.attachments.map((a) => (
                  <span key={a} className="flex items-center gap-1 text-xs font-medium text-ink-soft bg-surface-page border border-divider rounded-control px-2 py-1"><Paperclip className="w-3 h-3" />{a}</span>
                ))}
              </div>
            )}

            {nurseControls && (
              <div className="border border-divider rounded-card p-3 bg-surface-page space-y-2.5">
                <div className="flex gap-2 flex-wrap">
                  {step.status === "Pending" && (
                    <button onClick={onMarkStarted} className="px-3 py-1.5 bg-ink text-white text-xs font-bold rounded-control hover:bg-ink">Mark as Started</button>
                  )}
                  {step.status === "In Progress" && (
                    <button onClick={onMarkComplete} className="px-3 py-1.5 bg-success-ink text-white text-xs font-bold rounded-control hover:bg-success-ink">Mark as Complete</button>
                  )}
                  {(step.status === "Pending" || step.status === "In Progress") && (
                    <button onClick={onSkip} className="px-3 py-1.5 border border-divider bg-surface text-ink-soft text-xs font-bold rounded-control hover:bg-surface-hover flex items-center gap-1.5">
                      <SkipForward className="w-3.5 h-3.5" /> Skip
                    </button>
                  )}
                  <button onClick={() => toast("Attachment upload (demo)")} className="px-3 py-1.5 border border-divider bg-surface text-ink-soft text-xs font-bold rounded-control hover:bg-surface-hover flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Add Attachment</button>
                </div>
                <div className="flex gap-2">
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for this step…" className="flex-1 px-3 py-1.5 border border-divider rounded-control text-xs outline-none focus:border-border-strong bg-surface" />
                  <button onClick={() => { if (note.trim()) { toast.success("Note added."); setNote(""); } }} className="px-3 py-1.5 border border-divider bg-surface text-ink-soft text-xs font-bold rounded-control hover:bg-surface-hover">Add Note</button>
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

  if (!journey) return <div className="p-4 text-center text-ink-muted italic">Journey not found.</div>;

  const { done, total } = journeyProgress({ ...journey, steps });
  const nurseControls = role === "Nurse";

  const markStarted = (idx: number) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, status: "In Progress", by: "Berna Koç", at: "Now" } : s)));
  const markComplete = (idx: number) => setSteps((prev) => prev.map((s, i) => {
    if (i === idx) return { ...s, status: "Completed", at: s.at ?? "Now" };
    if (i === idx + 1 && s.status === "Pending") return { ...s, status: "In Progress" as const };
    return s;
  }));
  const markSkipped = (idx: number) => setSteps((prev) => prev.map((s, i) => {
    if (i === idx) return { ...s, status: "Skipped" as const, skipReason: "Skipped by nurse" };
    if (i === idx + 1 && s.status === "Pending") return { ...s, status: "In Progress" as const };
    return s;
  }));

  return (
    <div className="p-4">
      <Link to={`/patients/${patientId}/journeys`} className="flex items-center text-sm font-bold text-ink-muted hover:text-ink mb-6 w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Journeys
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-ink">{journey.name}</h2>
        <StatusPill status={journey.status} type={journeyStatusPillType(journey.status)} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
          <div className="h-full bg-ink-muted rounded-full" style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }} />
        </div>
        <span className="text-xs font-bold text-ink-muted shrink-0">{done}/{total} steps</span>
      </div>

      {!nurseControls && (
        <p className="text-xs text-ink-muted italic mb-4">Read-only — journey steps are managed by the assigned nurse.</p>
      )}

      <div>
        {steps.map((step, i) => (
          <StepNode
            key={step.name}
            step={step}
            isLast={i === steps.length - 1}
            nurseControls={nurseControls}
            onMarkStarted={() => markStarted(i)}
            onMarkComplete={() => markComplete(i)}
            onSkip={() => markSkipped(i)}
          />
        ))}
      </div>
    </div>
  );
}
