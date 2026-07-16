import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight, MapPin } from "lucide-react";
import {
  Appt, TODAY_SHORT, NOW_MINUTES, minToClock, apptStatusDotClass,
  DAY_START_HOUR, DAY_END_HOUR, HOUR_PX, blockHeightPx, gapToNext, apptBlockClass,
} from "./dashboardData";
import { StatusPill } from "./DashboardShared";
import { statusPillType } from "./dashboardData";
import { videoJoinState } from "./clinicianDashboardData";
import { JourneyProgressChip } from "./journey/JourneyProgress";

type ScheduleView = "list" | "calendar";

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

function StatusCell({ appt, isActive, hasActiveSession, onJoin }: {
  appt: Appt;
  isActive: boolean;
  hasActiveSession: boolean;
  onJoin: (id: string) => void;
}) {
  if (isActive) {
    return (
      <span className="text-xs font-bold text-orange-700 whitespace-nowrap">
        In Clinic · <JourneyProgressChip appt={appt} className="!text-orange-700" />
      </span>
    );
  }
  if (appt.status === "Completed" || appt.status === "Cancelled") {
    return <StatusPill status={appt.status} type={statusPillType(appt.status)} />;
  }
  if (appt.status === "No Show") {
    return <StatusPill status={appt.status} type={statusPillType(appt.status)} />;
  }
  if (appt.isVideo) {
    const gate = videoJoinState(appt, hasActiveSession);
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{gate.enabled ? "Ready to join" : gate.reason}</span>
        <button
          disabled={!gate.enabled}
          onClick={(e) => { e.stopPropagation(); onJoin(appt.id); }}
          className={`px-2.5 py-1 text-[11px] font-bold rounded shrink-0 flex items-center gap-1 ${
            gate.enabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
          }`}
        >
          <Video className="w-3 h-3" /> Join
        </button>
      </div>
    );
  }
  return <StatusPill status={appt.status} type={statusPillType(appt.status)} />;
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
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-50/60 hover:bg-orange-50" : "hover:bg-gray-50"}`}
    >
      <span className="text-xs font-bold text-gray-500 w-11 shrink-0 tabular-nums">{appt.timeLabel.slice(0, 5)}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
      <div className={`min-w-0 flex-1 ${settled ? "opacity-60" : ""}`}>
        <div className={`text-sm font-bold text-gray-800 truncate ${appt.status === "Completed" ? "line-through" : ""}`}>{appt.patient.name}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
          {appt.isVideo ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
          {typeLabel(appt)}
        </div>
      </div>
      <StatusCell appt={appt} isActive={isActive} hasActiveSession={hasActiveSession} onJoin={onJoin} />
    </div>
  );
}

function NowDivider() {
  return (
    <div className="relative flex items-center px-4 py-1.5">
      <div className="flex-1 h-px bg-red-300" />
      <span className="mx-2 text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 tabular-nums shrink-0">{minToClock(NOW_MINUTES)}</span>
      <div className="flex-1 h-px bg-red-300" />
    </div>
  );
}

// The row-based list view — time · status · patient · type, one row per
// appointment. Reads faster than a pixel timeline once there's no
// lane-packing to visually parse, and it's the natural place for the
// mutual-exclusion Join button per video row.
function ScheduleListView({ appts, activeApptId, hasActiveSession, onOpen, onJoin }: {
  appts: Appt[];
  activeApptId?: string;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
}) {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const nowDividerIndex = sorted.findIndex((a) => a.startMin > NOW_MINUTES);

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
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
      className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden hover:shadow-md hover:z-10 transition-shadow ${apptBlockClass(appt.status)} ${isActive ? "ring-2 ring-orange-400" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
        {appt.isVideo && <Video className="w-3 h-3 text-slate-500 shrink-0" />}
        <span className="text-[11px] font-bold text-gray-800 truncate">{appt.patient.name}</span>
      </div>
      {showDetail && (
        <div className="text-[10px] text-gray-500 truncate mt-0.5 pl-3">
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
function ScheduleCalendarView({ appts, activeApptId, onOpen }: {
  appts: Appt[];
  activeApptId?: string;
  onOpen: (id: string) => void;
}) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex" style={{ height: gridHeight }}>
        <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/30">
          {hours.map((h, i) => i % 2 === 1 && (
            <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-100/50" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
          ))}
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 text-[10px] font-semibold text-gray-500 text-right pr-2 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
              {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
          <span className="absolute right-1.5 z-20 text-[9px] font-bold text-white bg-red-500 rounded px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
            {minToClock(NOW_MINUTES)}
          </span>
        </div>
        <div className="flex-1 relative">
          {hours.map((h, i) => i % 2 === 1 && (
            <div key={`band-${h}`} className="absolute left-0 right-0 bg-gray-50/60 pointer-events-none" style={{ top: (i - 1) * HOUR_PX, height: HOUR_PX }} />
          ))}
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: i * HOUR_PX }} />
          ))}
          <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
            <div className="relative border-t-2 border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]">
              <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
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

function ViewToggle({ view, onChange }: { view: ScheduleView; onChange: (v: ScheduleView) => void }) {
  return (
    <div className="inline-flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
      {(["list", "calendar"] as ScheduleView[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all capitalize ${view === v ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
// at-a-glance shape of the day instead.
export function ClinicianScheduleList({ appts, activeApptId, hasActiveSession, onOpen, onJoin }: {
  appts: Appt[];
  activeApptId?: string;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [view, setView] = useState<ScheduleView>("list");

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col flex-1 min-h-0">
      <div className="border-b border-gray-200 bg-gray-50/70 px-4 py-2.5 flex items-start justify-between shrink-0 gap-3">
        <h3 className="font-bold text-gray-800 text-sm shrink-0 py-1">
          Today's Schedule <span className="text-gray-400 font-medium ml-1">{TODAY_SHORT}</span>
        </h3>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => navigate("/calendar/schedule")}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            Open Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>
      {view === "list" ? (
        <ScheduleListView appts={appts} activeApptId={activeApptId} hasActiveSession={hasActiveSession} onOpen={onOpen} onJoin={onJoin} />
      ) : (
        <ScheduleCalendarView appts={appts} activeApptId={activeApptId} onOpen={onOpen} />
      )}
    </div>
  );
}
