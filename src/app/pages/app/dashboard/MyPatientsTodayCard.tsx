import React from "react";

function KpiTile({ value, label, tone }: { value: number; label: string; tone?: "blue" | "green" }) {
  const valueCls = tone === "blue" ? "text-blue-600" : tone === "green" ? "text-emerald-600" : "text-slate-800";
  return (
    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3.5 text-center">
      <div className={`text-[26px] font-extrabold leading-none ${valueCls}`}>{value}</div>
      <div className="text-xs font-bold text-gray-500 mt-1.5">{label}</div>
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
        <KpiTile value={scheduled} label="Scheduled" />
        <KpiTile value={inProgress} label="In progress" tone="blue" />
        <KpiTile value={done} label="Completed" tone="green" />
      </div>
    </div>
  );
}
