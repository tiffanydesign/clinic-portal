import React from "react";

// The one "page-title icon chip" implementation — every top-level page's H1
// pairs with the same icon its sidebar nav entry already uses (see NAV_ICON
// in AppShell.tsx), tinted in the same Phenome Blue 500 the title text itself
// uses, so a page's identity color is never invented ad-hoc twice.
export function PageTitleIcon({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="w-11 h-11 rounded-card bg-[color:var(--phenome-blue-500)]/10 text-[color:var(--phenome-blue-500)] flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </span>
  );
}

// Shared class string for a page's H1 — plain neutral ink (the icon chip
// alone carries the Phenome Blue identity; the title text itself stays the
// same dark grey every other heading in the product uses), at the one
// page-title size/weight tier (--text-page-title). Applied directly (not
// wrapped) so each call site keeps its own truncate/whitespace/margin needs.
export const PAGE_TITLE_CLASS = "text-page-title text-ink";
