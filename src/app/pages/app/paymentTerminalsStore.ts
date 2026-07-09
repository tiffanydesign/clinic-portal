// In-memory external store bridging Clinic Settings > Payment Terminals
// (Admin CRUD) and the Reception Dashboard's Start Transaction modal — a
// terminal removed by Admin must disappear from Reception's picker without
// a page reload, since there's no backend here.
import { useSyncExternalStore } from "react";
import { INITIAL_TERMINALS, INITIAL_PENDING_TRANSACTIONS, Terminal, PendingTransaction } from "./paymentTerminalsData";

let terminals: Terminal[] = [...INITIAL_TERMINALS];
let pendingByTerminal: Record<string, PendingTransaction[]> = { ...INITIAL_PENDING_TRANSACTIONS };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useTerminals(): Terminal[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => terminals
  );
}

export function getPendingTransactions(id: string): PendingTransaction[] {
  return pendingByTerminal[id] ?? [];
}

export type NewTerminalInput = {
  label: string;
  model: string;
  serialNumber: string;
  assignedTo: string;
};

export function addTerminal(input: NewTerminalInput): Terminal {
  const newTerminal: Terminal = {
    id: `t-${Date.now()}`,
    label: input.label,
    model: input.model,
    serialNumber: input.serialNumber,
    assignedTo: input.assignedTo,
    status: "online",
    lastSeen: "Just now",
  };
  terminals = [newTerminal, ...terminals];
  emit();
  return newTerminal;
}

export function updateTerminal(id: string, patch: Partial<Pick<Terminal, "label" | "assignedTo">>) {
  terminals = terminals.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
}

export function removeTerminal(id: string) {
  terminals = terminals.filter((t) => t.id !== id);
  delete pendingByTerminal[id];
  emit();
}
