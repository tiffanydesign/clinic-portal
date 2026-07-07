import React from "react";
import { PenTool } from "lucide-react";
import type { ConsentFormContent } from "./consentFormData";

// Renders the patient-facing signing screen for a given content snapshot.
// Used both for the live-editing preview pane and the read-only "View" modal
// in Version History — same renderer, so what you compare is what patients saw.
export function ConsentFormPreview({ content }: { content: ConsentFormContent }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-xl mx-auto">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">P</div>
          <span className="text-sm font-bold text-gray-800">Phenome Clinic</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-snug">{content.title}</h2>
      </div>

      <div className="px-6 py-4 border-b border-gray-100">
        <div
          className="text-sm text-gray-600 leading-relaxed [&_p]:mb-2 last:[&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: content.introductionHtml }}
        />
      </div>

      <div className="divide-y divide-gray-100">
        {content.sections.map((section) => (
          <div key={section.id} className="px-6 py-4 flex gap-3">
            <div className="w-4 h-4 mt-0.5 border-2 border-gray-300 rounded shrink-0" aria-hidden />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-800">
                {section.title}
                {section.required && <span className="text-red-500 ml-1">*</span>}
              </div>
              <div
                className="text-xs text-gray-500 leading-relaxed mt-1 [&_p]:mb-1.5 last:[&_p]:mb-0 [&_strong]:text-gray-700 [&_a]:text-slate-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-5 bg-gray-50 space-y-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Signature</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Full Name</label>
            <div className="h-8 border border-gray-300 rounded bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Date</label>
            <div className="h-8 border border-gray-200 rounded bg-gray-100 flex items-center px-2 text-xs text-gray-400">Auto-filled</div>
          </div>
          {content.signatureBlock.idNumber && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">ID Number</label>
              <div className="h-8 border border-gray-300 rounded bg-white" />
            </div>
          )}
          {content.signatureBlock.witnessSignature && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Witness Signature</label>
              <div className="h-8 border border-gray-300 rounded bg-white" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Signature</label>
          <div className="h-16 border border-dashed border-gray-300 rounded bg-white flex items-center justify-center text-xs text-gray-400 gap-1.5">
            <PenTool className="w-3.5 h-3.5" /> Sign here
          </div>
        </div>
      </div>

      <div
        className="px-6 py-4 text-[11px] text-gray-400 leading-relaxed [&_p]:mb-0 [&_a]:text-slate-500 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: content.footerHtml }}
      />
    </div>
  );
}
