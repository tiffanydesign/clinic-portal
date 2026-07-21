// Per-entity audit timeline shown in the Room / Device detail drawers. Reactive
// (subscribes to the audit feed) so a change made elsewhere in the same session
// appears without reopening the drawer.
import React from "react";
import { History } from "lucide-react";
import { useAuditFeed } from "./auditStore";

export function ActivitySection({ entityId }: { entityId: string }) {
  const feed = useAuditFeed();
  const entries = feed.filter((e) => e.entityId === entityId);

  return (
    <div>
      <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <History className="w-3.5 h-3.5" /> Activity
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted">No activity recorded yet.</p>
      ) : (
        <ol className="relative border-l border-divider pl-5 space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-surface-sunken ring-4 ring-white" aria-hidden />
              <div className="text-sm font-semibold text-ink">{e.action}</div>
              {(e.before || e.after) && (
                <div className="text-xs text-ink-muted mt-0.5">
                  <span className="line-through">{e.before ?? "—"}</span>
                  <span className="mx-1 text-ink-muted">→</span>
                  <span className="font-semibold text-ink-soft">{e.after ?? "—"}</span>
                </div>
              )}
              {e.detail && <div className="text-xs text-ink-muted mt-0.5">{e.detail}</div>}
              <div className="text-label text-ink-muted mt-1">{e.actor} · {e.timeLabel}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
