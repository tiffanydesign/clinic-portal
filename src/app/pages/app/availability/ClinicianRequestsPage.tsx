import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useAvailabilityStore, availabilityActions, getPendingRequests } from "./availabilityStore";
import { PendingRequestsSection } from "./PendingRequestsSection";
import { WithdrawModal } from "./WithdrawModal";

type WithdrawTarget = { id: string };

// A Clinician doesn't approve anything themselves (Admin does) — what they
// need at /approval is visibility into their own submitted requests: what's
// still pending, and what's already been decided and why. Reuses the exact
// same store and section component the My Availability page's Request
// Centre uses, so this can never show a different answer than that page.
// Weekly Hours and Date Override apply instantly now, so the only thing
// that can ever be pending here is Leave.
export function ClinicianRequestsPage() {
  const navigate = useNavigate();
  const store = useAvailabilityStore();
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);

  const pending = useMemo(() => getPendingRequests(store), [store]);

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    availabilityActions.withdrawLeave(withdrawTarget.id);
    setWithdrawTarget(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-page">
      <div className="px-6 py-6 border-b border-divider bg-surface flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Requests</h1>
          <p className="text-sm text-ink-muted mt-1">Availability changes you've submitted, and their approval status.</p>
        </div>
        <button
          onClick={() => navigate("/calendar/my-availability")}
          className="flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:underline shrink-0"
        >
          Go to My Availability <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <PendingRequestsSection
          pending={pending}
          decisions={store.decisions}
          onWithdraw={(req) => setWithdrawTarget({ id: req.relatedId! })}
        />
      </div>

      {withdrawTarget && <WithdrawModal onCancel={() => setWithdrawTarget(null)} onConfirm={confirmWithdraw} />}
    </div>
  );
}
