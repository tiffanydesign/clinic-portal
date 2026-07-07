import React, { useState } from "react";
import { Pencil, History, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  CONSENT_FORM_VERSIONS,
  cloneContent,
  contentsEqual,
  type ConsentFormContent,
  type ConsentFormVersion,
} from "./consentFormData";
import { ConsentFormEditor } from "./ConsentFormEditor";
import { ConsentFormReadView } from "./ConsentFormReadView";
import { ConsentFormPreview } from "./ConsentFormPreview";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

function SaveVersionModal({
  nextVersion,
  onCancel,
  onConfirm,
}: {
  nextVersion: number;
  onCancel: () => void;
  onConfirm: (changeSummary: string) => void;
}) {
  const [summary, setSummary] = useState("");
  const canConfirm = summary.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Save New Version</h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            This will create <span className="font-bold text-gray-800">Version {nextVersion}</span> and set it as the active consent form.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Change Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Describe what changed in this version..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 resize-none"
            />
          </div>

          <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Previously signed consent forms are not affected. Patients who already signed will remain bound to the version they signed. This new
              version applies only to future signatures.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => canConfirm && onConfirm(summary.trim())}
            disabled={!canConfirm}
            className={`px-5 py-2 rounded text-sm font-bold text-white transition-colors ${canConfirm ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Confirm &amp; Activate
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscardConfirmModal({ onCancel, onDiscard }: { onCancel: () => void; onDiscard: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-base font-bold text-gray-800 mb-1.5">Discard changes?</h2>
          <p className="text-sm text-gray-500">Your edits have not been saved. This will discard them and return to the active version.</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Keep Editing
          </button>
          <button onClick={onDiscard} className="px-4 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const CURRENT_USER = "Ayşe Hançer";

export function ConsentFormPage() {
  const [versions, setVersions] = useState<ConsentFormVersion[]>(CONSENT_FORM_VERSIONS);
  const activeVersion = versions.find((v) => v.status === "active")!;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ConsentFormContent | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const hasChanges = !!draft && !contentsEqual(draft, activeVersion.content);

  const exitEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  const handleEditClick = () => {
    setDraft(cloneContent(activeVersion.content));
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    if (hasChanges) setDiscardConfirmOpen(true);
    else exitEdit();
  };

  const handleRestore = (version: ConsentFormVersion) => {
    setDraft(cloneContent(version.content));
    setIsEditing(true);
    setHistoryOpen(false);
    toast(`Version ${version.version} content loaded into a new draft — review and save when ready.`);
  };

  const handleConfirmSave = (changeSummary: string) => {
    const nextNumber = activeVersion.version + 1;
    const now = new Date();
    const editedAtShort = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const editedAtFull = `${editedAtShort}, ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

    setVersions((prev) => [
      {
        version: nextNumber,
        status: "active",
        editedBy: CURRENT_USER,
        editedAtShort,
        editedAtFull,
        changeSummary,
        signedCount: 0,
        content: draft!,
      },
      ...prev.map((v) => (v.status === "active" ? { ...v, status: "archived" as const } : v)),
    ]);

    setSaveModalOpen(false);
    exitEdit();
    toast.success(`Version ${nextNumber} is now active`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-start bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consent Form Template</h1>
          <p className="text-sm text-gray-500 mt-1">The consent form patients sign at reception before their visit</p>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            Version {activeVersion.version} · Active
          </div>
          <div className="text-xs text-gray-500 mt-1.5">
            Last edited by {activeVersion.editedBy} · {activeVersion.editedAtShort}
          </div>
        </div>
      </div>

      <div className="px-8 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/60 shrink-0">
        {isEditing ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-700 bg-slate-100 rounded">
            <Pencil className="w-4 h-4" /> Editing
          </span>
        ) : (
          <button
            onClick={handleEditClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50 hover:border-slate-400 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-600 border border-gray-300 bg-white rounded hover:bg-gray-50 hover:border-slate-400 transition-colors"
        >
          <History className="w-4 h-4" /> Version History
        </button>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-1/2 min-w-0 overflow-y-auto p-8 border-r border-gray-200 bg-white">
          {isEditing && draft ? <ConsentFormEditor draft={draft} onChange={setDraft} /> : <ConsentFormReadView content={activeVersion.content} />}
        </div>
        <div className="w-1/2 min-w-0 overflow-y-auto p-8 bg-gray-100">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
            Patient View Preview
          </div>
          <ConsentFormPreview content={isEditing && draft ? draft : activeVersion.content} />
        </div>
      </div>

      {isEditing && (
        <div className="px-8 py-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
          <button onClick={handleCancelClick} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded text-sm font-bold text-white transition-colors ${hasChanges ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Save as New Version
          </button>
        </div>
      )}

      {historyOpen && <VersionHistoryPanel versions={versions} onClose={() => setHistoryOpen(false)} onRestore={handleRestore} />}
      {saveModalOpen && <SaveVersionModal nextVersion={activeVersion.version + 1} onCancel={() => setSaveModalOpen(false)} onConfirm={handleConfirmSave} />}
      {discardConfirmOpen && (
        <DiscardConfirmModal
          onCancel={() => setDiscardConfirmOpen(false)}
          onDiscard={() => {
            setDiscardConfirmOpen(false);
            exitEdit();
          }}
        />
      )}
    </div>
  );
}
