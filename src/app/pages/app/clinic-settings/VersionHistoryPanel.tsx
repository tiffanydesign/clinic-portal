import React, { useState } from "react";
import { X, Eye, GitCompare, RotateCcw } from "lucide-react";
import type { ConsentFormVersion } from "./consentFormData";
import { ConsentFormPreview } from "./ConsentFormPreview";
import { VersionCompare } from "./VersionCompare";

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
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-surface-sunken/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[560px] max-w-full h-full bg-surface border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <div>
            <h2 className="text-lg font-bold text-ink">Version History</h2>
            <p className="text-xs text-ink-muted mt-0.5">Append-only. Every version is preserved in full for audit purposes.</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {versions.map((v) => (
            <div key={v.version} className="border border-divider rounded-card p-4 bg-surface">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold text-ink">Version {v.version}</span>
                <VersionPill status={v.status} />
              </div>
              <div className="text-xs text-ink-muted">{v.editedBy} · {v.editedAtFull}</div>
              <div className="text-sm text-ink-soft mt-2 leading-snug">{v.changeSummary}</div>
              {v.adminNote && (
                <div className="text-xs text-ink-muted italic mt-1.5 pl-2.5 border-l-2 border-divider">{v.adminNote}</div>
              )}
              <div className="text-xs text-ink-muted mt-1.5">{v.signedCount} patients signed this version</div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-divider">
                <button
                  onClick={() => setViewing(v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-page transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {v.version !== active.version && (
                  <button
                    onClick={() => setComparing(v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-ink-soft border border-divider bg-surface rounded-control hover:bg-surface-page transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" /> Compare
                  </button>
                )}
                <button
                  onClick={() => onRestore(v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-ink-soft border border-divider bg-surface-page rounded-control hover:bg-surface-hover transition-colors ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore as New Version
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setViewing(null)}>
          <div
            className="bg-surface-page rounded-card shadow-2xl border border-divider w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink">Version {viewing.version}</h2>
                <VersionPill status={viewing.status} />
                <span className="text-xs text-ink-muted">Read only</span>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ConsentFormPreview content={viewing.content} />
            </div>
          </div>
        </div>
      )}

      {comparing && (
        <div className="fixed inset-0 z-50 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setComparing(null)}>
          <div
            className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
              <h2 className="text-lg font-bold text-ink">Compare Versions</h2>
              <button onClick={() => setComparing(null)} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <VersionCompare from={comparing} to={active} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
