import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Download, Settings, Search, Star, Flag, MessageSquare, AlertCircle, X,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, Users, TrendingUp, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  FeedbackItem, ChangeHistoryEntry, Status, TabKey, TAB_KEYS,
  SOURCE_COLORS, TYPE_COLORS, STATUS_PILLS, URGENCY_COLORS, HISTORY_DOT_COLORS,
  submitterDisplayName, matchesTab, isOverdue, CURRENT_ADMIN_NAME,
} from "./feedbackData";
import { useFeedbackList, changeStatus, toggleFlag, addInternalNote } from "./feedbackStore";
import { FilterSelect } from "../../components/FilterSelect";

const SOURCE_OPTIONS = ["All Sources", "Patient", "Clinician", "Nurse", "Receptionist", "Google Review"];
const TYPE_OPTIONS = ["All Types", "Visit Feedback", "Complaint", "Suggestion", "System Issue", "Incident Report", "Compliment", "Other"];
const STATUS_OPTIONS = ["All Status", "New", "In Review", "Resolved", "Addressed", "Archived"];

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.44H12v4.62h6.48c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09C3.26 21.3 7.3 24 12 24Z" />
      <path fill="#FBBC05" d="M5.31 14.32A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.38-2.32V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.01-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.59l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75Z" />
    </svg>
  );
}

/** Delta chip: green up / red down, paired with an arrow icon (never color alone). */
function StatDelta({ value }: { value: string }) {
  const down = value.trim().startsWith("↓");
  return (
    <span className={`inline-flex items-center gap-0.5 text-overline shrink-0 ${down ? "text-danger-ink" : "text-success-ink"}`}>
      {down ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {value.replace(/^[↑↓]\s*/, "")}
    </span>
  );
}

/**
 * One segment of the compact KPI strip: a semantic icon tile + label + metric.
 * `emphasis` slightly warms the tile for the one metric that demands action
 * (Open Issues), so a standing Admin triages "what needs me" in one glance.
 */
function StatSegment({ tile, icon, label, value, valueAffix, delta, sub, grow = "flex-1" }: {
  tile: string; icon: React.ReactNode; label: string; value: React.ReactNode;
  valueAffix?: React.ReactNode; delta?: string; sub?: React.ReactNode; grow?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 min-w-0 ${grow}`}>
      <div className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 ${tile}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-overline text-ink-muted uppercase tracking-wide leading-none mb-1.5 whitespace-nowrap">{label}</div>
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-xl font-bold text-ink tabular-nums">{value}</span>
          {valueAffix}
          {delta && <StatDelta value={delta} />}
        </div>
        {sub && <div className="text-overline text-ink-muted font-medium mt-1.5 truncate leading-none">{sub}</div>}
      </div>
    </div>
  );
}

function FeedbackCard({ item, compact, isSelected, onClick }: {
  item: FeedbackItem; compact: boolean; isSelected: boolean; onClick: () => void;
}) {
  const isGoogle = item.source === "Google Review";
  const sourceColor = SOURCE_COLORS[item.source];
  const statusStyle = STATUS_PILLS[item.status];
  const overdue = isOverdue(item);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`bg-surface border rounded-card pl-3 pr-3 py-2.5 relative cursor-pointer shadow-sm transition-all flex items-center gap-3
          ${isSelected ? "border-border-strong ring-1 ring-info" : "border-divider hover:border-divider"}`}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${sourceColor}`} />
        <span className="flex-1 min-w-0 truncate text-sm font-bold text-ink">{item.title}</span>
        {item.flagged && <Flag className="w-3 h-3 text-warning-ink fill-current shrink-0" />}
        <span className={`px-2 py-0.5 border text-overline rounded-full shrink-0 ${statusStyle}`}>{item.status}</span>
        <span className="text-overline text-ink-muted font-medium shrink-0 w-16 text-right">{item.timeAgo}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-surface border rounded-card pl-4 pr-4 py-3 relative cursor-pointer shadow-sm transition-all flex items-center gap-4
        ${isSelected ? "border-border-strong ring-1 ring-info" : "border-divider hover:border-divider"}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${sourceColor}`} />
      {item.status === "New" && <div className="absolute top-1/2 -translate-y-1/2 left-3 w-2 h-2 rounded-full bg-info shadow-[0_0_0_2px_var(--surface-card)]" />}

      <div className="w-28 shrink-0 pl-3 flex items-center gap-1.5">
        {isGoogle && <GoogleG className="w-3.5 h-3.5 shrink-0" />}
        {/* The Google "G" glyph already says the source; "Review" is
            redundant and is what pushed this past the column's 112px width. */}
        <span className="text-overline text-ink-soft truncate">{isGoogle ? "Google" : item.source}</span>
      </div>

      {!isGoogle && (
        <span className={`px-2 py-0.5 border text-overline rounded-control shrink-0 ${TYPE_COLORS[item.type]}`}>{item.type}</span>
      )}

      <h3 className="flex-1 min-w-0 text-sm font-bold text-ink truncate">{item.title}</h3>

      {item.rating && (
        <div className="flex text-warning-ink shrink-0">
          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= item.rating! ? "fill-current" : "text-ink-muted"}`} />)}
        </div>
      )}

      {item.urgency === "High" && (
        <span title="High urgency" className="flex items-center text-danger-ink shrink-0"><AlertCircle className="w-3.5 h-3.5" /></span>
      )}
      {overdue && <span title="Overdue (48h+)" className="text-overline text-danger-ink uppercase shrink-0">Overdue</span>}
      {item.flagged && <Flag className="w-3.5 h-3.5 text-warning-ink fill-current shrink-0" />}

      <div className="w-52 shrink-0 text-overline text-ink-muted truncate font-medium">
        {item.source === "Patient" ? (
          <>Patient: {item.patientName}{item.clinician && ` · ${item.clinician}`}</>
        ) : isGoogle ? (
          <>External reviewer</>
        ) : (
          <>By: {submitterDisplayName(item)} · {item.authorRole}</>
        )}
      </div>

      <span className={`px-2.5 py-0.5 border text-overline rounded-full shrink-0 ${statusStyle}`}>{item.status}</span>
      <span className="text-overline text-ink-muted font-medium shrink-0 w-20 text-right">{item.timeAgo}</span>
    </div>
  );
}

