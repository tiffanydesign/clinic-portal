import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight, MapPin } from "lucide-react";
import {
  Appt, ApptStatus, TODAY_SHORT, NOW_MINUTES, minToClock,
  DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, blockHeightPx, gapToNext,
} from "./dashboardData";
import { StatusPill } from "./DashboardShared";
import { videoJoinState } from "./clinicianDashboardData";
import { JourneyProgressChip } from "./journey/JourneyProgress";

type ScheduleView = "list" | "calendar";

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

// Converges the shared five-hue ApptStatus palette to a calmer scheme for
// THIS page only (Admin/Reception's clinic-wide calendar keeps the original
// mapping via dashboardData's apptStatusDotClass/apptBlockClass) — routine
// flow states (Booked/Arrived/Checked In/Completed/Cancelled) all read as
// plain grey; colour is reserved for what's genuinely happening right now
// (blue, matching ClinicianNowCard's "Now" accent) or needs the clinician's
// attention (red, No Show only — same "exception colour" rule as Work
// Queue's Overdue badge).
function clinicianDotClass(status: ApptStatus): string {
  if (status === "In Clinic") return "bg-info-ink animate-pulse";
  if (status === "No Show") return "bg-danger";
  return "bg-ink-muted/50";
}
function clinicianPillType(status: ApptStatus): "default" | "error" {
  return status === "No Show" ? "error" : "default";
}
function clinicianBlockClass(status: ApptStatus): string {
  if (status === "In Clinic") return "bg-info/10 border border-info/30";
  if (status === "No Show") return "bg-danger/10 border border-dashed border-danger/30";
  if (status === "Cancelled") return "bg-surface-page border border-divider line-through";
  return "bg-surface border border-divider";
}

function StatusCell({ appt, isActive, hasActiveSession, onJoin }: {
  appt: Appt;
  isActive: boolean;
  hasActiveSession: boolean;
  onJoin: (id: string) => void;
}) {
  if (isActive) {
    return (
      <span className="text-label font-bold text-info-ink truncate block">
        In Clinic · <JourneyProgressChip appt={appt} className="!text-info-ink" />
      </span>
    );
  }
  if (appt.status === "Completed" || appt.status === "Cancelled") {
    return <StatusPill status={appt.status} type={clinicianPillType(appt.status)} />;
  }
  if (appt.status === "No Show") {
    return <StatusPill status={appt.status} type={clinicianPillType(appt.status)} />;
  }
  if (appt.isVideo) {
    const gate = videoJoinState(appt, hasActiveSession);
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-ink-muted whitespace-nowrap">{gate.enabled ? "Ready to join" : gate.reason}</span>
        <button
          disabled={!gate.enabled}
          onClick={(e) => { e.stopPropagation(); onJoin(appt.id); }}
          className={`px-2.5 py-1 text-label font-bold rounded-control shrink-0 flex items-center gap-1 ${
            gate.enabled ? "bg-success-ink text-white hover:bg-success-ink" : "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
          }`}
        >
          <Video className="w-3 h-3" /> Join
        </button>
      </div>
    );
  }
  return <StatusPill status={appt.status} type={clinicianPillType(appt.status)} />;
}

