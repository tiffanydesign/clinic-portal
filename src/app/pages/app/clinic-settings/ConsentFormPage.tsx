import React, { useState } from "react";
import { Link } from "react-router";
import { Pencil, History, AlertTriangle, RotateCcw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
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
import { ContentDiff } from "./VersionCompare";
import { summarizeContentChanges } from "./richTextDiff";

function SaveVersionModal({
  nextVersion,
  activeVersion,
  restoredFrom,
  draft,
  onCancel,
  onConfirm,
}: {
  nextVersion: number;
  activeVersion: ConsentFormVersion;
  restoredFrom: ConsentFormVersion | null;
  draft: ConsentFormContent;
  onCancel: () => void;
  onConfirm: (changeSummary: string, adminNote: string) => void;
}) {
  const [adminNote, setAdminNote] = useState("");

  // Two-stage summary when the draft started from a restored version: what
  // the restore itself changed vs. the currently active content, then
  // whatever the Admin additionally edited on top of that restored content.
  const restoreBullets = restoredFrom ? summarizeContentChanges(activeVersion.content, restoredFrom.content) : [];
  const furtherBullets = restoredFrom ? summarizeContentChanges(restoredFrom.content, draft) : [];
  const directBullets = restoredFrom ? [] : summarizeContentChanges(activeVersion.content, draft);

  const autoSummary = restoredFrom
    ? `Restored from Version ${restoredFrom.version}${furtherBullets.length ? "; " + furtherBullets.join("; ") : ""}`
    : directBullets.join("; ");

  return (
    <Modal open onClose={onCancel} title="Save New Version" size="form"
      footer={<>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => onConfirm(autoSummary, adminNote.trim())}>Confirm &amp; Activate</Button>
      </>}
    >
      <div className="space-y-5">
        <p className="text-body text-ink-soft">
          This will create <span className="font-bold text-ink">Version {nextVersion}</span> and set it as the active consent form.
        </p>

        <div>
          <label className="block text-label font-bold text-ink-soft uppercase tracking-wider mb-2">Change Summary — detected automatically</label>

          {restoredFrom ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-label font-bold text-ink-soft mb-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Restored from Version {restoredFrom.version}
                </div>
                <ContentDiff from={activeVersion.content} to={restoredFrom.content} />
              </div>

              <div>
                <div className="text-label font-bold text-ink-soft mb-2">Additional edits after restoring</div>
                {furtherBullets.length > 0 ? (
                  <ContentDiff from={restoredFrom.content} to={draft} />
                ) : (
                  <p className="text-body text-ink-muted italic">No further edits made after restoring this version.</p>
                )}
              </div>
            </div>
          ) : (
            <ContentDiff from={activeVersion.content} to={draft} />
          )}
        </div>

        <div>
          <label className="block text-label font-bold text-ink-soft uppercase tracking-wider mb-2">Admin Notes (optional)</label>
          <Textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Add any context for this change (optional)..."
            className="resize-none"
          />
        </div>

        <div className="flex gap-2.5 p-3 bg-warning/10 border border-warning/30 rounded-control">
          <AlertTriangle className="w-4 h-4 text-warning-ink shrink-0 mt-0.5" />
          <p className="text-label text-warning-ink leading-relaxed">
            Previously signed consent forms are not affected. Patients who already signed will remain bound to the version they signed. This new
            version applies only to future signatures.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function DiscardConfirmModal({ onCancel, onDiscard }: { onCancel: () => void; onDiscard: () => void }) {
  return (
    <Modal open onClose={onCancel} title="Discard changes?" size="confirm"
      footer={<>
        <Button variant="secondary" onClick={onCancel}>Keep Editing</Button>
        <Button variant="destructive" onClick={onDiscard}>Discard Changes</Button>
      </>}
    >
      <p className="text-body text-ink-muted">Your edits have not been saved. This will discard them and return to the active version.</p>
    </Modal>
  );
}

const CURRENT_USER = "Ayşe Hançer";

export function ConsentFormPage() {
  const [versions, setVersions] = useState<ConsentFormVersion[]>(CONSENT_FORM_VERSIONS);
  const activeVersion = versions.find((v) => v.status === "active")!;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ConsentFormContent | null>(null);
  const [restoredFrom, setRestoredFrom] = useState<ConsentFormVersion | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const hasChanges = !!draft && !contentsEqual(draft, activeVersion.content);

  const exitEdit = () => {
    setIsEditing(false);
    setDraft(null);
    setRestoredFrom(null);
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
    setRestoredFrom(version);
    setIsEditing(true);
    setHistoryOpen(false);
    toast(`Version ${version.version} content loaded into a new draft — review and save when ready.`);
  };

  const handleConfirmSave = (changeSummary: string, adminNote: string) => {
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
        adminNote: adminNote || undefined,
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
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <div className="px-6 py-6 border-b border-divider shrink-0 flex justify-between items-start bg-surface">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-2">
            <Link to="/clinic-settings" className="hover:text-ink-soft hover:underline">Clinic Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-soft font-bold">Consent Form Template</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Consent Form Template</h1>
          <p className="text-sm text-ink-muted mt-1">The consent form patients sign at reception before their visit</p>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success-ink text-xs font-bold">
            Version {activeVersion.version} · Active
          </div>
          <div className="text-xs text-ink-muted mt-1.5">
            Last edited by {activeVersion.editedBy} · {activeVersion.editedAtShort}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-divider flex justify-between items-center bg-surface-page/60 shrink-0">
        {isEditing ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-ink-soft bg-surface-hover rounded-control">
            <Pencil className="w-4 h-4" /> Editing
          </span>
        ) : (
          <button
            onClick={handleEditClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-hover hover:border-border-strong transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-hover hover:border-border-strong transition-colors"
        >
          <History className="w-4 h-4" /> Version History
        </button>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-1/2 min-w-0 overflow-y-auto p-4 border-r border-divider bg-surface">
          {isEditing && draft ? <ConsentFormEditor draft={draft} onChange={setDraft} /> : <ConsentFormReadView content={activeVersion.content} />}
        </div>
        <div className="w-1/2 min-w-0 overflow-y-auto p-4 bg-surface-hover">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-info/10 border border-info/30 text-info-ink text-overline mb-4">
            Patient View Preview
          </div>
          <ConsentFormPreview content={isEditing && draft ? draft : activeVersion.content} />
        </div>
      </div>

      {isEditing && (
        <div className="px-6 py-4 border-t border-divider bg-surface flex justify-between items-center shrink-0">
          <button onClick={handleCancelClick} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">
            Cancel
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-control text-sm font-bold text-white transition-colors ${hasChanges ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
          >
            Save as New Version
          </button>
        </div>
      )}

      {historyOpen && <VersionHistoryPanel versions={versions} onClose={() => setHistoryOpen(false)} onRestore={handleRestore} />}
      {saveModalOpen && draft && (
        <SaveVersionModal
          nextVersion={activeVersion.version + 1}
          activeVersion={activeVersion}
          restoredFrom={restoredFrom}
          draft={draft}
          onCancel={() => setSaveModalOpen(false)}
          onConfirm={handleConfirmSave}
        />
      )}
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
