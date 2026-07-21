// Add a device. Type-adaptive: scanners and TVs go into devicesStore; a
// Payment Terminal keeps its existing Stripe-facing fields (model list, 4-digit
// short code, front-desk assignment) and is created in paymentTerminalsStore,
// so the Reception flow keeps working unchanged.
import React, { useState } from "react";
import { toast } from "sonner";
import { ScanLine, Tv, CreditCard } from "lucide-react";
import { DeviceType, DeviceKind, SHORT_CODE_HINT } from "./devicesData";
import { addDevice } from "./devicesStore";
import { isShortCodeTaken } from "./deviceView";
import { addTerminal, updateTerminal } from "../paymentTerminalsStore";
import { TERMINAL_MODELS } from "../paymentTerminalsData";
import { useActiveRooms } from "./roomsStore";
import { SettingsDrawer, Field, inputCls } from "./settingsUiShared";

const TYPE_OPTIONS: { v: DeviceType; label: string; icon: typeof ScanLine }[] = [
  { v: "Scan Device", label: "Scan Device", icon: ScanLine },
  { v: "TV", label: "TV", icon: Tv },
  { v: "Payment Terminal", label: "Payment Terminal", icon: CreditCard },
];

export function DeviceAddDrawer({ onClose }: { onClose: () => void }) {
  const rooms = useActiveRooms();
  const [type, setType] = useState<DeviceType>("Scan Device");
  const [model, setModel] = useState("");
  const [terminalModel, setTerminalModel] = useState(TERMINAL_MODELS[0]);
  const [shortCode, setShortCode] = useState("");
  const [label, setLabel] = useState("");
  const [roomId, setRoomId] = useState<string>("");
  const [desk, setDesk] = useState("");

  const isTerminal = type === "Payment Terminal";
  const effModel = isTerminal ? terminalModel : model.trim();

  const codeTrim = shortCode.trim();
  const codeError =
    codeTrim.length === 0
      ? undefined
      : isTerminal && !/^\d{4}$/.test(codeTrim)
      ? "Payment terminal codes are 4 digits."
      : isShortCodeTaken(codeTrim)
      ? "This short code is already in use."
      : undefined;

  const canSave =
    codeTrim.length > 0 && !codeError && (isTerminal ? desk.trim().length > 0 : model.trim().length > 0);

  const save = () => {
    if (!canSave) return;
    const finalLabel = label.trim() || codeTrim;
    if (isTerminal) {
      const t = addTerminal({ label: finalLabel, model: terminalModel, shortCode: codeTrim, assignedTo: desk.trim() });
      if (roomId) updateTerminal(t.id, { roomId });
      toast.success(`${finalLabel} added and online.`);
    } else {
      addDevice({ type: type as DeviceKind, model: model.trim(), shortCode: codeTrim, label: finalLabel, roomId: roomId || null });
      toast.success(`${finalLabel} added.`);
    }
    onClose();
  };

  return (
    <SettingsDrawer
      title="Add device"
      subtitle="Register a scanner, TV or payment terminal"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-card text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button onClick={save} disabled={!canSave}
            className={`px-5 py-2 rounded-card text-sm font-bold text-white transition-colors ${canSave ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}>
            Add device
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Type" required>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((o) => {
              const Icon = o.icon;
              const active = type === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setType(o.v)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-card border text-xs font-bold transition-colors ${
                    active ? "border-border-strong bg-surface-page text-ink-soft ring-1 ring-info" : "border-divider bg-surface text-ink-muted hover:border-divider"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center leading-tight">{o.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Model" required>
          {isTerminal ? (
            <select value={terminalModel} onChange={(e) => setTerminalModel(e.target.value)} className={`${inputCls} bg-surface`}>
              {TERMINAL_MODELS.map((m) => <option key={m}>{m}</option>)}
            </select>
          ) : (
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Samsung QM43C" className={inputCls} />
          )}
        </Field>

        <Field label="Short Code" required hint={codeError ? undefined : `Unique across all devices · ${SHORT_CODE_HINT[type]}`} error={codeError}>
          <input
            type="text"
            inputMode={isTerminal ? "numeric" : "text"}
            value={shortCode}
            onChange={(e) => setShortCode(isTerminal ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value.toUpperCase().slice(0, 12))}
            placeholder={isTerminal ? "e.g. 4471" : SHORT_CODE_HINT[type].replace("e.g. ", "")}
            className={`${inputCls} font-mono tracking-widest`}
          />
        </Field>

        <Field label="Label" hint="Optional — defaults to the short code.">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Room 1 Display" className={inputCls} />
        </Field>

        {isTerminal && (
          <Field label="Assigned to (desk)" required>
            <input type="text" value={desk} onChange={(e) => setDesk(e.target.value)} placeholder="e.g. Reception 5" className={inputCls} />
          </Field>
        )}

        <Field label="Assign to room" hint="Optional — leave as Unassigned for now.">
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={`${inputCls} bg-surface`}>
            <option value="">Unassigned</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.type}</option>)}
          </select>
        </Field>
      </div>
    </SettingsDrawer>
  );
}
