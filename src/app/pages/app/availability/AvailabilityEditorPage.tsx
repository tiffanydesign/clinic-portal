import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Trash2, Plus, Edit2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  DAYS, WeekSchedule, Slot, OverrideItem, LeaveDuration, LeaveReason,
  cloneSchedule, scheduleEquals, classifyWeekChange, classifyDateChange,
  checkLeaveConflicts, ChangeDirection, BookedAppt,
} from "./availabilityData";
import { useAvailabilityStore, availabilityActions, dayOfWeekForDate, getPendingRequests } from "./availabilityStore";
import { PendingRequestsSection } from "./PendingRequestsSection";
import { DateOverridesSection } from "./DateOverridesSection";
import { LeaveRequestsSection } from "./LeaveRequestsSection";
import { OverrideModal } from "./OverrideModal";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { ConflictModal } from "./ConflictModal";
import { WithdrawModal } from "./WithdrawModal";
import { FilterSelect } from "../../../components/FilterSelect";

const TIME_OPTIONS = ["6:00am", "6:30am", "7:00am", "7:30am", "8:00am", "8:30am", "9:00am", "9:30am", "10:00am", "10:30am", "11:00am", "11:30am", "12:00pm", "12:30pm", "1:00pm", "1:30pm", "2:00pm", "2:30pm", "3:00pm", "3:30pm", "4:00pm", "4:30pm", "5:00pm", "5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm", "8:00pm", "8:30pm", "9:00pm"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-slate-600" : "bg-gray-300"}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

type ConflictContext =
  | { kind: "schedule"; conflicts: BookedAppt[] }
  | { kind: "override-create"; conflicts: BookedAppt[]; date: string; slots: Slot[] }
  | { kind: "override-edit"; conflicts: BookedAppt[]; id: string; slots: Slot[] }
  | { kind: "override-delete"; conflicts: BookedAppt[]; id: string }
  | { kind: "leave"; conflicts: BookedAppt[]; dateFrom: string; dateTo: string; duration: LeaveDuration; reason: LeaveReason; reasonOther?: string };

type WithdrawContext = { kind: "leave"; id: string };

export function AvailabilityEditorPage() {
  const navigate = useNavigate();
  const store = useAvailabilityStore();

  const [title, setTitle] = useState("Clinic Availability");
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
  const [overrideModalState, setOverrideModalState] = useState<{ editing?: OverrideItem } | null>(null);
  const [leaveModalState, setLeaveModalState] = useState<{ initialDate?: string } | null>(null);

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

  // --- Override create/edit — same instant-apply rule as Weekly Hours ---
  const handleOverrideApply = (date: string, slots: Slot[]) => {
    const editing = overrideModalState?.editing;
    if (editing) {
      const preview = classifyDateChange(editing.slots, true, slots, true, editing.date);
      if (preview.direction === "Reducing" && preview.conflicts.length > 0) {
        setConflictModal({ kind: "override-edit", conflicts: preview.conflicts, id: editing.id, slots });
        return;
      }
      const res = availabilityActions.submitOverrideEdit(editing.id, slots);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Availability updated.");
      setOverrideModalState(null);
      return;
    }

    const day = dayOfWeekForDate(date);
    const template = store.savedSchedule[day];
    const preview = classifyDateChange(template.slots, template.active, slots, true, date);
    if (preview.direction === "Reducing" && preview.conflicts.length > 0) {
      setConflictModal({ kind: "override-create", conflicts: preview.conflicts, date, slots });
      return;
    }
    const res = availabilityActions.submitOverride(date, slots);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Availability updated.");
    setOverrideModalState(null);
  };

  const handleOverrideDelete = (o: OverrideItem) => {
    const template = store.savedSchedule[o.dayOfWeek];
    const preview = classifyDateChange(o.slots, true, template.slots, template.active, o.date);
    if (preview.direction === "Reducing" && preview.conflicts.length > 0) {
      setConflictModal({ kind: "override-delete", conflicts: preview.conflicts, id: o.id });
      return;
    }
    availabilityActions.deleteOverride(o.id);
    toast.success("Override removed.");
  };

  const handleRequestLeaveInstead = (date: string) => {
    setOverrideModalState(null);
    setLeaveModalState({ initialDate: date });
  };

  const handleSubmitLeave = (dateFrom: string, dateTo: string, duration: LeaveDuration, reason: LeaveReason, reasonOther: string | undefined) => {
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
      case "override-create": {
        const res = availabilityActions.submitOverride(conflictModal.date, conflictModal.slots);
        if (res.ok) { toast.success("Availability updated."); setOverrideModalState(null); }
        break;
      }
      case "override-edit": {
        const res = availabilityActions.submitOverrideEdit(conflictModal.id, conflictModal.slots);
        if (res.ok) { toast.success("Availability updated."); setOverrideModalState(null); }
        break;
      }
      case "override-delete":
        availabilityActions.deleteOverride(conflictModal.id);
        toast.success("Override removed.");
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
  const overridesForDialog = store.overrides.filter((o) => o.status !== "Rejected").map((o) => parseInt(o.date.split(" ")[0], 10));

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <button onClick={handleBack} className="p-2 mr-2 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              {isEditingTitle ? (
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)} className="text-xl font-bold text-gray-800 border-b border-slate-500 outline-none bg-transparent" />
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-800 mr-2">{title}</h1>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded-full mr-2">Applies instantly</span>
                  <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Only leave requires Admin approval. Everything else applies instantly.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div title="Default schedules cannot be deleted" className="cursor-not-allowed">
            <button disabled className="p-2 text-gray-300 border border-transparent rounded"><Trash2 className="w-5 h-5" /></button>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={!evalResult.isDirty}
            className={`px-6 py-2 font-bold text-sm rounded transition-colors ${
              !evalResult.isDirty ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-slate-600 text-white hover:bg-slate-700"
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {evalResult.isDirty && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-3 shrink-0">
          <p className="text-xs text-amber-800 font-medium">Unsaved changes</p>
          <button onClick={handleDiscard} className="text-xs font-bold text-amber-800 hover:underline">Discard</button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side (65%) — weekly editor */}
        <div className="w-[65%] h-full overflow-y-auto p-8 border-r border-gray-300 bg-white">
          <div className="max-w-2xl mx-auto space-y-6">
            {DAYS.map((day) => {
              const config = localSchedule[day];
              return (
                <div key={day} className="flex items-start py-4 border-b border-gray-100 last:border-0">
                  <div className="w-40 flex items-center shrink-0 pt-2">
                    <Toggle checked={config.active} onChange={() => toggleDay(day)} />
                    <span className={`ml-3 text-sm font-bold whitespace-nowrap ${config.active ? "text-gray-800" : "text-gray-400"}`}>{day}</span>
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
                            <span className="text-gray-400">-</span>
                            <FilterSelect
                              value={slot.end}
                              onChange={(v) => updateSlotTime(day, idx, "end", v)}
                              options={TIME_OPTIONS}
                              className="w-28 justify-center"
                            />
                          </div>

                          <div className="flex items-center ml-4 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx === 0 && <button onClick={() => addSlot(day)} className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100"><Plus className="w-4 h-4" /></button>}
                            {config.slots.length > 1 && <button onClick={() => removeSlot(day, idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                            {idx === 0 && <button title="Copy to all" className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100 ml-2"><Copy className="w-4 h-4" /></button>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="pt-2 text-sm text-gray-400 font-medium">Unavailable</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (35%) */}
        <div className="w-[35%] h-full overflow-y-auto bg-gray-50 p-8 space-y-6">
          <PendingRequestsSection
            pending={pending}
            decisions={store.decisions}
            onWithdraw={(req) => setWithdrawModal({ kind: "leave", id: req.relatedId! })}
          />

          <DateOverridesSection
            overrides={store.overrides}
            onAdd={() => setOverrideModalState({})}
            onEdit={(o) => setOverrideModalState({ editing: o })}
            onDelete={handleOverrideDelete}
          />

          <LeaveRequestsSection leaves={store.leaves} onNew={() => setLeaveModalState({})} />
        </div>
      </div>

      {overrideModalState && (
        <OverrideModal
          onClose={() => setOverrideModalState(null)}
          onApply={handleOverrideApply}
          onRequestLeaveInstead={handleRequestLeaveInstead}
          existingDates={overridesForDialog}
          editing={overrideModalState.editing}
        />
      )}

      {leaveModalState && (
        <LeaveRequestModal onClose={() => setLeaveModalState(null)} onSubmit={handleSubmitLeave} initialDate={leaveModalState.initialDate} />
      )}

      {conflictModal && (
        <ConflictModal
          bookings={conflictModal.conflicts}
          context={conflictModal.kind === "leave" ? "leave" : conflictModal.kind === "schedule" ? "schedule" : "override"}
          onCancel={() => setConflictModal(null)}
          onConfirm={confirmConflict}
        />
      )}

      {withdrawModal && <WithdrawModal onCancel={() => setWithdrawModal(null)} onConfirm={confirmWithdraw} />}
    </div>
  );
}
