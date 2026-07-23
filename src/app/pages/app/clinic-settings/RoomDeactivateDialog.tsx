// The deactivation guard. A room with open (still-going-to-happen) bookings
// can't be deactivated — the dialog lists each one with a path to reschedule.
// A room with none deactivates after a plain confirm, orphaning its devices to
// Unassigned.
import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Room, roomOpenBookings } from "./roomsData";
import { setRoomStatus } from "./roomsStore";
import { unassignDevicesInRoom, getDevicesSnapshot } from "./devicesStore";
import { getTerminalsSnapshot, updateTerminal } from "../paymentTerminalsStore";
import { APPTS } from "../dashboard/dashboardData";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";

export function RoomDeactivateDialog({ room, onClose, onDone }: { room: Room; onClose: () => void; onDone: () => void }) {
  const navigate = useNavigate();
  const bookings = roomOpenBookings(room.id, APPTS);
  const blocked = bookings.length > 0;
  const assignedCount =
    getDevicesSnapshot().filter((d) => d.roomId === room.id && !d.retired).length +
    getTerminalsSnapshot().filter((t) => t.roomId === room.id).length;

  const confirm = () => {
    const freed = unassignDevicesInRoom(room.id);
    getTerminalsSnapshot().filter((t) => t.roomId === room.id).forEach((t) => updateTerminal(t.id, { roomId: null }));
    setRoomStatus(room.id, "inactive");
    const extra = freed.length > 0 ? ` ${freed.length} device${freed.length > 1 ? "s" : ""} moved to Unassigned.` : "";
    toast.success(`${room.name} deactivated.${extra}`);
    onDone();
  };

  const openBooking = (id: string) => { onClose(); navigate(`/calendar/schedule/appointment/${id}`); };

  if (blocked) {
    return (
      <Modal open onClose={onClose} title={`Can't deactivate ${room.name} yet`} size="confirm"
        footer={<Button variant="primary" onClick={onClose}>Got it</Button>}
      >
        <div className="flex items-start gap-3 mb-3 p-3 rounded-control bg-danger/10">
          <AlertTriangle className="w-5 h-5 text-danger-ink shrink-0 mt-0.5" />
          <p className="text-label text-danger-ink/80">
            {bookings.length} upcoming booking{bookings.length > 1 ? "s" : ""} still use{bookings.length > 1 ? "" : "s"} this room.
          </p>
        </div>
        <div className="border border-divider rounded-card divide-y divide-divider max-h-64 overflow-y-auto">
          {bookings.map((a) => (
            <div key={a.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-data font-bold text-ink truncate">{a.patient.name}</div>
                <div className="text-label text-ink-muted flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 shrink-0" /> {a.timeLabel} · {a.type}
                </div>
              </div>
              <button
                onClick={() => openBooking(a.id)}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control border border-divider text-label font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors"
              >
                Reschedule <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-label text-ink-muted leading-relaxed mt-3">
          Reschedule or cancel each booking into another room, then deactivate.
        </p>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`Deactivate ${room.name}?`} size="confirm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={confirm}>Deactivate</Button>
      </>}
    >
      <p className="text-body text-ink-muted leading-relaxed">
        It will disappear from the calendar columns and booking pickers. Existing history keeps showing it. You can reactivate it any time.
        {assignedCount > 0 && (
          <> {assignedCount} assigned device{assignedCount > 1 ? "s" : ""} will move to Unassigned.</>
        )}
      </p>
    </Modal>
  );
}