function ScheduleRow({ appt, isActive, hasActiveSession, onOpen, onJoin }: {
  appt: Appt;
  isActive: boolean;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
}) {
  const settled = appt.status === "Completed" || appt.status === "Cancelled" || appt.status === "No Show";
  return (
    <div
      onClick={() => onOpen(appt.id)}
      className={`px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-info/5 hover:bg-info/5" : "hover:bg-surface-hover"}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-ink-muted w-11 shrink-0 tabular-nums">{appt.timeLabel.slice(0, 5)}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 ${clinicianDotClass(appt.status)}`} />
        <div className={`min-w-0 flex-1 ${settled ? "opacity-60" : ""}`}>
          <div className={`text-data font-bold text-ink truncate ${appt.status === "Completed" ? "line-through" : ""}`}>{appt.patient.name}</div>
          <div className="text-xs text-ink-muted flex items-center gap-1 truncate">
            {appt.isVideo ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
            {typeLabel(appt)}
          </div>
        </div>
        {/* Non-active statuses are compact (pill / Join button) so they sit
            fine at the row's end. The active-session chip's text length
            varies with the journey's station name, so it gets its own line
            below instead of fighting the name for the same row's width. */}
        {!isActive && <StatusCell appt={appt} isActive={isActive} hasActiveSession={hasActiveSession} onJoin={onJoin} />}
      </div>
      {isActive && (
        <div className="pl-[76px] mt-1">
          <StatusCell appt={appt} isActive={isActive} hasActiveSession={hasActiveSession} onJoin={onJoin} />
        </div>
      )}
    </div>
  );
}

function NowDivider() {
  return (
    <div className="relative flex items-center px-4 py-1.5">
      <div className="flex-1 h-px bg-danger" />
      <span className="mx-2 text-label font-bold text-white bg-danger-ink rounded-control px-1.5 py-0.5 tabular-nums shrink-0">{minToClock(NOW_MINUTES)}</span>
      <div className="flex-1 h-px bg-danger" />
    </div>
  );
}

// The row-based list view — time · status · patient · type, one row per
// appointment. Reads faster than a pixel timeline once there's no
// lane-packing to visually parse, and it's the natural place for the
// mutual-exclusion Join button per video row.
function ScheduleListView({ appts, activeApptId, hasActiveSession, onOpen, onJoin, scrollable }: {
  appts: Appt[];
  activeApptId?: string;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
  scrollable: boolean;
}) {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const nowDividerIndex = sorted.findIndex((a) => a.startMin > NOW_MINUTES);

  return (
    <div className={`divide-y divide-divider ${scrollable ? "flex-1 overflow-y-auto" : ""}`}>
      {sorted.map((appt, i) => (
        <React.Fragment key={appt.id}>
          {i === nowDividerIndex && <NowDivider />}
          <ScheduleRow
            appt={appt}
            isActive={appt.id === activeApptId}
            hasActiveSession={hasActiveSession}
            onOpen={onOpen}
            onJoin={onJoin}
          />
        </React.Fragment>
      ))}
      {nowDividerIndex === -1 && <NowDivider />}
    </div>
  );
}

function CalendarBlock({ appt, gapMin, isActive, onOpen }: { appt: Appt; gapMin?: number; isActive: boolean; onOpen: (id: string) => void }) {
  const top = ((appt.startMin - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const height = blockHeightPx(appt.durationMin, gapMin);
  const showDetail = height >= 38;

  return (
    <button
      onClick={() => onOpen(appt.id)}
      style={{ top, height }}
      className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden hover:shadow-md hover:z-10 transition-shadow rounded-card shadow-sm ${clinicianBlockClass(appt.status)} ${isActive ? "ring-2 ring-info" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${clinicianDotClass(appt.status)}`} />
        {appt.isVideo && <Video className="w-3 h-3 text-ink-muted shrink-0" />}
        <span className="text-label font-bold text-ink truncate">{appt.patient.name}</span>
      </div>
      {showDetail && (
        <div className="text-label text-ink-muted truncate mt-0.5 pl-3">
          {typeLabel(appt)}{appt.isVideo ? " · Video" : appt.room ? ` · ${appt.room}` : ""}
        </div>
      )}
    </button>
  );
}

// A single-column day timeline scoped to this clinician's own appointments
// only — deliberately not a reuse of the shared multi-column CalendarWidget
// (that component is Admin/Reception's clinic-wide room/clinician grid);
// with exactly one column there's nothing to lane-pack or group, so a
// lighter dedicated view keeps this file self-contained.
function ScheduleCalendarView({ appts, activeApptId, onOpen, scrollable }: {
  appts: Appt[];
  activeApptId?: string;
  onOpen: (id: string) => void;
  scrollable: boolean;
}) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);

  return (
    <div className={scrollable ? "flex-1 overflow-y-auto" : ""}>
      <div className="flex" style={{ height: gridHeight }}>
        <div className="w-14 shrink-0 relative border-r border-divider bg-surface-page/30">
          {hours.map((h, i) => i % 2 === 1 && (
            <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-hover/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
          ))}
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 text-label font-semibold text-ink-muted text-right pr-2 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
              {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
          <span className="absolute right-1.5 z-20 text-label font-bold text-white bg-danger-ink rounded-control px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
            {minToClock(NOW_MINUTES)}
          </span>
        </div>
        <div className="flex-1 relative">
          {hours.map((h, i) => i % 2 === 1 && (
            <div key={`band-${h}`} className="absolute left-0 right-0 bg-surface-page/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
          ))}
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 border-t border-divider" style={{ top: i * HOUR_PX }} />
          ))}
          <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
            <div className="relative border-t-2 border-danger shadow-[0_0_6px_rgba(239,68,68,0.35)]">
              <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-danger-ink ring-2 ring-white" />
            </div>
          </div>
          {sorted.map((appt) => (
            <CalendarBlock key={appt.id} appt={appt} gapMin={gapToNext(sorted, appt.startMin)} isActive={appt.id === activeApptId} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Ghost/text buttons — no persistent track background, only a hover tint;
// the active view is marked by a quiet underline (same idiom the Stat
// family's T3 strip already uses for its own active-item indicator), not a
// filled pill, so this tertiary control stays visually lighter than the
// primary actions on the page.
function ViewToggle({ view, onChange }: { view: ScheduleView; onChange: (v: ScheduleView) => void }) {
  return (
    <div className="inline-flex items-center gap-3 shrink-0">
      {(["list", "calendar"] as ScheduleView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-1.5 py-1 text-label font-bold capitalize border-b-2 transition-colors ${view === v ? "text-ink border-ink" : "text-ink-muted border-transparent hover:text-ink-soft"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// The Clinician's own Today's Schedule — replaces the shared block-timeline
// CalendarWidget for this role only. Defaults to the row-based list (time ·
// status · patient · type reads faster than a pixel timeline day to day),
// with a toggle to a single-column calendar view for whoever wants the
// at-a-glance shape of the day instead. The whole header is the "open in
// Calendar" affordance (no separate text-link button) — clicking anywhere
// on the title row navigates through, same destination as before.
// `scrollable` (default true, matching the Clinician Dashboard's own fixed-
// height row) lets the Nurse Dashboard opt into showing the entire day
// inline with no nested scrollbar, since its page itself is the only
// scroll surface.
export function ClinicianScheduleList({ appts, activeApptId, hasActiveSession, onOpen, onJoin, scrollable = true }: {
  appts: Appt[];
  activeApptId?: string;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
  scrollable?: boolean;
}) {
  const navigate = useNavigate();
  const [view, setView] = useState<ScheduleView>("list");

  return (
    <div className={`border border-divider rounded-card shadow-sm bg-surface flex flex-col ${scrollable ? "flex-1 min-h-0" : "shrink-0"}`}>
      <div
        onClick={() => navigate("/calendar/schedule")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/calendar/schedule"); }}
        className="border-b border-divider bg-surface-page/70 px-4 py-2.5 flex items-start justify-between shrink-0 gap-3 cursor-pointer hover:bg-surface-hover/70 transition-colors"
      >
        <h3 className="font-bold text-ink text-sm shrink-0 py-1 flex items-center gap-1">
          Today's Schedule <span className="text-ink-muted font-medium ml-1">{TODAY_SHORT}</span>
          <ArrowRight className="w-3.5 h-3.5 text-ink-muted ml-0.5" />
        </h3>
        {/* ViewToggle's own buttons stopPropagation so switching list/calendar
            never triggers the header's navigate. */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>
      {view === "list" ? (
        <ScheduleListView appts={appts} activeApptId={activeApptId} hasActiveSession={hasActiveSession} onOpen={onOpen} onJoin={onJoin} scrollable={scrollable} />
      ) : (
        <ScheduleCalendarView appts={appts} activeApptId={activeApptId} onOpen={onOpen} scrollable={scrollable} />
      )}
    </div>
  );
}
