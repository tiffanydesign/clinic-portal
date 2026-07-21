import React, { useState } from "react";
import { X, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Terminal } from "../pages/app/paymentTerminalsData";
import { useTerminals } from "../pages/app/paymentTerminalsStore";

type Stage = "select" | "waiting" | "success";

function compactDuration(lastSeen: string): string {
  const hourMatch = lastSeen.match(/(\d+)\s*hour/);
  if (hourMatch) return `${hourMatch[1]}h`;
  const minMatch = lastSeen.match(/(\d+)\s*min/);
  if (minMatch) return `${minMatch[1]}m`;
  return lastSeen;
}

function TerminalRow({ terminal, selected, onSelect }: { terminal: Terminal; selected: boolean; onSelect: () => void }) {
  const selectable = terminal.status === "online";
  const dotClass = terminal.status === "online" ? "bg-success-ink" : terminal.status === "needs-attention" ? "bg-warning-ink" : "bg-ink-muted";

  return (
    <button
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      title={!selectable ? `Offline${terminal.status === "needs-attention" ? ` · ${compactDuration(terminal.lastSeen)}` : ""} — cannot be selected` : undefined}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-card border text-left transition-colors ${
        !selectable
          ? "border-divider bg-surface-page opacity-60 cursor-not-allowed"
          : selected
          ? "border-border-strong bg-surface-page ring-1 ring-info"
          : "border-divider bg-surface hover:border-border-strong cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <span className={`text-sm font-bold truncate ${selectable ? "text-ink" : "text-ink-muted"}`}>{terminal.label}</span>
        <span className={`text-xs font-mono tracking-widest shrink-0 ${selectable ? "text-ink-muted" : "text-ink-muted"}`}>#{terminal.shortCode}</span>
      </div>
      <span className={`text-xs font-medium shrink-0 ${terminal.status === "needs-attention" ? "text-warning-ink" : selectable ? "text-success-ink" : "text-ink-muted"}`}>
        {terminal.status === "online" ? "Online" : terminal.status === "needs-attention" ? `Offline ${compactDuration(terminal.lastSeen)}` : "Offline"}
      </span>
    </button>
  );
}

export function StartTransactionModal({
  patient,
  service,
  amountDue,
  onClose,
  onComplete,
}: {
  patient: string;
  service: string;
  amountDue: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const terminals = useTerminals();
  const onlineTerminals = terminals.filter((t) => t.status === "online");
  const [selectedId, setSelectedId] = useState<string | null>(onlineTerminals[0]?.id ?? null);
  const [stage, setStage] = useState<Stage>("select");

  const selected = terminals.find((t) => t.id === selectedId);
  const noneOnline = onlineTerminals.length === 0;

  const handleStart = () => {
    if (!selected) return;
    setStage("waiting");
    setTimeout(() => setStage("success"), 2000);
  };

  return (
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page">
          <h2 className="text-lg font-bold text-ink">Start Transaction</h2>
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-surface-page border border-divider rounded-card px-4 py-3 mb-5">
            <div className="text-sm font-bold text-ink">{patient} · {service}</div>
            <div className="text-xs text-ink-muted mt-0.5">{amountDue} due</div>
          </div>

          {stage === "select" && (
            <>
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Select Terminal</div>
              {noneOnline ? (
                <div className="text-center py-4 border border-divider rounded-card bg-surface-page">
                  <p className="text-sm font-bold text-ink-soft mb-1">No terminals are currently online</p>
                  <p className="text-xs text-ink-muted">Contact your clinic admin to check terminal status</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {terminals.map((t) => (
                    <TerminalRow key={t.id} terminal={t} selected={t.id === selectedId} onSelect={() => setSelectedId(t.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {stage === "waiting" && (
            <div className="text-center py-6">
              <Loader2 className="w-10 h-10 text-ink-muted mx-auto mb-3 animate-spin" />
              <p className="text-sm font-bold text-ink-soft">Waiting for card on {selected?.label}…</p>
            </div>
          )}

          {stage === "success" && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success-ink mx-auto mb-3" />
              <p className="text-base font-bold text-ink">Payment successful ✓ {amountDue}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end gap-3">
          {stage === "success" ? (
            <button onClick={onComplete} className="px-6 py-2 bg-ink hover:bg-surface-sunken text-white rounded-control text-sm font-bold transition-colors shadow-sm">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} disabled={stage === "waiting"} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={stage === "waiting" || noneOnline || !selected}
                className={`flex items-center px-6 py-2 rounded-control text-sm font-bold text-white transition-colors shadow-sm ${
                  stage === "waiting" || noneOnline || !selected ? "bg-surface-sunken cursor-not-allowed" : "bg-surface-sunken hover:bg-surface-sunken"
                }`}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Start Transaction
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
