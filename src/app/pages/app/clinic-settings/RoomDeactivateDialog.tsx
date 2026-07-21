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

  return (
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6" onClick={onClose}>
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 motion-reduce:animate-none" onClick={(e) => e.stopPropagation()}>
        {blocked ? (
          <>
            <div className="px-6 py-4 border-b border-divider flex items-start gap-3 bg-danger/10">
              <AlertTriangle className="w-5 h-5 text-danger-ink shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-danger-ink">Can't deactivate {room.name} yet</h2>
                <p className="text-xs text-danger-ink/80 mt-0.5">
                  {bookings.length} upcoming booking{bookings.length > 1 ? "s" : ""} still use{bookings.length > 1 ? "" : "s"} this room.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="border border-divider rounded-card divide-y divide-divider max-h-64 overflow-y-auto">
                {bookings.map((a) => (
                  <div key={a.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink truncate">{a.patient.name}</div>
                      <div className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" /> {a.timeLabel} · {a.type}
                      </div>
                    </div>
                    <button
                      onClick={() => openBooking(a.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control border border-divider text-xs font-bold text-ink-soft bg-surface hover:bg-surface-page transition-colors"
                    >
                      Reschedule <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Reschedule or cancel each booking into another room, then deactivate.
              </p>
            </div>
            <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end">
              <button onClick={onClose} className="px-5 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Got it</button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <h2 className="text-base font-bold text-ink mb-1.5">Deactivate {room.name}?</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                It will disappear from the calendar columns and booking pickers. Existing history keeps showing it. You can reactivate it any time.
                {assignedCount > 0 && (
                  <> {assignedCount} assigned device{assignedCount > 1 ? "s" : ""} will move to Unassigned.</>
                )}
              </p>
            </div>
            <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover">Cancel</button>
              <button onClick={confirm} className="px-5 py-2 rounded-control text-sm font-bold text-white bg-ink hover:bg-surface-sunken">Deactivate</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
