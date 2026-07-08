import React from "react";
import { Link } from "react-router";
import { Check, ArrowRight, Flag, StickyNote, PauseCircle, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { CurrentPatient, JourneyStep } from "./nurseDashboardData";

type StepState = "completed" | "current" | "upcoming";

function StepIcon({ state }: { state: StepState }) {
  return (
    <div className="w-8 h-8 flex items-center justify-center shrink-0">
      {state === "completed" && (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}
      {state === "current" && (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-slate-400/40 motion-safe:animate-ping" />
          <div className="relative w-8 h-8 rounded-full bg-white border-[3px] border-slate-600 flex items-center justify-center shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          </div>
        </div>
      )}
      {state === "upcoming" && <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />}
    </div>
  );
}

function StepRow({ step, state, isLast }: { step: JourneyStep; state: StepState; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <StepIcon state={state} />
        {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] ${state === "completed" ? "bg-emerald-300" : "bg-gray-200"}`} />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? "pb-1" : "pb-5"}`}>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className={state === "current" ? "text-base font-bold text-gray-800" : state === "completed" ? "text-sm font-medium text-gray-400" : "text-sm font-medium text-gray-400"}>
            {step.label}
          </span>
          {state === "completed" && step.completedTime && <span className="text-xs font-medium text-gray-400 shrink-0">{step.completedTime}</span>}
        </div>
        {state === "current" && (
          <>
            {step.status && <div className="text-sm font-bold text-slate-600 mt-0.5">{step.status}</div>}
            {step.detail && (
              <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-800 leading-relaxed">
                {step.detail}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SecondaryActions() {
  return (
    <div className="flex items-center justify-center gap-5 mt-3">
      <button onClick={() => toast("Note added (demo)")} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
        <StickyNote className="w-3.5 h-3.5" /> Add Note
      </button>
      <button onClick={() => toast.error("Issue flagged (demo)")} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors">
        <Flag className="w-3.5 h-3.5" /> Flag Issue
      </button>
      <button onClick={() => toast("Journey paused (demo)")} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
        <PauseCircle className="w-3.5 h-3.5" /> Pause Journey
      </button>
    </div>
  );
}

function EmptyBody({ hasQueue, onStartNext, heading, subtext }: { hasQueue: boolean; onStartNext: () => void; heading: string; subtext: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${heading === "Journey complete" ? "bg-emerald-50" : "bg-gray-100"}`}>
        {heading === "Journey complete" ? <Check className="w-8 h-8 text-emerald-500" strokeWidth={3} /> : <UserRound className="w-8 h-8 text-gray-400" />}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">{heading}</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{subtext}</p>
      <button
        onClick={onStartNext}
        disabled={!hasQueue}
        className={`px-8 py-3.5 rounded-xl text-base font-bold transition-colors ${hasQueue ? "bg-slate-600 text-white hover:bg-slate-700 shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
      >
        {hasQueue ? "Start Next Patient" : "No patients waiting"}
      </button>
    </div>
  );
}

export function CurrentPatientCard({
  patient,
  hasQueue,
  onAdvanceStep,
  onStartNext,
}: {
  patient: CurrentPatient | null;
  hasQueue: boolean;
  onAdvanceStep: () => void;
  onStartNext: () => void;
}) {
  if (!patient) {
    return (
      <div className="h-full bg-white border border-gray-300 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <EmptyBody hasQueue={hasQueue} onStartNext={onStartNext} heading="No patient in progress" subtext="Start the next patient from your queue to begin their journey." />
      </div>
    );
  }

  const isComplete = patient.currentStepIndex >= patient.steps.length;
  const currentStep = !isComplete ? patient.steps[patient.currentStepIndex] : null;

  return (
    <div className="h-full bg-white border border-gray-300 rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Identity bar */}
      <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-slate-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
            {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-800 truncate">{patient.name}</h2>
              <span className="text-sm text-gray-500 shrink-0">{patient.age}</span>
            </div>
            <div className="text-sm text-gray-600 mt-0.5 truncate">{patient.appointment}</div>
          </div>
        </div>
        <Link to={patient.patientRoute} className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:underline shrink-0">
          Open Patient Record <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isComplete ? (
        <EmptyBody hasQueue={hasQueue} onStartNext={onStartNext} heading="Journey complete" subtext={`${patient.name}'s visit has been fully checked out.`} />
      ) : (
        <>
          {/* Journey stepper */}
          <div className="flex-1 overflow-y-auto p-6 pb-2">
            {patient.steps.map((step, i) => {
              const state: StepState = i < patient.currentStepIndex ? "completed" : i === patient.currentStepIndex ? "current" : "upcoming";
              return <StepRow key={step.label} step={step} state={state} isLast={i === patient.steps.length - 1} />;
            })}
          </div>

          {/* Primary action */}
          <div className="p-6 pt-4 border-t border-gray-200 shrink-0 bg-gray-50">
            <button
              onClick={onAdvanceStep}
              className="w-full py-4 bg-slate-600 text-white text-lg font-bold rounded-xl hover:bg-slate-700 active:bg-slate-800 transition-colors shadow-md"
            >
              {currentStep?.action}
            </button>
            <SecondaryActions />
          </div>
        </>
      )}
    </div>
  );
}
