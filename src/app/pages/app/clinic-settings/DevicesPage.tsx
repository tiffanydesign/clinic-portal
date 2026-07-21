import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronRight, Plus, MonitorSmartphone, AlertTriangle } from "lucide-react";
import { DeviceType } from "./devicesData";
import { useDeviceViews, DeviceView, displayStatus, DeviceDisplayStatus } from "./deviceView";
import { getActiveRoomsSnapshot, roomName, useRooms } from "./roomsStore";
import { FilterSelect } from "../../../components/FilterSelect";
import { useSimulatedResource, DemoStateControl, LoadingState, ErrorState, EmptyState } from "./settingsStates";
import { DeviceRow } from "./DeviceRow";
import { DeviceAddDrawer } from "./DeviceAddDrawer";
import { DeviceDetailDrawer } from "./DeviceDetailDrawer";

type TypeTab = "all" | DeviceType;
type StatusFilter = "all" | DeviceDisplayStatus | "retired";

const TYPE_TABS: { v: TypeTab; label: string }[] = [
  { v: "all", label: "All" },
  { v: "Scan Device", label: "Scan Device" },
  { v: "TV", label: "TV" },
  { v: "Payment Terminal", label: "Payment Terminal" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "needs-attention", label: "Needs attention" },
  { value: "offline", label: "Offline" },
  { value: "retired", label: "Retired" },
];

function DeviceTable({ views, onOpen }: { views: DeviceView[]; onOpen: (v: DeviceView) => void }) {
  return (
    <div className="border border-divider rounded-card overflow-hidden shadow-sm">
      <div>
        <table className="w-full text-left [&_th]:!px-2 [&_td]:!px-2">
          <thead className="bg-surface-page">
            <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              <th className="px-4 py-3 border-b border-divider">Device</th>
              <th className="px-4 py-3 border-b border-divider">Model</th>
              <th className="px-4 py-3 border-b border-divider">Short Code</th>
              <th className="px-4 py-3 border-b border-divider">Type</th>
              <th className="px-4 py-3 border-b border-divider">Assigned Room</th>
              <th className="px-4 py-3 border-b border-divider">Status</th>
              <th className="px-4 py-3 border-b border-divider">Last Seen</th>
              <th className="px-3 py-3 border-b border-divider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider bg-surface">
            {views.map((v) => <DeviceRow key={v.id} view={v} onOpen={onOpen} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DevicesPage() {
  const views = useDeviceViews();
  useRooms(); // subscribe so room renames/reorders re-render the grouped view
  const { state, set } = useSimulatedResource("devices");
  const [params, setParams] = useSearchParams();

  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [grouped, setGrouped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detailView = detailId ? views.find((v) => v.id === detailId) ?? null : null;

  // Deep links: ?type=payment-terminal pre-filters (the redirect from the old
  // Payment Terminals route), ?device=<id> opens a device straight away.
  useEffect(() => {
    const t = params.get("type");
    const d = params.get("device");
    if (t === "payment-terminal") setTypeTab("Payment Terminal");
    if (d && views.some((v) => v.id === d)) setDetailId(d);
    if (t || d) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeCount = (v: TypeTab) => views.filter((x) => !x.retired && (v === "all" || x.type === v)).length;

  const filtered = useMemo(() => {
    const base = status === "retired" ? views.filter((v) => v.retired) : views.filter((v) => !v.retired);
    let list = base.filter((v) => typeTab === "all" || v.type === typeTab);
    if (status !== "all" && status !== "retired") list = list.filter((v) => displayStatus(v) === status);
    return list;
  }, [views, typeTab, status]);

  // Grouped view: Unassigned pinned first (with a reminder), then active rooms
  // in sort order, then any leftover (e.g. a device on a since-deactivated room).
  const groups = useMemo(() => {
    if (!grouped) return null;
    const activeIds = getActiveRoomsSnapshot().map((r) => r.id);
    const byRoom = new Map<string, DeviceView[]>();
    filtered.forEach((v) => {
      const key = v.roomId ?? "__none__";
      const arr = byRoom.get(key) ?? [];
      arr.push(v);
      byRoom.set(key, arr);
    });
    const ordered: { key: string; label: string; views: DeviceView[]; unassigned?: boolean }[] = [];
    if (byRoom.has("__none__")) ordered.push({ key: "__none__", label: "Unassigned", views: byRoom.get("__none__")!, unassigned: true });
    activeIds.forEach((id) => byRoom.has(id) && ordered.push({ key: id, label: roomName(id), views: byRoom.get(id)! }));
    byRoom.forEach((v, key) => {
      if (key !== "__none__" && !activeIds.includes(key)) ordered.push({ key, label: roomName(key), views: v });
    });
    return ordered;
  }, [grouped, filtered]);

  const onOpen = (v: DeviceView) => setDetailId(v.id);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <div className="px-6 py-6 border-b border-divider shrink-0 flex justify-between items-start bg-surface">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-2">
            <Link to="/clinic-settings" className="hover:text-ink-soft hover:underline">Clinic Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-soft font-bold">Devices</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Devices</h1>
          <p className="text-sm text-ink-muted mt-1">Scanners, room TVs and payment terminals across the clinic</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <DemoStateControl state={state} onChange={set} />
          <button onClick={() => setShowAdd(true)} className="flex items-center px-4 py-2 bg-ink text-white rounded-card text-sm font-bold hover:bg-ink transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add device
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-divider bg-surface-page/60 shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
          {TYPE_TABS.map((t) => (
            <button
              key={t.v}
              onClick={() => setTypeTab(t.v)}
              className={`px-3 py-1.5 text-xs font-bold rounded-control transition-colors flex items-center gap-1.5 ${typeTab === t.v ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
            >
              {t.label}
              <span className={`text-label tabular-nums ${typeTab === t.v ? "text-ink-muted" : "text-ink-muted"}`}>{typeCount(t.v)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <FilterSelect value={status} onChange={(v) => setStatus(v as StatusFilter)} options={STATUS_OPTIONS} className="text-xs py-1.5" />
          <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
            {[{ v: false, label: "List" }, { v: true, label: "By room" }].map((o) => (
              <button key={o.label} onClick={() => setGrouped(o.v)} className={`px-3 py-1.5 text-xs font-bold rounded-control transition-colors ${grouped === o.v ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {state === "loading" ? (
          <LoadingState />
        ) : state === "error" ? (
          <ErrorState entity="devices" onRetry={() => set("loading")} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MonitorSmartphone}
            title="No devices here"
            body={status === "retired" ? "No retired devices to show." : "No devices match these filters. Try a different type or status."}
            cta={status !== "retired" && <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-ink text-white rounded-card text-base font-bold hover:bg-ink transition-colors shadow-sm">Add a device</button>}
          />
        ) : groups ? (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center gap-2 mb-2.5">
                  <h3 className="text-sm font-bold text-ink-soft">{g.label}</h3>
                  <span className="text-xs font-semibold text-ink-muted">{g.views.length}</span>
                  {g.unassigned && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-warning-ink bg-warning/10 border border-warning/30 rounded-full px-2 py-0.5">
                      <AlertTriangle className="w-3 h-3" /> needs a room
                    </span>
                  )}
                </div>
                <DeviceTable views={g.views} onOpen={onOpen} />
              </div>
            ))}
          </div>
        ) : (
          <DeviceTable views={filtered} onOpen={onOpen} />
        )}
      </div>

      {showAdd && <DeviceAddDrawer onClose={() => setShowAdd(false)} />}
      {detailView && <DeviceDetailDrawer view={detailView} onClose={() => setDetailId(null)} />}
    </div>
  );
}
