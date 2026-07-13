import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Escapes a Glass-Card's own stacking context: `backdrop-filter` on the
// card creates a new stacking context, so a plain `position: absolute`
// child popover gets trapped beneath any later sibling Glass-Card in DOM
// order, regardless of z-index (the same class of bug FilterSelect's Radix
// portal already fixes for dropdowns — see that component's own note).
// Portals to document.body and positions with `fixed`, computed from the
// trigger's own bounding rect, so it always paints above every card.
export function FloatingPopover({
  anchorRef, onClose, children, align = "right",
}: {
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPos(
      align === "right"
        ? { top: rect.bottom + 6, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 6, left: rect.left }
    );
  }, [anchorRef, align]);

  useLayoutEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pos) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed z-[101]"
        style={{ top: pos.top, left: pos.left, right: pos.right }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
