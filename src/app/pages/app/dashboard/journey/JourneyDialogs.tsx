import React from "react";
import { SKIP_REASONS, JourneyStepConfig, fmtClock } from "./journeyEngine";
import type { JourneyEngine } from "./useJourneyEngine";

// Completion-confirm popover — anchored above the action bar, matching the
// L1 "tap to confirm" tier (§11.4): logging a completion time is reversible
// via Go Back, so it doesn't need a full L2 scrim dialog.
export function ExitConfirmPopover({ engine, step }: { engine: JourneyEngine; step: JourneyStepConfig }) {
  const enter = engine.entries[step.id]?.enter ?? engine.clock;
  return (
    <div className="absolute bottom-full left-0 mb-3 w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm completion — will be logged</div>
      <div className="text-lg font-bold text-gray-800 tabular-nums">{fmtClock(enter)} → {fmtClock(engine.clock)} · {engine.clock - enter} min</div>
      <div className="flex gap-2.5 mt-4">
        <button onClick={engine.closeExitPopover} className="flex-1 h-11 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button onClick={engine.confirmExit} className="flex-[1.3] h-11 rounded-lg text-sm font-bold text-white bg-slate-700 hover:bg-slate-800">Confirm Completion</button>
      </div>
      <div className="absolute -bottom-[9px] left-8 w-[18px] h-[18px] bg-white border-r border-b border-gray-200 rotate-45" />
    </div>
  );
}

export function NotePopover({ engine }: { engine: JourneyEngine }) {
  return (
    <div className="absolute bottom-full left-0 mb-3 w-[330px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add note</div>
      <textarea
        autoFocus
        value={engine.noteDraft}
        onChange={(e) => engine.setNoteDraft(e.target.value)}
        placeholder="Type a note for this patient…"
        className="w-full min-h-[80px] border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-slate-500 resize-none"
      />
      <div className="flex gap-2.5 mt-3">
        <button onClick={engine.closeNote} className="flex-1 h-11 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 bg-white hover:bg-gray-50">Cancel</button>
        <button onClick={engine.saveNote} className="flex-[1.3] h-11 rounded-lg text-sm font-bold text-white bg-slate-700 hover:bg-slate-800">Save note</button>
      </div>
      <div className="absolute -bottom-[9px] left-8 w-[18px] h-[18px] bg-white border-r border-b border-gray-200 rotate-45" />
    </div>
  );
}

function ScrimDialog({ children, width = "max-w-md" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-900/34 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-full ${width} p-7 animate-in fade-in zoom-in-95`}>
        {children}
      </div>
    </div>
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
