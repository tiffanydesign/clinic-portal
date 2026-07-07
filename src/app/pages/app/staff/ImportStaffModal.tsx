import React, { useRef, useState } from "react";
import { X, UploadCloud, Download, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF } from "./staffData";

type EntryStatus = "valid" | "duplicate" | "invalid";

type ParsedEntry = {
  key: string;
  email: string;
  role: StaffRole | "";
  firstName?: string;
  lastName?: string;
  status: EntryStatus;
};

const ROLE_OPTIONS: StaffRole[] = ["Clinician", "Nurse", "Receptionist", "Admin"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function matchRole(token: string | undefined): StaffRole | "" {
  if (!token) return "";
  const norm = token.trim().toLowerCase();
  return ROLE_OPTIONS.find((r) => r.toLowerCase() === norm) ?? "";
}

function classify(email: string, role: StaffRole | "", seen: Set<string>, existingEmails: Set<string>): EntryStatus {
  if (!EMAIL_RE.test(email)) return "invalid";
  const key = email.toLowerCase();
  if (existingEmails.has(key) || seen.has(key)) return "duplicate";
  return "valid";
}

// Splits on newlines/commas into flat tokens, then pairs each email-looking
// token with an optional trailing role hint (e.g. "berna@phenome.com, Nurse").
// A bare, unattached non-email token is kept as its own invalid row rather
// than silently dropped, so malformed input is visible in the preview.
function parseBulkText(text: string): { email: string; roleHint: StaffRole | ""; raw: string }[] {
  const tokens = text.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean);
  const results: { email: string; roleHint: StaffRole | ""; raw: string }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (EMAIL_RE.test(tok)) {
      const next = tokens[i + 1];
      const roleHint = matchRole(next);
      if (roleHint) i++;
      results.push({ email: tok, roleHint, raw: tok });
    } else {
      results.push({ email: tok, roleHint: "", raw: tok });
    }
  }
  return results;
}

function parseCsv(text: string): { email: string; roleHint: StaffRole | ""; firstName?: string; lastName?: string; raw: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const dataLines = header.includes("email") ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const email = cols[0] ?? "";
    return { email, roleHint: matchRole(cols[1]), firstName: cols[2] || undefined, lastName: cols[3] || undefined, raw: line };
  });
}

function downloadTemplate() {
  const csv = "email,role,first_name,last_name\nname@phenome.com,Nurse,Jane,Doe\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "staff-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportStaffModal({ onClose, onImported }: { onClose: () => void; onImported: (staff: Staff[]) => void }) {
  const [tab, setTab] = useState<"bulk" | "csv">("bulk");
  const [bulkText, setBulkText] = useState("");
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingEmails = new Set(MOCK_STAFF.map((s) => s.email.toLowerCase()));

  const buildEntries = (raw: { email: string; roleHint: StaffRole | ""; firstName?: string; lastName?: string; raw: string }[]) => {
    const seen = new Set<string>();
    const next: ParsedEntry[] = raw.map((r, i) => {
      const status = classify(r.email, r.roleHint, seen, existingEmails);
      if (status !== "invalid") seen.add(r.email.toLowerCase());
      return { key: `${r.raw}-${i}`, email: r.email, role: r.roleHint || "Nurse", firstName: r.firstName, lastName: r.lastName, status };
    });
    setEntries(next);
  };

  const handleParseBulk = () => buildEntries(parseBulkText(bulkText));

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => buildEntries(parseCsv(String(reader.result ?? "")));
    reader.readAsText(file);
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
        phone: "",
        status: "Invited",
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

  const tabCls = (active: boolean) =>
    `py-3 px-1 text-sm font-medium border-b-2 transition-colors ${active ? "border-slate-600 text-slate-800 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"}`;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Import Staff Members</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-6 border-b border-gray-200 shrink-0">
          <button className={tabCls(tab === "bulk")} onClick={() => setTab("bulk")}>Bulk Email Entry</button>
          <button className={tabCls(tab === "csv")} onClick={() => setTab("csv")}>CSV Upload</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {tab === "bulk" ? (
            <div className="space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={5}
                placeholder="Paste or type email addresses, one per line or comma-separated"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 resize-none font-mono"
              />
              <p className="text-[11px] text-gray-400">
                Add a role after each email, e.g. <span className="font-mono">berna@phenome.com, Nurse</span>. Roles can also be set individually below.
              </p>
              <button
                onClick={handleParseBulk}
                disabled={!bulkText.trim()}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-bold transition-colors"
              >
                Parse Emails
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-slate-500 bg-slate-50" : "border-gray-300 hover:border-slate-400"}`}
              >
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Upload a CSV file</p>
                <p className="text-xs text-gray-400 mt-1">{fileName || "Drag and drop, or click to browse"}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm font-semibold text-[#0077B6] hover:text-slate-800 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download CSV template
              </button>
              <p className="text-[11px] text-gray-400">Columns: email, role, first_name, last_name</p>
            </div>
          )}

          {entries.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview</div>
                <div className="text-xs font-medium text-gray-500">
                  {validEntries.length} valid · {skippedCount} skipped (already exist) · {errorCount} error{errorCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.key} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${e.status === "invalid" ? "text-red-600" : "text-gray-800"}`}>{e.email}</div>
                      {e.status === "duplicate" && <div className="text-[11px] text-orange-600 font-semibold mt-0.5">Already exists</div>}
                      {e.status === "invalid" && <div className="text-[11px] text-red-500 font-semibold mt-0.5">Invalid email format</div>}
                    </div>
                    {e.status === "valid" && (
                      <select
                        value={e.role}
                        onChange={(ev) => updateRole(e.key, ev.target.value as StaffRole)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white outline-none focus:border-slate-500"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => removeEntry(e.key)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0" title="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Parse or upload a batch to preview it before sending invitations. Nothing is imported until you confirm below.
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs font-medium text-gray-500">
            {entries.length > 0 && `${validEntries.length} valid · ${skippedCount} skipped · ${errorCount} error${errorCount === 1 ? "" : "s"}`}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={validEntries.length === 0}
              className={`px-6 py-2 rounded text-sm font-bold text-white transition-colors ${validEntries.length > 0 ? "bg-slate-600 hover:bg-slate-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              Import &amp; Send Invitations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
