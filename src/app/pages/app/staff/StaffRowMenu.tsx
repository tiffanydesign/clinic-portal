import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { MoreHorizontal } from "lucide-react";
import { Staff } from "./staffData";

// Three-dot actions menu rendered in a portal with fixed positioning,
// so it escapes the table's overflow-auto container.
export function StaffRowMenu({ staff }: { staff: Staff }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const MENU_H = 232;
      const openUp = r.bottom + MENU_H > window.innerHeight;
      setPos({ top: openUp ? r.top - MENU_H - 4 : r.bottom + 4, left: Math.max(8, r.right - 192) });
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-control transition-colors"
        aria-label={`Actions for ${staff.name}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <MenuItems staff={staff} pos={pos} onClose={() => setOpen(false)} />
        </>,
        document.body
      )}
    </>
  );
}

function MenuItems({ staff, pos, onClose }: { staff: Staff; pos: { top: number; left: number }; onClose: () => void }) {
  const navigate = useNavigate();

  const go = (path: string) => { onClose(); navigate(path); };

  const itemCls = "w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover";

  return (
    <div className="fixed w-48 bg-surface border border-divider rounded-card shadow-lg z-50 py-1" style={{ top: pos.top, left: pos.left }}>
      <button className={itemCls} onClick={() => go(`/staff/${staff.id}/overview`)}>View Profile</button>
      <button className={itemCls} onClick={() => go(`/staff/${staff.id}/workload`)}>View Workload</button>
    </div>
  );
}
