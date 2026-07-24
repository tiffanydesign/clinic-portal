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
      <div className="px-6 py-5 relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-success/10 border-r border-dashed border-success/40" />
        <div className="absolute inset-y-0 right-0 w-6 bg-success/10 border-l border-dashed border-success/40" />
        <div className="absolute inset-x-0 top-0 h-5 bg-success/10 border-b border-dashed border-success/40" />
        <div className="space-y-6">
          <div className="bg-surface rounded-card border border-divider p-4 text-sm text-ink-soft">Section A — cards inside use --space-4 (16px) default internal padding, or --space-5 (20px) for a "large" card tier.</div>
          <div className="bg-surface rounded-card border border-divider p-4 text-sm text-ink-soft">Section B — gap between large sections is --space-6 (24px); gap between cards within a section is --space-4 (16px).</div>
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
        <li><strong className="text-ink-soft">Horizontal page gutter:</strong> <code>px-6</code> (--page-padding-x, 24px) — identical on the header bar and the content area, top to bottom of the page. Never narrower.</li>
        <li><strong className="text-ink-soft">Header bar:</strong> <code>px-6 py-4</code> — the bar itself may run a tighter vertical rhythm than the content below it (it's chrome, not a content section).</li>
        <li><strong className="text-ink-soft">Content top/bottom padding:</strong> <code>py-5</code> (--page-padding-y, 20px) before the first block and after the last — v3 revision, down from 24px.</li>
        <li><strong className="text-ink-soft">Section rhythm:</strong> <code>space-y-6</code> / <code>gap-6</code> (--section-gap, 24px) between large page sections; <code>space-y-4</code> / <code>gap-4</code> (--card-gap, 16px) between cards within one section.</li>
        <li><strong className="text-ink-soft">Inside a section:</strong> cards/panels use <code>--space-4</code> (16px) default internal padding, or <code>--space-5</code> (20px) for a "large" card tier — see Spacing.</li>
      </ul>

      <h3 className="text-section text-ink-soft mb-2">Known drift</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Audited 2026-07-24 (v3 spacing/rhythm pass) across every top-level page reachable from the sidebar. Flag new drift here the same way — don't silently fix it in this file, migrate opportunistically when next touching the page.</p>
      {DRIFT.length === 0 ? (
        <div className="bg-success/10 border border-success/30 rounded-card p-4 text-xs text-success-ink">
          None currently. Every top-level page shell uses the standard <code>px-6 py-5</code> content inset with a <code>border-t</code> divider before the table/list card (matches Billing/Patients/Staff).
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
