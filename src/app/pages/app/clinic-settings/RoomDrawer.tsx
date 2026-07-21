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
  if (devices.length === 0) return <p className="text-sm text-ink-muted">No devices assigned to this room.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {devices.map((d) => {
        const Icon = DEVICE_ICON[d.type] ?? ScanLine;
        return (
          <button
            key={d.id}
            onClick={() => onOpen(d.id)}
            className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-card border border-divider bg-surface-page hover:border-border-strong hover:bg-surface transition-colors text-sm font-semibold text-ink-soft"
          >
            <Icon className="w-3.5 h-3.5 text-ink-muted shrink-0" />
            {d.label}
            <span className="text-xs font-mono text-ink-muted">{d.shortCode}</span>
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
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-card text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button
            onClick={save}
            disabled={!canSave}
            className={`px-5 py-2 rounded-card text-sm font-bold text-white transition-colors ${canSave ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
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
          <select value={type} onChange={(e) => setType(e.target.value as RoomType)} className={`${inputCls} bg-surface`}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional — equipment, accessibility, quirks…" className={inputCls} />
        </Field>

        {isEdit && (
          <>
            <div className="pt-2 border-t border-divider">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Assigned devices</h3>
              <AssignedDevices devices={assigned} onOpen={openDevice} />
            </div>
            <div className="pt-2 border-t border-divider">
              <ActivitySection entityId={room!.id} />
            </div>
          </>
        )}
      </div>
    </SettingsDrawer>
  );
}
