import React from "react";
import type { ConsentFormContent } from "./consentFormData";

// The admin's own read-only view of the template configuration — distinct
// from ConsentFormPreview, which renders what the patient sees.
export function ConsentFormReadView({ content }: { content: ConsentFormContent }) {
  const { signatureBlock } = content;
  const signatureFields = [
    { label: "Full Name", on: true },
    { label: "Date", on: true },
    { label: "Signature", on: true },
    { label: "ID Number", on: signatureBlock.idNumber },
    { label: "Witness Signature", on: signatureBlock.witnessSignature },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink mb-4">{content.title}</h1>

      <div
        className="text-sm text-ink-soft leading-relaxed mb-6 [&_p]:mb-3 last:[&_p]:mb-0"
        dangerouslySetInnerHTML={{ __html: content.introductionHtml }}
      />

      <div className="space-y-5 mb-6">
        {content.sections.map((section, i) => (
          <div key={section.id}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-ink-muted w-5 shrink-0">{i + 1}.</span>
              <span className="text-sm font-bold text-ink">{section.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded-control text-overline ${
                  section.required ? "bg-danger/10 text-danger-ink" : "bg-surface-hover text-ink-soft"
                }`}
              >
                {section.required ? "Required" : "Optional"}
              </span>
            </div>
            <div
              className="text-sm text-ink-soft leading-relaxed pl-7 [&_p]:mb-2 last:[&_p]:mb-0 [&_strong]:text-ink"
              dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Signature Block</div>
        <div className="flex flex-wrap gap-2">
          {signatureFields.map((f) => (
            <span
              key={f.label}
              className={`px-2.5 py-1 rounded-control text-xs font-medium border ${
                f.on ? "bg-surface-page border-divider text-ink-soft" : "bg-surface-page border-divider text-ink-muted line-through"
              }`}
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="text-xs text-ink-muted leading-relaxed pt-4 border-t border-divider [&_p]:mb-0"
        dangerouslySetInnerHTML={{ __html: content.footerHtml }}
      />
    </div>
  );
}
