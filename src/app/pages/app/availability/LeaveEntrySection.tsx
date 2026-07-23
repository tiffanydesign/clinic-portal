import React from "react";
import { Plane } from "lucide-react";

// Leave is the one request kind that needs Admin approval, so this section is
// an ENTRY POINT only — the actual request status (pending / approved /
// rejected) lives once, in the Request popup (top bar). No list here, so a
// request never appears twice on the page. Only one Leave request may be
// Pending at a time — the button surfaces that BEFORE the click (matching
// the Save button's affected-count indicator) rather than letting the user
// open the form and find out on submit.
export function LeaveEntrySection({ onNew, hasPending }: { onNew: () => void; hasPending: boolean }) {
  return (
    <div className="bg-surface rounded-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-ink">Leave</h3>
        <span className="px-2 py-0.5 bg-warning/10 border border-warning/30 text-warning-ink text-overline rounded-full">Requires approval</span>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Request full or half-day leave. It goes to Admin for approval and its status appears in Requests (top bar).
      </p>
      <div title={hasPending ? "You already have a request pending approval" : undefined}>
        <button
          onClick={onNew}
          disabled={hasPending}
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-control text-sm font-bold transition-colors ${
            hasPending ? "border border-divider bg-surface-sunken text-ink-muted cursor-not-allowed" : "border border-divider text-ink-soft bg-surface hover:bg-surface-hover"
          }`}
        >
          <Plane className={`w-4 h-4 ${hasPending ? "text-ink-muted" : "text-ink-muted"}`} /> New Leave Request
        </button>
      </div>
      {hasPending && <p className="text-label text-ink-muted mt-2">Withdraw your pending request to submit a new one.</p>}
    </div>
  );
}
