import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ChevronRight, ChevronUp, ChevronDown, Plus, DoorOpen, Pencil, PowerOff, Power,
  ScanLine, Tv, CreditCard, LucideIcon,
} from "lucide-react";
import { Room } from "./roomsData";
import { useRooms, reorderRoom, setRoomStatus } from "./roomsStore";
import { useDeviceViews, DeviceView } from "./deviceView";
import { OverflowMenu, Pill, ConfirmDialog } from "./settingsUiShared";
import { useSimulatedResource, DemoStateControl, LoadingState, ErrorState, EmptyState } from "./settingsStates";
import { RoomDrawer } from "./RoomDrawer";
import { RoomDeactivateDialog } from "./RoomDeactivateDialog";

const DEVICE_ICON: Record<string, LucideIcon> = { "Scan Device": ScanLine, TV: Tv, "Payment Terminal": CreditCard };

function DeviceChips({ devices, onOpen }: { devices: DeviceView[]; onOpen: (id: string) => void }) {
  if (devices.length === 0) return <span className="text-xs text-ink-muted">—</span>;
  const shown = devices.slice(0, 3);
  const extra = devices.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((d) => {
        const Icon = DEVICE_ICON[d.type] ?? ScanLine;
        return (
          <button
            key={d.id}
            onClick={(e) => { e.stopPropagation(); onOpen(d.id); }}
            className="inline-flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-control border border-divider bg-surface-page hover:border-border-strong hover:bg-surface transition-colors text-xs font-semibold text-ink-soft"
            title={`${d.label} · ${d.shortCode}`}
          >
            <Icon className="w-3 h-3 text-ink-muted shrink-0" /> {d.label}
          </button>
        );
      })}
      {extra > 0 && <span className="text-xs font-bold text-ink-muted">+{extra}</span>}
    </div>
  );
}

function RoomRow({ room, index, total, devices, onOpen, onEdit, onDeactivate, onReactivate, onOpenDevice }: {
  room: Room; index: number; total: number; devices: DeviceView[];
  onOpen: () => void; onEdit: () => void; onDeactivate: () => void; onReactivate: () => void; onOpenDevice: (id: string) => void;
}) {
  const inactive = room.status === "inactive";
  return (
    <tr className={`transition-colors cursor-pointer ${inactive ? "bg-surface-page/40 hover:bg-surface-hover" : "hover:bg-surface-hover/60"}`} onClick={onOpen}>
      <td className="px-3 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col">
          <button disabled={index === 0} onClick={() => reorderRoom(room.id, "up")} aria-label={`Move ${room.name} up`}
            className="p-0.5 text-ink-muted hover:text-ink-soft disabled:text-ink-muted disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button disabled={index === total - 1} onClick={() => reorderRoom(room.id, "down")} aria-label={`Move ${room.name} down`}
            className="p-0.5 text-ink-muted hover:text-ink-soft disabled:text-ink-muted disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`text-sm font-bold ${inactive ? "text-ink-muted" : "text-ink"}`}>{room.name}</span>
      </td>
      <td className="px-4 py-3.5 text-sm text-ink-soft">{room.type}</td>
      <td className="px-4 py-3.5"><DeviceChips devices={devices} onOpen={onOpenDevice} /></td>
      <td className="px-4 py-3.5">
        {inactive ? <Pill tone="gray"><span className="w-1.5 h-1.5 rounded-full bg-ink-muted" /> Inactive</Pill>
          : <Pill tone="emerald"><span className="w-1.5 h-1.5 rounded-full bg-success-ink" /> Active</Pill>}
      </td>
      <td className="px-4 py-3.5 text-xs text-ink-muted max-w-[220px]"><span className="line-clamp-1">{room.notes || "—"}</span></td>
      <td className="px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        <OverflowMenu
          ariaLabel={`Actions for ${room.name}`}
          items={[
            { label: "Edit", icon: Pencil, onClick: onEdit },
            inactive
              ? { label: "Reactivate", icon: Power, onClick: onReactivate }
              : { label: "Deactivate", icon: PowerOff, onClick: onDeactivate },
          ]}
        />
      </td>
    </tr>
  );
}

