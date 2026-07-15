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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 motion-reduce:animate-none" onClick={(e) => e.stopPropagation()}>
        {blocked ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-3 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-red-800">Can't deactivate {room.name} yet</h2>
                <p className="text-xs text-red-700/80 mt-0.5">
                  {bookings.length} upcoming booking{bookings.length > 1 ? "s" : ""} still use{bookings.length > 1 ? "" : "s"} this room.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {bookings.map((a) => (
                  <div key={a.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{a.patient.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" /> {a.timeLabel} · {a.type}
                      </div>
                    </div>
                    <button
                      onClick={() => openBooking(a.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Reschedule <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Reschedule or cancel each booking into another room, then deactivate.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Got it</button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <h2 className="text-base font-bold text-gray-800 mb-1.5">Deactivate {room.name}?</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                It will disappear from the calendar columns and booking pickers. Existing history keeps showing it. You can reactivate it any time.
                {assignedCount > 0 && (
                  <> {assignedCount} assigned device{assignedCount > 1 ? "s" : ""} will move to Unassigned.</>
                )}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">Cancel</button>
              <button onClick={confirm} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700">Deactivate</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
