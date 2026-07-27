import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 20;

// The ONE pagination footer for list/table pages capped at PAGE_SIZE (20)
// rows per page. Replaces the decorative, non-functional "Previous / 1 /
// Next" footer markup previously copy-pasted across Patients/Billing (never
// wired to real state — Next had no handler, Previous was permanently
// disabled). Includes a direct page-number jump input per product decision:
// lists can grow well past a couple of pages (Billing transaction history,
// clinic-wide Patients), and clicking through 6 pages one at a time doesn't
// scale on an iPad.
export function Pagination({
  page,
  pageCount,
  totalCount,
  pageSize = PAGE_SIZE,
  onPageChange,
  itemLabel = "records",
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const [jumpValue, setJumpValue] = useState("");

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const goTo = (p: number) => onPageChange(Math.min(Math.max(1, p), Math.max(1, pageCount)));

  const commitJump = () => {
    if (jumpValue.trim() !== "") {
      const n = parseInt(jumpValue, 10);
      if (!Number.isNaN(n)) goTo(n);
    }
    setJumpValue("");
  };

  // Windowed page numbers: first, last, current ±1, "…" for gaps — same
  // convention as the shadcn Pagination primitive this replaces, just wired
  // to real page-count state instead of static <a href> links.
  const pages: (number | "ellipsis")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "ellipsis") pages.push("ellipsis");
  }

  return (
    <div className="h-12 border-t border-divider bg-surface flex items-center justify-between px-4 shrink-0 gap-4">
      <div className="text-xs text-ink-muted font-medium shrink-0">
        Showing {from}–{to} of {totalCount} {itemLabel}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="touch-extend p-1.5 text-ink-soft hover:bg-surface-sunken border border-transparent rounded-control transition-colors disabled:text-ink-muted disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="px-1 text-xs text-ink-muted select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                aria-current={p === page ? "page" : undefined}
                className={`touch-extend min-w-[28px] h-7 px-1.5 text-xs font-bold rounded-control transition-colors ${
                  p === page
                    ? "text-ink-soft border border-divider bg-surface-page shadow-sm"
                    : "text-ink-muted hover:text-ink-soft hover:bg-surface-sunken border border-transparent"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className="touch-extend p-1.5 text-ink-soft hover:bg-surface-sunken border border-transparent rounded-control transition-colors disabled:text-ink-muted disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-divider">
            <span className="text-xs text-ink-muted font-medium">Go to</span>
            <input
              type="text"
              inputMode="numeric"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && commitJump()}
              onBlur={commitJump}
              placeholder={String(page)}
              aria-label="Go to page"
              className="w-11 h-7 px-1.5 text-xs text-center border border-divider rounded-control outline-none focus:border-border-strong bg-surface"
            />
          </div>
        </div>
      )}
    </div>
  );
}
