import React, { useState } from "react";
import { Bold, Italic, List, Heading2, Paperclip, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePatientOutletContext } from "./PatientRecordLayout";
import { ClinicianNote } from "./patientRecordData";
import { DIAGNOSIS_LIBRARY } from "../clinic-settings/diagnosesData";

const CURRENT_CLINICIAN_ID = "EMP-003"; // Dr. Ebru Reis (signed-in clinician)

function NoteCard({ note, canManage, onDelete }: { note: ClinicianNote; canManage: boolean; onDelete: () => void }) {
  return (
    <div className="rounded-card bg-surface p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-hover text-ink-soft text-xs font-bold flex items-center justify-center shrink-0">{note.authorAvatar}</div>
          <div>
            <div className="text-sm font-bold text-ink">{note.author}</div>
            <div className="text-xs text-ink-muted">{note.timestamp}</div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => toast("Edit note (demo)")} className="text-xs font-bold text-ink-soft hover:underline">Edit</button>
            <button onClick={onDelete} className="text-xs font-bold text-danger-ink hover:underline">Delete</button>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-soft leading-relaxed mb-3">{note.body}</p>
      {note.diagnosisTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {note.diagnosisTags.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-info/10 text-info-ink border border-info/30 text-label font-bold rounded-control">{t}</span>
          ))}
        </div>
      )}
      {note.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.attachments.map((a) => (
            <span key={a} className="flex items-center gap-1 text-xs font-medium text-ink-soft bg-surface-page border border-divider rounded-control px-2 py-1"><Paperclip className="w-3 h-3" />{a}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddNoteModal({ onClose, onSave }: { onClose: () => void; onSave: (body: string, tags: string[]) => void }) {
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const results = query ? DIAGNOSIS_LIBRARY.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) && !tags.includes(d.name)).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 bg-surface-sunken/30 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-surface rounded-card shadow-2xl border border-divider w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <h2 className="text-lg font-bold text-ink">Add Clinician Note</h2>
          <button onClick={onClose} className="p-2 text-ink-muted hover:bg-surface-sunken rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="border border-divider rounded-control overflow-hidden">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-divider bg-surface-page">
              {[Bold, Italic, List, Heading2].map((Icon, i) => (
                <button key={i} onClick={() => toast("Formatting (demo)")} className="p-1.5 text-ink-muted hover:bg-surface-sunken rounded-control"><Icon className="w-3.5 h-3.5" /></button>
              ))}
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write a clinical note…" className="w-full p-3 text-sm outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">Linked Diagnoses</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-info/10 text-info-ink border border-info/30 text-label font-bold rounded-control">
                    {t} <button onClick={() => setTags((p) => p.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Diagnosis Library…" className="w-full px-3 py-2 border border-divider rounded-control text-sm outline-none focus:border-border-strong" />
            {results.length > 0 && (
              <div className="border border-divider rounded-control mt-1 divide-y divide-divider">
                {results.map((d) => (
                  <button key={d.id} onClick={() => { setTags((p) => [...p, d.name]); setQuery(""); }} className="w-full text-left px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-page flex items-center justify-between">
                    {d.name} <span className="text-xs text-ink-muted font-mono">{d.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => toast("Attachment upload (demo)")} className="flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:underline">
            <Paperclip className="w-3.5 h-3.5" /> Add Attachment
          </button>
        </div>

        <div className="px-6 py-4 border-t border-divider flex justify-end gap-3 bg-surface-page shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button onClick={() => { if (!body.trim()) { toast.error("Note cannot be empty."); return; } onSave(body, tags); }} disabled={!body.trim()} className={`px-6 py-2 rounded-control text-sm font-bold text-white ${body.trim() ? "bg-surface-sunken hover:bg-surface-sunken" : "bg-surface-sunken cursor-not-allowed"}`}>Save Note</button>
        </div>
      </div>
    </div>
  );
}

export function ClinicianNotesTab() {
  const { patient, role } = usePatientOutletContext();
  const [notes, setNotes] = useState(patient.clinicianNotes);
  const [modalOpen, setModalOpen] = useState(false);
  const canAdd = role === "Clinician" || role === "Admin";

  const addNote = (body: string, tags: string[]) => {
    setNotes((prev) => [
      { id: `N-${prev.length + 1}`, authorId: CURRENT_CLINICIAN_ID, author: "Dr. Ebru Reis", authorAvatar: "ER", timestamp: "3 Jul 2026, now", body, diagnosisTags: tags, attachments: [], editable: true },
      ...prev,
    ]);
    setModalOpen(false);
    toast.success("Note saved.");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {canAdd && (
        <div className="flex justify-end mb-5">
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-ink text-white text-sm font-bold rounded-control hover:bg-ink flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Note</button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center text-ink-muted italic">No clinician notes yet.</div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} canManage={role === "Clinician" && n.authorId === CURRENT_CLINICIAN_ID && n.editable} onDelete={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))} />
          ))}
        </div>
      )}

      {modalOpen && <AddNoteModal onClose={() => setModalOpen(false)} onSave={addNote} />}
    </div>
  );
}
