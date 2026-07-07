import React from "react";
import type { ConsentFormVersion } from "./consentFormData";
import { diffWords, hasDiff, type DiffToken } from "./richTextDiff";

function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <span>
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t.text)) return <React.Fragment key={i}>{t.text}</React.Fragment>;
        if (t.type === "add") return <span key={i} className="bg-emerald-100 text-emerald-800 rounded-sm px-0.5">{t.text}</span>;
        if (t.type === "del") return <span key={i} className="bg-red-100 text-red-700 line-through rounded-sm px-0.5">{t.text}</span>;
        return <React.Fragment key={i}>{t.text}</React.Fragment>;
      })}
    </span>
  );
}

function FieldDiffRow({ label, oldText, newText }: { label: string; oldText: string; newText: string }) {
  const tokens = diffWords(oldText, newText);
  if (!hasDiff(tokens)) return null;
  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-sm text-gray-800 leading-relaxed"><DiffText tokens={tokens} /></div>
    </div>
  );
}

function ToggleDiffRow({ label, oldValue, newValue }: { label: string; oldValue: boolean; newValue: boolean }) {
  if (oldValue === newValue) return null;
  return (
    <div className="border border-gray-200 rounded p-3 flex items-center justify-between">
      <div className="text-sm font-bold text-gray-800">{label}</div>
      <div className="text-xs font-medium flex items-center gap-1.5">
        <span className="bg-red-100 text-red-700 line-through px-1.5 py-0.5 rounded">{oldValue ? "On" : "Off"}</span>
        <span className="text-gray-400">→</span>
        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{newValue ? "On" : "Off"}</span>
      </div>
    </div>
  );
}

export function VersionCompare({ from, to }: { from: ConsentFormVersion; to: ConsentFormVersion }) {
  const oldSections = from.content.sections;
  const newSections = to.content.sections;
  const oldIds = new Set(oldSections.map((s) => s.id));
  const newIds = new Set(newSections.map((s) => s.id));

  const removedSections = oldSections.filter((s) => !newIds.has(s.id));
  const addedSections = newSections.filter((s) => !oldIds.has(s.id));
  const commonSections = newSections.filter((s) => oldIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">Version {from.version}</div>
          <div className="text-xs text-gray-500">{from.editedBy} · {from.editedAtFull}</div>
        </div>
        <div className="text-gray-300 text-xl">→</div>
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">Version {to.version}</div>
          <div className="text-xs text-gray-500">{to.editedBy} · {to.editedAtFull}</div>
        </div>
      </div>

      <div className="space-y-3">
        <FieldDiffRow label="Form Title" oldText={from.content.title} newText={to.content.title} />
        <FieldDiffRow label="Introduction" oldText={from.content.introductionHtml} newText={to.content.introductionHtml} />

        {removedSections.map((s) => (
          <div key={s.id} className="border border-red-200 bg-red-50 rounded p-3">
            <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Removed Section</div>
            <div className="text-sm font-bold text-gray-800 line-through">{s.title}</div>
          </div>
        ))}

        {commonSections.map((s) => {
          const old = oldSections.find((o) => o.id === s.id)!;
          return (
            <React.Fragment key={s.id}>
              <FieldDiffRow label={`Section: ${s.title}`} oldText={old.bodyHtml} newText={s.bodyHtml} />
            </React.Fragment>
          );
        })}

        {addedSections.map((s) => (
          <div key={s.id} className="border border-emerald-200 bg-emerald-50 rounded p-3">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Added Section</div>
            <div className="text-sm font-bold text-gray-800">
              {s.title}
              {s.required && <span className="text-red-500 ml-1">*</span>}
            </div>
          </div>
        ))}

        <ToggleDiffRow label="ID Number field" oldValue={from.content.signatureBlock.idNumber} newValue={to.content.signatureBlock.idNumber} />
        <ToggleDiffRow label="Witness Signature field" oldValue={from.content.signatureBlock.witnessSignature} newValue={to.content.signatureBlock.witnessSignature} />
        <FieldDiffRow label="Footer" oldText={from.content.footerHtml} newText={to.content.footerHtml} />
      </div>
    </div>
  );
}
