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
  const dotClass = terminal.status === "online" ? "bg-emerald-500" : terminal.status === "needs-attention" ? "bg-amber-500" : "bg-gray-400";

  return (
    <button
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      title={!selectable ? `Offline${terminal.status === "needs-attention" ? ` · ${compactDuration(terminal.lastSeen)}` : ""} — cannot be selected` : undefined}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
        !selectable
          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
          : selected
          ? "border-slate-500 bg-slate-50 ring-1 ring-slate-500"
          : "border-gray-200 bg-white hover:border-slate-400 cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <span className={`text-sm font-bold truncate ${selectable ? "text-gray-800" : "text-gray-400"}`}>{terminal.label}</span>
      </div>
      <span className={`text-xs font-medium shrink-0 ${terminal.status === "needs-attention" ? "text-amber-600" : selectable ? "text-emerald-600" : "text-gray-400"}`}>
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Start Transaction</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-5">
            <div className="text-sm font-bold text-gray-800">{patient} · {service}</div>
            <div className="text-xs text-gray-500 mt-0.5">{amountDue} due</div>
          </div>

          {stage === "select" && (
            <>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Terminal</div>
              {noneOnline ? (
                <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm font-bold text-gray-700 mb-1">No terminals are currently online</p>
                  <p className="text-xs text-gray-400">Contact your clinic admin to check terminal status</p>
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
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-bold text-gray-700">Waiting for card on {selected?.label}…</p>
            </div>
          )}

          {stage === "success" && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-800">Payment successful ✓ {amountDue}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {stage === "success" ? (
            <button onClick={onComplete} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} disabled={stage === "waiting"} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={stage === "waiting" || noneOnline || !selected}
                className={`flex items-center px-6 py-2 rounded text-sm font-bold text-white transition-colors shadow-sm ${
                  stage === "waiting" || noneOnline || !selected ? "bg-gray-300 cursor-not-allowed" : "bg-slate-600 hover:bg-slate-700"
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
