import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FilterSelect } from "../../../components/FilterSelect";
import { WeekSchedule, BLOCKED_REASONS, timeToMinutes, blockCoversWholeDay } from "./availabilityData";
import { dayOfWeekForDate } from "./availabilityStore";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const TIME_OPTIONS = ["6:00am", "6:30am", "7:00am", "7:30am", "8:00am", "8:30am", "9:00am", "9:30am", "10:00am", "10:30am", "11:00am", "11:30am", "12:00pm", "12:30pm", "1:00pm", "1:30pm", "2:00pm", "2:30pm", "3:00pm", "3:30pm", "4:00pm", "4:30pm", "5:00pm", "5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm", "8:00pm", "8:30pm", "9:00pm"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The next 90 days, weekdays only, formatted "D Mon YYYY" (matches the store's
// date strings + BOOKED_APPOINTMENTS). Base = demo horizon 4 Jul 2026.
function upcomingWorkdays(): string[] {
  const base = new Date(2026, 6, 4);
  const out: string[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push(`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }
  return out;
}

// Add a one-off Blocked Time. The parent owns the whole lifecycle (conflict
// gating + commit); this modal only collects and validates input, then calls
// onApply — it never self-closes on submit.
export function BlockedTimeModal({ onClose, onApply, onRequestLeaveInstead, savedSchedule }: {
  onClose: () => void;
  onApply: (date: string, startMin: number, durationMin: number, reason: string) => void;
  onRequestLeaveInstead: (date: string) => void;
  savedSchedule: WeekSchedule;
}) {
  const workdays = useMemo(upcomingWorkdays, []);
  const [date, setDate] = useState(workdays[0]);
  const [start, setStart] = useState("12:00pm");
  const [end, setEnd] = useState("1:00pm");
  const [reasonSel, setReasonSel] = useState<string>("Training");
  const [note, setNote] = useState("");

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const durationMin = endMin - startMin;
  const validTime = durationMin > 0;
  const otherNeedsNote = reasonSel === "Other" && note.trim() === "";
  const coversWholeDay = validTime && blockCoversWholeDay(savedSchedule, dayOfWeekForDate(date), startMin, durationMin);
  const canApply = validTime && !otherNeedsNote && !coversWholeDay;

  const reasonLabel = reasonSel === "Other" ? note.trim() : reasonSel;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Blocked Time"
      size="confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => canApply && onApply(date, startMin, durationMin, reasonLabel)}
            disabled={!canApply}
            disabledReason={coversWholeDay ? "Use Leave for a whole day off" : "Complete the form to continue"}
          >
            Add Blocked Time
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-label font-bold text-ink-muted mb-1.5">Date</label>
          <FilterSelect value={date} onChange={setDate} options={workdays} className="w-full" />
          <p className="text-label text-ink-muted mt-1">Workdays only, within the next 90 days.</p>
        </div>

        <div>
          <label className="block text-label font-bold text-ink-muted mb-1.5">Time</label>
          <div className="flex items-center gap-2">
            <FilterSelect value={start} onChange={setStart} options={TIME_OPTIONS} className="flex-1 justify-center" />
            <span className="text-ink-muted">–</span>
            <FilterSelect value={end} onChange={setEnd} options={TIME_OPTIONS} className="flex-1 justify-center" />
          </div>
          {!validTime && <p className="text-label text-danger-ink mt-1">End time must be after start time.</p>}
        </div>

        <div>
          <label className="block text-label font-bold text-ink-muted mb-1.5">Reason</label>
          <FilterSelect value={reasonSel} onChange={setReasonSel} options={BLOCKED_REASONS} className="w-full" />
          {reasonSel === "Other" && (
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note (required)"
              className="mt-2"
            />
          )}
        </div>

        {coversWholeDay && (
          <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-control px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-warning-ink shrink-0 mt-0.5" />
            <div className="text-label text-warning-ink">
              This covers your whole working day. Request <button onClick={() => onRequestLeaveInstead(date)} className="font-bold underline">Leave</button> instead.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
