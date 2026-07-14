import React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { CLINICIAN_REVIEW_QUEUE, QueueItem } from "./clinicianDashboardData";

function QueueRow({ item, onAction }: { item: QueueItem; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 gap-2">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{item.patient}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          {item.test} · {item.submitted}
          {item.overdue && <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Overdue</span>}
        </div>
      </div>
      <button onClick={onAction} className="px-3 py-1.5 text-[11px] font-bold text-slate-700 border border-slate-300 bg-slate-50 rounded hover:bg-slate-100 shrink-0">
        Review
      </button>
    </div>
  );
}

// Single-purpose Work Queue card: results awaiting a first look. The queue
// used to be segmented Review/Sign-off, but sign-off happens elsewhere now —
// this card only ever shows Review, so there's nothing left to toggle.
export function ClinicianWorkQueue() {
  const nav = useNavigate();
  const sorted = [...CLINICIAN_REVIEW_QUEUE].sort((a, b) => Number(b.overdue) - Number(a.overdue));

  return (
    <div className="border border-gray-300 rounded bg-white flex flex-col h-full">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">Work Queue</h3>
        <span className="text-xs font-semibold text-gray-400">{sorted.length} pending review</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center gap-2 text-sm font-medium text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All clear
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sorted.map((item) => (
              <QueueRow key={`${item.patient}-${item.test}`} item={item} onAction={() => nav("/patients/P-001/results")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
