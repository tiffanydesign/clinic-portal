// Device detail drawer. General fields for every device, an inline room
// reassignment, editable label/notes, plus type-specific blocks: TV pairing,
// and the Payment Terminal's preserved Stripe state (needs-attention +
// unresolved transactions + remove-with-guard). Ends with the audit history.
import React, { useState } from "react";
import { toast } from "sonner";
import { ScanLine, Tv, CreditCard, AlertTriangle, Archive, RotateCcw, Trash2, LucideIcon } from "lucide-react";
import { DeviceView, displayStatus, DEVICE_STATUS_META, reassignDeviceView } from "./deviceView";
import { updateDevice, retireDevice, restoreDevice } from "./devicesStore";
import { updateTerminal, removeTerminal, getPendingTransactions } from "../paymentTerminalsStore";
import { useActiveRooms } from "./roomsStore";
import { SettingsDrawer, Field, inputCls, Pill, ConfirmDialog } from "./settingsUiShared";
import { ActivitySection } from "./ActivitySection";
import { TvPairingBlock } from "./TvPairingBlock";

const TYPE_ICON: Record<string, LucideIcon> = { "Scan Device": ScanLine, TV: Tv, "Payment Terminal": CreditCard };

function KV({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-800 text-right ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
    </div>
  );
}

function StatusPillFor({ view }: { view: DeviceView }) {
  const meta = DEVICE_STATUS_META[displayStatus(view)];
  const tone = meta.chip.includes("emerald") ? "emerald" : meta.chip.includes("amber") ? "amber" : meta.chip.includes("slate") ? "slate" : "gray";
  return <Pill tone={tone as any}><span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}</Pill>;
}

function TerminalStripeBlock({ view }: { view: DeviceView }) {
  const pending = getPendingTransactions(view.id);
  const needsAttention = view.status === "needs-attention";
  if (!needsAttention && pending.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Needs attention</h3>
      </div>
      {needsAttention && <p className="text-xs text-amber-800/90">This reader is offline and has unresolved activity. Check its connection at the desk.</p>}
      {pending.length > 0 && (
        <div className="border border-amber-200 rounded-lg divide-y divide-amber-100 bg-white">
          {pending.map((tx, i) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-800 truncate">{tx.patient}</div>
                <div className="text-xs text-gray-500">{tx.initiatedAt} · {tx.status}</div>
              </div>
              <div className="text-sm font-bold text-gray-800 shrink-0">{tx.amount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeviceDetailDrawer({ view, onClose }: { view: DeviceView; onClose: () => void }) {
  const rooms = useActiveRooms();
  const Icon = TYPE_ICON[view.type] ?? ScanLine;
  const isTerminal = view.source === "terminal";
  const isTv = view.type === "TV" && view.source === "device";

  const [label, setLabel] = useState(view.label);
  const [notes, setNotes] = useState(view.notes ?? "");
  const [desk, setDesk] = useState(view.assignedDesk ?? "");
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [removeStage, setRemoveStage] = useState(false);

  const dirty = label.trim() !== view.label || (!isTerminal && notes !== (view.notes ?? "")) || (isTerminal && desk.trim() !== (view.assignedDesk ?? ""));
  const pending = isTerminal ? getPendingTransactions(view.id) : [];

  const saveEdits = () => {
    if (label.trim().length === 0) { toast.error("Label can't be empty."); return; }
    if (isTerminal) {
      updateTerminal(view.id, { label: label.trim(), assignedTo: desk.trim() });
    } else {
      updateDevice(view.id, { label: label.trim(), notes });
    }
    toast.success("Device updated.");
  };

  const reassign = (roomId: string) => {
    reassignDeviceView(view, roomId || null);
    const target = roomId ? rooms.find((r) => r.id === roomId)?.name ?? "room" : "Unassigned";
    toast.success(`Moved to ${target}.`);
  };

  const roomValue = rooms.some((r) => r.id === view.roomId) ? view.roomId! : "";

  return (
    <SettingsDrawer
      title={view.label}
      subtitle={`${view.type} · ${view.shortCode}`}
      onClose={onClose}
      footer={
        view.retired ? (
          <button onClick={() => { restoreDevice(view.id); toast.success(`${view.label} restored.`); onClose(); }}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Restore device
          </button>
        ) : (
          <div className="flex justify-between items-center w-full">
            {isTerminal ? (
              <button onClick={() => setRemoveStage(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Remove terminal
              </button>
            ) : (
              <button onClick={() => setConfirmRetire(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors">
                <Archive className="w-4 h-4" /> Retire device
              </button>
            )}
            {dirty && (
              <button onClick={saveEdits} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Save changes</button>
            )}
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPillFor view={view} />
            {view.retired && <Pill tone="gray">Retired</Pill>}
            <span className="text-xs text-gray-400">Last seen {view.lastSeen}</span>
          </div>
        </div>

        {!view.retired && (
          <Field label="Assigned room" hint="Change takes effect immediately.">
            <select value={roomValue} onChange={(e) => reassign(e.target.value)} className={`${inputCls} bg-white`}>
              <option value="">Unassigned</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.type}</option>)}
            </select>
          </Field>
        )}

        {isTv && <TvPairingBlock view={view} />}
        {isTerminal && <TerminalStripeBlock view={view} />}

        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 px-4">
          <KV label="Model" value={view.model} />
          <KV label="Short code" value={view.shortCode} mono />
          <KV label="Type" value={view.type} />
          {isTerminal && view.assignedDesk && <KV label="Desk" value={view.assignedDesk} />}
          {view.addedBy && <KV label="Added by" value={`${view.addedBy}${view.addedOn ? ` · ${view.addedOn}` : ""}`} />}
        </div>

        <Field label="Label"><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} /></Field>
        {isTerminal ? (
          <Field label="Assigned to (desk)"><input type="text" value={desk} onChange={(e) => setDesk(e.target.value)} className={inputCls} /></Field>
        ) : (
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional…" className={inputCls} /></Field>
        )}

        <div className="pt-2 border-t border-gray-100">
          <ActivitySection entityId={view.id} />
        </div>
      </div>

      {confirmRetire && (
        <ConfirmDialog
          title={`Retire ${view.label}?`}
          body="It will be hidden from the device list and unassigned from its room. You can bring it back from the Retired filter."
          confirmLabel="Retire"
          danger
          onCancel={() => setConfirmRetire(false)}
          onConfirm={() => { retireDevice(view.id); toast.success(`${view.label} retired.`); setConfirmRetire(false); onClose(); }}
        />
      )}

      {removeStage && (
        <ConfirmDialog
          title={pending.length > 0 ? "This terminal has unresolved transactions" : `Remove ${view.label}?`}
          danger
          body={
            pending.length > 0 ? (
              <div className="space-y-2">
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {pending.map((tx, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0"><div className="text-sm font-bold text-gray-800 truncate">{tx.patient}</div><div className="text-xs text-gray-500">{tx.initiatedAt} · {tx.status}</div></div>
                      <div className="text-sm font-bold text-gray-800 shrink-0">{tx.amount}</div>
                    </div>
                  ))}
                </div>
                <p>Removing this terminal won't cancel these payments, but you won't be able to retry them from this device.</p>
              </div>
            ) : (
              "This terminal will no longer be available for taking payments at reception."
            )
          }
          confirmLabel={pending.length > 0 ? "Remove anyway" : "Remove"}
          onCancel={() => setRemoveStage(false)}
          onConfirm={() => { removeTerminal(view.id); toast.success(`${view.label} removed.`); setRemoveStage(false); onClose(); }}
        />
      )}
    </SettingsDrawer>
  );
}
