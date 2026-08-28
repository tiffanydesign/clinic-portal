import React from "react";
import { Check, MapPin, MoreHorizontal } from "lucide-react";
import { FULL_DAY_STATIONS, fmtSpan } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";

// The panel's one loud object: the station happening right now, with
// everything the nurse needs to run it — who owns it, which room and devices,
// the instruction, its ordered sub-steps, and the single action that closes
// it. Before this redesign all of that was one row in a sixteen-row list,
// indistinguishable from the fifteen rows she cannot act on.

function RolePill({ role, quiet = false }: { role?: string; quiet?: boolean }) {
  if (!role) return null;
  return (
    <span
      className={`shrink-0 text-xs font-bold whitespace-nowrap rounded-full px-2 py-0.5 ${
        quiet ? "bg-surface-page text-ink-muted" : "bg-surface-hover text-ink-soft"
      }`}
    >
      {role}
    </span>
  );
}

export { RolePill };

// The checklist that gates completion. Two columns because nine steps in one
// column pushes the action button off the fold — the whole reason the old
// panel's CTA was unreachable without scrolling.
function StepChecklist({ journey }: { journey: StationJourney }) {
  const { view, toggleSub } = journey;
  const active = view.active!;
  if (!view.activeSteps.length) return null;

  const pct = view.activeSubs.length ? (view.stepsDone / view.activeSubs.length) * 100 : 0;

  return (
    <div className="mt-4 border border-divider rounded-card bg-surface overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-page border-b border-divider">
        <span className="text-overline text-ink-soft whitespace-nowrap">
          {active.config.stepsTitle ?? "Steps"}
        </span>
        <div className="flex-1 max-w-[220px] h-1 rounded-full bg-surface-sunken overflow-hidden">
          <div className="h-full rounded-full bg-success-fill transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="ml-auto text-xs text-ink-muted tabular-nums whitespace-nowrap">
          {view.stepsDone} of {view.activeSubs.length} done
        </span>
      </div>

      {/* Two columns only once the panel is actually wide enough for them.
          This card is whatever the viewport has left after the 248px nav and
          the 396px rail, so a 260px-per-column minimum needs ~1240px of
          viewport — measured, not guessed, same as the old panel's rail
          breakpoints. Below that one column beats two starved ones. */}
      <div className="grid grid-cols-1 min-[1240px]:grid-cols-2">
        {view.activeSteps.map((step, k) => {
          const on = view.activeSubs[k];
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => toggleSub(active.index, k)}
              aria-pressed={on}
              className={`flex items-start gap-2.5 p-3 text-left transition-colors hover:bg-surface-page ${
                k > 1 ? "border-t border-divider" : ""
              } ${k % 2 === 0 ? "min-[1240px]:border-r min-[1240px]:border-divider" : ""}`}
            >
              <span
                className={`w-4 h-4 mt-0.5 rounded-full shrink-0 flex items-center justify-center border-[1.5px] ${
                  on ? "bg-success-fill border-success-fill" : "bg-surface border-border-strong"
                }`}
              >
                {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
              </span>
              <span className="min-w-0">
                <span className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-label font-bold ${on ? "text-ink" : "text-ink-soft"}`}>{step.label}</span>
                  <span className="text-xs text-ink-muted tabular-nums">{step.est}</span>
                </span>
                <span className="block text-xs text-ink-muted leading-relaxed mt-0.5">{step.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MENU_HINTS = { note: "N", flag: "F", pause: "P", stepback: "⌫" };

// Everything that is not "close this station" lives behind one overflow
// button, so the primary action never competes with four sibling buttons for
// the nurse's attention.
function OverflowMenu({ journey }: { journey: StationJourney }) {
  const { menuOpen, toggleMenu, closeMenu, openNote, toggleFlag, togglePause, openStepBack, canStepBack } = journey;

  const items: { label: string; hint: string; onClick: () => void; disabled?: boolean }[] = [
    { label: "Add note", hint: MENU_HINTS.note, onClick: openNote },
    { label: journey.flagged ? "Clear flagged issue" : "Flag issue", hint: MENU_HINTS.flag, onClick: toggleFlag },
    { label: journey.paused ? "Resume journey" : "Pause journey", hint: MENU_HINTS.pause, onClick: togglePause },
    { label: "Step back a station", hint: MENU_HINTS.stepback, onClick: openStepBack, disabled: !canStepBack },
  ];

  return (
    <div className="relative shrink-0">
      {menuOpen && <div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden />}
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="More journey actions"
        aria-expanded={menuOpen}
        className="w-12 h-full min-h-11 border border-divider rounded-control bg-surface flex items-center justify-center transition-colors hover:bg-surface-hover hover:border-border-strong"
      >
        <MoreHorizontal className="w-4 h-4 text-ink-soft" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 bottom-[calc(100%+8px)] w-60 bg-surface border border-divider rounded-card shadow-xl p-1 z-50">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className={`w-full flex items-center gap-2.5 min-h-11 px-2.5 rounded-chip text-data font-semibold text-left transition-colors ${
                item.disabled ? "text-ink-muted cursor-not-allowed" : "text-ink-soft hover:bg-surface-hover"
              }`}
            >
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-ink-muted">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PrimaryAction({ journey }: { journey: StationJourney }) {
  const { view, mode, paused, primaryTap } = journey;
  const blocked = mode === "in-progress" && view.stepsLeft > 0;

  let label: string;
  if (paused) label = "Resume journey";
  else if (mode === "not-started") label = `Start journey — ${FULL_DAY_STATIONS[0].name}`;
  else if (mode === "complete") label = "Open visit summary";
  else if (blocked) label = `${view.stepsLeft} step${view.stepsLeft > 1 ? "s" : ""} left — ${view.nextOpenStep?.label ?? ""}`;
  else label = `Complete — ${view.active?.config.name ?? ""}`;

  return (
    <div className="flex items-stretch gap-2 mt-4">
      <button
        type="button"
        onClick={primaryTap}
        disabled={blocked}
        aria-disabled={blocked}
        className={`flex-1 flex items-center justify-center gap-2 min-h-12 px-4 rounded-control text-sm font-extrabold tracking-tight transition-colors ${
          blocked
            ? "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
            : "btn-primary shadow-md"
        }`}
      >
        {!blocked && mode === "in-progress" && !paused && <Check className="w-4 h-4" strokeWidth={3} />}
        {label}
      </button>
      <OverflowMenu journey={journey} />
    </div>
  );
}

// The two states with nothing running: before the first station and after the
// last. Same frame as the live card so the panel's shape never jumps.
function IdleCard({ journey }: { journey: StationJourney }) {
  const { view, mode } = journey;
  const complete = mode === "complete";
  return (
    <div className="shrink-0 border border-border-strong rounded-card bg-surface-page p-5">
      <div className="text-overline text-ink-muted">{complete ? "Journey complete" : "Not started"}</div>
      <div className="text-page-title text-ink mt-2">
        {complete
          ? `${view.total} of ${view.total} stations${view.spanMin != null ? ` · ${fmtSpan(view.spanMin)}` : ""}`
          : `Arrives ${view.firstStart ?? "—"} · full-day assessment`}
      </div>
      <p className="text-data text-ink-muted mt-1.5 leading-relaxed">
        {complete
          ? `${view.firstStart ?? "—"} → ${view.lastEnd ?? "—"} · summary ready for the care team`
          : `${view.total} stations planned · reception, preparation, diagnostics, consults`}
      </p>
      <PrimaryAction journey={journey} />
    </div>
  );
}

export function StationNowCard({ journey }: { journey: StationJourney }) {
  const { view, paused, flagged } = journey;
  const active = view.active;
  if (!active) return <IdleCard journey={journey} />;

  return (
    <div className="shrink-0 border border-border-strong rounded-card bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${paused ? "bg-warning-fill" : "bg-info-fill"}`} />
            <span className="text-overline text-ink-soft">
              {active.config.phase} · station {active.index + 1} of {view.total}
            </span>
            {flagged && (
              <span className="text-xs font-bold text-white bg-danger-fill rounded-full px-2 py-0.5">⚑ Flagged</span>
            )}
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap mt-1.5">
            <h3 className="text-page-title text-ink">{active.config.name}</h3>
            <RolePill role={active.config.role} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="kpi-value-lg text-ink">{fmtSpan(active.timing.dur)}</div>
          <div className={`text-xs font-bold mt-0.5 ${paused ? "text-warning-ink" : "text-info-ink"}`}>
            {paused ? "Paused" : "In progress"}
          </div>
        </div>
      </div>

      {active.config.loc && (
        <div className="flex items-start gap-2 mt-3 bg-surface-hover rounded-control px-3 py-2.5">
          <MapPin className="w-3.5 h-3.5 text-ink-soft shrink-0 mt-0.5" />
          <span className="text-label font-bold text-ink-soft leading-relaxed text-pretty">{active.config.loc}</span>
        </div>
      )}

      {active.config.desc && (
        <p className="text-label text-ink-muted leading-relaxed mt-3 text-pretty">{active.config.desc}</p>
      )}

      <StepChecklist journey={journey} />
      <PrimaryAction journey={journey} />
    </div>
  );
}
