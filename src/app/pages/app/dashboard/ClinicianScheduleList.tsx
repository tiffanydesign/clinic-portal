import React from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight, MapPin } from "lucide-react";
import { Appt, JOURNEY_STEPS_RECEPTION, TODAY_SHORT, NOW_MINUTES, minToClock, apptStatusDotClass } from "./dashboardData";
import { StatusPill } from "./DashboardShared";
import { statusPillType } from "./dashboardData";
import { videoJoinState } from "./clinicianDashboardData";

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
    return <span className="text-xs font-bold text-orange-700 whitespace-nowrap">In Clinic · {JOURNEY_STEPS_RECEPTION[appt.currentStep]}</span>;
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

// The Clinician's own row-based Today's Schedule — replaces the shared
// block-timeline CalendarWidget for this role only. A glance-friendly list
// (time · status · patient · type) reads faster than a pixel timeline once
// there's no lane-packing to visually parse, and it's the natural place for
// the mutual-exclusion Join button per video row.
export function ClinicianScheduleList({ appts, activeApptId, hasActiveSession, onOpen, onJoin }: {
  appts: Appt[];
  activeApptId?: string;
  hasActiveSession: boolean;
  onOpen: (id: string) => void;
  onJoin: (id: string) => void;
}) {
  const navigate = useNavigate();
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const nowDividerIndex = sorted.findIndex((a) => a.startMin > NOW_MINUTES);

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col flex-1 min-h-0">
      <div className="h-12 border-b border-gray-200 bg-gray-50/70 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">
          Today's Schedule <span className="text-gray-400 font-medium ml-1">{TODAY_SHORT}</span>
        </h3>
        <button
          onClick={() => navigate("/calendar/schedule")}
          className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          Open Calendar <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
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
    </div>
  );
}
