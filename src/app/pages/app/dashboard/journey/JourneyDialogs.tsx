import React from "react";
import { SKIP_REASONS, JourneyStepConfig, fmtClock } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";

function ScrimDialog({ children, width = "max-w-md" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-900/34 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-full ${width} p-7 animate-in fade-in zoom-in-95`}>
        {children}
      </div>
    </div>
  );
}

// L2 standard confirmation (§11.4): completing a station affects the
// patient's logged timeline, so it gets a centered scrim dialog rather than
// an anchored popover — consistent with Skip/Go Back below.
export function ExitConfirmPopover({ engine, step }: { engine: JourneyEngine; step: JourneyStepConfig }) {
  const enter = engine.entries[step.id]?.enter ?? engine.clock;
  return (
    <ScrimDialog width="max-w-sm">
      <h2 className="text-xl font-bold text-gray-800">Confirm completion?</h2>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">This will be logged in the patient journey.</p>
      <div className="text-lg font-bold text-gray-800 tabular-nums mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        {fmtClock(enter)} → {fmtClock(engine.clock)} · {engine.clock - enter} min
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={engine.closeExitPopover} className="flex-1 h-12 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button onClick={engine.confirmExit} className="flex-[1.3] h-12 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-800">Confirm Completion</button>
      </div>
    </ScrimDialog>
  );
}

export function NotePopover({ engine }: { engine: JourneyEngine }) {
  return (
    <ScrimDialog>
      <h2 className="text-xl font-bold text-gray-800">Add note</h2>
      <textarea
        autoFocus
        value={engine.noteDraft}
        onChange={(e) => engine.setNoteDraft(e.target.value)}
        placeholder="Type a note for this patient…"
        className="w-full min-h-[110px] mt-4 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-slate-500 resize-none"
      />
      <div className="flex gap-3 mt-5">
        <button onClick={engine.closeNote} className="flex-1 h-12 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button onClick={engine.saveNote} className="flex-[1.3] h-12 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-800">Save note</button>
      </div>
    </ScrimDialog>
  );
}

// L3 strong confirmation (§11.4): skipping a station is a documented clinical
// exception, so a reason is required before the button activates.
export function SkipDialog({ engine, stepName }: { engine: JourneyEngine; stepName: string }) {
  return (
    <ScrimDialog>
      <h2 className="text-xl font-bold text-gray-800">Skip {stepName}?</h2>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">Choose a reason. This station will be recorded as skipped in the patient journey.</p>
      <div className="mt-4 flex flex-col gap-2">
        {SKIP_REASONS.map((r) => {
          const on = engine.skipReason === r;
          return (
            <button
              key={r}
              onClick={() => engine.setSkipReason(r)}
              className={`flex items-center gap-3 min-h-[48px] px-4 rounded-xl border-[1.5px] text-sm font-bold text-left transition-colors ${on ? "border-slate-700 bg-slate-50" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${on ? "border-slate-700 bg-[radial-gradient(circle,#334155_0_6px,#fff_7px_20px)]" : "border-gray-300"}`} />
              {r}
            </button>
          );
        })}
      </div>
      {engine.skipOther && (
        <textarea
          autoFocus
          value={engine.skipNote}
          onChange={(e) => engine.setSkipNote(e.target.value)}
          placeholder="Describe the reason…"
          className="w-full min-h-[80px] mt-3 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-slate-500 resize-none"
        />
      )}
      <div className="flex gap-3 mt-6">
        <button onClick={engine.closeDialog} className="flex-1 h-12 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button
          onClick={engine.confirmSkip}
          disabled={!engine.skipCan}
          className={`flex-1 h-12 rounded-xl text-sm font-bold text-white ${engine.skipCan ? "bg-slate-700 hover:bg-slate-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          Skip {stepName}
        </button>
      </div>
    </ScrimDialog>
  );
}

// L3: undoing a logged station reopens the previous one and resets the
// current one, so it needs an explicit, reasoned confirmation.
export function GoBackDialog({ engine, prevName, curName }: { engine: JourneyEngine; prevName: string; curName: string }) {
  return (
    <ScrimDialog>
      <h2 className="text-xl font-bold text-gray-800">Return to {prevName}?</h2>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        This will reopen &ldquo;{prevName}&rdquo; and reset &ldquo;{curName}&rdquo; to not started.
      </p>
      <label className="block text-sm font-bold text-gray-800 mt-5 mb-2">Reason for correction (required)</label>
      <textarea
        autoFocus
        value={engine.gobackReason}
        onChange={(e) => engine.setGobackReason(e.target.value)}
        placeholder="Explain why you're going back…"
        className="w-full min-h-[80px] border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-slate-500 resize-none"
      />
      <div className="flex gap-3 mt-6">
        <button onClick={engine.closeDialog} className="flex-1 h-12 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button
          onClick={engine.confirmGoBack}
          disabled={!engine.gobackCan}
          className={`flex-1 h-12 rounded-xl text-sm font-bold text-white ${engine.gobackCan ? "bg-amber-600 hover:bg-amber-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          Confirm &amp; Go Back
        </button>
      </div>
    </ScrimDialog>
  );
}
