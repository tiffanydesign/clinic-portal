import React from "react";
import type { ConsentFormContent, ConsentFormVersion } from "./consentFormData";
import { diffWords, hasDiff, type DiffToken } from "./richTextDiff";

function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <span>
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t.text)) return <React.Fragment key={i}>{t.text}</React.Fragment>;
        if (t.type === "add") return <span key={i} className="bg-success/15 text-success-ink rounded-control px-0.5">{t.text}</span>;
        if (t.type === "del") return <span key={i} className="bg-danger/15 text-danger-ink line-through rounded-control px-0.5">{t.text}</span>;
        return <React.Fragment key={i}>{t.text}</React.Fragment>;
      })}
    </span>
  );
}

function FieldDiffRow({ label, oldText, newText }: { label: string; oldText: string; newText: string }) {
  const tokens = diffWords(oldText, newText);
  if (!hasDiff(tokens)) return null;
  return (
    <div className="border border-divider rounded-control p-3">
      <div className="text-label font-bold text-ink-muted uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-sm text-ink leading-relaxed"><DiffText tokens={tokens} /></div>
    </div>
  );
}

function ToggleDiffRow({ label, oldValue, newValue }: { label: string; oldValue: boolean; newValue: boolean }) {
  if (oldValue === newValue) return null;
  return (
    <div className="border border-divider rounded-control p-3 flex items-center justify-between">
      <div className="text-sm font-bold text-ink">{label}</div>
      <div className="text-xs font-medium flex items-center gap-1.5">
        <span className="bg-danger/15 text-danger-ink line-through px-1.5 py-0.5 rounded-control">{oldValue ? "On" : "Off"}</span>
        <span className="text-ink-muted">→</span>
        <span className="bg-success/15 text-success-ink px-1.5 py-0.5 rounded-control">{newValue ? "On" : "Off"}</span>
      </div>
    </div>
  );
}

// The visual diff body, reused by the full version-to-version Compare view
// below and by the Save modal's auto-detected Change Summary.
export function ContentDiff({ from, to }: { from: ConsentFormContent; to: ConsentFormContent }) {
  const oldSections = from.sections;
  const newSections = to.sections;
  const oldIds = new Set(oldSections.map((s) => s.id));
  const newIds = new Set(newSections.map((s) => s.id));

  const removedSections = oldSections.filter((s) => !newIds.has(s.id));
  const addedSections = newSections.filter((s) => !oldIds.has(s.id));
  const commonSections = newSections.filter((s) => oldIds.has(s.id));

  return (
    <div className="space-y-3">
      <FieldDiffRow label="Form Title" oldText={from.title} newText={to.title} />
      <FieldDiffRow label="Introduction" oldText={from.introductionHtml} newText={to.introductionHtml} />

      {removedSections.map((s) => (
        <div key={s.id} className="border border-danger/30 bg-danger/10 rounded-control p-3">
          <div className="text-label font-bold text-danger-ink uppercase tracking-wider mb-1.5">Removed Section</div>
          <div className="text-sm font-bold text-ink line-through">{s.title}</div>
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
        <div key={s.id} className="border border-success/30 bg-success/10 rounded-control p-3">
          <div className="text-label font-bold text-success-ink uppercase tracking-wider mb-1.5">Added Section</div>
          <div className="text-sm font-bold text-ink">
            {s.title}
            {s.required && <span className="text-danger-ink ml-1">*</span>}
          </div>
        </div>
      ))}

      <ToggleDiffRow label="ID Number field" oldValue={from.signatureBlock.idNumber} newValue={to.signatureBlock.idNumber} />
      <ToggleDiffRow label="Witness Signature field" oldValue={from.signatureBlock.witnessSignature} newValue={to.signatureBlock.witnessSignature} />
      <FieldDiffRow label="Footer" oldText={from.footerHtml} newText={to.footerHtml} />
    </div>
  );
}

export function VersionCompare({ from, to }: { from: ConsentFormVersion; to: ConsentFormVersion }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-divider">
        <div>
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">From</div>
          <div className="text-sm font-bold text-ink mt-0.5">Version {from.version}</div>
          <div className="text-xs text-ink-muted">{from.editedBy} · {from.editedAtFull}</div>
        </div>
        <div className="text-ink-muted text-xl">→</div>
        <div>
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">To</div>
          <div className="text-sm font-bold text-ink mt-0.5">Version {to.version}</div>
          <div className="text-xs text-ink-muted">{to.editedBy} · {to.editedAtFull}</div>
        </div>
      </div>

      <ContentDiff from={from.content} to={to.content} />
    </div>
  );
}
