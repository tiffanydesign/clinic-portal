import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";
import { Section } from "./DashboardShared";
import { Stat } from "../../../components/stat";
import { useAvailabilityStore, getPendingRequests } from "../availability/availabilityStore";
import { needsYourActionItems, ActionItem, ActionItemKind } from "./needsYourActionData";

// Type is carried by a single low-saturation chip — neutral grey fill + a tiny
// colour dot — rather than a saturated amber/purple pill. The dot alone
// distinguishes the two kinds, so the list reads as one calm column instead of
// a scatter of competing accent colours.
const KIND_DOT: Record<ActionItemKind, string> = {
  Leave: "bg-warning",
  Refund: "bg-special",
};

type Filter = "All" | ActionItemKind;

// Every row is a single click-through deep-link — no inline Approve /
// Reject / Refund buttons here by design. Deciding happens in Approval
// Center or Billing, where the full context (conflicts, line items) lives.
function ActionRow({ item, onOpen }: { item: ActionItem; onOpen: () => void }) {
  const overdue = item.waitHours > 48;
  return (
    <button onClick={onOpen} className="w-full flex items-start gap-3 px-4 py-4 hover:bg-surface-hover text-left transition-colors">
      <span className="min-w-0 flex-1">
        {/* Low-sat type chip: grey fill, grey text, one tiny colour dot. */}
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-overline rounded-control bg-surface-hover text-ink-soft">
          <span className={`w-1.5 h-1.5 rounded-full ${KIND_DOT[item.kind]}`} aria-hidden />
          {item.kind}
        </span>
        {/* Primary line: name (+ amount) bold in ink — weight, not colour,
            carries the emphasis. */}
        <span className="block text-sm text-ink mt-2 truncate">
          <span className="font-semibold">{item.primary}</span>
          {item.emphasis && (
            <>
              <span className="text-ink-muted"> · </span>
              <span className="font-semibold tabular-nums">{item.emphasis}</span>
            </>
          )}
        </span>
        {/* Secondary line: regular weight, muted — recedes below the name. */}
        {item.detail && (
          <span className="block text-xs font-normal text-ink-muted mt-0.5 truncate">{item.detail}</span>
        )}
      </span>
      {/* Wait meta stays quiet: muted grey, or slightly darker grey + a small
          red alert glyph once overdue — no full-width red text. */}
      <span
        className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${overdue ? "text-ink-soft" : "text-ink-muted"}`}
        title={overdue ? "Overdue — waiting more than 48h" : undefined}
      >
        {overdue && <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" aria-hidden />}
        {item.waitLabel}
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
      className={`px-2.5 py-1 text-label font-bold rounded-control transition-all inline-flex items-center gap-1.5 ${active ? `bg-surface ${activeText} shadow-sm` : "text-ink-muted hover:text-ink-soft"}`}
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
          <div className="inline-flex items-center gap-0.5 bg-surface-hover p-0.5 rounded-card border border-divider">
            <FilterChip label="All" count={allItems.length} active={kindFilter === "All"} activeText="text-ink" onClick={() => setKindFilter("All")} />
            <FilterChip label="Leave" count={leaveCount} active={kindFilter === "Leave"} activeText="text-ink" onClick={() => setKindFilter("Leave")} />
            <FilterChip label="Refunds" count={refundCount} active={kindFilter === "Refund"} activeText="text-ink" onClick={() => setKindFilter("Refund")} />
          </div>
        ) : undefined
      }
    >
      {allItems.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center px-6">
          <p className="text-sm text-ink-muted font-medium">All clear ✓ Nothing waiting on you.</p>
        </div>
      ) : (
        <div className="divide-y divide-divider">
          {filtered.map((item) => (
            <ActionRow key={item.id} item={item} onOpen={() => nav(item.route)} />
          ))}
        </div>
      )}
    </Section>
  );
}
