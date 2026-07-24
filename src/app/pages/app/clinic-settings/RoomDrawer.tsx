// Add / edit a room, and — for an existing room — show its assigned devices
// and audit history. One drawer doubles as the room detail surface (rooms have
// no separate detail page; their three fields fit alongside Activity).
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ScanLine, Tv, CreditCard, LucideIcon, Wrench, Pencil, Trash2 } from "lucide-react";
import { Room, RoomType, ROOM_TYPES } from "./roomsData";
import { addRoom, updateRoom, isRoomNameTaken } from "./roomsStore";
import { useDeviceViews, DeviceView } from "./deviceView";
import { SettingsDrawer, Field, inputCls, ConfirmDialog } from "./settingsUiShared";
import { ActivitySection } from "./ActivitySection";
import { RoomBlock, TODAY_ISO, formatBlockDate, minToClock, blockReasonAbbrev } from "./roomBlocksData";
import { useRoomBlocksFor, addRoomBlock, updateRoomBlock as updateRoomBlockRecord, removeRoomBlock } from "./roomBlocksStore";
import { RoomBlockDrawer, RoomBlockDraft } from "./RoomBlockDrawer";
import { roomBlockConflicts, roomBlockConflictLabel } from "./roomBlockConflicts";
import { ConflictModal } from "../availability/ConflictModal";
import { useAppointments } from "../dashboard/appointmentsStore";
import type { Appt } from "../dashboard/dashboardData";

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
            className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-control border border-divider bg-surface-page hover:border-border-strong hover:bg-surface transition-colors text-sm font-semibold text-ink-soft"
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

function formatBlockTimeRange(b: RoomBlock): string {
  return b.allDay ? "All day" : `${minToClock(b.startMin!)}–${minToClock(b.endMin!)}`;
}
function formatBlockDateRange(b: RoomBlock): string {
  return b.startDate === b.endDate ? formatBlockDate(b.startDate) : `${formatBlockDate(b.startDate)} – ${formatBlockDate(b.endDate)}`;
}

// Upcoming blocks by default (spec: past blocks are history, not something an
// admin needs staring at); a "View past blocks" toggle reveals the archive.
function RoomBlocksSection({ roomId, onAdd, onEdit, onRemove }: {
  roomId: string;
  onAdd: () => void;
  onEdit: (b: RoomBlock) => void;
  onRemove: (b: RoomBlock) => void;
}) {
  const blocks = useRoomBlocksFor(roomId);
  const upcoming = useMemo(() => blocks.filter((b) => b.endDate >= TODAY_ISO).sort((a, b) => a.startDate.localeCompare(b.startDate)), [blocks]);
  const past = useMemo(() => blocks.filter((b) => b.endDate < TODAY_ISO).sort((a, b) => b.startDate.localeCompare(a.startDate)), [blocks]);
  const [showPast, setShowPast] = useState(false);

  return (
    <div className="pt-2 border-t border-divider">
      <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Upcoming blocks</h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-muted italic mb-3">No upcoming blocks.</p>
      ) : (
        <div className="space-y-2.5 mb-3">
          {upcoming.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-2 border-b border-divider pb-2.5 last:border-0 last:pb-0">
              <div className="min-w-0 flex items-start gap-2">
                <Wrench className="w-3.5 h-3.5 text-ink-muted mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink">{formatBlockDateRange(b)}</div>
                  <div className="text-xs text-ink-soft">{formatBlockTimeRange(b)} · {blockReasonAbbrev(b.reason)}</div>
                  <div className="text-label text-ink-muted mt-0.5">by {b.createdBy}</div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(b)} title="Edit" className="p-1.5 rounded-control text-ink-muted hover:text-ink-soft hover:bg-surface-hover transition-colors touch-extend"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onRemove(b)} title="Remove" className="p-1.5 rounded-control text-ink-muted hover:text-danger-ink hover:bg-danger/10 transition-colors touch-extend"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onAdd} className="w-full py-2.5 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
        + Block room
      </button>

      {past.length > 0 && (
        <>
          <button onClick={() => setShowPast((v) => !v)} className="mt-3 text-xs font-bold text-ink-muted hover:text-ink-soft">
            {showPast ? "Hide" : "View"} past blocks ({past.length})
          </button>
          {showPast && (
            <div className="space-y-1.5 mt-2">
              {past.map((b) => (
                <div key={b.id} className="text-xs text-ink-muted">
                  {formatBlockDateRange(b)} · {formatBlockTimeRange(b)} · {blockReasonAbbrev(b.reason)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
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

  const liveAppts = useAppointments();
  const [blockDrawerState, setBlockDrawerState] = useState<"new" | RoomBlock | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RoomBlock | null>(null);
  const [conflictState, setConflictState] = useState<{ draft: RoomBlockDraft; editingId?: string; conflicts: Appt[] } | null>(null);

  const commitBlock = (draft: RoomBlockDraft, editingId?: string) => {
    if (editingId) updateRoomBlockRecord(editingId, draft);
    else addRoomBlock(draft);
    toast.success(editingId ? "Room block updated." : "Room blocked.");
    setBlockDrawerState(null);
  };
  const applyBlock = (draft: RoomBlockDraft, editingId?: string) => {
    const conflicts = roomBlockConflicts(draft.roomId, draft, liveAppts);
    if (conflicts.length > 0) { setConflictState({ draft, editingId, conflicts }); return; }
    commitBlock(draft, editingId);
  };
  const confirmBlockConflict = () => {
    if (!conflictState) return;
    commitBlock(conflictState.draft, conflictState.editingId);
    setConflictState(null);
  };

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
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button
            onClick={save}
            disabled={!canSave}
            className={`px-5 py-2 rounded-control text-sm font-bold text-white transition-colors ${canSave ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
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
            <RoomBlocksSection
              roomId={room!.id}
              onAdd={() => setBlockDrawerState("new")}
              onEdit={(b) => setBlockDrawerState(b)}
              onRemove={setRemoveTarget}
            />
            <div className="pt-2 border-t border-divider">
              <ActivitySection entityId={room!.id} />
            </div>
          </>
        )}
      </div>

      {blockDrawerState && (
        <RoomBlockDrawer
          room={room!}
          editing={blockDrawerState === "new" ? undefined : blockDrawerState}
          onClose={() => setBlockDrawerState(null)}
          onApply={(draft) => applyBlock(draft, blockDrawerState === "new" ? undefined : blockDrawerState.id)}
        />
      )}

      {conflictState && (
        <ConflictModal
          bookings={conflictState.conflicts.map((a) => ({ label: roomBlockConflictLabel(a) }))}
          context="blocked-time"
          onCancel={() => setConflictState(null)}
          onConfirm={confirmBlockConflict}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove this room block?"
          body={`${formatBlockDateRange(removeTarget)} · ${formatBlockTimeRange(removeTarget)} — the room becomes bookable again for this window immediately.`}
          confirmLabel="Remove"
          danger
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            removeRoomBlock(removeTarget.id);
            toast.success("Room block removed.");
            setRemoveTarget(null);
          }}
        />
      )}
    </SettingsDrawer>
  );
}
