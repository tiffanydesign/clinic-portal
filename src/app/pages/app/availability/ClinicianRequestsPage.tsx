import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useAvailabilityStore, availabilityActions, getPendingRequests } from "./availabilityStore";
import { PendingRequestsSection } from "./PendingRequestsSection";
import { WithdrawModal } from "./WithdrawModal";

type WithdrawTarget = { kind: "schedule" } | { kind: "override"; id: string } | { kind: "leave"; id: string };

// A Clinician doesn't approve anything themselves (Admin does) — what they
// need at /approval is visibility into their own submitted requests: what's
// still pending, and what's already been decided and why. Reuses the exact
// same store and section component the My Availability page's Request
// Centre uses, so this can never show a different answer than that page.
export function ClinicianRequestsPage() {
  const navigate = useNavigate();
  const store = useAvailabilityStore();
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);

  const pending = useMemo(() => getPendingRequests(store), [store]);

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    if (withdrawTarget.kind === "schedule") availabilityActions.withdrawScheduleChange();
    if (withdrawTarget.kind === "override") availabilityActions.withdrawOverride(withdrawTarget.id);
    if (withdrawTarget.kind === "leave") availabilityActions.withdrawLeave(withdrawTarget.id);
    setWithdrawTarget(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Availability changes you've submitted, and their approval status.</p>
        </div>
        <button
          onClick={() => navigate("/calendar/my-availability")}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:underline shrink-0"
        >
          Go to My Availability <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        <PendingRequestsSection
          pending={pending}
          decisions={store.decisions}
          onWithdraw={(req) => {
            if (req.kind === "Schedule Change") setWithdrawTarget({ kind: "schedule" });
            else if (req.kind === "Date Override") setWithdrawTarget({ kind: "override", id: req.relatedId! });
            else setWithdrawTarget({ kind: "leave", id: req.relatedId! });
          }}
        />
      </div>

      {withdrawTarget && <WithdrawModal onCancel={() => setWithdrawTarget(null)} onConfirm={confirmWithdraw} />}
    </div>
  );
}
