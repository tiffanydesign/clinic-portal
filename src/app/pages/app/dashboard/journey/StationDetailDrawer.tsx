import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { FULL_DAY_STATIONS, fmtSpan, stationStatus, stationTiming, subsOf, waitBefore } from "./stationJourney";
import type { StationStatus } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";

// Any one of the sixteen stations, in full, without leaving the panel. This
// is what lets the rail be a rail: the nurse taps a tick and gets that
// station's real times, room, devices, instructions and sub-steps, instead of
// the panel having to print all of it for all sixteen at once.

const STATUS_LABEL: Record<StationStatus, string> = { done: "Done", active: "In progress", todo: "Planned" };
const STATUS_KICKER: Record<StationStatus, string> = { done: "completed", active: "in progress", todo: "upcoming" };
const STATUS_PILL: Record<StationStatus, string> = {
  done: "bg-success/10 text-success-ink",
  active: "bg-info/10 text-info-ink",
  todo: "bg-surface-hover text-ink-muted",
};

function IconButton({
  onClick, disabled, label, children,
}: {
  onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-8 h-8 rounded-chip flex items-center justify-center transition-colors touch-extend ${
        disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-hover"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-overline text-ink-muted mb-2">{title}</div>
      {children}
    </div>
  );
}

export function StationDetailDrawer({ journey }: { journey: StationJourney }) {
  const { drawer, closeDrawer, drawerPrev, drawerNext, state } = journey;
  const open = drawer != null;
  const index = drawer ?? 0;
  const config = FULL_DAY_STATIONS[index];
  const status = stationStatus(state.cursor, index);
  const timing = stationTiming(state, index);
  const waited = waitBefore(state, index);
  const subs = subsOf(state, index);
  const note = state.log[index]?.note;

  // `~` marks a planned value throughout, so an estimate can never be
  // mistaken for something that actually happened.
  const plan = (v: string | null) => (v == null ? null : status === "todo" ? `~${v}` : v);
  const facts: { label: string; value: string }[] = [
    { label: "Start", value: plan(timing.start) ?? "not scheduled" },
    { label: "End", value: status === "active" ? "in progress" : plan(timing.end) ?? "—" },
    { label: "Duration", value: plan(timing.dur == null ? null : fmtSpan(timing.dur)) ?? "—" },
    { label: "Waited before", value: waited == null ? "—" : waited ? fmtSpan(waited) : "none" },
  ];

  const clean = !config.steps && !config.desc && !config.loc && !note;

  return (
    <>
      <div
        onClick={closeDrawer}
        aria-hidden
        className={`absolute inset-0 bg-ink/15 z-40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`absolute top-0 right-0 bottom-0 w-[380px] max-w-full bg-surface border-l border-divider shadow-2xl z-50 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start gap-2.5 px-4 py-4 border-b border-divider shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-overline text-ink-muted">
              {STATUS_KICKER[status]} · station {index + 1} of {FULL_DAY_STATIONS.length}
            </div>
            <h3 className="text-section text-ink mt-1 leading-snug">{config.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${STATUS_PILL[status]}`}>
                {STATUS_LABEL[status]}
              </span>
              {config.role && <span className="text-xs text-ink-muted">{config.role}</span>}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <IconButton onClick={drawerPrev} disabled={index === 0} label="Previous station">
              <ChevronLeft className="w-3.5 h-3.5 text-ink-soft" />
            </IconButton>
            <IconButton onClick={drawerNext} disabled={index === FULL_DAY_STATIONS.length - 1} label="Next station">
              <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
            </IconButton>
            <IconButton onClick={closeDrawer} label="Close station detail">
              <X className="w-3.5 h-3.5 text-ink-muted" />
            </IconButton>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Times first: the four numbers a nurse is asked for when anyone
              questions how a visit ran. */}
          <div className="grid grid-cols-2 gap-px bg-divider border border-divider rounded-control overflow-hidden">
            {facts.map((f) => (
              <div key={f.label} className="bg-surface-page px-3 py-2.5">
                <div className="text-xs text-ink-muted">{f.label}</div>
                <div className="text-label text-ink tabular-nums mt-0.5">{f.value}</div>
              </div>
            ))}
          </div>

          {config.loc && (
            <Section title="Room, devices & staff">
              <p className="text-label text-ink-soft leading-relaxed bg-surface-hover rounded-control px-3 py-2.5 text-pretty">
                {config.loc}
              </p>
            </Section>
          )}

          {config.desc && (
            <Section title="Instructions">
              <p className="text-label text-ink-soft leading-relaxed text-pretty">{config.desc}</p>
            </Section>
          )}

          {config.steps && (
            <Section title={`${config.stepsTitle ?? "Steps"} · ${subs.filter(Boolean).length} of ${config.steps.length}`}>
              <div className="flex flex-col gap-2.5">
                {config.steps.map((step, k) => (
                  <div key={step.label} className="flex items-start gap-2.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                        subs[k] ? "bg-success-fill" : "bg-surface-sunken"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-label font-bold ${subs[k] ? "text-ink-soft" : "text-ink-muted"}`}>
                          {step.label}
                        </span>
                        <span className="text-xs text-ink-muted tabular-nums">{step.est}</span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5 text-pretty">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {note && (
            <Section title="Note">
              <p className="text-label text-ink-soft leading-relaxed bg-warning/10 rounded-control px-3 py-2.5 text-pretty">
                {note}
              </p>
            </Section>
          )}

          {clean && <p className="text-label text-ink-muted">No notes or exceptions on this station.</p>}
        </div>
      </aside>
    </>
  );
}
