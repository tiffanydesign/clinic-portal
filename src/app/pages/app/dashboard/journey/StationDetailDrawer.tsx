import React from "react";
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, ClipboardList,
  Clock, ListChecks, StickyNote, UserRound, X,
} from "lucide-react";
import { WAIT_SLA_MIN } from "./journeyEngine";
import { FULL_DAY_STATIONS, fmtSpan, stationStatus, stationTiming, subsOf, waitBefore } from "./stationJourney";
import type { StationStatus } from "./stationJourney";
import type { StationJourney } from "./useStationJourney";
import { StationWhereStacked, hasWhere } from "./StationWhere";

// Any one of the sixteen stations, in full, without leaving the panel. This
// is what lets the rail be a rail: the nurse taps a tick and gets that
// station's real times, room, devices, instructions and sub-steps, instead of
// the panel having to print all of it for all sixteen at once.
//
// Every fact is typed by an icon whose colour carries meaning rather than
// decoration: green = done or clear, blue = happening now, amber = a wait
// worth noticing, grey = planned. Spending colour nowhere else is what keeps
// the one amber line findable.

const STATUS: Record<StationStatus, { label: string; icon: React.ElementType; tint: string; ink: string }> = {
  done: { label: "Done", icon: CheckCircle2, tint: "bg-success/10 border-success/30 text-success-ink", ink: "text-success-ink" },
  active: { label: "In progress", icon: Clock, tint: "bg-info/10 border-info/30 text-info-ink", ink: "text-info-ink" },
  todo: { label: "Planned", icon: Circle, tint: "bg-surface-hover border-divider text-ink-muted", ink: "text-ink-muted" },
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="shrink-0">{icon}</span>
        <span className="text-overline text-ink-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

// The three numbers as one left-to-right sentence rather than a 2x2 table of
// labelled cells. Start → End → Duration is how the fact is actually spoken,
// and reading it across takes one pass instead of four.
function TimingRow({
  start, end, dur, status,
}: {
  start: string | null; end: string | null; dur: string; status: StationStatus;
}) {
  const mark = status === "todo" ? "~" : "";
  return (
    <div className="flex items-stretch bg-surface-page border border-divider rounded-control overflow-hidden">
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="text-xs text-ink-muted">Start</div>
        <div className="text-section text-ink tabular-nums mt-0.5">{start ? `${mark}${start}` : "—"}</div>
      </div>
      <div className="flex items-center shrink-0 text-ink-muted/60">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="text-xs text-ink-muted">End</div>
        <div className={`text-section tabular-nums mt-0.5 ${status === "active" ? "text-info-ink" : "text-ink"}`}>
          {status === "active" ? "now" : end ? `${mark}${end}` : "—"}
        </div>
      </div>
      <div className="w-px bg-divider shrink-0" />
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="text-xs text-ink-muted">{status === "todo" ? "Planned" : "Duration"}</div>
        <div className="text-section text-ink tabular-nums mt-0.5">{status === "todo" ? `${mark}${dur}` : dur}</div>
      </div>
    </div>
  );
}

// The wait before a station is the one number here that can be a problem, so
// it gets its own line and the drawer's only conditional colour: a green
// all-clear, or amber once the gap crosses the same WAIT_SLA_MIN the rest of
// the app escalates at. Hidden entirely when there is no real gap to measure.
function WaitLine({ waited, status }: { waited: number | null; status: StationStatus }) {
  // Never for a station that has not happened. Its "wait" is the gap between
  // two planned times, which is always 0 by construction — printing a green
  // "no wait" all-clear over a future station asserts an observation nobody
  // made yet.
  if (waited == null || status === "todo") return null;
  if (waited === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-success-ink">
        <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
        No wait before this station
      </div>
    );
  }
  const over = waited > WAIT_SLA_MIN;
  return (
    <div className={`flex items-center gap-2 text-xs ${over ? "text-warning-ink font-bold" : "text-ink-muted"}`}>
      <Clock className="w-3.5 h-3.5 shrink-0" />
      Waited {fmtSpan(waited)} before this station
      {over && ` — over the ${WAIT_SLA_MIN}m target`}
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
  const tone = STATUS[status];
  const StatusIcon = tone.icon;
  const subsDone = subs.filter(Boolean).length;
  const empty = !hasWhere(config) && !config.desc && !config.steps && !note;

  return (
    <>
      <div
        onClick={closeDrawer}
        aria-hidden
        // The one canonical overlay scrim: flat --ink-900 at 35%, no blur.
        //
        // z-20/z-30 (not 40/50): this drawer lives INSIDE the journey panel and
        // only ever needs to layer above the panel's own content. At 40/50 it
        // reached the tier the page-blocking Drawer/Modal own, and its
        // composited transition layers painted through the Appointment drawer
        // that opens over this whole page. An in-card layer stays under 40.
        className={`absolute inset-0 bg-ink/35 z-20 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!open}
        // 400px = the shared Drawer's `sm` tier. 380px was an invented width,
        // and DESIGN.md allows exactly two (400 / 560). Flush, no radius:
        // it is anchored to the panel's own right edge.
        className={`absolute top-0 right-0 bottom-0 w-[400px] max-w-full bg-surface border-l border-divider shadow-2xl z-30 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* surface-page-tinted header bar — the header/footer contract Drawer
            and Modal share across the product, which this panel's drawer was
            the only one not following. */}
        <header className="px-4 py-3.5 border-b border-divider bg-surface-page shrink-0">
          <div className="flex items-start gap-3">
            {/* Status as a tinted icon chip, not a word: it is the first thing
                read, and it wears the same green/blue/grey as this station's
                own tick on the rail, so the two agree on sight. */}
            <span className={`w-9 h-9 rounded-control border flex items-center justify-center shrink-0 ${tone.tint}`}>
              <StatusIcon className="w-4 h-4" strokeWidth={status === "todo" ? 2 : 2.4} />
            </span>
            <div className="flex-1 min-w-0">
              {/* The status is a word in the kicker, not a second pill under
                  the title: a green "Done" chip below a green check chip is
                  the same fact twice, and it cost a whole row to say it. */}
              {/* No phase here: the nurse arrived by tapping a tick inside a
                  phase group the rail already labels, and "In progress ·
                  Diagnostics · station 7 of 16" does not fit beside three nav
                  buttons in 380px — it truncated mid-word. */}
              <div className="text-xs truncate">
                <span className={`font-bold ${tone.ink}`}>{tone.label}</span>
                <span className="text-ink-muted"> · station {index + 1} of {FULL_DAY_STATIONS.length}</span>
              </div>
              <h3 className="text-section text-ink mt-0.5 leading-snug">{config.name}</h3>
              {config.role && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-ink-muted bg-surface border border-divider rounded-full px-2 py-0.5">
                  <UserRound className="w-3 h-3 shrink-0" />
                  {config.role}
                </span>
              )}
            </div>
            <div className="flex gap-0.5 shrink-0 -mt-1 -mr-1">
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
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <TimingRow
              start={timing.start}
              end={timing.end}
              dur={timing.dur == null ? "—" : fmtSpan(timing.dur)}
              status={status}
            />
            <WaitLine waited={waited} status={status} />
          </div>

          {/* No "Where" heading above this: every row inside already names
              itself (Room / Devices / Staff) with its own icon, so the
              heading was a third MapPin saying nothing new. */}
          <StationWhereStacked cfg={config} />

          {config.desc && (
            <Section icon={<ClipboardList className="w-4 h-4 text-ink-muted" />} title="Instructions">
              <p className="text-label text-ink-soft leading-relaxed text-pretty">{config.desc}</p>
            </Section>
          )}

          {config.steps && (
            <Section
              icon={<ListChecks className="w-4 h-4 text-ink-muted" />}
              title={`${config.stepsTitle ?? "Steps"} · ${subsDone} of ${config.steps.length}`}
            >
              <div className="flex flex-col gap-2.5">
                {config.steps.map((step, k) => (
                  <div key={step.label} className="flex items-start gap-2.5">
                    {subs[k] ? (
                      <CheckCircle2 className="w-4 h-4 text-success-fill shrink-0 mt-px" strokeWidth={2.4} />
                    ) : (
                      <Circle className="w-4 h-4 text-ink-muted/45 shrink-0 mt-px" />
                    )}
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
            <Section icon={<StickyNote className="w-4 h-4 text-warning-ink" />} title="Note">
              <p className="text-label text-ink-soft leading-relaxed bg-warning/10 rounded-control px-3 py-2.5 text-pretty">
                {note}
              </p>
            </Section>
          )}

          {empty && <p className="text-label text-ink-muted">No notes or exceptions recorded on this station.</p>}
        </div>
      </aside>
    </>
  );
}
