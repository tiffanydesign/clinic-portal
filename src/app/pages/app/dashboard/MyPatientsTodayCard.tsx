import React from "react";
import { CalendarClock, Activity, CheckCircle2 } from "lucide-react";

// Same semantic tone vocabulary as the KPI bar (KpiBar.tsx's KPI_ICON/TONE_CLASS):
// neutral slate for "not started yet", blue for "in progress", emerald for "done".
const TILE_ICON_CLASS: Record<"slate" | "blue" | "green", string> = {
  slate: "bg-slate-100 text-slate-500",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
};

function KpiTile({
  value,
  label,
  tone = "slate",
  icon: Icon,
}: {
  value: number;
  label: string;
  tone?: "slate" | "blue" | "green";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const valueCls = tone === "blue" ? "text-blue-600" : tone === "green" ? "text-emerald-600" : "text-slate-800";
  return (
    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-2 flex flex-col items-center gap-1.5">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${TILE_ICON_CLASS[tone]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className={`text-[26px] font-extrabold leading-none ${valueCls}`}>{value}</div>
      <div className="text-xs font-bold text-gray-500">{label}</div>
    </div>
  );
}

export function MyPatientsTodayCard({ scheduled, inProgress, done }: { scheduled: number; inProgress: number; done: number }) {
  const total = scheduled + inProgress + done;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 shrink-0">
      <div className="flex items-baseline justify-between mb-3.5">
        <h3 className="text-base font-extrabold text-slate-800">My Patients Today</h3>
        <span className="text-xs font-semibold text-gray-400">{total} total</span>
      </div>
      <div className="flex gap-2.5">
        <KpiTile value={scheduled} label="Scheduled" icon={CalendarClock} />
        <KpiTile value={inProgress} label="In progress" tone="blue" icon={Activity} />
        <KpiTile value={done} label="Completed" tone="green" icon={CheckCircle2} />
      </div>
    </div>
  );
}
