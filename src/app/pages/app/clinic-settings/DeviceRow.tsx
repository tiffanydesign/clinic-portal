// One device row for the Devices table. The Assigned Room dropdown edits in
// place (immediate, with a toast); the rest of the actions live in the detail
// drawer opened by clicking the row.
import React from "react";
import { toast } from "sonner";
import { ScanLine, Tv, CreditCard, LucideIcon } from "lucide-react";
import { DeviceView, displayStatus, DEVICE_STATUS_META, reassignDeviceView } from "./deviceView";
import { restoreDevice } from "./devicesStore";
import { useActiveRooms } from "./roomsStore";
import { OverflowMenu } from "./settingsUiShared";

const TYPE_ICON: Record<string, LucideIcon> = { "Scan Device": ScanLine, TV: Tv, "Payment Terminal": CreditCard };

export function DeviceRow({ view, onOpen }: { view: DeviceView; onOpen: (v: DeviceView) => void }) {
  const rooms = useActiveRooms();
  const Icon = TYPE_ICON[view.type] ?? ScanLine;
  const meta = DEVICE_STATUS_META[displayStatus(view)];
  const roomValue = rooms.some((r) => r.id === view.roomId) ? view.roomId! : "";

  const reassign = (roomId: string) => {
    reassignDeviceView(view, roomId || null);
    const target = roomId ? rooms.find((r) => r.id === roomId)?.name ?? "room" : "Unassigned";
    toast.success(`${view.label} → ${target}.`);
  };

  return (
    <tr className={`transition-colors cursor-pointer ${view.retired ? "bg-surface-page/40 hover:bg-surface-page" : "hover:bg-surface-page/60"}`} onClick={() => onOpen(view)}>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-card bg-surface-hover flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-ink-soft" />
          </div>
          <div className="min-w-0">
            <div className={`text-sm font-bold truncate ${view.retired ? "text-ink-muted" : "text-ink"}`}>{view.label}</div>
            {view.retired && <div className="text-label font-bold text-ink-muted uppercase tracking-wide">Retired</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-ink-soft whitespace-nowrap">{view.model}</td>
      <td className="px-4 py-3.5 text-sm text-ink-muted font-mono tracking-wide whitespace-nowrap">{view.shortCode}</td>
      <td className="px-4 py-3.5 text-sm text-ink-soft whitespace-nowrap">{view.type}</td>
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <select
          value={roomValue}
          disabled={view.retired}
          onChange={(e) => reassign(e.target.value)}
          className="max-w-[160px] px-2.5 py-1.5 border border-divider rounded-card text-sm text-ink-soft bg-surface outline-none focus:border-border-strong disabled:bg-surface-page disabled:text-ink-muted"
        >
          <option value="">Unassigned</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${meta.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-ink-muted whitespace-nowrap">{view.lastSeen}</td>
      <td className="px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        <OverflowMenu
          ariaLabel={`Actions for ${view.label}`}
          items={
            view.retired
              ? [
                  { label: "View details", onClick: () => onOpen(view) },
                  { label: "Restore device", onClick: () => { restoreDevice(view.id); toast.success(`${view.label} restored.`); } },
                ]
              : [{ label: "View details", onClick: () => onOpen(view) }]
          }
        />
      </td>
    </tr>
  );
}
