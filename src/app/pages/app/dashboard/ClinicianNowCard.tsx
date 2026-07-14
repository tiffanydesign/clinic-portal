import React from "react";
import { Video, MapPin, CheckCircle2 } from "lucide-react";
import { Appt, relevantJourneySteps } from "./dashboardData";
import { CondensedJourneyStrip } from "./AppointmentDrawerShared";
import { inPersonStartState, videoJoinState } from "./clinicianDashboardData";

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

function VideoWaitingLine({ appt }: { appt: Appt }) {
  const text =
    appt.status === "Checked In" ? "Checked in online — ready to connect" :
    appt.status === "Arrived" ? "Arrived — waiting to connect" :
    "Not yet checked in";
  return <p className="text-sm text-gray-500 mt-3">{text}</p>;
}

// The Clinician Dashboard's single big action card: whichever patient is
// actually "now" (status In Clinic — the single-active-session rule) takes
// over the card entirely; otherwise it previews whoever is next and how far
// along their own journey already is, so the clinician can predict the wait
// without opening a detail view. The small label above the card ("Current
// Patient" / "Next Patient") names which of those two states is showing,
// since the card itself is reused for both rather than being two components.
export function ClinicianNowCard({
  activeAppt,
  upNextAppt,
  onOpenRecord,
  onComplete,
  onStartOrJoin,
}: {
  activeAppt?: Appt;
  upNextAppt?: Appt;
  onOpenRecord: (id: string) => void;
  onComplete: (id: string) => void;
  onStartOrJoin: (id: string) => void;
}) {
  const heading = activeAppt ? "Current Patient" : upNextAppt ? "Next Patient" : null;

  return (
    <div className="shrink-0">
      {heading && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-0.5">{heading}</h3>}

      {activeAppt ? (
        (() => {
          const a = activeAppt;
          const { steps, current } = relevantJourneySteps(a);
          return (
            <div className="border border-orange-200 bg-orange-50/60 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Now</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{a.patient.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                    {a.isVideo ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                    {typeLabel(a)} · {a.timeLabel}
                  </p>
                </div>
              </div>

              {!a.isVideo && (
                <div className="mt-4 px-1">
                  <CondensedJourneyStrip steps={steps} current={current} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => onOpenRecord(a.id)}
                  className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Open Record
                </button>
                <button
                  onClick={() => onComplete(a.id)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Consultation
                </button>
              </div>
            </div>
          );
        })()
      ) : upNextAppt ? (
        (() => {
          const a = upNextAppt;
          const { steps, current } = relevantJourneySteps(a);
          const gate = a.isVideo ? videoJoinState(a, false) : inPersonStartState(a);
          const actionLabel = a.isVideo ? "Join Call" : "Start Consultation";
          return (
            <div className="border border-blue-200 bg-blue-50/50 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Up Next</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800 truncate">{a.patient.name}</h3>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                  {a.isVideo ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                  {typeLabel(a)} · {a.timeLabel}
                </p>
              </div>

              {a.isVideo ? (
                <VideoWaitingLine appt={a} />
              ) : (
                <div className="mt-4 px-1">
                  <CondensedJourneyStrip steps={steps} current={current} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => onOpenRecord(a.id)}
                  className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Open Record
                </button>
                <button
                  disabled={!gate.enabled}
                  onClick={() => onStartOrJoin(a.id)}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    gate.enabled ? "bg-slate-700 text-white hover:bg-slate-800" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {a.isVideo && <Video className="w-4 h-4" />} {actionLabel}
                </button>
              </div>
              {!gate.enabled && <p className="text-xs text-gray-500 font-medium mt-2 text-right">{gate.reason}</p>}
            </div>
          );
        })()
      ) : (
        <div className="border border-gray-200 bg-white rounded-xl shadow-sm p-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium text-gray-600">All caught up — no more patients scheduled today.</p>
        </div>
      )}
    </div>
  );
}
