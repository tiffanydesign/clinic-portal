import React from "react";

// Page-shell mock — a miniature, inert replica of a real page's outer
// chrome (header bar + content), so the padding values are seen at actual
// scale rather than described in prose. Never a real page component: this
// section documents the shell contract every real page should follow.
function PageShellMock() {
  return (
    <div className="border border-divider rounded-card overflow-hidden bg-surface-page">
      <div className="bg-surface border-b border-divider px-6 py-4 relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-info/10 border-r border-dashed border-info/40" />
        <div className="absolute inset-y-0 right-0 w-6 bg-info/10 border-l border-dashed border-info/40" />
        <div className="absolute inset-x-0 top-0 h-4 bg-info/10 border-b border-dashed border-info/40" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-info/10 border-t border-dashed border-info/40" />
        <div className="text-section font-bold text-ink">Page Title</div>
        <div className="text-label text-ink-muted mt-0.5">Header bar — px-6 py-4</div>
      </div>
      <div className="px-6 py-6 relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-success/10 border-r border-dashed border-success/40" />
        <div className="absolute inset-y-0 right-0 w-6 bg-success/10 border-l border-dashed border-success/40" />
        <div className="absolute inset-x-0 top-0 h-6 bg-success/10 border-b border-dashed border-success/40" />
        <div className="space-y-6">
          <div className="bg-surface rounded-card border border-divider p-4 text-sm text-ink-soft">Section A — cards inside use --space-4 (16px) internal padding, never more.</div>
          <div className="bg-surface rounded-card border border-divider p-4 text-sm text-ink-soft">Section B — gap between sections is --space-6 (24px), same as the page gutter.</div>
        </div>
      </div>
    </div>
  );
}

const DRIFT: { page: string; path: string; found: string; fix: string }[] = [];

export function DesignSystemLayout() {
  return (
    <section id="layout" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Page Layout</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-2xl">
        One page shell, reused everywhere: a header bar and a content area, both anchored to the same horizontal gutter. This is what stops one page (Billing) from feeling tighter or looser than another (Dashboard) for no reason.
      </p>

      <h3 className="text-section text-ink-soft mb-2">The shell</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-3">
        <PageShellMock />
      </div>
      <ul className="text-label text-ink-muted mb-6 px-0.5 space-y-1 list-disc list-inside">
        <li><strong className="text-ink-soft">Horizontal page gutter:</strong> <code>px-6</code> (24px) — identical on the header bar and the content area, top to bottom of the page. Never narrower.</li>
        <li><strong className="text-ink-soft">Header bar:</strong> <code>px-6 py-4</code> — the bar itself may run a tighter vertical rhythm than the content below it (it's chrome, not a content section).</li>
        <li><strong className="text-ink-soft">Content top offset + section rhythm:</strong> <code>py-6</code> before the first block, <code>space-y-6</code> / <code>gap-6</code> between major sections — this is the one place <code>--space-6</code> is allowed, per the Spacing section's rule.</li>
        <li><strong className="text-ink-soft">Inside a section:</strong> cards/panels use <code>--space-4</code> (16px) internal padding max — see Spacing.</li>
      </ul>

      <h3 className="text-section text-ink-soft mb-2">Known drift</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Audited 2026-07-24 across every top-level page reachable from the sidebar. Flag new drift here the same way — don't silently fix it in this file, migrate opportunistically when next touching the page (same policy as the Legacy inventory below).</p>
      {DRIFT.length === 0 ? (
        <div className="bg-success/10 border border-success/30 rounded-card p-4 text-xs text-success-ink">
          None currently. Billing's table (was edge-to-edge, no padding at all), Schedule's calendar grid, and Team Availability's grid (both were <code>p-4</code>/no wrapper) have all been migrated to the standard <code>px-6</code> shell.
        </div>
      ) : (
        <div className="bg-warning/10 border border-warning/30 rounded-card p-4">
          {DRIFT.map((d) => (
            <div key={d.page} className="text-xs text-warning-ink">
              <span className="font-bold">{d.page}</span> <span className="font-mono text-ink-muted">({d.path})</span> uses <span className="font-mono">{d.found}</span> for its content area instead of the standard shell — should be <span className="font-mono">{d.fix}</span>.
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
