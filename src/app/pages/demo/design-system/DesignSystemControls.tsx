import React, { useRef, useState } from "react";
import { Info } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { Drawer } from "../../../components/ui/drawer";
import { FilterSelect } from "../../../components/FilterSelect";
import { FloatingPopover } from "../../../components/glass/FloatingPopover";

// Wraps any interactive demo element with a semi-transparent overlay sized
// to the REAL rendered hit area (post .touch-extend), so ≥44pt compliance
// is visually provable, not just asserted in a comment. Purely additive —
// pointer-events-none so it never intercepts the actual click.
function HitAreaOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      {children}
      <div className="absolute inset-0 pointer-events-none ring-2 ring-info/40 ring-offset-1 rounded-control" />
    </div>
  );
}

const OVERLAY_GUIDE = [
  { name: "Tooltip (hover)", when: "One line of non-critical context on a single control — an icon's meaning, a truncated value. Never contains an action." },
  { name: "Popover (click)", when: "A small structured info panel anchored to one element — \"who changed this, when\", a day's booking list. Dismisses on outside click; no action required." },
  { name: "Modal", when: "A focused task that must block the rest of the page until resolved — confirm, a short form, a conflict that needs a decision. Centered, narrow." },
  { name: "Drawer", when: "A richer detail or edit view — many fields, a record's full detail, something that feels like \"open a page within the page\". Right-anchored, taller." },
];

export function DesignSystemControls() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectVal, setSelectVal] = useState("Option A");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverAnchor = useRef<HTMLButtonElement>(null);

  return (
    <section id="controls" className="scroll-mt-16">
      <h2 className="text-page-title text-ink mb-1">Controls</h2>
      <p className="text-label text-ink-muted mb-4 px-0.5">Ban: no ad-hoc input/button/modal markup at a call site — Input/Textarea/Button/Modal/Drawer below are the ONLY implementations. Every interactive element is ringed at its REAL clickable hit area — confirm the ring is always ≥44×44px.</p>

      <h3 className="text-section text-ink-soft mb-2">Input / Textarea / Select</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 grid grid-cols-2 gap-4 max-w-2xl">
        <Input label="Patient name" placeholder="Ece Yıldırım" />
        <Input label="Email (error state)" defaultValue="not-an-email" error="Enter a valid email address" />
        <Input label="Disabled" defaultValue="Locked value" disabled />
        <div>
          <label className="text-label font-medium text-ink-soft mb-1 block">Clinic (Select — reference, not redefine)</label>
          <FilterSelect value={selectVal} onChange={setSelectVal} options={["Option A", "Option B", "Option C"]} className="w-full" />
        </div>
        <Textarea label="Notes" placeholder="Add a note…" className="col-span-2" />
      </div>

      <h3 className="text-section text-ink-soft mb-2">Button — 4 variants × hit-area check</h3>
      <div className="bg-surface rounded-card border border-divider p-4 mb-6 flex flex-wrap items-center gap-3">
        <HitAreaOverlay><Button variant="primary">Primary</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="secondary">Secondary</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="ghost">Ghost</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="destructive">Destructive</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="primary" size="sm">Compact 32px</Button></HitAreaOverlay>
        <HitAreaOverlay><Button variant="secondary" disabled disabledReason="Complete step 1 first">Disabled (explicable)</Button></HitAreaOverlay>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Overlays — which one, when</h3>
      <p className="text-label text-ink-muted mb-2 px-0.5">Rarity intent, cheapest to most disruptive: Tooltip (hover, free) → Popover (click, dismissable) → Modal (blocking) → Drawer (blocking, richer). Reach for the cheapest one that actually fits.</p>
      <div className="bg-surface rounded-card border border-divider p-4 mb-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          {OVERLAY_GUIDE.map((o) => (
            <div key={o.name} className="text-xs">
              <span className="font-bold text-ink">{o.name}</span>
              <span className="text-ink-muted"> — {o.when}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-divider">
          {/* Tooltip: the codebase's real recipe is a plain group-hover pair,
              not the vendored Radix Tooltip (that one's still on the unused
              legacy --primary tokens) — documented here as the pattern to
              copy, not as a shared component to import. */}
          <div className="group relative inline-flex">
            <button className="touch-extend p-2 text-ink-muted hover:text-ink-soft rounded-control hover:bg-surface-hover" aria-label="What is this?">
              <Info className="w-4 h-4" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-ink text-white text-xs p-2.5 rounded-control shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Tooltip — hover this icon. Plain group/group-hover, no shared component.
            </div>
            <span className="text-xs text-ink-muted self-center ml-1">← hover</span>
          </div>

          <div className="relative">
            <button ref={popoverAnchor} onClick={() => setPopoverOpen((v) => !v)} className="touch-extend px-3 py-2 rounded-control text-xs font-bold text-ink-soft border border-divider bg-surface hover:bg-surface-hover">
              Click for Popover
            </button>
            {popoverOpen && (
              <FloatingPopover anchorRef={popoverAnchor} onClose={() => setPopoverOpen(false)}>
                <div className="w-56 bg-surface border border-divider rounded-card shadow-xl p-3.5">
                  <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1">FloatingPopover</div>
                  <div className="text-xs text-ink-soft">Click-anchored, portal-rendered, closes on outside click/scroll.</div>
                </div>
              </FloatingPopover>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-section text-ink-soft mb-2">Modal / Drawer (click to open)</h3>
      <div className="bg-surface rounded-card border border-divider p-4 flex gap-3">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal (form, 640px)</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer (lg, 560px)</Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example form modal" size="form" footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setModalOpen(false)}>Save</Button>
        </div>
      }>
        <Input label="Example field" placeholder="Type here…" />
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Example drawer" width="lg" footer={
        <Button variant="primary" onClick={() => setDrawerOpen(false)}>Done</Button>
      }>
        <p className="text-sm text-ink-soft">Drawer body content — --space-4 padding, same as Modal.</p>
      </Drawer>
    </section>
  );
}
