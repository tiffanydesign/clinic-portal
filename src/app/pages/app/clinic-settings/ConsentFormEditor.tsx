import React, { useState } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";
import type { ConsentFormContent, ConsentSection } from "./consentFormData";
import { newSectionId } from "./consentFormData";
import { RichTextEditor } from "./RichTextEditor";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
        checked ? "bg-slate-600" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? "left-[19px]" : "left-[3px]"}`} />
    </button>
  );
}

function SectionCard({
  section,
  index,
  onUpdate,
  onRemove,
  dragHandlers,
  isDragging,
}: {
  section: ConsentSection;
  index: number;
  onUpdate: (patch: Partial<ConsentSection>) => void;
  onRemove: () => void;
  dragHandlers: React.HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
}) {
  return (
    <div className={`border rounded-lg p-3 bg-white transition-shadow ${isDragging ? "border-slate-400 shadow-md" : "border-gray-200"}`}>
      <div className="flex items-start gap-2 mb-2">
        <span {...dragHandlers} className="mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" title="Drag to reorder">
          <GripVertical className="w-4 h-4" />
        </span>
        <input
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={`Section ${index + 1} title`}
          className="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-300 rounded text-sm font-bold text-gray-800 outline-none focus:border-slate-500"
        />
        <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0" title="Delete section">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="pl-6">
        <RichTextEditor value={section.bodyHtml} onChange={(html) => onUpdate({ bodyHtml: html })} placeholder="Section text patients will read..." minHeight={70} />
        <div className="flex items-center gap-2 mt-2">
          <Toggle checked={section.required} onChange={(v) => onUpdate({ required: v })} />
          <span className="text-xs font-medium text-gray-600">{section.required ? "Required" : "Optional"} — patients must check this box to sign</span>
        </div>
      </div>
    </div>
  );
}

export function ConsentFormEditor({
  draft,
  onChange,
}: {
  draft: ConsentFormContent;
  onChange: (next: ConsentFormContent) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateSection = (id: string, patch: Partial<ConsentSection>) => {
    onChange({ ...draft, sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };

  const removeSection = (id: string) => {
    onChange({ ...draft, sections: draft.sections.filter((s) => s.id !== id) });
  };

  const addSection = () => {
    onChange({
      ...draft,
      sections: [...draft.sections, { id: newSectionId(), title: "", bodyHtml: "", required: false }],
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...draft.sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ ...draft, sections: next });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Form Title</label>
        <input
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-bold text-gray-800 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Introduction</label>
        <RichTextEditor value={draft.introductionHtml} onChange={(html) => onChange({ ...draft, introductionHtml: html })} placeholder="Introductory text shown before the consent sections..." />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Consent Sections</label>
          <span className="text-xs text-gray-400">{draft.sections.length} section{draft.sections.length === 1 ? "" : "s"}</span>
        </div>
        <div className="space-y-3">
          {draft.sections.map((section, i) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <SectionCard
                section={section}
                index={i}
                onUpdate={(patch) => updateSection(section.id, patch)}
                onRemove={() => removeSection(section.id)}
                dragHandlers={{}}
                isDragging={dragIndex === i}
              />
            </div>
          ))}
        </div>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 mt-3 px-3 py-2 text-xs font-bold text-slate-600 border border-dashed border-slate-300 rounded hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Section
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Signature Block</label>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-gray-700">Full Name</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Always required</span>
              <Toggle checked disabled />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-gray-700">Date</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Auto-filled</span>
              <Toggle checked disabled />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-gray-700">Signature</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Always required</span>
              <Toggle checked disabled />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-gray-700">ID Number</span>
            <Toggle checked={draft.signatureBlock.idNumber} onChange={(v) => onChange({ ...draft, signatureBlock: { ...draft.signatureBlock, idNumber: v } })} />
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-gray-700">Witness Signature</span>
            <Toggle
              checked={draft.signatureBlock.witnessSignature}
              onChange={(v) => onChange({ ...draft, signatureBlock: { ...draft.signatureBlock, witnessSignature: v } })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Footer</label>
        <RichTextEditor value={draft.footerHtml} onChange={(html) => onChange({ ...draft, footerHtml: html })} placeholder="Clinic information, legal notices..." minHeight={60} />
      </div>
    </div>
  );
}
