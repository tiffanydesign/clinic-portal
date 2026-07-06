import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Trash2, Plus, Edit2, ChevronLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  DAYS, WeekSchedule, Slot, OverrideItem, LeaveItem, PendingRequest,
  buildDefaultSchedule, cloneSchedule, checkWeeklyConflicts, checkOverrideConflicts,
  checkLeaveConflicts, isDuplicateOverrideDate, isDateBlockedForLeave, summarizeScheduleChange,
} from "./availabilityData";
import { PendingRequestCard } from "./PendingRequestCard";
import { DateOverridesSection } from "./DateOverridesSection";
import { LeaveRequestsSection } from "./LeaveRequestsSection";
import { OverrideModal } from "./OverrideModal";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { ConflictModal } from "./ConflictModal";
import { WithdrawModal } from "./WithdrawModal";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-slate-600" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

const DEFAULT_START = "9:00am";
const DEFAULT_END = "5:00pm";
const LOCK_TITLE = "Locked while a request is pending approval.";

export function AvailabilityEditorPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("Clinic Availability");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // effective (approved) state vs. the in-progress draft form
  const [savedSchedule, setSavedSchedule] = useState<WeekSchedule>(() => buildDefaultSchedule(DEFAULT_START, DEFAULT_END));
  const [draftSchedule, setDraftSchedule] = useState<WeekSchedule>(() => cloneSchedule(savedSchedule));
  const [savedTimezone, setSavedTimezone] = useState("Europe/Istanbul");
  const [timezone, setTimezone] = useState(savedTimezone);

  const [overrides, setOverrides] = useState<OverrideItem[]>([
    { id: "OV-1", date: "15 Jul 2026", slots: [{ start: "10:00am", end: "2:00pm" }], status: "Approved" },
  ]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [pending, setPending] = useState<PendingRequest | null>(null);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [pendingConflictAction, setPendingConflictAction] = useState<(() => void) | null>(null);

  const reqCounter = useRef(1);
  const nextReqId = () => `REQ-${reqCounter.current++}`;

  const locked = pending !== null;
  const isDirty = useMemo(
    () => JSON.stringify(draftSchedule) !== JSON.stringify(savedSchedule) || timezone !== savedTimezone,
    [draftSchedule, savedSchedule, timezone, savedTimezone]
  );
  const canSave = isDirty && !locked;

  // --- weekly editor handlers (no-ops while locked; buttons are disabled too, this is belt-and-braces) ---
  const toggleDay = (day: string) => {
    if (locked) return;
    setDraftSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
  };
  const addSlot = (day: string) => {
    if (locked) return;
    setDraftSchedule((prev) => ({ ...prev, [day]: { ...prev[day], slots: [...prev[day].slots, { start: "9:00am", end: "5:00pm" }] } }));
  };
  const removeSlot = (day: string, idx: number) => {
    if (locked) return;
    setDraftSchedule((prev) => {
      const slots = prev[day].slots.filter((_, i) => i !== idx);
      if (slots.length === 0) return { ...prev, [day]: { active: false, slots: [{ start: "9:00am", end: "5:00pm" }] } };
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };
  const updateSlotTime = (day: string, idx: number, field: "start" | "end", value: string) => {
    if (locked) return;
    setDraftSchedule((prev) => {
      const slots = prev[day].slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const handleBack = () => {
    if (isDirty && !locked) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) navigate("/calendar/my-availability");
    } else {
      navigate("/calendar/my-availability");
    }
  };

  // --- Save: weekly schedule / timezone change ---
  const submitAvailabilityChange = (hasConflict: boolean) => {
    setPending({
      id: nextReqId(),
      type: "Availability Change",
      submittedAt: "Just now",
      summary: summarizeScheduleChange(savedSchedule, draftSchedule, savedTimezone, timezone),
      hasConflict,
    });
    setPendingConflictAction(null);
    toast.success("Availability change submitted for approval.");
  };

  const handleSaveClick = () => {
    if (!canSave) return;
    const conflicts = checkWeeklyConflicts(draftSchedule);
    if (conflicts.length > 0) {
      setPendingConflictAction(() => () => submitAvailabilityChange(true));
    } else {
      submitAvailabilityChange(false);
    }
  };

  // --- Override submission ---
  const handleApplyOverride = (date: string, slots: Slot[], reason: string | undefined, unavailable: boolean): string | null => {
    if (isDuplicateOverrideDate(overrides, date)) return "An override already exists for this date.";
    if (isDateBlockedForLeave(overrides, leaves, date)) return "This date overlaps with an existing leave request.";

    const conflicts = checkOverrideConflicts(date, slots, unavailable);
    const override: OverrideItem = { id: `OV-${overrides.length + 1}-${date}`, date, slots, reason, status: "Pending", hasConflict: conflicts.length > 0 };
    const commit = () => {
      setOverrides((prev) => [...prev, override]);
      setPending({
        id: nextReqId(),
        type: "Override",
        submittedAt: "Just now",
        summary: unavailable ? `${date} · Unavailable${reason ? ` (${reason})` : ""}` : `${date} · ${slots.map((s) => `${s.start}–${s.end}`).join(", ")}`,
        hasConflict: conflicts.length > 0,
        relatedId: override.id,
      });
      toast.success("Override submitted for approval.");
    };

    if (conflicts.length > 0) setPendingConflictAction(() => commit);
    else commit();
    return null;
  };

  // --- Leave submission ---
  const handleSubmitLeave = (date: string, fullDay: boolean, start: string | undefined, end: string | undefined, reason: string | undefined): string | null => {
    if (isDateBlockedForLeave(overrides, leaves, date)) return "This date overlaps with an existing leave request or override.";

    const conflicts = checkLeaveConflicts(date, fullDay, start, end);
    const leave: LeaveItem = { id: `LV-${leaves.length + 1}-${date}`, date, fullDay, startTime: start, endTime: end, reason, status: "Pending", hasConflict: conflicts.length > 0 };
    const commit = () => {
      setLeaves((prev) => [...prev, leave]);
      setPending({
        id: nextReqId(),
        type: "Leave",
        submittedAt: "Just now",
        summary: fullDay ? `${date} · Full day` : `${date} · ${start}–${end}`,
        hasConflict: conflicts.length > 0,
        relatedId: leave.id,
      });
      toast.success("Leave request submitted for approval.");
    };

    if (conflicts.length > 0) setPendingConflictAction(() => commit);
    else commit();
    return null;
  };

  // --- Withdraw ---
  const confirmWithdraw = () => {
    if (!pending) return;
    if (pending.type === "Override" && pending.relatedId) {
      setOverrides((prev) => prev.map((o) => (o.id === pending.relatedId ? { ...o, status: "Withdrawn" } : o)));
    }
    if (pending.type === "Leave" && pending.relatedId) {
      setLeaves((prev) => prev.map((l) => (l.id === pending.relatedId ? { ...l, status: "Withdrawn" } : l)));
    }
    setPending(null);
    setShowWithdrawModal(false);
    toast.success("Request withdrawn.");
  };

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
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  className="text-xl font-bold text-gray-800 border-b border-slate-500 outline-none bg-transparent"
                />
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-800 mr-2">{title}</h1>
                  <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Mon – Fri, {DEFAULT_START} – {DEFAULT_END}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div title="Default schedules cannot be deleted" className="cursor-not-allowed">
            <button disabled className="p-2 text-gray-300 border border-transparent rounded">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <div title={locked ? "Withdraw your pending request before saving new changes." : !isDirty ? "No changes to save." : undefined}>
            <button
              onClick={handleSaveClick}
              disabled={!canSave}
              className={`px-6 py-2 font-bold text-sm rounded transition-colors ${canSave ? "bg-slate-600 text-white hover:bg-slate-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Locked banner */}
      {locked && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              You already have a pending availability request. Withdraw the existing request before submitting another.
            </p>
          </div>
          <button onClick={() => setShowWithdrawModal(true)} className="px-4 py-1.5 bg-white border border-amber-300 text-amber-800 text-sm font-bold rounded hover:bg-amber-100 transition-colors shrink-0">
            Withdraw Request
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side (65%) — weekly editor */}
        <div title={locked ? LOCK_TITLE : undefined} className={`w-[65%] h-full overflow-y-auto p-8 border-r border-gray-300 bg-white ${locked ? "opacity-70" : ""}`}>
          <div className="max-w-2xl mx-auto space-y-6">
            {DAYS.map((day) => {
              const config = draftSchedule[day];
              return (
                <div key={day} className="flex items-start py-4 border-b border-gray-100 last:border-0">
                  <div className="w-32 flex items-center shrink-0 pt-2">
                    <Toggle checked={config.active} onChange={() => toggleDay(day)} disabled={locked} />
                    <span className={`ml-3 text-sm font-bold ${config.active ? "text-gray-800" : "text-gray-400"}`}>{day}</span>
                  </div>

                  <div className="flex-1 flex flex-col space-y-3">
                    {config.active ? (
                      config.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center group">
                          <div className="flex items-center space-x-2">
                            <input type="text" value={slot.start} readOnly={locked} onChange={(e) => updateSlotTime(day, idx, "start", e.target.value)} className={`w-24 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500 ${locked ? "cursor-not-allowed bg-gray-50" : "cursor-text"}`} />
                            <span className="text-gray-400">-</span>
                            <input type="text" value={slot.end} readOnly={locked} onChange={(e) => updateSlotTime(day, idx, "end", e.target.value)} className={`w-24 text-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white outline-none focus:border-slate-500 ${locked ? "cursor-not-allowed bg-gray-50" : "cursor-text"}`} />
                          </div>

                          {!locked && (
                            <div className="flex items-center ml-4 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {idx === 0 && <button onClick={() => addSlot(day)} className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100"><Plus className="w-4 h-4" /></button>}
                              {config.slots.length > 1 && <button onClick={() => removeSlot(day, idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                              {idx === 0 && <button title="Copy to all" className="p-1.5 text-gray-400 hover:text-slate-600 rounded hover:bg-gray-100 ml-2"><Copy className="w-4 h-4" /></button>}
                            </div>
                          )}
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

        {/* Right Side (35%) — Pending / Overrides / Leave */}
        <div className="w-[35%] h-full overflow-y-auto bg-gray-50 p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={locked}
              title={locked ? LOCK_TITLE : undefined}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-slate-500 ${locked ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
            >
              <option value="Europe/Istanbul">Europe/Istanbul</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>

          {pending && <PendingRequestCard request={pending} onWithdraw={() => setShowWithdrawModal(true)} />}

          <DateOverridesSection overrides={overrides} locked={locked} onAdd={() => setShowOverrideModal(true)} />
          <LeaveRequestsSection leaves={leaves} locked={locked} onNew={() => setShowLeaveModal(true)} />
        </div>
      </div>

      {showOverrideModal && (
        <OverrideModal
          onClose={() => setShowOverrideModal(false)}
          onApply={handleApplyOverride}
          existingDates={overrides.filter((o) => o.status !== "Withdrawn" && o.status !== "Rejected").map((o) => parseInt(o.date))}
        />
      )}

      {showLeaveModal && <LeaveRequestModal onClose={() => setShowLeaveModal(false)} onSubmit={handleSubmitLeave} />}

      {pendingConflictAction && (
        <ConflictModal
          onCancel={() => setPendingConflictAction(null)}
          onSubmit={() => { pendingConflictAction(); setPendingConflictAction(null); }}
        />
      )}

      {showWithdrawModal && <WithdrawModal onCancel={() => setShowWithdrawModal(false)} onConfirm={confirmWithdraw} />}
    </div>
  );
}
