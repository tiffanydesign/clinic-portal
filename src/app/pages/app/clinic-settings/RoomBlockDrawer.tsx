// Add / edit a Room Block. Pure form: collects and validates input, then
// hands a draft to onApply — it never saves or manages conflict state
// itself. The parent owns the whole lifecycle (conflict-check, ConflictModal,
// commit), same division of responsibility as availability/BlockedTimeModal.tsx.
import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FilterSelect } from "../../../components/FilterSelect";
import { Room } from "./roomsData";
import {
  RoomBlock, RoomBlockReason, ROOM_BLOCK_REASONS,
  BLOCK_TIME_OPTIONS, clockToMin, minToClock, upcomingDays,
} from "./roomBlocksData";
import { SettingsDrawer, Field, inputCls } from "./settingsUiShared";

export type RoomBlockDraft = {
  roomId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startMin?: number;
  endMin?: number;
  reason: RoomBlockReason;
  note?: string;
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="touch-extend flex items-center gap-2.5"
    >
      <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-ink" : "bg-surface-sunken"}`}>
        <span className={`w-3.5 h-3.5 bg-surface rounded-full absolute top-[3px] transition-all ${checked ? "left-[22px]" : "left-[3px]"}`} />
      </span>
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
    </button>
  );
}

export function RoomBlockDrawer({ room, initialDate, editing, onClose, onApply }: {
  room: Room;
  initialDate?: string; // ISO, used only for a new block
  editing?: RoomBlock;
  onClose: () => void;
  onApply: (draft: RoomBlockDraft) => void;
}) {
  const isEdit = !!editing;
  const days = upcomingDays();
  const defaultDate = editing?.startDate ?? initialDate ?? days[0].value;

  const [startDate, setStartDate] = useState(defaultDate);
  const [multiDay, setMultiDay] = useState(isEdit ? editing!.startDate !== editing!.endDate : false);
  const [endDate, setEndDate] = useState(editing?.endDate ?? defaultDate);
  const [allDay, setAllDay] = useState(editing?.allDay ?? true);
  const [startTime, setStartTime] = useState(editing?.startMin != null ? minToClock(editing.startMin) : "09:00");
  const [endTime, setEndTime] = useState(editing?.endMin != null ? minToClock(editing.endMin) : "10:00");
  const [reasonSel, setReasonSel] = useState<RoomBlockReason>(editing?.reason ?? "Maintenance");
  const [note, setNote] = useState(editing?.note ?? "");

  const effectiveEndDate = multiDay ? endDate : startDate;
  const dateRangeValid = effectiveEndDate >= startDate;
  const startMin = clockToMin(startTime);
  const endMin = clockToMin(endTime);
  const timeValid = allDay || endMin > startMin;
  const otherNeedsNote = reasonSel === "Other" && note.trim() === "";
  const canApply = dateRangeValid && timeValid && !otherNeedsNote;

  const apply = () => {
    if (!canApply) return;
    onApply({
      roomId: room.id,
      startDate,
      endDate: effectiveEndDate,
      allDay,
      startMin: allDay ? undefined : startMin,
      endMin: allDay ? undefined : endMin,
      reason: reasonSel,
      note: reasonSel === "Other" ? note.trim() : undefined,
    });
  };

  return (
    <SettingsDrawer
      title={isEdit ? "Edit room block" : "Block room"}
      subtitle={room.name}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
          <button
            onClick={apply}
            disabled={!canApply}
            className={`px-5 py-2 rounded-control text-sm font-bold text-white transition-colors ${canApply ? "btn-primary" : "bg-surface-sunken cursor-not-allowed"}`}
          >
            {isEdit ? "Save changes" : "Block room"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Date" required>
          <FilterSelect value={startDate} onChange={setStartDate} options={days} className="w-full" />
        </Field>

        <Toggle checked={multiDay} onChange={() => setMultiDay((v) => !v)} label="Block multiple consecutive days" />

        {multiDay && (
          <Field label="Through" required error={!dateRangeValid ? "End date must be on or after the start date." : undefined}>
            <FilterSelect value={endDate} onChange={setEndDate} options={days} className="w-full" />
          </Field>
        )}

        <Toggle checked={allDay} onChange={() => setAllDay((v) => !v)} label="All day" />

        {!allDay && (
          <Field label="Time" required error={!timeValid ? "End time must be after start time." : undefined}>
            <div className="flex items-center gap-2">
              <FilterSelect value={startTime} onChange={setStartTime} options={BLOCK_TIME_OPTIONS} className="flex-1 justify-center" />
              <span className="text-ink-muted">–</span>
              <FilterSelect value={endTime} onChange={setEndTime} options={BLOCK_TIME_OPTIONS} className="flex-1 justify-center" />
            </div>
          </Field>
        )}

        <Field label="Reason" required>
          <FilterSelect value={reasonSel} onChange={(v) => setReasonSel(v as RoomBlockReason)} options={ROOM_BLOCK_REASONS} className="w-full" />
        </Field>

        <Field label="Note" required={reasonSel === "Other"} hint={reasonSel !== "Other" ? "Optional." : undefined}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={reasonSel === "Other" ? "Required — describe why this room is blocked." : "Optional…"}
            className={inputCls}
          />
        </Field>

        {otherNeedsNote && (
          <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-control px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-warning-ink shrink-0 mt-0.5" />
            <span className="text-label text-warning-ink">A note is required for "Other".</span>
          </div>
        )}
      </div>
    </SettingsDrawer>
  );
}
