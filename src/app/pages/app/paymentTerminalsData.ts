// Shared types and mock data for the Payment Terminal "fleet" — consumed by
// both Clinic Settings > Payment Terminals (Admin CRUD + monitoring) and the
// Reception Dashboard's Start Transaction modal (pick an online terminal to
// take a payment on). One shared store (paymentTerminalsStore.ts) backs both
// so a terminal Admin removes disappears from Reception's picker too.

export type TerminalStatus = "online" | "offline" | "needs-attention";

export type Terminal = {
  id: string;
  label: string;
  model: string;
  // A short, spoken/typed-friendly 4-digit code — reception staff match this
  // against the number shown on the physical terminal's own screen, rather
  // than hunting for a long manufacturer serial number.
  shortCode: string;
  assignedTo: string;
  status: TerminalStatus;
  lastSeen: string;
  // Optional clinical-room assignment, surfaced only in the unified Devices
  // page's "Assigned Room" column. Front-desk terminals default to Unassigned
  // (their physical desk lives in `assignedTo`); this never affects the
  // Reception Start-Transaction picker, which keys off status/label/shortCode.
  roomId?: string | null;
};

export type PendingTransaction = {
  patient: string;
  amount: string;
  initiatedAt: string;
  status: string;
};

// Maps to a future real Stripe Reader's device_type field.
export const TERMINAL_MODELS = ["BBPOS WisePOS E", "Stripe Reader S700", "BBPOS WisePad 3"];

export const INITIAL_TERMINALS: Terminal[] = [
  { id: "t1", label: "Front Desk 1", model: "BBPOS WisePOS E", shortCode: "2291", assignedTo: "Reception 1", status: "online", lastSeen: "Just now" },
  { id: "t2", label: "Front Desk 2", model: "Stripe Reader S700", shortCode: "7734", assignedTo: "Reception 2", status: "online", lastSeen: "2 min ago" },
  { id: "t3", label: "Front Desk 3", model: "BBPOS WisePad 3", shortCode: "5561", assignedTo: "Reception 3", status: "needs-attention", lastSeen: "3 hours ago" },
  { id: "t4", label: "Front Desk 4", model: "BBPOS WisePOS E", shortCode: "3382", assignedTo: "Reception 4", status: "offline", lastSeen: "5 min ago" },
];

// Keyed by terminal id — only t3 has unresolved transactions in the demo, so
// removing it is the one path that exercises the danger-styled confirmation.
export const INITIAL_PENDING_TRANSACTIONS: Record<string, PendingTransaction[]> = {
  t3: [
    { patient: "Bora Yılmaz", amount: "₺450", initiatedAt: "Today 09:12", status: "Awaiting card" },
    { patient: "İpek Sarıkaya", amount: "₺1,200", initiatedAt: "Yesterday 16:40", status: "Failed - retry needed" },
  ],
};

export function terminalStatusRank(status: TerminalStatus): number {
  // needs-attention first (Admin should see problems immediately), then
  // online, then plain offline last.
  if (status === "needs-attention") return 0;
  if (status === "online") return 1;
  return 2;
}
