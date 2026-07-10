import React from "react";
import { useNavigate } from "react-router";
import { Video, ArrowRight } from "lucide-react";
import type { Role } from "../../../context/AppContext";
import {
  APPTS, Appt, DOCTOR_COLUMNS, DAY_START_HOUR, DAY_END_HOUR, HOUR_PX,
  NOW_MINUTES, TODAY_SHORT, apptBlockClass, apptStatusDotClass, blockHeightPx, gapToNext, minToClock,
} from "./dashboardData";

const NURSE_NAME = "Berna Koç";
const CLINICIAN_ID = "EMP-003"; // Dr. Claudia Reis (signed-in clinician)

type Column = { key: string; label: string; appts: Appt[] };

function buildColumns(role: Role): Column[] {
  if (role === "Nurse") {
    return [{ key: "me", label: "My Patients", appts: APPTS.filter((a) => a.nurse === NURSE_NAME) }];
  }
  if (role === "Clinician") {
    return [{ key: "me", label: "My Schedule", appts: APPTS.filter((a) => a.doctorId === CLINICIAN_ID) }];
  }
  // Admin & Reception: one column per active doctor
  return DOCTOR_COLUMNS.map((d) => ({
    key: d.id,
    label: d.name,
    appts: APPTS.filter((a) => a.doctorId === d.id),
  }));
}

// Simple lane-packing so overlapping appointments sit side by side.
function packLanes(appts: Appt[]): { appt: Appt; lane: number; lanes: number }[] {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const laneEnds: number[] = [];
  const placed = sorted.map((appt) => {
    const end = appt.startMin + appt.durationMin;
    let lane = laneEnds.findIndex((e) => e <= appt.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { appt, lane };
  });
  const lanes = Math.max(1, laneEnds.length);
  return placed.map((p) => ({ ...p, lanes }));
}

function ApptBlock({ appt, lane, lanes, gapMin }: { appt: Appt; lane: number; lanes: number; gapMin?: number }) {
  const navigate = useNavigate();
  const top = ((appt.startMin - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const height = blockHeightPx(appt.durationMin, gapMin);
  const widthPct = 100 / lanes;
  const showDetail = height >= 38;

  return (
    <button
      onClick={() => navigate(`/dashboard/appointment/${appt.id}`)}
      style={{ top, height, left: `${lane * widthPct}%`, width: `calc(${widthPct}% - 3px)` }}
      className={`absolute px-2 py-1 text-left overflow-hidden hover:shadow-md hover:z-10 transition-shadow ${apptBlockClass(appt.status)}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${apptStatusDotClass(appt.status)}`} />
        {appt.isVideo && <Video className="w-3 h-3 text-slate-500 shrink-0" />}
        <span className="text-[11px] font-bold text-gray-800 truncate">{appt.patient.name}</span>
      </div>
      {showDetail && (
        <div className="text-[10px] text-gray-500 truncate mt-0.5 pl-3">
          {appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {appt.durationMin}m
        </div>
      )}
    </button>
  );
}

export function CalendarWidget({ role }: { role: Role }) {
  const navigate = useNavigate();
  const columns = buildColumns(role);
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const nowTop = ((NOW_MINUTES - DAY_START_HOUR * 60) / 60) * HOUR_PX;

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col h-full min-h-0">
      {/* Header */}
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

      {/* Column headers (multi-doctor for Admin/Reception) */}
      {columns.length > 1 && (
        <div className="flex border-b border-gray-200 bg-gray-50/40 shrink-0 pl-14">
          {columns.map((c) => (
            <div key={c.key} className="flex-1 px-2 py-2 text-center text-xs font-bold text-gray-600 border-l border-gray-100 truncate">
              {c.label}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* Hour gutter */}
          <div className="w-14 shrink-0 relative border-r border-gray-200 bg-gray-50/30">
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 text-[10px] font-medium text-gray-400 text-right pr-2 tabular-nums" style={{ top: i * HOUR_PX - 6 }}>
                {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
            <span className="absolute right-1.5 z-20 text-[9px] font-bold text-white bg-red-500 rounded px-1 py-[1px] shadow-sm tabular-nums" style={{ top: nowTop - 7 }}>
              {minToClock(NOW_MINUTES)}
            </span>
          </div>

          {/* Columns */}
          <div className="flex-1 relative">
            {/* Hour gridlines */}
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />
            ))}

            {/* Now line */}
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
              <div className="relative border-t-2 border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]">
                <span className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </div>
            </div>

            {/* Appointment columns */}
            <div className="flex h-full">
              {columns.map((c) => {
                const packed = packLanes(c.appts);
                return (
                  <div key={c.key} className="flex-1 relative border-l border-gray-100">
                    {packed.map(({ appt, lane, lanes }) => {
                      const laneMates = packed.filter((p) => p.lane === lane).map((p) => p.appt);
                      return <ApptBlock key={appt.id} appt={appt} lane={lane} lanes={lanes} gapMin={gapToNext(laneMates, appt.startMin)} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
