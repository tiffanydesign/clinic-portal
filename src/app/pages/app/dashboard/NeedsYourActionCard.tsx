import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plane, RefreshCcw } from "lucide-react";
import { Section } from "./DashboardShared";
import { Stat } from "../../../components/stat";
import { useAvailabilityStore, getPendingRequests } from "../availability/availabilityStore";
import { needsYourActionItems, ActionItem, ActionItemKind } from "./needsYourActionData";

const KIND_STYLE: Record<ActionItemKind, { pill: string; icon: React.ReactNode }> = {
  Leave: { pill: "bg-amber-50 text-amber-700 border-amber-200", icon: <Plane className="w-3.5 h-3.5 text-amber-600" /> },
  Refund: { pill: "bg-purple-50 text-purple-700 border-purple-200", icon: <RefreshCcw className="w-3.5 h-3.5 text-purple-600" /> },
};

type Filter = "All" | ActionItemKind;

// Every row is a single click-through deep-link — no inline Approve /
// Reject / Refund buttons here by design. Deciding happens in Approval
// Center or Billing, where the full context (conflicts, line items) lives.
function ActionRow({ item, onOpen }: { item: ActionItem; onOpen: () => void }) {
  const overdue = item.waitHours > 48;
  return (
    <button onClick={onOpen} className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
      <span className="shrink-0">{KIND_STYLE[item.kind].icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border mb-0.5 ${KIND_STYLE[item.kind].pill}`}>{item.kind}</span>
        <span className="block text-sm font-medium text-gray-800 truncate">{item.summary}</span>
      </span>
      <span className={`text-xs font-bold shrink-0 ${overdue ? "text-red-600" : "text-gray-400"}`}>
        {item.waitLabel}{overdue ? " · overdue" : ""}
      </span>
    </button>
  );
}

// Category filter chip — the button owns the label and active styling, the
// Stat family's T4 `pill` owns the count.
function FilterChip({ label, count, active, activeText, onClick }: {
  label: string; count: number; active: boolean; activeText: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all inline-flex items-center gap-1.5 ${active ? `bg-white ${activeText} shadow-sm` : "text-gray-500 hover:text-gray-700"}`}
    >
      {label}
      <Stat stat={{ id: `nya-${label}`, label, kind: "count", variant: "pill", value: String(count) }} />
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
          {allItems.length > 0 && (
            <span className="ml-2">
              <Stat
                stat={{ id: "nya-total", label: "items need your action", kind: "count", variant: "pill", value: String(allItems.length) }}
                tone="red"
              />
            </span>
          )}
        </>
      }
      className="h-full"
      subHeader={
        allItems.length > 0 ? (
          <div className="inline-flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <FilterChip label="All" count={allItems.length} active={kindFilter === "All"} activeText="text-slate-700" onClick={() => setKindFilter("All")} />
            <FilterChip label="Leave" count={leaveCount} active={kindFilter === "Leave"} activeText="text-amber-700" onClick={() => setKindFilter("Leave")} />
            <FilterChip label="Refunds" count={refundCount} active={kindFilter === "Refund"} activeText="text-purple-700" onClick={() => setKindFilter("Refund")} />
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
