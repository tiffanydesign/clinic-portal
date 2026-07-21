import React from "react";
import { useNavigate } from "react-router";
import { Video, MapPin, CheckCircle2 } from "lucide-react";
import { Appt } from "./dashboardData";
import { ApptJourneyStrip } from "./journey/JourneyProgress";
import { inPersonStartState, videoJoinState } from "./clinicianDashboardData";

function typeLabel(a: Appt): string {
  return a.type.replace(" (in-person)", "").replace(" (video)", "");
}

function VideoWaitingLine({ appt }: { appt: Appt }) {
  const text =
    appt.status === "Checked In" ? "Checked in online — ready to connect" :
    appt.status === "Arrived" ? "Arrived — waiting to connect" :
    "Not yet checked in";
  return <p className="text-sm text-ink-muted mt-3">{text}</p>;
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
  const navigate = useNavigate();
  const heading = activeAppt ? "Current Patient" : upNextAppt ? "Next Patient" : null;

  return (
    <div className="shrink-0">
      {heading && <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 px-0.5">{heading}</h3>}

      {activeAppt ? (
        (() => {
          const a = activeAppt;
          return (
            <div className="border border-warning/30 bg-warning/10 rounded-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-warning-ink animate-pulse" />
                <span className="text-label font-bold text-warning-ink uppercase tracking-wider">Now</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-ink truncate">{a.patient.name}</h3>
                  </div>
                  <p className="text-sm text-ink-soft mt-1 flex items-center gap-1.5">
                    {a.isVideo ? <Video className="w-3.5 h-3.5 text-ink-muted" /> : <MapPin className="w-3.5 h-3.5 text-ink-muted" />}
                    {typeLabel(a)} · {a.timeLabel}
                  </p>
                </div>
              </div>

              {!a.isVideo && (
                <div className="mt-4">
                  <ApptJourneyStrip appt={a} onOpen={() => navigate(`${a.patient.route}/journeys`)} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => onOpenRecord(a.id)}
                  className="px-4 py-2.5 border border-divider bg-surface text-ink-soft text-sm font-bold rounded-card hover:bg-surface-page transition-colors"
                >
                  Open Record
                </button>
                <button
                  onClick={() => onComplete(a.id)}
                  className="flex-1 px-4 py-2.5 bg-ink text-white text-sm font-bold rounded-card hover:bg-ink transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </button>
              </div>
            </div>
          );
        })()
      ) : upNextAppt ? (
        (() => {
          const a = upNextAppt;
          const gate = a.isVideo ? videoJoinState(a, false) : inPersonStartState(a);
          const actionLabel = a.isVideo ? "Join Call" : "Start";
          return (
            <div className="border border-info/30 bg-info/10 rounded-card shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-label font-bold text-info-ink uppercase tracking-wider">Up Next</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-ink truncate">{a.patient.name}</h3>
                <p className="text-sm text-ink-soft mt-1 flex items-center gap-1.5">
                  {a.isVideo ? <Video className="w-3.5 h-3.5 text-ink-muted" /> : <MapPin className="w-3.5 h-3.5 text-ink-muted" />}
                  {typeLabel(a)} · {a.timeLabel}
                </p>
              </div>

              {a.isVideo ? (
                <VideoWaitingLine appt={a} />
              ) : (
                <div className="mt-4">
                  <ApptJourneyStrip appt={a} onOpen={() => navigate(`${a.patient.route}/journeys`)} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => onOpenRecord(a.id)}
                  className="px-4 py-2.5 border border-divider bg-surface text-ink-soft text-sm font-bold rounded-card hover:bg-surface-page transition-colors"
                >
                  Open Record
                </button>
                <button
                  disabled={!gate.enabled}
                  onClick={() => onStartOrJoin(a.id)}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-card transition-colors flex items-center justify-center gap-2 ${
                    gate.enabled ? "bg-ink text-white hover:bg-ink" : "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed"
                  }`}
                >
                  {a.isVideo && <Video className="w-4 h-4" />} {actionLabel}
                </button>
              </div>
              {!gate.enabled && <p className="text-xs text-ink-muted font-medium mt-2 text-right">{gate.reason}</p>}
            </div>
          );
        })()
      ) : (
        <div className="border border-divider bg-surface rounded-card shadow-sm p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-ink shrink-0" />
          <p className="text-sm font-medium text-ink-soft">All caught up — no more patients scheduled today.</p>
        </div>
      )}
    </div>
  );
}
