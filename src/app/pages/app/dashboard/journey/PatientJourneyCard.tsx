import React from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Check, Clock, Flag, PauseCircle, PlayCircle, SkipForward, StickyNote, Undo2, UserRound } from "lucide-react";
import type { StepRenderState, StepRow } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";
import { ExitConfirmPopover, GoBackDialog, NotePopover, SkipDialog } from "./JourneyDialogs";

const SEGMENT_CLASS: Record<StepRenderState, string> = {
  done: "bg-success-ink",
  prog: "bg-info-ink motion-safe:animate-pulse",
  wait: "bg-warning",
  up: "bg-surface-sunken",
  skip: "bg-[repeating-linear-gradient(45deg,var(--surface-sunken),var(--surface-sunken)_3px,var(--surface-hover)_3px,var(--surface-hover)_6px)]",
};

function ProgressBar({ segments }: { segments: StepRenderState[] }) {
  return (
    <div className="flex gap-1">
      {segments.map((s, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${SEGMENT_CLASS[s]}`} />)}
    </div>
  );
}

function StepNode({ state }: { state: StepRenderState }) {
  if (state === "done") return <div className="w-6 h-6 rounded-full bg-success-ink text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" strokeWidth={3} /></div>;
  if (state === "skip") return <div className="w-6 h-6 rounded-card bg-surface-hover border border-divider text-ink-muted flex items-center justify-center shrink-0"><SkipForward className="w-3.5 h-3.5" /></div>;
  if (state === "prog") {
    return (
      <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-info/40 motion-safe:animate-ping" />
        <div className="relative w-6 h-6 rounded-full bg-surface border-2 border-info flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-info-ink" />
        </div>
      </div>
    );
  }
  return <div className="w-[18px] h-[18px] m-[3px] rounded-full border-2 border-divider bg-surface shrink-0" />;
}

function StepBody({ row }: { row: StepRow }) {
  const nameCls =
    row.state === "done" ? "text-ink-muted font-semibold" :
    row.state === "prog" ? "font-extrabold text-ink" :
    row.state === "skip" ? "text-ink-muted line-through decoration-gray-300 font-semibold" :
    "text-ink-muted font-semibold";
  return (
    <div className={`flex-1 min-w-0 ${row.notLast ? "pb-4" : "pb-1"}`}>
      {row.showWaited && (
        <div className="inline-block text-label font-semibold text-warning-ink bg-warning/10 px-1.5 py-0.5 rounded-control mb-1">
          Waited {row.waited} min
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className={`min-w-0 truncate text-sm ${nameCls}`}>{row.name}</span>
        {row.subtitle && <span className="shrink-0 text-xs font-medium text-ink-muted truncate">({row.subtitle})</span>}
        {row.showOwner && <span className="shrink-0 text-label font-extrabold uppercase tracking-wide text-ink-muted bg-surface-hover px-1.5 py-0.5 rounded-control">{row.owner}</span>}
        {row.showWaitLive && <span className="shrink-0 inline-flex items-center gap-1 text-label font-bold text-warning-ink bg-warning/10 px-2 py-0.5 rounded-full">◷ Waiting · {row.waitLive} min</span>}
        <span className="ml-auto shrink-0 text-xs font-bold text-ink-muted tabular-nums">
          {row.showTime && row.timeTxt}
          {row.showDur && row.durTxt}
        </span>
      </div>
      {row.showProg && <div className="text-xs font-extrabold text-info-ink tabular-nums mt-0.5">{row.progTxt}</div>}
      {row.showInfo && <div className="mt-1.5 inline-block text-xs font-semibold text-info-ink bg-info/10 border border-info/30 rounded-card px-3 py-2">{row.infoTxt}</div>}
      {row.showSkip && <div className="text-xs text-ink-muted font-semibold mt-1">{row.skipCap}</div>}
      {row.note && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-soft bg-surface-page border border-divider rounded-card px-2.5 py-1.5">
          <StickyNote className="w-3 h-3 mt-0.5 text-ink-muted shrink-0" />
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
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <UserRound className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">No patient in progress</h2>
        <p className="text-sm text-ink-muted mb-5 max-w-xs">Start the next patient from your queue to begin their journey.</p>
        <button
          onClick={onStartNext}
          className="px-6 py-3 rounded-card text-sm font-bold transition-colors btn-primary shadow-md"
        >
          Start Next Patient
        </button>
      </div>
    );
  }

  if (completedCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-ink-muted" />
        </div>
        <h2 className="text-base font-bold text-ink mb-1">Awaiting First Patient</h2>
        <p className="text-sm text-ink-muted max-w-xs">
          {nextAppt
            ? <>The queue is currently empty. Next upcoming appointment is <span className="font-semibold text-ink-soft">{nextAppt.name}</span> at <span className="font-semibold text-ink-soft">{nextAppt.time}</span>.</>
            : "The queue is currently empty. No further appointments are scheduled today."}
        </p>
        <button onClick={() => navigate("/calendar/schedule")} className="mt-4 text-sm font-bold text-ink-soft hover:text-ink hover:underline">
          View today's schedule ↓
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
      <div className="w-11 h-11 rounded-full bg-success-ink text-white flex items-center justify-center mb-2.5">
        <Check className="w-5 h-5" strokeWidth={3} />
      </div>
      <h2 className="text-sm font-extrabold text-ink">All Patients Completed</h2>
      <p className="text-sm text-ink-muted mt-1 max-w-xs">You have successfully processed all {completedCount} assigned patients for today.</p>
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

  const primaryBtnClass = engine.paused ? "bg-success-ink hover:opacity-90" : "bg-info-ink hover:opacity-90";

  return (
    <div className="h-full bg-surface border border-divider rounded-card shadow-sm flex flex-col overflow-hidden">
      {/* Identity bar */}
      <div className="p-5 border-b border-divider flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-sunken text-ink-soft flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-ink truncate">{patientName}</h2>
              <span className="text-xs font-semibold text-ink-muted shrink-0">{patientTag}</span>
              {engine.flagged && <span className="text-label font-extrabold text-white bg-danger-ink rounded-full px-2 py-0.5 shrink-0">⚑ Flagged</span>}
            </div>
            <div className="text-xs text-ink-muted font-medium mt-0.5 truncate">{patientMeta}</div>
          </div>
        </div>
        <Link to={patientRoute} className="flex items-center gap-1 text-xs font-bold text-ink-soft hover:underline shrink-0">
          Open Patient Record <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Panel head: progress bar + chips */}
      <div className="px-5 py-3 border-b border-divider flex items-center justify-between gap-6 shrink-0">
        <div>
          <div className="text-sm font-bold text-ink">Patient Journey</div>
          <div className="text-xs font-semibold text-ink-muted mt-0.5">{journey.doneN} of {journey.totalStations} stations complete · {journey.progressPct}%</div>
        </div>
        <div className="flex flex-col gap-2 flex-1 max-w-[400px]">
          <ProgressBar segments={journey.segments} />
          <div className="flex gap-1.5 justify-end">
            <span className="inline-flex items-center gap-1 text-label font-bold text-ink-soft bg-surface-hover rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-success-ink" />{journey.doneN} done</span>
            <span className="inline-flex items-center gap-1 text-label font-bold text-ink-soft bg-surface-hover rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-info-ink" />{journey.progN} active</span>
            <span className="inline-flex items-center gap-1 text-label font-bold text-ink-soft bg-surface-hover rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-warning-ink" />{journey.remainN} to go</span>
          </div>
        </div>
      </div>

      {isDoneAll ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-11 h-11 rounded-full bg-success-ink text-white flex items-center justify-center mb-2.5"><Check className="w-5 h-5" strokeWidth={3} /></div>
          <h2 className="text-sm font-extrabold text-ink">Patient Checked Out</h2>
          <p className="text-sm text-ink-muted mt-1">{patientName}'s visit is complete.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {journey.rows.map((row) => (
              <div key={row.id} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <StepNode state={row.state} />
                  {row.notLast && <div className={`w-0.5 flex-1 min-h-[20px] my-0.5 ${row.state === "done" ? "bg-success" : "bg-surface-sunken"}`} />}
                </div>
                <StepBody row={row} />
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="relative px-5 pt-3.5 pb-4 border-t border-divider bg-surface-page/70 shrink-0">
            {engine.exitPopover && cur.step && <ExitConfirmPopover engine={engine} step={cur.step} />}
            {engine.notePopover && <NotePopover engine={engine} />}

            {cur.mode === "exit" && (
              <div className="text-center text-xs font-extrabold text-info-ink tabular-nums mb-1.5">
                {Math.max(0, engine.clock - (engine.entries[cur.step!.id]?.enter ?? engine.clock))} min
              </div>
            )}
            {engine.paused && <div className="text-center text-xs font-extrabold text-warning-ink mb-1.5">Journey paused — timers stopped</div>}

            <button onClick={engine.primaryTap} className={`w-full h-12 rounded-card text-white text-sm font-extrabold tracking-tight transition-colors ${primaryBtnClass}`}>
              {primaryLabel}
            </button>

            {cur.mode === "enter" && (
              <div className="flex items-center gap-1 mt-2.5">
                <button onClick={engine.openSkip} className="flex items-center gap-1.5 h-11 px-3 rounded-card text-xs font-bold text-ink-soft hover:bg-surface-hover"><SkipForward className="w-3.5 h-3.5" /> Skip this station</button>
                <button onClick={engine.openNote} className="flex items-center gap-1.5 h-11 px-3 rounded-card text-xs font-bold text-ink-soft hover:bg-surface-hover"><StickyNote className="w-3.5 h-3.5" /> Add Note</button>
              </div>
            )}
            {cur.mode === "exit" && (
              <div className="flex items-center gap-1 mt-2.5">
                <button onClick={engine.openNote} className="flex items-center gap-1.5 h-11 px-3 rounded-card text-xs font-bold text-ink-soft hover:bg-surface-hover"><StickyNote className="w-3.5 h-3.5" /> Add Note</button>
                <button onClick={engine.toggleFlag} className={`flex items-center gap-1.5 h-11 px-3 rounded-card text-xs font-bold hover:bg-surface-hover ${engine.flagged ? "text-danger-ink" : "text-ink-soft"}`}><Flag className="w-3.5 h-3.5" /> {engine.flagged ? "Unflag" : "Flag Issue"}</button>
                <button onClick={engine.togglePause} className="flex items-center gap-1.5 h-11 px-3 rounded-card text-xs font-bold text-ink-soft hover:bg-surface-hover">{engine.paused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />} {engine.paused ? "Resume" : "Pause Journey"}</button>
                <div className="w-px h-6 bg-surface-sunken mx-1 ml-auto" />
                {engine.prevStation && (
                  <button onClick={engine.openGoBack} className="flex items-center gap-1.5 h-11 px-3 rounded-card text-label font-bold text-ink-muted hover:bg-surface-hover"><Undo2 className="w-3 h-3" /> Go Back</button>
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
