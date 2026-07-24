import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Trash2, Plus, Edit2, ChevronLeft, AlertTriangle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  DAYS, WeekSchedule, LeaveDuration, LeaveReason,
  cloneSchedule, scheduleEquals, classifyWeekChange,
  checkLeaveConflicts, ChangeDirection, BookedAppt, blockedTimeConflicts, bookingLabel,
} from "./availabilityData";
import { useAvailabilityStore, availabilityActions, getPendingRequests } from "./availabilityStore";
import { RequestCentreModal } from "./RequestCentreModal";
import { BlockedTimeSection } from "./BlockedTimeSection";
import { LeaveEntrySection } from "./LeaveEntrySection";
import { AvailabilityPreview } from "./AvailabilityPreview";
import { BlockedTimeModal } from "./BlockedTimeModal";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { ConflictModal } from "./ConflictModal";
import { WithdrawModal } from "./WithdrawModal";
import { FilterSelect } from "../../../components/FilterSelect";

const TIME_OPTIONS = ["6:00am", "6:30am", "7:00am", "7:30am", "8:00am", "8:30am", "9:00am", "9:30am", "10:00am", "10:30am", "11:00am", "11:30am", "12:00pm", "12:30pm", "1:00pm", "1:30pm", "2:00pm", "2:30pm", "3:00pm", "3:30pm", "4:00pm", "4:30pm", "5:00pm", "5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm", "8:00pm", "8:30pm", "9:00pm"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-surface-sunken" : "bg-surface-sunken"}`}
    >
      <div className={`w-3.5 h-3.5 bg-surface rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

type ConflictContext =
  | { kind: "schedule"; conflicts: BookedAppt[] }
  | { kind: "blocked-time"; conflicts: BookedAppt[]; date: string; startMin: number; durationMin: number; reason: string }
  | { kind: "leave"; conflicts: BookedAppt[]; dateFrom: string; dateTo: string; duration: LeaveDuration; reason: LeaveReason; reasonOther?: string };

type WithdrawContext = { kind: "leave"; id: string };

export function AvailabilityEditorPage() {
  const navigate = useNavigate();
  const store = useAvailabilityStore();

  const [title, setTitle] = useState("My Availability");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // The draft is local until Save commits it to the store — Weekly Hours
  // changes never sit behind a pending request anymore, they apply the
  // moment any conflicts are resolved (see ConflictModal below).
  const [localSchedule, setLocalSchedule] = useState<WeekSchedule>(() => cloneSchedule(store.savedSchedule));
  const [localTimezone, setLocalTimezone] = useState(store.savedTimezone);

  // --- debounced (500ms) direction/conflict evaluation driving the Save button ---
  const [evalResult, setEvalResult] = useState<{ isDirty: boolean; direction: ChangeDirection; conflicts: BookedAppt[] }>({ isDirty: false, direction: "Same", conflicts: [] });
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const evaluate = () => {
      const schedChanged = !scheduleEquals(store.savedSchedule, localSchedule);
      const tzChanged = localTimezone !== store.savedTimezone;
      if (!schedChanged && !tzChanged) { setEvalResult({ isDirty: false, direction: "Same", conflicts: [] }); return; }
      if (!schedChanged && tzChanged) { setEvalResult({ isDirty: true, direction: "Expanding", conflicts: [] }); return; }
      const { direction, conflicts } = classifyWeekChange(store.savedSchedule, localSchedule);
      setEvalResult({ isDirty: true, direction, conflicts });
    };
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(evaluate, 500);
    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSchedule, localTimezone]);

  const hasBlockingConflicts = evalResult.isDirty && evalResult.direction === "Reducing" && evalResult.conflicts.length > 0;

  const [conflictModal, setConflictModal] = useState<ConflictContext | null>(null);
  const [withdrawModal, setWithdrawModal] = useState<WithdrawContext | null>(null);
  const [blockedTimeModalOpen, setBlockedTimeModalOpen] = useState(false);
  const [leaveModalState, setLeaveModalState] = useState<{ initialDate?: string } | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // --- weekly editor handlers ---
  const toggleDay = (day: string) => {
    setLocalSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
  };
  const addSlot = (day: string) => {
    setLocalSchedule((prev) => ({ ...prev, [day]: { ...prev[day], slots: [...prev[day].slots, { start: "9:00am", end: "5:00pm" }] } }));
  };
  const removeSlot = (day: string, idx: number) => {
    setLocalSchedule((prev) => {
      const slots = prev[day].slots.filter((_, i) => i !== idx);
      if (slots.length === 0) return { ...prev, [day]: { active: false, slots: [{ start: "9:00am", end: "5:00pm" }] } };
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };
  const updateSlotTime = (day: string, idx: number, field: "start" | "end", value: string) => {
    setLocalSchedule((prev) => ({ ...prev, [day]: { ...prev[day], slots: prev[day].slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) } }));
  };

  const handleDiscard = () => {
    setLocalSchedule(cloneSchedule(store.savedSchedule));
    setLocalTimezone(store.savedTimezone);
  };

  const handleBack = () => {
    if (evalResult.isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) navigate("/calendar/my-availability");
    } else {
      navigate("/calendar/my-availability");
    }
  };

  // --- Save ---
  // Weekly Hours never needs Admin approval: an Expanding change (or a
  // Reducing one with no conflicts) saves immediately; a Reducing change
  // with conflicts opens the blocking ConflictModal, which itself commits
  // the save once every conflict is resolved.
  const handleSaveClick = () => {
    if (!evalResult.isDirty) return;
    if (hasBlockingConflicts) {
      setConflictModal({ kind: "schedule", conflicts: evalResult.conflicts });
    } else {
      availabilityActions.directSaveSchedule(localSchedule, localTimezone);
      // The debounced effect above only re-evaluates when localSchedule /
      // localTimezone change, not when store.savedSchedule does — without
      // this, "Unsaved changes" and an enabled Save button would linger
      // after a save that just succeeded.
      setEvalResult({ isDirty: false, direction: "Same", conflicts: [] });
      toast.success("Availability updated.");
    }
  };

  // --- Blocked Time — same instant-apply rule as Weekly Hours. A window that
  // overlaps a booked appointment opens the blocking ConflictModal, which
  // commits the block once every booking is resolved. Removing a block only
  // frees time, so it never conflicts. ---
  const handleBlockedTimeApply = (date: string, startMin: number, durationMin: number, reason: string) => {
    const conflicts = blockedTimeConflicts(date, startMin, durationMin);
    if (conflicts.length > 0) {
      setConflictModal({ kind: "blocked-time", conflicts, date, startMin, durationMin, reason });
      return;
    }
    availabilityActions.addBlockedTime(date, startMin, durationMin, reason);
    toast.success("Blocked time added.");
    setBlockedTimeModalOpen(false);
  };

  const handleRemoveBlockedTime = (id: string) => {
    availabilityActions.removeBlockedTime(id);
    toast.success("Blocked time removed.");
  };

  const handleRequestLeaveInstead = (date: string) => {
    setBlockedTimeModalOpen(false);
    setLeaveModalState({ initialDate: date });
  };

  const handleSubmitLeave = (dateFrom: string, dateTo: string, duration: LeaveDuration, reason: LeaveReason, reasonOther: string | undefined) => {
    // Checked first, before conflict-awareness, so a blocked submission never
    // detours through the ConflictModal only to fail at the very end.
    if (availabilityActions.hasPendingRequest()) {
      toast.error("You already have a request pending approval. Withdraw it or wait for a decision before submitting a new one.");
      return;
    }
    if (availabilityActions.hasLeaveOverlap(dateFrom, dateTo)) {
      toast.error("You already have a leave request for this date.");
      return;
    }
    // Leave always ends up Pending regardless of conflicts; when conflicts
    // exist we still surface them for awareness before committing, per spec.
    // Leave is the one request kind that still genuinely requires Admin's
    // judgment call, so conflicts here are informational, not blocking.
    const conflicts = checkLeaveConflicts(dateFrom, dateTo, duration);
    if (conflicts.length > 0) {
      setConflictModal({ kind: "leave", conflicts, dateFrom, dateTo, duration, reason, reasonOther });
      return;
    }
    const res = availabilityActions.submitLeave(dateFrom, dateTo, duration, reason, reasonOther);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Leave request submitted for approval.");
    setLeaveModalState(null);
  };

  const confirmConflict = () => {
    if (!conflictModal) return;
    switch (conflictModal.kind) {
      case "schedule":
        availabilityActions.directSaveSchedule(localSchedule, localTimezone);
        setEvalResult({ isDirty: false, direction: "Same", conflicts: [] });
        toast.success("Availability updated.");
        break;
      case "blocked-time":
        availabilityActions.addBlockedTime(conflictModal.date, conflictModal.startMin, conflictModal.durationMin, conflictModal.reason);
        toast.success("Blocked time added.");
        setBlockedTimeModalOpen(false);
        break;
      case "leave": {
        const res = availabilityActions.submitLeave(conflictModal.dateFrom, conflictModal.dateTo, conflictModal.duration, conflictModal.reason, conflictModal.reasonOther);
        if (res.ok) { toast.success("Leave request submitted for approval."); setLeaveModalState(null); }
        else toast.error(res.error);
        break;
      }
    }
    setConflictModal(null);
  };

  const confirmWithdraw = () => {
    if (!withdrawModal) return;
    availabilityActions.withdrawLeave(withdrawModal.id);
    toast.success("Request withdrawn.");
    setWithdrawModal(null);
  };

  const pending = useMemo(() => getPendingRequests(store), [store]);

  return (
    <div className="flex flex-col h-full bg-surface-page relative">
      {/* Top Bar */}
      <div className="bg-surface border-b border-divider px-4 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <button onClick={handleBack} className="p-2 mr-2 text-ink-muted hover:text-ink rounded-control hover:bg-surface-hover transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              {isEditingTitle ? (
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)} className="text-xl font-bold text-ink border-b border-border-strong outline-none bg-transparent" />
              ) : (
                <>
                  <h1 className="text-xl font-bold text-ink mr-2">{title}</h1>
                  <span className="px-2 py-0.5 bg-success/10 border border-success/30 text-success-ink text-overline rounded-full mr-2">Applies instantly</span>
                  <Edit2 className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </div>
            <p className="text-sm text-ink-muted mt-1">Only leave requires Admin approval. Everything else applies instantly.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Surfaced BEFORE the user clicks Save, not only after — so the
              affected count is visible up front rather than a surprise
              buried behind the modal. */}
          {hasBlockingConflicts && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-danger-ink">
              <AlertTriangle className="w-3.5 h-3.5" />
              {evalResult.conflicts.length} booking{evalResult.conflicts.length === 1 ? "" : "s"} affected
            </span>
          )}
          {/* Only place request status lives — one current request (Leave is
              the only kind that can ever be Pending) + its decision history,
              behind a popup rather than a permanent right-column card. */}
          <button
            onClick={() => setRequestModalOpen(true)}
            className="relative inline-flex items-center gap-2 h-9 px-3.5 rounded-control text-sm font-medium text-ink-soft border border-divider bg-surface hover:bg-surface-hover transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-ink-muted" /> Requests
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-warning-ink text-white text-overline font-bold tabular-nums">
                {pending.length}
              </span>
            )}
          </button>
          <div title="Default schedules cannot be deleted" className="cursor-not-allowed">
            <button disabled className="p-2 text-ink-muted border border-transparent rounded-control"><Trash2 className="w-5 h-5" /></button>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={!evalResult.isDirty}
            title={hasBlockingConflicts ? "Resolve affected bookings to save" : undefined}
            className={`px-6 py-2 font-bold text-sm rounded-control transition-colors ${
              !evalResult.isDirty ? "bg-surface-sunken text-ink-muted cursor-not-allowed" : "bg-ink text-white hover:bg-ink"
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {evalResult.isDirty && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center gap-3 shrink-0">
          <p className="text-xs text-warning-ink font-medium">Unsaved changes</p>
          <button onClick={handleDiscard} className="text-xs font-bold text-warning-ink hover:underline">Discard</button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side (55%) — Weekly Hours is the day-by-day editor and gets
            the majority of the width to itself; the pale page shows through
            around its card the same way the right column's cards sit. */}
        <div className="w-[55%] h-full overflow-y-auto px-4 py-4 border-r border-divider bg-surface-page">
          <div className="bg-surface rounded-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-bold text-ink">Weekly Hours</h3>
            <span className="px-2 py-0.5 bg-success/10 border border-success/30 text-success-ink text-overline rounded-full">Applies instantly</span>
          </div>
          <div className="space-y-6">
            {DAYS.map((day) => {
              const config = localSchedule[day];
              return (
                <div key={day} className="flex items-start py-4 border-b border-divider last:border-0">
                  <div className="w-40 flex items-center shrink-0 pt-2">
                    <Toggle checked={config.active} onChange={() => toggleDay(day)} />
                    <span className={`ml-3 text-sm font-bold whitespace-nowrap ${config.active ? "text-ink" : "text-ink-muted"}`}>{day}</span>
                  </div>

                  <div className="flex-1 flex flex-col space-y-3">
                    {config.active ? (
                      config.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center group">
                          <div className="flex items-center space-x-2">
                            <FilterSelect
                              value={slot.start}
                              onChange={(v) => updateSlotTime(day, idx, "start", v)}
                              options={TIME_OPTIONS}
                              className="w-28 justify-center"
                            />
                            <span className="text-ink-muted">-</span>
                            <FilterSelect
                              value={slot.end}
                              onChange={(v) => updateSlotTime(day, idx, "end", v)}
                              options={TIME_OPTIONS}
                              className="w-28 justify-center"
                            />
                          </div>

                          <div className="flex items-center ml-4 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx === 0 && <button onClick={() => addSlot(day)} className="p-1.5 text-ink-muted hover:text-ink-soft rounded-control hover:bg-surface-hover"><Plus className="w-4 h-4" /></button>}
                            {config.slots.length > 1 && <button onClick={() => removeSlot(day, idx)} className="p-1.5 text-ink-muted hover:text-danger-ink rounded-control hover:bg-danger/10"><Trash2 className="w-4 h-4" /></button>}
                            {idx === 0 && <button title="Copy to all" className="p-1.5 text-ink-muted hover:text-ink-soft rounded-control hover:bg-surface-hover ml-2"><Copy className="w-4 h-4" /></button>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="pt-2 text-sm text-ink-muted font-medium">Unavailable</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Right Side (45%) — Blocked Time, the Leave entry point, and the
            read-only Preview stack here; request STATUS lives only in the
            Requests popup (top bar), never a permanent card on this side. */}
        <div className="w-[45%] h-full overflow-y-auto bg-surface-page px-4 py-4 space-y-3">
          <BlockedTimeSection
            blocks={store.blockedTime}
            onAdd={() => setBlockedTimeModalOpen(true)}
            onRemove={handleRemoveBlockedTime}
          />

          <LeaveEntrySection onNew={() => setLeaveModalState({})} hasPending={pending.length > 0} />

          <AvailabilityPreview
            savedSchedule={store.savedSchedule}
            localSchedule={localSchedule}
            blockedTime={store.blockedTime}
            leaves={store.leaves}
          />
        </div>
      </div>

      {blockedTimeModalOpen && (
        <BlockedTimeModal
          onClose={() => setBlockedTimeModalOpen(false)}
          onApply={handleBlockedTimeApply}
          onRequestLeaveInstead={handleRequestLeaveInstead}
          savedSchedule={store.savedSchedule}
        />
      )}

      {leaveModalState && (
        <LeaveRequestModal onClose={() => setLeaveModalState(null)} onSubmit={handleSubmitLeave} initialDate={leaveModalState.initialDate} />
      )}

      {conflictModal && (
        <ConflictModal
          bookings={conflictModal.conflicts.map((c) => ({ label: bookingLabel(c) }))}
          context={conflictModal.kind === "leave" ? "leave" : conflictModal.kind === "schedule" ? "schedule" : "blocked-time"}
          onCancel={() => setConflictModal(null)}
          onConfirm={confirmConflict}
        />
      )}

      {withdrawModal && <WithdrawModal onCancel={() => setWithdrawModal(null)} onConfirm={confirmWithdraw} />}

      {requestModalOpen && (
        <RequestCentreModal
          pending={pending}
          decisions={store.decisions}
          onWithdraw={(req) => { setRequestModalOpen(false); setWithdrawModal({ kind: "leave", id: req.relatedId! }); }}
          onClose={() => setRequestModalOpen(false)}
        />
      )}
    </div>
  );
}
