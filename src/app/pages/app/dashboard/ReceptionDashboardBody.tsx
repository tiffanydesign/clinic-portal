import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { APPTS, ApptStatus } from "./dashboardData";
import { ReceptionLiveCounters } from "./ReceptionLiveCounters";
import { ReceptionFrontDeskQueue } from "./ReceptionFrontDeskQueue";
import { ActivityFeed } from "./ActivityFeed";
import { CounterFilter, matchesFilter } from "./receptionDashboardData";

// Owns the state the Front Desk Queue and the counters above it share: local
// status overrides for Mark Arrived / Check In (seeded from the shared mock
// data, never mutating it — same pattern as the Clinician and Nurse
// dashboards), and which counter filter is currently applied. Check-out is
// deliberately not something Reception triggers here — it's the nurse's own
// action; Reception only ever reads the resulting status.
export function ReceptionDashboardBody() {
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState<Record<string, ApptStatus>>({});
  const [activeFilter, setActiveFilter] = useState<CounterFilter | null>(null);

  const todaysAppts = useMemo(
    () => APPTS.map((a) => (overrides[a.id] ? { ...a, status: overrides[a.id] } : a)),
    [overrides]
  );
  const visibleAppts = activeFilter ? todaysAppts.filter((a) => matchesFilter(a, activeFilter)) : todaysAppts;

  const openRecord = (id: string) => navigate(`/dashboard/appointment/${id}`);
  const markArrived = (id: string) => setOverrides((prev) => ({ ...prev, [id]: "Arrived" }));
  const checkIn = (id: string) => setOverrides((prev) => ({ ...prev, [id]: "Checked In" }));
  const toggleFilter = (f: CounterFilter) => setActiveFilter((prev) => (prev === f ? null : f));

  return (
    <div className="px-6 py-4 space-y-4">
      <ReceptionLiveCounters appts={todaysAppts} activeFilter={activeFilter} onToggleFilter={toggleFilter} />
      <ReceptionFrontDeskQueue
        appts={visibleAppts}
        activeFilter={activeFilter}
        onClearFilter={() => setActiveFilter(null)}
        onOpen={openRecord}
        onMarkArrived={markArrived}
        onCheckIn={checkIn}
      />
      <ActivityFeed defaultCollapsed />
    </div>
  );
}
