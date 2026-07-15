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
  if (devices.length === 0) return <span className="text-xs text-gray-400">—</span>;
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
            className="inline-flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-md border border-gray-200 bg-gray-50 hover:border-slate-400 hover:bg-white transition-colors text-xs font-semibold text-gray-700"
            title={`${d.label} · ${d.shortCode}`}
          >
            <Icon className="w-3 h-3 text-slate-500 shrink-0" /> {d.label}
          </button>
        );
      })}
      {extra > 0 && <span className="text-xs font-bold text-gray-400">+{extra}</span>}
    </div>
  );
}

function RoomRow({ room, index, total, devices, onOpen, onEdit, onDeactivate, onReactivate, onOpenDevice }: {
  room: Room; index: number; total: number; devices: DeviceView[];
  onOpen: () => void; onEdit: () => void; onDeactivate: () => void; onReactivate: () => void; onOpenDevice: (id: string) => void;
}) {
  const inactive = room.status === "inactive";
  return (
    <tr className={`transition-colors cursor-pointer ${inactive ? "bg-gray-50/40 hover:bg-gray-50" : "hover:bg-gray-50/60"}`} onClick={onOpen}>
      <td className="px-3 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col">
          <button disabled={index === 0} onClick={() => reorderRoom(room.id, "up")} aria-label={`Move ${room.name} up`}
            className="p-0.5 text-gray-400 hover:text-slate-700 disabled:text-gray-200 disabled:cursor-not-allowed">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button disabled={index === total - 1} onClick={() => reorderRoom(room.id, "down")} aria-label={`Move ${room.name} down`}
            className="p-0.5 text-gray-400 hover:text-slate-700 disabled:text-gray-200 disabled:cursor-not-allowed">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`text-sm font-bold ${inactive ? "text-gray-500" : "text-gray-800"}`}>{room.name}</span>
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-600">{room.type}</td>
      <td className="px-4 py-3.5"><DeviceChips devices={devices} onOpen={onOpenDevice} /></td>
      <td className="px-4 py-3.5">
        {inactive ? <Pill tone="gray"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive</Pill>
          : <Pill tone="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</Pill>}
      </td>
      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[220px]"><span className="line-clamp-1">{room.notes || "—"}</span></td>
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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-start bg-white">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
            <Link to="/clinic-settings" className="hover:text-slate-600 hover:underline">Clinic Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-bold">Rooms</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">Physical rooms that drive the calendar's columns and booking options</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <DemoStateControl state={state} onChange={set} />
          <button
            onClick={() => setDrawer({ mode: "add" })}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add room
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {state === "loading" ? (
          <LoadingState />
        ) : state === "error" ? (
          <ErrorState entity="rooms" onRetry={() => set("loading")} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No rooms yet"
            body="Add your first room to start booking patients into it."
            cta={<button onClick={() => setDrawer({ mode: "add" })} className="px-6 py-3 bg-slate-600 text-white rounded-lg text-base font-bold hover:bg-slate-700 transition-colors shadow-sm">Add your first room</button>}
          />
        ) : (
          <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 border-b border-gray-200 w-10" aria-label="Reorder" />
                  <th className="px-4 py-3 border-b border-gray-200">Room</th>
                  <th className="px-4 py-3 border-b border-gray-200">Type</th>
                  <th className="px-4 py-3 border-b border-gray-200">Assigned devices</th>
                  <th className="px-4 py-3 border-b border-gray-200">Status</th>
                  <th className="px-4 py-3 border-b border-gray-200">Notes</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
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
