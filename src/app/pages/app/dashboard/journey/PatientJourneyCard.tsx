import React from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Check, Clock, Flag, PauseCircle, PlayCircle, SkipForward, StickyNote, Undo2, UserRound } from "lucide-react";
import type { StepRenderState, StepRow } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";
import { ExitConfirmPopover, GoBackDialog, NotePopover, SkipDialog } from "./JourneyDialogs";

const SEGMENT_CLASS: Record<StepRenderState, string> = {
  done: "bg-emerald-500",
  prog: "bg-blue-500 motion-safe:animate-pulse",
  wait: "bg-amber-400",
  up: "bg-gray-200",
  skip: "bg-[repeating-linear-gradient(45deg,#d1d5db,#d1d5db_3px,#e5e7eb_3px,#e5e7eb_6px)]",
};

function ProgressBar({ segments }: { segments: StepRenderState[] }) {
  return (
    <div className="flex gap-1">
      {segments.map((s, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${SEGMENT_CLASS[s]}`} />)}
    </div>
  );
}

function StepNode({ state }: { state: StepRenderState }) {
  if (state === "done") return <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" strokeWidth={3} /></div>;
  if (state === "skip") return <div className="w-6 h-6 rounded-lg bg-gray-100 border border-gray-300 text-gray-400 flex items-center justify-center shrink-0"><SkipForward className="w-3.5 h-3.5" /></div>;
  if (state === "prog") {
    return (
      <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-400/40 motion-safe:animate-ping" />
        <div className="relative w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>
    );
  }
  return <div className="w-[18px] h-[18px] m-[3px] rounded-full border-2 border-gray-300 bg-white shrink-0" />;
}

function StepBody({ row }: { row: StepRow }) {
  const nameCls =
    row.state === "done" ? "text-gray-400 font-semibold" :
    row.state === "prog" ? "text-navy font-extrabold text-slate-800" :
    row.state === "skip" ? "text-gray-400 line-through decoration-gray-300 font-semibold" :
    "text-gray-400 font-semibold";
  return (
    <div className={`flex-1 min-w-0 ${row.notLast ? "pb-4" : "pb-1"}`}>
      {row.showWaited && (
        <div className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mb-1">
          Waited {row.waited} min
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className={`min-w-0 truncate text-sm ${nameCls}`}>{row.name}</span>
        {row.showOwner && <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{row.owner}</span>}
        {row.showWaitLive && <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">◷ Waiting · {row.waitLive} min</span>}
        <span className="ml-auto shrink-0 text-xs font-bold text-gray-500 tabular-nums">
          {row.showTime && row.timeTxt}
          {row.showDur && row.durTxt}
        </span>
      </div>
      {row.showProg && <div className="text-xs font-extrabold text-blue-600 tabular-nums mt-0.5">{row.progTxt}</div>}
      {row.showInfo && <div className="mt-1.5 inline-block text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{row.infoTxt}</div>}
      {row.showSkip && <div className="text-xs text-gray-400 font-semibold mt-1">{row.skipCap}</div>}
      {row.note && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <StickyNote className="w-3 h-3 mt-0.5 text-gray-400 shrink-0" />
          <span>{row.note}</span>
        </div>
      )}
    </div>
  );
}

export type NextAppointment = { name: string; time: string };

// The dashboard's three "no active patient" moments. Branch A (a queue is
// waiting) is the original behavior; B and C read the shift's shape from
// completedCount to tell "hasn't started yet" apart from "already wrapped
// up" — two very different moments that a single generic empty state would
// blur together.
export function EmptyJourney({
  hasQueue, completedCount, nextAppt, onStartNext,
}: {
  hasQueue: boolean;
  completedCount: number;
  nextAppt: NextAppointment | null;
  onStartNext: () => void;
}) {
  const navigate = useNavigate();

  if (hasQueue) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <UserRound className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-base font-bold text-gray-800 mb-1">No patient in progress</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">Start the next patient from your queue to begin their journey.</p>
        <button
          onClick={onStartNext}
          className="px-6 py-3 rounded-xl text-sm font-bold transition-colors bg-slate-700 text-white hover:bg-slate-800 shadow-md"
        >
          Start Next Patient
        </button>
      </div>
    );
  }

  if (completedCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-base font-bold text-gray-800 mb-1">Awaiting First Patient</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          {nextAppt
            ? <>The queue is currently empty. Next upcoming appointment is <span className="font-semibold text-gray-700">{nextAppt.name}</span> at <span className="font-semibold text-gray-700">{nextAppt.time}</span>.</>
            : "The queue is currently empty. No further appointments are scheduled today."}
        </p>
        <button onClick={() => navigate("/calendar/schedule")} className="mt-4 text-sm font-bold text-slate-600 hover:text-slate-800 hover:underline">
          View today's schedule ↓
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2.5">
        <Check className="w-5 h-5" strokeWidth={3} />
      </div>
      <h2 className="text-sm font-extrabold text-slate-800">All Patients Completed</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">You have successfully processed all {completedCount} assigned patients for today.</p>
    </div>
  );
}

export function PatientJourneyCard({
  engine, patientName, patientTag, patientMeta, patientRoute,
}: {
  engine: JourneyEngine;
  patientName: string;
  patientTag: string;
  patientMeta: string;
  patientRoute: string;
}) {
  const { journey, cur } = engine;
  const isDoneAll = cur.mode === "done";
  const initials = patientName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  let primaryLabel = "";
  if (cur.step) {
    if (cur.mode === "enter") primaryLabel = `Start — ${cur.step.name}`;
    else if (cur.mode === "exit") primaryLabel = `Complete — ${cur.step.name}`;
    else if (cur.mode === "milestone") primaryLabel = `Confirm — ${cur.step.name}`;
  }
  if (engine.paused) primaryLabel = "Resume Journey";

  const primaryBtnClass = engine.paused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-800";

  return (
    <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Identity bar */}
      <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-800 truncate">{patientName}</h2>
              <span className="text-xs font-semibold text-gray-400 shrink-0">{patientTag}</span>
              {engine.flagged && <span className="text-[10px] font-extrabold text-white bg-red-500 rounded-full px-2 py-0.5 shrink-0">⚑ Flagged</span>}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5 truncate">{patientMeta}</div>
          </div>
        </div>
        <Link to={patientRoute} className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline shrink-0">
          Open Patient Record <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Panel head: progress bar + chips */}
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-6 shrink-0">
        <div>
          <div className="text-sm font-bold text-gray-800">Patient Journey</div>
          <div className="text-xs font-semibold text-gray-500 mt-0.5">{journey.doneN} of {journey.totalStations} stations complete · {journey.progressPct}%</div>
        </div>
        <div className="flex flex-col gap-2 flex-1 max-w-[400px]">
          <ProgressBar segments={journey.segments} />
          <div className="flex gap-1.5 justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{journey.doneN} done</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{journey.progN} active</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{journey.remainN} to go</span>
          </div>
        </div>
      </div>

      {isDoneAll ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2.5"><Check className="w-5 h-5" strokeWidth={3} /></div>
          <h2 className="text-sm font-extrabold text-slate-800">Patient Checked Out</h2>
          <p className="text-sm text-gray-500 mt-1">{patientName}'s visit is complete.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {journey.rows.map((row) => (
              <div key={row.id} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <StepNode state={row.state} />
                  {row.notLast && <div className={`w-0.5 flex-1 min-h-[20px] my-0.5 ${row.state === "done" ? "bg-emerald-300" : "bg-gray-200"}`} />}
                </div>
                <StepBody row={row} />
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="relative px-5 pt-3.5 pb-4 border-t border-gray-200 bg-gray-50/70 shrink-0">
            {engine.exitPopover && cur.step && <ExitConfirmPopover engine={engine} step={cur.step} />}
            {engine.notePopover && <NotePopover engine={engine} />}

            {cur.mode === "exit" && (
              <div className="text-center text-xs font-extrabold text-blue-600 tabular-nums mb-1.5">
                {Math.max(0, engine.clock - (engine.entries[cur.step!.id]?.enter ?? engine.clock))} min
              </div>
            )}
            {engine.paused && <div className="text-center text-xs font-extrabold text-amber-600 mb-1.5">Journey paused — timers stopped</div>}

            <button onClick={engine.primaryTap} className={`w-full h-12 rounded-xl text-white text-sm font-extrabold tracking-tight transition-colors ${primaryBtnClass}`}>
              {primaryLabel}
            </button>

            {cur.mode === "enter" && (
              <div className="flex items-center gap-1 mt-2.5">
                <button onClick={engine.openSkip} className="flex items-center gap-1.5 h-11 px-3 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"><SkipForward className="w-3.5 h-3.5" /> Skip this station</button>
                <button onClick={engine.openNote} className="flex items-center gap-1.5 h-11 px-3 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"><StickyNote className="w-3.5 h-3.5" /> Add Note</button>
              </div>
            )}
            {cur.mode === "exit" && (
              <div className="flex items-center gap-1 mt-2.5">
                <button onClick={engine.openNote} className="flex items-center gap-1.5 h-11 px-3 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"><StickyNote className="w-3.5 h-3.5" /> Add Note</button>
                <button onClick={engine.toggleFlag} className={`flex items-center gap-1.5 h-11 px-3 rounded-lg text-xs font-bold hover:bg-gray-100 ${engine.flagged ? "text-red-600" : "text-gray-600"}`}><Flag className="w-3.5 h-3.5" /> {engine.flagged ? "Unflag" : "Flag Issue"}</button>
                <button onClick={engine.togglePause} className="flex items-center gap-1.5 h-11 px-3 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">{engine.paused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />} {engine.paused ? "Resume" : "Pause Journey"}</button>
                <div className="w-px h-6 bg-gray-200 mx-1 ml-auto" />
                {engine.prevStation && (
                  <button onClick={engine.openGoBack} className="flex items-center gap-1.5 h-11 px-3 rounded-lg text-[11px] font-bold text-gray-400 hover:bg-gray-100"><Undo2 className="w-3 h-3" /> Go Back</button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {engine.dialog?.kind === "skip" && cur.step && <SkipDialog engine={engine} stepName={cur.step.name} />}
      {engine.dialog?.kind === "goback" && cur.step && <GoBackDialog engine={engine} prevName={engine.prevStation?.name ?? "the previous station"} curName={cur.step.name} />}
    </div>
  );
}
