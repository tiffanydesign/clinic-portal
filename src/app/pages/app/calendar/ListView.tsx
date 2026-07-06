import React, { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, Video } from "lucide-react";
import { Appt, APPT_TYPES, CLINICIANS } from "./scheduleData";
import { StatusPill } from "../dashboard/DashboardShared";
import { statusPillType } from "../dashboard/dashboardData";

const STATUSES = ["Booked", "Arrived", "Checked In", "In Clinic", "Completed", "No Show", "Cancelled"];
const PAGE_SIZE = 10;

type SortKey = "time" | "patient";

export function ListView({ appts, onRowClick }: { appts: Appt[]; onRowClick: (appt: Appt) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [doctor, setDoctor] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = appts.filter((a) =>
      (!q || a.patient.name.toLowerCase().includes(q.toLowerCase()) || a.id.toLowerCase().includes(q.toLowerCase())) &&
      (!status || a.status === status) &&
      (!type || a.type === type) &&
      (!doctor || a.doctorId === doctor)
    );
    rows = [...rows].sort((a, b) => {
      const cmp = sortKey === "time" ? a.startMin - b.startMin : a.patient.name.localeCompare(b.patient.name);
      return asc ? cmp : -cmp;
    });
    return rows;
  }, [appts, q, status, type, doctor, sortKey, asc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc(!asc); else { setSortKey(k); setAsc(true); }
  };
  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? null : asc ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  const sel = "px-2.5 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500";

  return (
    <div className="border border-gray-300 rounded bg-white flex flex-col h-full min-h-0 overflow-hidden">
      {/* toolbar */}
      <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search patient or appointment…" className={`${sel} w-full pl-8`} />
        </div>
        <input value="3 Jul 2026" readOnly className={`${sel} bg-gray-50 w-28`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className={sel}><option value="">All status</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className={sel}><option value="">All types</option>{APPT_TYPES.map((t) => <option key={t} value={t}>{t.replace(" (in-person)", "").replace(" (video)", "")}</option>)}</select>
        <select value={doctor} onChange={(e) => { setDoctor(e.target.value); setPage(0); }} className={sel}><option value="">All clinicians</option>{CLINICIANS.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select>
      </div>

      {/* table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr className="text-gray-600">
              <th className="px-4 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort("time")}>Time <SortIcon k="time" /></th>
              <th className="px-4 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort("patient")}>Patient <SortIcon k="patient" /></th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Clinician</th>
              <th className="px-4 py-2.5 font-semibold">Nurse</th>
              <th className="px-4 py-2.5 font-semibold">Room</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Payment</th>
              <th className="px-4 py-2.5 font-semibold">Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((a) => (
              <tr key={a.id} onClick={() => onRowClick(a)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2.5 text-gray-500 font-medium whitespace-nowrap">{a.timeLabel.slice(0, 5)}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{a.patient.name}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                  <span className="flex items-center gap-1">{a.isVideo && <Video className="w-3.5 h-3.5 text-slate-400" />}{a.type.replace(" (in-person)", "").replace(" (video)", "")}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{a.doctor.replace("Dr. ", "Dr. ")}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{a.nurse ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{a.room}</td>
                <td className="px-4 py-2.5"><StatusPill status={a.status} type={statusPillType(a.status)} /></td>
                <td className="px-4 py-2.5"><StatusPill status={a.payment} type={a.payment === "Paid" ? "success" : a.payment === "Partial" ? "warning" : "error"} /></td>
                <td className="px-4 py-2.5"><StatusPill status={a.consent} type={a.consent === "Signed" ? "success" : a.consent === "Pending" ? "warning" : "error"} /></td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No appointments match the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between shrink-0 text-sm">
        <span className="text-gray-500">{filtered.length} appointment{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={`px-3 py-1.5 border rounded text-xs font-bold ${page === 0 ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}>Prev</button>
          <span className="text-gray-500 text-xs">Page {page + 1} of {pageCount}</span>
          <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className={`px-3 py-1.5 border rounded text-xs font-bold ${page >= pageCount - 1 ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-gray-700 border-gray-300 hover:bg-gray-50"}`}>Next</button>
        </div>
      </div>
    </div>
  );
}
