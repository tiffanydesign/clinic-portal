import React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Section, LiveDot } from "./DashboardShared";

// ============================ ADMIN ============================

export function AdminPanels() {
  const nav = useNavigate();

  // Sorted most-overdue-first — Admin scanning this section only cares
  // which one has been sitting the longest, not the ones still on track.
  const results = [
    { patient: "Cem Polat", test: "Comprehensive Blood", days: 2, doctor: "Dr. Ebru Reis" },
    { patient: "Gül Korkmaz", test: "Genetic Panel", days: 5, doctor: "Dr. Kaan Öztürk" },
    { patient: "Hakan Bulut", test: "Hormone Screen", days: 1, doctor: "Dr. Emre Yalçın" },
    { patient: "Yasemin Kaplan", test: "Lipid Panel", days: 3, doctor: "Dr. Ebru Reis" },
    { patient: "Burak Kocaman", test: "Metabolic Panel", days: 2, doctor: "Dr. Kaan Öztürk" },
  ].sort((a, b) => b.days - a.days);

  // Wait reasons reflect the nurse's own patient-journey stations (mirrors
  // the Nurse Dashboard's station vocabulary) rather than Reception-gate
  // concerns like payment/consent, since this tracks in-clinic nurse wait
  // time, not the check-in gate. Sorted longest-wait-first so Admin can spot
  // "is anything backed up" without reading every row.
  const waiting = [
    { patient: "Aslı Kutlu", checkIn: "08:40", wait: 34, step: "Waiting for Body Scan", nurse: "Berna Koç" },
    { patient: "Tarkan Solmaz", checkIn: "08:52", wait: 22, step: "Waiting for Machine 1", nurse: "Aylin Demir" },
    { patient: "Cem Polat", checkIn: "08:56", wait: 18, step: "Waiting for Sample Collection", nurse: "Aylin Demir" },
    { patient: "Serkan Çetin", checkIn: "09:08", wait: 6, step: "Waiting for Consultation", nurse: "Aylin Demir" },
  ].sort((a, b) => b.wait - a.wait);

  const waitColor = (m: number) => (m > 30 ? "text-danger-ink" : m > 15 ? "text-warning-ink" : "text-ink");

  // Renders as a fragment (no own row wrapper) so DashboardPage can place
  // Results Queue + Waiting Room in the SAME flex row as Recent Activity —
  // the three monitoring cards share one height-matched row.
  return (
    <>
      <Section title="Results Queue" className="flex-1 min-w-0" action={<button onClick={() => nav("/patients")} className="text-xs font-bold text-ink-soft hover:underline">View all patients →</button>}>
        <div className="divide-y divide-divider">
          {results.map((r) => (
            <button key={r.patient} onClick={() => nav("/patients/P-001/results")} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-page text-left gap-2">
              <span className="min-w-0">
                <span className="text-sm font-medium text-ink truncate block">{r.patient}</span>
                <span className="text-xs text-ink-muted truncate block">{r.test} · {r.doctor.replace("Dr. ", "")}</span>
              </span>
              {r.days > 3 ? (
                <span className="text-label font-bold text-danger-ink flex items-center gap-1 shrink-0"><AlertTriangle className="w-3 h-3" /> {r.days}d overdue</span>
              ) : (
                <span className="text-xs text-ink-muted shrink-0">{r.days}d</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title={<>Waiting Room <LiveDot /></>} className="flex-1 min-w-0">
        <div className="divide-y divide-divider">
          {waiting.map((w) => (
            <div key={w.patient} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-page">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">{w.patient}</div>
                <div className="text-xs text-ink-muted truncate">In {w.checkIn} · {w.step} · {w.nurse}</div>
              </div>
              <div className={`text-sm font-bold shrink-0 ${waitColor(w.wait)}`}>{w.wait}m</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// Nurse, Clinician, and Reception each have their own dedicated dashboard
// layout now — see NurseDashboardPage.tsx, ClinicianDashboardBody.tsx, and
// ReceptionDashboardBody.tsx — rather than a panel in this shared layout.
