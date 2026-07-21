import React, { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, Video } from "lucide-react";
import { format } from "date-fns";
import { Appt, APPT_TYPES, CLINICIANS, roomName } from "./scheduleData";
import { FilterSelect } from "../../../components/FilterSelect";
import { StatusPill } from "../dashboard/DashboardShared";
import { statusPillType } from "../dashboard/dashboardData";

const STATUSES = ["Booked", "Arrived", "Checked In", "In Clinic", "Completed", "No Show", "Cancelled"];
const PAGE_SIZE = 10;

type SortKey = "time" | "patient";

export function ListView({ appts, onRowClick, selectedDate }: { appts: Appt[]; onRowClick: (appt: Appt) => void; selectedDate: Date }) {
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
  const sel = "px-2.5 py-2 border border-divider rounded-card text-sm text-ink-soft bg-surface outline-none focus:border-border-strong focus:ring-1 focus:ring-divider";

  return (
    <div className="border border-divider rounded-card shadow-sm bg-surface flex flex-col h-full min-h-0 overflow-hidden">
      {/* toolbar */}
      <div className="p-3 border-b border-divider bg-surface-page/50 flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search patient or appointment…" className={`${sel} w-full pl-4 bg-surface`} />
        </div>
        <input value={format(selectedDate, "d MMM yyyy")} readOnly className={`${sel} bg-surface-hover w-28 tabular-nums`} />
        <FilterSelect
          value={status}
          onChange={(v) => { setStatus(v); setPage(0); }}
          options={[{ value: "", label: "All status" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
        />
        <FilterSelect
          value={type}
          onChange={(v) => { setType(v); setPage(0); }}
          options={[
            { value: "", label: "All types" },
            ...APPT_TYPES.map((t) => ({ value: t, label: t.replace(" (in-person)", "").replace(" (video)", "") })),
          ]}
        />
        <FilterSelect
          value={doctor}
          onChange={(v) => { setDoctor(v); setPage(0); }}
          options={[{ value: "", label: "All clinicians" }, ...CLINICIANS.map((c) => ({ value: c.id, label: c.short }))]}
        />
      </div>

      {/* table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-page border-b border-divider sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <tr className="text-ink-muted">
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide cursor-pointer select-none" onClick={() => toggleSort("time")}>Time <SortIcon k="time" /></th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide cursor-pointer select-none" onClick={() => toggleSort("patient")}>Patient <SortIcon k="patient" /></th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Clinician</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Nurse</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Room</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Payment</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {pageRows.map((a) => (
              <tr key={a.id} onClick={() => onRowClick(a)} className="hover:bg-surface-page/80 cursor-pointer transition-colors">
                <td className="px-4 py-3 text-ink-muted font-semibold whitespace-nowrap tabular-nums">{a.timeLabel.slice(0, 5)}</td>
                <td className="px-4 py-3 font-semibold text-ink">{a.patient.name}</td>
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                  <span className="flex items-center gap-1">{a.isVideo && <Video className="w-3.5 h-3.5 text-ink-muted" />}{a.type.replace(" (in-person)", "").replace(" (video)", "")}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{a.doctor.replace("Dr. ", "Dr. ")}</td>
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{a.nurse ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{roomName(a.room)}</td>
                <td className="px-4 py-3"><StatusPill status={a.status} type={statusPillType(a.status)} /></td>
                {/* "Partial" is deliberately not its own PaymentStatus any more
                    (see dashboardData.ts) — any non-zero balance is Unpaid — so
                    Paid/Unpaid is the whole union here. */}
                <td className="px-4 py-3"><StatusPill status={a.payment} type={a.payment === "Paid" ? "success" : "error"} /></td>
                <td className="px-4 py-3"><StatusPill status={a.consent} type={a.consent === "Signed" ? "success" : a.consent === "Pending" ? "warning" : "error"} /></td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-ink-muted text-sm">No appointments match the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="p-3 border-t border-divider bg-surface-page/50 flex items-center justify-between shrink-0 text-sm">
        <span className="text-ink-muted font-medium">{filtered.length} appointment{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={`px-3 py-1.5 border rounded-card text-xs font-bold ${page === 0 ? "text-ink-muted border-divider cursor-not-allowed" : "text-ink-soft border-divider bg-surface hover:bg-surface-page shadow-sm"}`}>Prev</button>
          <span className="text-ink-muted text-xs font-medium">Page {page + 1} of {pageCount}</span>
          <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className={`px-3 py-1.5 border rounded-card text-xs font-bold ${page >= pageCount - 1 ? "text-ink-muted border-divider cursor-not-allowed" : "text-ink-soft border-divider bg-surface hover:bg-surface-page shadow-sm"}`}>Next</button>
        </div>
      </div>
    </div>
  );
}
