// Add / edit a room, and — for an existing room — show its assigned devices
// and audit history. One drawer doubles as the room detail surface (rooms have
// no separate detail page; their three fields fit alongside Activity).
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ScanLine, Tv, CreditCard, LucideIcon } from "lucide-react";
import { Room, RoomType, ROOM_TYPES } from "./roomsData";
import { addRoom, updateRoom, isRoomNameTaken } from "./roomsStore";
import { useDeviceViews, DeviceView } from "./deviceView";
import { SettingsDrawer, Field, inputCls } from "./settingsUiShared";
import { ActivitySection } from "./ActivitySection";

const DEVICE_ICON: Record<string, LucideIcon> = { "Scan Device": ScanLine, TV: Tv, "Payment Terminal": CreditCard };

function AssignedDevices({ devices, onOpen }: { devices: DeviceView[]; onOpen: (id: string) => void }) {
  if (devices.length === 0) return <p className="text-sm text-gray-400">No devices assigned to this room.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {devices.map((d) => {
        const Icon = DEVICE_ICON[d.type] ?? ScanLine;
        return (
          <button
            key={d.id}
            onClick={() => onOpen(d.id)}
            className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:border-slate-400 hover:bg-white transition-colors text-sm font-semibold text-gray-700"
          >
            <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {d.label}
            <span className="text-xs font-mono text-gray-400">{d.shortCode}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RoomDrawer({ room, onClose }: { room?: Room; onClose: () => void }) {
  const navigate = useNavigate();
  const isEdit = !!room;
  const [name, setName] = useState(room?.name ?? "");
  const [type, setType] = useState<RoomType>(room?.type ?? "Consult Room");
  const [notes, setNotes] = useState(room?.notes ?? "");

  const allDevices = useDeviceViews();
  const assigned = useMemo(() => allDevices.filter((d) => d.roomId === room?.id && !d.retired), [allDevices, room?.id]);

  const trimmed = name.trim();
  const nameError =
    trimmed.length === 0 ? undefined : isRoomNameTaken(trimmed, room?.id) ? "A room with this name already exists." : undefined;
  const canSave = trimmed.length > 0 && !nameError;

  const save = () => {
    if (!canSave) return;
    if (isEdit) {
      updateRoom(room!.id, { name: trimmed, type, notes });
      toast.success("Room updated.");
    } else {
      addRoom({ name: trimmed, type, notes });
      toast.success(`${trimmed} added.`);
    }
    onClose();
  };

  const openDevice = (id: string) => { onClose(); navigate(`/clinic-settings/devices?device=${id}`); };

  return (
    <SettingsDrawer
      title={isEdit ? room!.name : "Add room"}
      subtitle={isEdit ? `${room!.type} · ${room!.status === "active" ? "Active" : "Inactive"}` : "New consultation, scan or sample room"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
          <button
            onClick={save}
            disabled={!canSave}
            className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors ${canSave ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            {isEdit ? "Save changes" : "Add room"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Name" required error={nameError}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Scan C"
            autoFocus
            className={inputCls}
          />
        </Field>
        <Field label="Type" required hint="Determines the calendar column group and which bookings can use it.">
          <select value={type} onChange={(e) => setType(e.target.value as RoomType)} className={`${inputCls} bg-white`}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional — equipment, accessibility, quirks…" className={inputCls} />
        </Field>

        {isEdit && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assigned devices</h3>
              <AssignedDevices devices={assigned} onOpen={openDevice} />
            </div>
            <div className="pt-2 border-t border-gray-100">
              <ActivitySection entityId={room!.id} />
            </div>
          </>
        )}
      </div>
    </SettingsDrawer>
  );
}
