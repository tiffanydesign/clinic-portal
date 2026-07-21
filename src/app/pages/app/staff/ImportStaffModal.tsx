import React, { useState } from "react";
import { X, UploadCloud, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF } from "./staffData";

type EntryStatus = "valid" | "duplicate" | "invalid";

type ParsedEntry = {
  key: string;
  email: string;
  role: StaffRole | "";
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: EntryStatus;
};

type RawRow = { email: string; roleHint: StaffRole | ""; firstName?: string; lastName?: string; phone?: string; raw: string };

// Admin is intentionally excluded — the clinic has exactly one Admin account,
// already provisioned; bulk import can never create another one.
const ROLE_OPTIONS: StaffRole[] = ["Clinician", "Nurse", "Receptionist"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classify(email: string, seen: Set<string>, existingEmails: Set<string>): EntryStatus {
  if (!EMAIL_RE.test(email)) return "invalid";
  const key = email.toLowerCase();
  if (existingEmails.has(key) || seen.has(key)) return "duplicate";
  return "valid";
}

// Shown only when some rows will be silently dropped (duplicates/errors),
// so the admin knows exactly how many invitations are actually about to
// go out before committing.
function ImportConfirmModal({
  validCount,
  skippedCount,
  errorCount,
  onCancel,
  onConfirm,
}: {
  validCount: number;
  skippedCount: number;
  errorCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const excludedParts: string[] = [];
  if (skippedCount > 0) excludedParts.push(`${skippedCount} already existing`);
  if (errorCount > 0) excludedParts.push(`${errorCount} with errors`);
  const excludedText = excludedParts.join(" and ");

  return (
    <div className="fixed inset-0 z-[60] bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onCancel}>
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-base font-bold text-ink mb-1.5">Import {validCount} staff member{validCount === 1 ? "" : "s"}?</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Only the {validCount} valid row{validCount === 1 ? "" : "s"} will be imported and sent invitations. The {excludedText} will be skipped.
          </p>
        </div>
        <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken transition-colors">
            Import &amp; Send Invitations
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadTemplate() {
  const csv = "first_name,last_name,email,phone,role\nJane,Doe,name@phenome.com,+90 532 555 0199,Nurse\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "staff-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// No backend to actually parse a CSV against, so "uploading" always resolves
// to this fixed sample batch — deliberately mixed (three new hires, one
// email that collides with an existing staff member, one malformed row) so
// the preview's valid/duplicate/invalid states are all exercised at once.
const MOCK_FILE_NAME = "staff-import-demo.csv";
const MOCK_ROWS: RawRow[] = [
  { firstName: "Zeynep", lastName: "Aydemir", email: "zeynep.aydemir@phenome.com", phone: "+90 532 000 4444", roleHint: "Nurse", raw: "Zeynep,Aydemir,zeynep.aydemir@phenome.com,+90 532 000 4444,Nurse" },
  { firstName: "Mert", lastName: "Yalçın", email: "mert.yalcin@phenome.com", phone: "+90 532 000 5555", roleHint: "Receptionist", raw: "Mert,Yalçın,mert.yalcin@phenome.com,+90 532 000 5555,Receptionist" },
  { firstName: "Deniz", lastName: "Aksoy", email: "deniz.aksoy@phenome.com", phone: "+90 532 000 6666", roleHint: "Clinician", raw: "Deniz,Aksoy,deniz.aksoy@phenome.com,+90 532 000 6666,Clinician" },
  { firstName: "Berna", lastName: "Koç", email: "berna@phenome.com", phone: "+90 532 555 0107", roleHint: "Nurse", raw: "Berna,Koç,berna@phenome.com,+90 532 555 0107,Nurse" },
  { firstName: "Onur", lastName: "Şahin", email: "onur.sahin(at)phenome.com", phone: "", roleHint: "", raw: "Onur,Şahin,onur.sahin(at)phenome.com,," },
];

export function ImportStaffModal({ onClose, onImported }: { onClose: () => void; onImported: (staff: Staff[]) => void }) {
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const existingEmails = new Set(MOCK_STAFF.map((s) => s.email.toLowerCase()));

  const buildEntries = (raw: RawRow[]) => {
    const seen = new Set<string>();
    const next: ParsedEntry[] = raw.map((r, i) => {
      const status = classify(r.email, seen, existingEmails);
      if (status !== "invalid") seen.add(r.email.toLowerCase());
      return { key: `${r.raw}-${i}`, email: r.email, role: r.roleHint || "Nurse", firstName: r.firstName, lastName: r.lastName, phone: r.phone, status };
    });
    setEntries(next);
    return next;
  };

  // Simulates a real upload's round trip (brief "processing" delay, then a
  // populated preview + toast) without needing an actual file — there's no
  // backend to send one to in this demo.
  const simulateUpload = () => {
    if (processing) return;
    setDragOver(false);
    setProcessing(true);
    setFileName(MOCK_FILE_NAME);
    setEntries([]);
    setTimeout(() => {
      const next = buildEntries(MOCK_ROWS);
      setProcessing(false);
      toast.success(`${MOCK_FILE_NAME} uploaded — ${next.length} ${next.length === 1 ? "entry" : "entries"} found.`);
    }, 700);
  };

  const updateRole = (key: string, role: StaffRole) => {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, role } : e)));
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  const validEntries = entries.filter((e) => e.status === "valid");
  const skippedCount = entries.filter((e) => e.status === "duplicate").length;
  const errorCount = entries.filter((e) => e.status === "invalid").length;

  const handleImport = () => {
    const created: Staff[] = validEntries.map((e, i) => {
      const id = `EMP-IMP-${Date.now()}-${i}`;
      const namePart = e.email.split("@")[0];
      const fullName = e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : namePart;
      const avatar = e.firstName && e.lastName ? (e.firstName[0] + e.lastName[0]).toUpperCase() : namePart.slice(0, 2).toUpperCase();
      return {
        id,
        name: fullName,
        avatar,
        role: (e.role || "Nurse") as StaffRole,
        email: e.email,
        phone: e.phone || "",
        status: "Inactive",
        today: "Off",
        patients: e.role === "Clinician" || e.role === "Nurse" ? 0 : null,
        workload: e.role === "Clinician" || e.role === "Nurse" ? 0 : null,
        nextShift: "—",
        lastActive: "Never · Not activated",
        lastActiveDays: 0,
        joined: "4 Jul 2026",
      };
    });
    onImported(created);
    toast.success(`Invitations sent to ${created.length} staff member${created.length === 1 ? "" : "s"}`);
  };

  // Only interrupt with a confirmation when some rows would be silently
  // dropped (duplicates/errors) — a fully clean batch imports immediately.
  const handleImportClick = () => {
    if (skippedCount > 0 || errorCount > 0) setConfirmOpen(true);
    else handleImport();
  };

  return (
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <h2 className="text-lg font-bold text-ink">Import Staff Members</h2>
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); if (!processing) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); simulateUpload(); }}
              onClick={simulateUpload}
              className={`border-2 border-dashed rounded-card p-4 text-center transition-colors ${processing ? "border-divider cursor-wait" : dragOver ? "border-border-strong bg-surface-page cursor-pointer" : "border-divider hover:border-border-strong cursor-pointer"}`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-8 h-8 text-ink-muted mx-auto mb-2 animate-spin" />
                  <p className="text-sm font-bold text-ink-soft">Processing {MOCK_FILE_NAME}...</p>
                  <p className="text-xs text-ink-muted mt-1">Reading rows and checking for existing staff</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-ink-soft">Upload a CSV file</p>
                  <p className="text-xs text-ink-muted mt-1">{fileName || "Drag and drop, or click to browse"}</p>
                </>
              )}
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:text-ink transition-colors">
              <Download className="w-3.5 h-3.5" /> Download CSV template
            </button>
          </div>

          {entries.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Preview</div>
                <div className="text-xs font-medium text-ink-muted">
                  {validEntries.length} valid · {skippedCount} skipped (already exist) · {errorCount} error{errorCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="border border-divider rounded-card divide-y divide-divider max-h-64 overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.key} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${e.status === "invalid" ? "text-danger-ink" : "text-ink"}`}>
                        {e.firstName && e.lastName ? `${e.firstName} ${e.lastName} · ` : ""}{e.email}
                      </div>
                      {e.status === "duplicate" && <div className="text-label text-warning-ink font-semibold mt-0.5">Already exists</div>}
                      {e.status === "invalid" && <div className="text-label text-danger-ink font-semibold mt-0.5">Invalid email format</div>}
                    </div>
                    {e.status === "valid" && (
                      <select
                        value={e.role}
                        onChange={(ev) => updateRole(e.key, ev.target.value as StaffRole)}
                        className="px-2 py-1 border border-divider rounded-control text-xs bg-surface outline-none focus:border-border-strong"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => removeEntry(e.key)} className="p-1.5 text-ink-muted hover:text-danger-ink hover:bg-danger/10 rounded-control transition-colors shrink-0" title="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-page border-t border-divider flex items-center justify-between shrink-0">
          <div className="text-xs font-medium text-ink-muted">
            {entries.length > 0 && `${validEntries.length} valid · ${skippedCount} skipped · ${errorCount} error${errorCount === 1 ? "" : "s"}`}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">
              Cancel
            </button>
            <button
              onClick={handleImportClick}
              disabled={validEntries.length === 0}
              className={`px-6 py-2 rounded-control text-sm font-bold text-white transition-colors ${validEntries.length > 0 ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}
            >
              Import &amp; Send Invitations
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ImportConfirmModal
          validCount={validEntries.length}
          skippedCount={skippedCount}
          errorCount={errorCount}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); handleImport(); }}
        />
      )}
    </div>
  );
}
