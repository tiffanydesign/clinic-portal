import React, { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { Drawer } from "../../../components/ui/drawer";
import { FilterSelect } from "../../../components/FilterSelect";

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

export function DesignSystemControls() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectVal, setSelectVal] = useState("Option A");

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
