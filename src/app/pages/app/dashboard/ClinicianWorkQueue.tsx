import React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { CLINICIAN_REVIEW_QUEUE, CLINICIAN_SIGNOFF_QUEUE, QueueItem } from "./clinicianDashboardData";

function Segmented({ value, onChange }: { value: "review" | "signoff"; onChange: (v: "review" | "signoff") => void }) {
  const options: { v: "review" | "signoff"; label: string }[] = [
    { v: "review", label: `Review (${CLINICIAN_REVIEW_QUEUE.length})` },
    { v: "signoff", label: `Sign-off (${CLINICIAN_SIGNOFF_QUEUE.length})` },
  ];
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${value === o.v ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function QueueRow({ item, actionLabel, onAction }: { item: QueueItem; actionLabel: string; onAction: () => void }) {
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
        {actionLabel}
      </button>
    </div>
  );
}

// Single Work Queue card, segmented Review/Sign-off — the two queues never
// interleave (each is its own distinct clinical step: first look, then
// final signature), so a segmented control keeps them legible instead of one
// merged, harder-to-scan list.
export function ClinicianWorkQueue({ tab, onTabChange }: { tab: "review" | "signoff"; onTabChange: (t: "review" | "signoff") => void }) {
  const nav = useNavigate();
  const items = tab === "review" ? CLINICIAN_REVIEW_QUEUE : CLINICIAN_SIGNOFF_QUEUE;
  const sorted = [...items].sort((a, b) => Number(b.overdue) - Number(a.overdue));
  const actionLabel = tab === "review" ? "Review" : "Sign";

  return (
    <div className="border border-gray-300 rounded bg-white flex flex-col h-full">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 text-sm">Work Queue</h3>
        <Segmented value={tab} onChange={onTabChange} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center gap-2 text-sm font-medium text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All clear
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sorted.map((item) => (
              <QueueRow key={`${item.patient}-${item.test}`} item={item} actionLabel={actionLabel} onAction={() => nav("/patients/P-001/results")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
