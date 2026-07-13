import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Section } from "./DashboardShared";
import { useAvailabilityStore, getPendingRequests } from "../availability/availabilityStore";
import { needsYourActionItems, ActionItem, ActionItemKind } from "./needsYourActionData";

const KIND_PILL: Record<ActionItemKind, string> = {
  Leave: "bg-amber-50 text-amber-700 border-amber-200",
  Refund: "bg-purple-50 text-purple-700 border-purple-200",
};

type Filter = "All" | ActionItemKind;

// Every row is a single click-through deep-link — no inline Approve /
// Reject / Refund buttons here by design. Deciding happens in Approval
// Center or Billing, where the full context (conflicts, line items) lives.
function ActionRow({ item, onOpen }: { item: ActionItem; onOpen: () => void }) {
  const overdue = item.waitHours > 48;
  return (
    <button onClick={onOpen} className="w-full min-h-[48px] flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
      <span className="flex items-center gap-2 min-w-0">
        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shrink-0 ${KIND_PILL[item.kind]}`}>{item.kind}</span>
        <span className="text-sm font-medium text-gray-800 truncate">{item.summary}</span>
      </span>
      <span className={`text-xs font-bold shrink-0 ${overdue ? "text-red-600" : "text-gray-400"}`}>
        {item.waitLabel}{overdue ? " · overdue" : ""}
      </span>
    </button>
  );
}

export function NeedsYourActionCard() {
  const nav = useNavigate();
  const store = useAvailabilityStore();
  const [kindFilter, setKindFilter] = useState<Filter>("All");

  const pending = useMemo(() => getPendingRequests(store), [store]);
  const allItems = useMemo(() => needsYourActionItems(pending), [pending]);

  const leaveCount = allItems.filter((i) => i.kind === "Leave").length;
  const refundCount = allItems.filter((i) => i.kind === "Refund").length;

  // No row cap — the card's own fixed height + internal scroll (via
  // Section) handles overflow, so every item stays reachable without a
  // separate "view all" link out to another page.
  const filtered = kindFilter === "All" ? allItems : allItems.filter((i) => i.kind === kindFilter);

  return (
    <Section
      title={
        <>
          Needs Your Action
          {allItems.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">{allItems.length}</span>}
        </>
      }
      className="h-full"
      action={
        allItems.length > 0 ? (
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setKindFilter("All")}
              className={`px-1.5 py-0.5 rounded font-bold border transition-colors ${kindFilter === "All" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              All ({allItems.length})
            </button>
            <button
              onClick={() => setKindFilter("Leave")}
              className={`px-1.5 py-0.5 rounded font-bold border transition-colors ${kindFilter === "Leave" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              Leave ({leaveCount})
            </button>
            <button
              onClick={() => setKindFilter("Refund")}
              className={`px-1.5 py-0.5 rounded font-bold border transition-colors ${kindFilter === "Refund" ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              Refunds ({refundCount})
            </button>
          </div>
        ) : undefined
      }
    >
      {allItems.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center px-6">
          <p className="text-sm text-gray-400 font-medium">All clear ✓ Nothing waiting on you.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((item) => (
            <ActionRow key={item.id} item={item} onOpen={() => nav(item.route)} />
          ))}
        </div>
      )}
    </Section>
  );
}