export function RoomsPage() {
  const navigate = useNavigate();
  const rooms = useRooms();
  const allDevices = useDeviceViews();
  const { state, set } = useSimulatedResource("rooms");

  const [drawer, setDrawer] = useState<{ mode: "add" } | { mode: "edit"; room: Room } | null>(null);
  const [deactivating, setDeactivating] = useState<Room | null>(null);
  const [reactivating, setReactivating] = useState<Room | null>(null);

  const devicesByRoom = useMemo(() => {
    const map = new Map<string, DeviceView[]>();
    allDevices.filter((d) => d.roomId && !d.retired).forEach((d) => {
      const arr = map.get(d.roomId!) ?? [];
      arr.push(d);
      map.set(d.roomId!, arr);
    });
    return map;
  }, [allDevices]);

  const openDevice = (id: string) => navigate(`/clinic-settings/devices?device=${id}`);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <div className="px-6 py-6 border-b border-divider shrink-0 flex justify-between items-start bg-surface">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-2">
            <Link to="/clinic-settings" className="hover:text-ink-soft hover:underline">Clinic Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-soft font-bold">Rooms</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Rooms</h1>
          <p className="text-sm text-ink-muted mt-1">Physical rooms that drive the calendar's columns and booking options</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <DemoStateControl state={state} onChange={set} />
          <button
            onClick={() => setDrawer({ mode: "add" })}
            className="flex items-center px-4 py-2 btn-primary rounded-control text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add room
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {state === "loading" ? (
          <LoadingState />
        ) : state === "error" ? (
          <ErrorState entity="rooms" onRetry={() => set("loading")} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No rooms yet"
            body="Add your first room to start booking patients into it."
            cta={<button onClick={() => setDrawer({ mode: "add" })} className="px-6 py-3 btn-primary rounded-control text-base font-bold transition-colors">Add your first room</button>}
          />
        ) : (
          <div className="border border-divider rounded-card overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-surface-page">
                <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  <th className="px-3 py-3 border-b border-divider w-10" aria-label="Reorder" />
                  <th className="px-4 py-3 border-b border-divider">Room</th>
                  <th className="px-4 py-3 border-b border-divider">Type</th>
                  <th className="px-4 py-3 border-b border-divider">Assigned devices</th>
                  <th className="px-4 py-3 border-b border-divider">Status</th>
                  <th className="px-4 py-3 border-b border-divider">Notes</th>
                  <th className="px-3 py-3 border-b border-divider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider bg-surface">
                {rooms.map((room, i) => (
                  <RoomRow
                    key={room.id}
                    room={room}
                    index={i}
                    total={rooms.length}
                    devices={devicesByRoom.get(room.id) ?? []}
                    onOpen={() => setDrawer({ mode: "edit", room })}
                    onEdit={() => setDrawer({ mode: "edit", room })}
                    onDeactivate={() => setDeactivating(room)}
                    onReactivate={() => setReactivating(room)}
                    onOpenDevice={openDevice}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer?.mode === "add" && <RoomDrawer onClose={() => setDrawer(null)} />}
      {drawer?.mode === "edit" && <RoomDrawer room={drawer.room} onClose={() => setDrawer(null)} />}

      {deactivating && (
        <RoomDeactivateDialog room={deactivating} onClose={() => setDeactivating(null)} onDone={() => setDeactivating(null)} />
      )}

      {reactivating && (
        <ConfirmDialog
          title={`Reactivate ${reactivating.name}?`}
          body="It will reappear in the calendar columns and booking pickers."
          confirmLabel="Reactivate"
          onCancel={() => setReactivating(null)}
          onConfirm={() => {
            setRoomStatus(reactivating.id, "active");
            toast.success(`${reactivating.name} reactivated.`);
            setReactivating(null);
          }}
        />
      )}
    </div>
  );
}
