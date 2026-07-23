import React, { useState } from "react";
import { Eye, GitCompare, RotateCcw } from "lucide-react";
import type { ConsentFormVersion } from "./consentFormData";
import { ConsentFormPreview } from "./ConsentFormPreview";
import { VersionCompare } from "./VersionCompare";
import { Drawer } from "../../../components/ui/drawer";
import { Modal } from "../../../components/ui/modal";

function VersionPill({ status }: { status: ConsentFormVersion["status"] }) {
  return status === "active" ? (
    <span className="px-2 py-0.5 rounded-control text-overline bg-success/10 border border-success/30 text-success-ink">
      Active
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-control text-overline bg-surface-hover border border-divider text-ink-muted">
      Archived
    </span>
  );
}

export function VersionHistoryPanel({
  versions,
  onClose,
  onRestore,
}: {
  versions: ConsentFormVersion[];
  onClose: () => void;
  onRestore: (version: ConsentFormVersion) => void;
}) {
  const [viewing, setViewing] = useState<ConsentFormVersion | null>(null);
  const [comparing, setComparing] = useState<ConsentFormVersion | null>(null);
  const active = versions.find((v) => v.status === "active")!;

  return (
    <>
      <Drawer open onClose={onClose} title="Version History" subtitle="Append-only. Every version is preserved in full for audit purposes." width="lg">
        <div className="space-y-4">
          {versions.map((v) => (
            <div key={v.version} className="border border-divider rounded-card p-4 bg-surface">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-data font-bold text-ink">Version {v.version}</span>
                <VersionPill status={v.status} />
              </div>
              <div className="text-label text-ink-muted">{v.editedBy} · {v.editedAtFull}</div>
              <div className="text-body text-ink-soft mt-2 leading-snug">{v.changeSummary}</div>
              {v.adminNote && (
                <div className="text-label text-ink-muted italic mt-1.5 pl-2.5 border-l-2 border-divider">{v.adminNote}</div>
              )}
              <div className="text-label text-ink-muted mt-1.5">{v.signedCount} patients signed this version</div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-divider">
                <button
                  onClick={() => setViewing(v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-label font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-hover transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {v.version !== active.version && (
                  <button
                    onClick={() => setComparing(v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-label font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-hover transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" /> Compare
                  </button>
                )}
                <button
                  onClick={() => onRestore(v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-label font-bold text-ink-soft border border-divider bg-surface-page rounded-control hover:bg-surface-hover transition-colors ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore as New Version
                </button>
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {viewing && (
        <Modal open onClose={() => setViewing(null)} size="form" title={`Version ${viewing.version}`}>
          <div className="flex items-center gap-2 mb-4">
            <VersionPill status={viewing.status} />
            <span className="text-label text-ink-muted">Read only</span>
          </div>
          <ConsentFormPreview content={viewing.content} />
        </Modal>
      )}

      {comparing && (
        <Modal open onClose={() => setComparing(null)} size="form" title="Compare Versions">
          <VersionCompare from={comparing} to={active} />
        </Modal>
      )}
    </>
  );
}