function ChangeHistoryTimeline({ entries }: { entries: ChangeHistoryEntry[] }) {
  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-3">
          <div className="flex flex-col items-center pt-0.5">
            {entry.kind === "flagged" ? (
              <Flag className="w-3 h-3 text-danger-ink fill-current shrink-0" />
            ) : (
              <div className={`w-2 h-2 rounded-full shrink-0 ${HISTORY_DOT_COLORS[entry.kind]}`} />
            )}
            {idx < entries.length - 1 && <div className="w-px flex-1 bg-surface-sunken mt-1" />}
          </div>
          <div className="pb-3 min-w-0">
            <div className="text-xs font-bold text-ink-soft">{entry.label}</div>
            <div className="text-overline text-ink-muted font-medium">
              {entry.time}{entry.by && ` · by ${entry.by}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackDrawer({ item, onClose, newNote, setNewNote, onAddNote, onUpdateStatus, onToggleFlag, onMarkAddressed }: {
  item: FeedbackItem; onClose: () => void; newNote: string; setNewNote: (v: string) => void;
  onAddNote: () => void; onUpdateStatus: (id: string, s: Status) => void; onToggleFlag: (id: string) => void;
  onMarkAddressed: (id: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(true);
  const isGoogle = item.source === "Google Review";

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-surface border-l border-divider shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-50">
      <div className="px-5 py-4 border-b border-divider flex items-start justify-between shrink-0 bg-surface-page">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            {isGoogle && <GoogleG className="w-3.5 h-3.5" />} {item.source}
          </span>
          {!isGoogle && <span className={`px-2 py-0.5 border text-overline rounded-control ${TYPE_COLORS[item.type]}`}>{item.type}</span>}
          {item.urgency && (
            <span className={`px-2 py-0.5 border text-overline rounded-control ${URGENCY_COLORS[item.urgency]}`}>{item.urgency} Urgency</span>
          )}
        </div>
        <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6 gap-3">
            <h2 className="text-xl font-bold text-ink flex-1 min-w-0">{item.title}</h2>
            <span className="text-xs font-medium text-ink-muted shrink-0 mt-1">{item.timeAgo}</span>
          </div>

          {!isGoogle ? (
            <div className="mb-6">
              <select
                value={item.status}
                onChange={(e) => onUpdateStatus(item.id, e.target.value as Status)}
                className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-card outline-none cursor-pointer
                  ${item.status === "New" ? "bg-info-ink text-white border-info-ink" :
                    item.status === "In Review" ? "bg-warning/15 text-warning-ink border-warning/30" :
                    item.status === "Resolved" ? "bg-success/15 text-success-ink border-success/30" :
                    "bg-surface-hover text-ink-soft border-divider"}`}
              >
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          ) : (
            <div className="mb-6">
              <span className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-card ${STATUS_PILLS[item.status]}`}>{item.status}</span>
            </div>
          )}

          {/* Submitter Card */}
          <div className="bg-surface-page border border-divider rounded-card p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {item.isAnonymous ? (
                  <div className="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-sm font-bold text-ink-muted mr-3 shrink-0">?</div>
                ) : (
                  <div className={`w-10 h-10 rounded-full border border-divider flex items-center justify-center text-sm font-bold mr-3 shrink-0 ${isGoogle ? "bg-surface-hover text-ink-muted" : "bg-surface text-ink-soft"}`}>
                    {item.authorName.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
                <div>
                  <div className="font-bold text-ink text-sm flex items-center">
                    {submitterDisplayName(item)}
                    {item.source !== "Patient" && !isGoogle && (
                      <span className={`ml-2 px-1.5 py-0.5 text-overline rounded-control
                        ${item.source === "Clinician" ? "bg-info/10 text-info-ink border border-info/30" :
                          item.source === "Nurse" ? "bg-success/10 text-success-ink border border-success/30" :
                          "bg-special/10 text-special-ink border border-special/30"}`}>
                        {item.authorRole}
                      </span>
                    )}
                  </div>
                  {item.source === "Patient" && <div className="text-xs text-ink-muted mt-0.5">Patient Account</div>}
                  {item.isAnonymous && <div className="text-xs text-ink-muted mt-0.5">Submitted anonymously</div>}
                  {isGoogle && <div className="text-xs text-ink-muted mt-0.5">Google Review</div>}
                </div>
              </div>
              {!item.isAnonymous && !isGoogle && (
                <button className="text-xs font-bold text-ink-soft hover:underline shrink-0">
                  {item.source === "Patient" ? "View Patient Record" : "View Staff Profile"}
                </button>
              )}
            </div>
            {item.source === "Patient" && (
              <div className="pt-3 border-t border-divider text-xs text-ink-soft space-y-1.5 font-medium">
                <div>Visit: <span className="font-bold text-ink">{item.visitDate}</span></div>
                {item.clinician && <div>Clinician: <span className="text-ink">{item.clinician}</span></div>}
                {item.nurse && <div>Nurse: <span className="text-ink">{item.nurse}</span></div>}
              </div>
            )}
            {isGoogle && (
              <div className="pt-3 border-t border-divider text-xs text-ink-muted font-medium">
                External reviewer · not linked to a patient record
              </div>
            )}
          </div>

          {item.rating && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="text-sm font-bold text-ink-soft mr-3">{isGoogle ? "Google Rating" : "Overall Rating"}</div>
                <div className="flex text-warning-ink">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= item.rating! ? "fill-current" : "text-ink-muted"}`} />)}
                </div>
                <span className="text-sm font-bold text-ink ml-2">{item.rating}/5</span>
              </div>
              {!isGoogle && (
                <div className="bg-surface-page p-3 rounded-control border border-divider space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-soft font-medium">Facility Cleanliness</span>
                    <div className="flex text-warning-ink">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}</div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-soft font-medium">Wait Time</span>
                    <div className="flex text-warning-ink">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= 3 ? "fill-current" : "text-ink-muted"}`} />)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap mb-2">{item.body}</div>
          {isGoogle && <div className="text-xs text-ink-muted mb-8">{item.timeAgo} on Google</div>}
        </div>

        {/* Internal Notes */}
        <div className="bg-surface-page border-t border-b border-divider p-6">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Internal Notes</h3>
          {item.internalNotes && item.internalNotes.length > 0 ? (
            <div className="space-y-4 mb-4">
              {item.internalNotes.map((note, idx) => (
                <div key={idx} className="bg-surface border border-divider rounded-control p-3 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-ink text-xs">{note.author}</span>
                    <span className="text-overline font-medium text-ink-muted">{note.time}</span>
                  </div>
                  <p className="text-ink-soft leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-ink-muted italic mb-4">No internal notes yet.</div>
          )}
          <div className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note... (not visible to submitter)"
              className="w-full px-3 py-2 pb-4 border border-divider rounded-card text-sm outline-none focus:border-border-strong bg-surface resize-none"
              rows={2}
            />
            <button
              onClick={onAddNote}
              disabled={!newNote.trim()}
              className="absolute right-2 bottom-2 px-3 py-1 bg-surface-sunken text-ink-soft text-xs font-bold rounded-control hover:bg-surface-sunken disabled:opacity-50 transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Change History */}
        <div className="p-6">
          <button onClick={() => setHistoryOpen((o) => !o)} className="w-full flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">Change History</h3>
            {historyOpen ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
          </button>
          {historyOpen && <ChangeHistoryTimeline entries={item.changeHistory} />}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-4 bg-surface border-t border-divider flex items-center justify-between shrink-0 gap-2">
        <button
          onClick={() => onToggleFlag(item.id)}
          className={`flex items-center px-4 py-2 text-sm font-bold rounded-card transition-colors border shrink-0
            ${item.flagged ? "bg-warning/10 text-warning-ink border-warning/30" : "bg-surface text-ink-soft border-divider hover:bg-surface-hover"}`}
        >
          <Flag className={`w-4 h-4 mr-2 ${item.flagged ? "fill-current" : ""}`} />
          {item.flagged ? "Flagged" : "Flag"}
        </button>

        {isGoogle ? (
          <div className="flex gap-2">
            {item.status !== "Addressed" && (
              <button onClick={() => onMarkAddressed(item.id)} className="px-4 py-2 bg-success-ink text-white rounded-control text-sm font-bold hover:opacity-90 transition-colors shadow-sm">
                Mark Addressed
              </button>
            )}
            <a href={item.reviewUrl} target="_blank" rel="noreferrer" className="flex items-center px-4 py-2 border border-divider bg-surface text-ink-soft rounded-control text-sm font-bold hover:bg-surface-hover transition-colors">
              Reply on Google <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button onClick={() => onUpdateStatus(item.id, "Archived")} className="px-4 py-2 bg-surface border border-divider text-ink-soft rounded-control text-sm font-bold hover:bg-surface-hover transition-colors">
              Archive
            </button>
            {["New", "In Review"].includes(item.status) && (
              <button onClick={() => onUpdateStatus(item.id, "Resolved")} className="px-6 py-2 bg-success-ink text-white rounded-control text-sm font-bold hover:opacity-90 transition-colors shadow-sm">
                Mark as Resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FeedbackAdminPage() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const feedbacks = useFeedbackList();

  const [activeTab, setActiveTab] = useState<TabKey>("New");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState("");

  const selectedItem = feedbacks.find((f) => f.id === feedbackId);

  const openFeedback = (id: string) => navigate(`/feedback/${id}`);
  const closeDrawer = () => navigate("/feedback");

  useEffect(() => {
    if (!selectedItem) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return feedbacks
      .filter((f) => matchesTab(f, activeTab))
      .filter((f) => sourceFilter === "All Sources" || f.source === sourceFilter)
      .filter((f) => typeFilter === "All Types" || f.type === typeFilter)
      .filter((f) => statusFilter === "All Status" || f.status === statusFilter)
      .filter((f) => {
        if (!q) return true;
        return f.title.toLowerCase().includes(q)
          || (f.patientName?.toLowerCase().includes(q) ?? false)
          || (!f.isAnonymous && f.authorName.toLowerCase().includes(q));
      });
  }, [feedbacks, activeTab, sourceFilter, typeFilter, statusFilter, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabKey, number>;
    TAB_KEYS.forEach((t) => { counts[t] = feedbacks.filter((f) => matchesTab(f, t)).length; });
    return counts;
  }, [feedbacks]);

  const newOverdue = useMemo(() => feedbacks.some((f) => f.status === "New" && isOverdue(f)), [feedbacks]);

  const googleItems = useMemo(() => feedbacks.filter((f) => f.source === "Google Review"), [feedbacks]);
  const googleAvg = googleItems.length ? googleItems.reduce((s, f) => s + (f.rating || 0), 0) / googleItems.length : 0;

  const handleUpdateStatus = (id: string, newStatus: Status) => changeStatus(id, newStatus, CURRENT_ADMIN_NAME);
  const handleToggleFlag = (id: string) => toggleFlag(id, CURRENT_ADMIN_NAME);
  const handleMarkAddressed = (id: string) => changeStatus(id, "Addressed", CURRENT_ADMIN_NAME);
  const handleAddNote = () => {
    if (!newNote.trim() || !selectedItem) return;
    addInternalNote(selectedItem.id, newNote.trim(), CURRENT_ADMIN_NAME);
    setNewNote("");
  };

  const handleSyncNow = () => toast.success("Google Reviews synced (demo)");

  const handleExport = () => {
    const csvValue = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const headers = ["Source", "Type", "Title", "Status", "Urgency", "Anonymous", "Submitter", "Rating", "Time", "Flagged", "Last Status Change"];
    const rows = filtered.map((f) => {
      const last = f.changeHistory[f.changeHistory.length - 1];
      return [
        f.source, f.type, f.title, f.status, f.urgency || "", f.isAnonymous ? "Y" : "N",
        submitterDisplayName(f), f.rating ? String(f.rating) : "", f.timeAgo, f.flagged ? "Y" : "N",
        last ? `${last.label} (${last.time})` : "",
      ].map(csvValue).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} records`);
  };

  return (
    <div className="flex flex-col h-full bg-surface-page overflow-hidden">

      {/* Header & Toolbar */}
      <div className="shrink-0 bg-surface border-b border-divider">
        <div className="flex justify-between items-center px-6 py-4 border-b border-divider">
          <div>
            <h1 className="text-2xl font-bold text-ink">Feedback</h1>
            <p className="text-sm text-ink-muted mt-1">Patient and staff feedback records</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleExport} className="flex items-center px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft hover:bg-surface-hover transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2 text-ink-muted" /> Export
            </button>
            <button className="p-2 border border-divider rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink-soft transition-colors shadow-sm">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Google sync status strip */}
        <div className="px-6 py-2 flex items-center justify-between bg-info/5 border-b border-divider">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
            <GoogleG className="w-3.5 h-3.5" /> Google Reviews · Last synced 2 hours ago
          </div>
          <button onClick={handleSyncNow} className="flex items-center gap-1 text-xs text-ink-soft font-bold hover:underline">
            <RefreshCw className="w-3 h-3" /> Sync now
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-1 border-b border-divider">
          {TAB_KEYS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-bold border-b-2 transition-colors
                  ${isActive ? "border-border-strong text-ink" : "border-transparent text-ink-muted hover:text-ink-soft"}`}
              >
                {tab}
                <span className={`ml-1.5 text-xs font-bold ${isActive ? "text-ink-muted" : "text-ink-muted"}`}>({tabCounts[tab]})</span>
                {tab === "New" && newOverdue && <span className="absolute top-2.5 right-1 w-1.5 h-1.5 rounded-full bg-danger" />}
              </button>
            );
          })}
        </div>

        {/* Secondary filters */}
        <div className="px-6 py-3 flex items-center space-x-4 bg-surface-page">
          <FilterSelect value={sourceFilter} onChange={setSourceFilter} options={SOURCE_OPTIONS} className="min-w-[140px]" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} className="min-w-[140px]" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="min-w-[120px]" />
          <div className="px-3 py-1.5 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface shadow-sm cursor-pointer hover:border-border-strong">
            This Month
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, staff name, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 border border-divider rounded-control text-sm outline-none focus:border-border-strong bg-surface shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-1 cursor-pointer hover:bg-surface-hover px-2 py-1 rounded-control">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 text-ink-muted" />)}
          </div>
        </div>
      </div>

      {/* KPI strip — one compact divided surface instead of five tall cards,
          reclaiming vertical space for the list. Each metric carries a semantic
          icon tile; only the actionable one (Open Issues / overdue) shows alarm
          color, so triage happens in a single glance. */}
      <div className="px-6 py-3 shrink-0">
        <div className="flex items-stretch flex-wrap bg-surface rounded-card divide-x divide-divider overflow-hidden">
          <StatSegment
            tile="bg-surface-hover"
            icon={<MessageSquare className="w-[18px] h-[18px] text-ink-muted" />}
            label="Total Feedback"
            value="47"
            grow="flex-[1.1]"
            delta="↑ 12"
            sub="vs last month"
          />
          <StatSegment
            tile="bg-warning/10"
            icon={<Star className="w-[18px] h-[18px] text-warning-ink fill-current" />}
            label="Avg. Rating"
            value="4.3"
            grow="flex-[0.9]"
            valueAffix={<span className="text-overline text-ink-muted">/5</span>}
            delta="↑ 0.2"
          />
          <StatSegment
            tile="bg-warning/10"
            icon={<AlertCircle className="w-[18px] h-[18px] text-warning-ink" />}
            label="Open Issues"
            value="5"
            grow="flex-[1.5]"
            sub={
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-control bg-danger/10 text-danger-ink font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />1 overdue
                </span>
                <span className="text-ink-muted">·</span> 3 new · 2 review
              </span>
            }
          />
          <StatSegment
            tile="bg-special/10"
            icon={<Users className="w-[18px] h-[18px] text-special-ink" />}
            label="Staff Feedback"
            value="9"
            grow="flex-[1.65]"
            sub="4 suggestions · 3 issues · 2 incidents"
          />
          <StatSegment
            tile="bg-info/10"
            icon={<GoogleG className="w-[18px] h-[18px]" />}
            label="Google Rating"
            value={googleAvg.toFixed(1)}
            valueAffix={<Star className="w-4 h-4 text-warning-ink fill-current self-center" />}
            sub={`${googleItems.length} Google reviews`}
          />
        </div>
      </div>

      {/* Main Layout: full-width list + slide-in drawer */}
      <div className="flex-1 relative overflow-hidden border-t border-divider">
        <div
          className={`h-full flex flex-col transition-[margin-right] duration-300 ease-out ${selectedItem ? "mr-[420px]" : "mr-0"}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeDrawer(); }}
        >
          <div className="flex-1 overflow-y-auto p-4 bg-surface-page" onClick={(e) => { if (e.target === e.currentTarget) closeDrawer(); }}>
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-muted py-6">
                <MessageSquare className="w-12 h-12 mb-4 text-ink-muted" />
                <div className="text-lg font-bold text-ink-soft mb-1">No feedback in this view</div>
                <div className="text-sm">Try a different tab or filter</div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((f) => (
                  <FeedbackCard
                    key={f.id}
                    item={f}
                    compact={!!selectedItem}
                    isSelected={f.id === feedbackId}
                    onClick={() => openFeedback(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="h-10 bg-surface border-t border-divider flex items-center justify-center text-xs font-bold text-ink-muted shrink-0">
            Showing {filtered.length} of {feedbacks.length} records
          </div>
        </div>

        {selectedItem && (
          <FeedbackDrawer
            key={selectedItem.id}
            item={selectedItem}
            onClose={closeDrawer}
            newNote={newNote}
            setNewNote={setNewNote}
            onAddNote={handleAddNote}
            onUpdateStatus={handleUpdateStatus}
            onToggleFlag={handleToggleFlag}
            onMarkAddressed={handleMarkAddressed}
          />
        )}
      </div>
    </div>
  );
}
