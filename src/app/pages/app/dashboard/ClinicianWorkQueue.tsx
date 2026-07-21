import React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { CLINICIAN_REVIEW_QUEUE, QueueItem } from "./clinicianDashboardData";

function QueueRow({ item, onAction }: { item: QueueItem; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-page gap-2">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink truncate">{item.patient}</div>
        <div className="text-xs text-ink-muted flex items-center gap-1.5">
          {item.test} · {item.submitted}
          {item.overdue && <span className="text-label font-bold text-danger-ink flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
        </div>
      </div>
      <button onClick={onAction} className="px-3 py-1.5 text-label font-bold text-ink-soft border border-divider bg-surface-page rounded-control hover:bg-surface-hover shrink-0">
        Review
      </button>
    </div>
  );
}

// Single-purpose Work Queue card: results awaiting a first look. The queue
// used to be segmented Review/Sign-off, but sign-off happens elsewhere now —
// this card only ever shows Review, so there's nothing left to toggle. Shares
// ClinicianScheduleList's ("Today's Schedule") exact shell — same rounded-card
// border, same bordered/tinted header bar — so the two cards stacked in the
// dashboard's two columns read as one consistent card language instead of
// two different ones (this one used to be a plain h-12 header with no tint).
export function ClinicianWorkQueue() {
  const nav = useNavigate();
  const sorted = [...CLINICIAN_REVIEW_QUEUE].sort((a, b) => Number(b.overdue) - Number(a.overdue));

  return (
    <div className="rounded-card bg-surface flex flex-col h-full min-h-0">
      <div className="border-b border-divider bg-surface-page/70 px-4 py-2.5 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-ink text-sm">Work Queue</h3>
        <span className="text-xs font-semibold text-ink-muted">{sorted.length} pending review</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center gap-2 text-sm font-medium text-ink-muted">
            <CheckCircle2 className="w-4 h-4 text-success-ink" /> All clear
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {sorted.map((item) => (
              <QueueRow key={`${item.patient}-${item.test}`} item={item} onAction={() => nav("/patients/P-001/results")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
