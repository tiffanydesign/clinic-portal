import React, { createContext, useContext, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { useAppContext, Role } from "../../../context/AppContext";
import { PatientHeader } from "./PatientHeader";
import { getPatientRecord, ROLE_TABS, TAB_LABEL, DEFAULT_TAB, TabKey, PatientRecord } from "./patientRecordData";

// App.tsx wires each tab as <PatientRecordLayout><SomeTab /></PatientRecordLayout>
// (flat routes, matching the rest of the app) rather than nested <Route>
// children, so tabs read the resolved patient + role from this context
// instead of react-router's <Outlet> context.
const PatientRecordContext = createContext<{ patient: PatientRecord; role: Role } | undefined>(undefined);

export function usePatientOutletContext() {
  const ctx = useContext(PatientRecordContext);
  if (!ctx) throw new Error("usePatientOutletContext must be used within PatientRecordLayout");
  return ctx;
}

// /patients/:patientId -> role-aware default tab
export function PatientRecordRedirect() {
  const { role } = useAppContext();
  const { patientId } = useParams();
  return <Navigate to={`/patients/${patientId}/${DEFAULT_TAB[role]}`} replace />;
}

export function PatientRecordLayout({ children }: { children?: React.ReactNode }) {
  const { role } = useAppContext();
  const { patientId } = useParams();
  const location = useLocation();
  const patient = getPatientRecord(patientId);
  const [flag, setFlag] = useState(patient.flag);

  const tabs = ROLE_TABS[role];

  return (
    <div className="flex flex-col h-full bg-surface-page">
      <PatientHeader patient={patient} role={role} backTo="/patients" flag={flag} onSetFlag={setFlag} />

      <div className="bg-surface border-b border-divider px-6 flex gap-6 shrink-0 overflow-x-auto">
        {tabs.map((tab: TabKey) => {
          const path = `/patients/${patientId}/${tab}`;
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={tab}
              to={path}
              className={`py-3 text-sm font-bold border-b-[3px] whitespace-nowrap transition-colors ${isActive ? "border-border-strong text-ink" : "border-transparent text-ink-muted hover:text-ink-soft hover:border-divider"}`}
            >
              {TAB_LABEL[tab]}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        <PatientRecordContext.Provider value={{ patient, role }}>
          {children}
        </PatientRecordContext.Provider>
      </div>
    </div>
  );
}
