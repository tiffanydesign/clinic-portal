import React from "react";
import { useNavigate } from "react-router";
import { Section } from "./DashboardShared";

// A quiet "live" marker for a card title: a small pulsing green dot + a muted,
// normal-weight "Live" label — reads as ambient status, not a shouting badge
// like the old all-caps green LiveDot.
function SubtleLive() {
  return (
    <span className="inline-flex items-center gap-1 ml-2 text-label font-medium text-ink-muted" title="Updating live">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden />
      Live
    </span>
  );
}

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

  // Single threshold — a wait only earns a colour once it crosses the line
  // that genuinely needs attention. Everything under it stays neutral grey, so
  // the list reads calm instead of a three-colour (red/amber/black) traffic
  // light where the grading was never actually defined.
  const WAIT_ALERT_MIN = 30;

  // Renders as a fragment (no own row wrapper) so DashboardPage can place
  // Results Queue + Waiting Room in the SAME flex row as Recent Activity —
  // the three monitoring cards share one height-matched row.
  return (
    <>
      <Section title="Results Queue" className="flex-1 min-w-0" action={<button onClick={() => nav("/patients")} className="text-xs font-bold text-ink-soft hover:underline">View all patients →</button>}>
        <div className="divide-y divide-divider">
          {results.map((r) => {
            const overdue = r.days > 3;
            return (
              // Patient name is the single prominent element; the queue age
              // drops to a restrained tag on the secondary line rather than a
              // large red status competing with the name.
              <button key={r.patient} onClick={() => nav("/patients/P-001/results")} className="w-full flex flex-col items-start gap-1 px-4 py-3 hover:bg-surface-hover text-left">
                <span className="text-sm font-semibold text-ink truncate w-full">{r.patient}</span>
                <span className="flex items-center gap-2 min-w-0 w-full">
                  <span className="text-xs text-ink-muted truncate min-w-0">{r.test} · {r.doctor.replace("Dr. ", "")}</span>
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-control text-overline bg-danger/10 text-danger-ink shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" aria-hidden />
                      {r.days}d overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-control text-overline bg-surface-hover text-ink-muted shrink-0">
                      {r.days}d
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={<>Waiting Room <SubtleLive /></>} className="flex-1 min-w-0">
        <div className="divide-y divide-divider">
          {waiting.map((w) => {
            const alert = w.wait >= WAIT_ALERT_MIN;
            const step = w.step.replace("Waiting for ", "");
            return (
              // Name leads in the same plain ink as every other list in this
              // dashboard (Results Queue included); the wait time moves down
              // to the secondary line and is coloured only when it crosses
              // the alert threshold — otherwise it stays neutral.
              <button key={w.patient} onClick={() => nav("/patients")} className="w-full flex flex-col items-start gap-1 px-4 py-3 hover:bg-surface-hover text-left">
                <span className="text-sm font-semibold text-ink truncate w-full">{w.patient}</span>
                <span className="text-xs text-ink-muted truncate w-full">
                  <span className={`font-semibold tabular-nums ${alert ? "text-danger-ink" : "text-ink-soft"}`}>{w.wait}m</span>
                  {" waiting · "}{step}{" · in at "}{w.checkIn}{" · "}{w.nurse}
                </span>
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}

// Nurse, Clinician, and Reception each have their own dedicated dashboard
// layout now — see NurseDashboardPage.tsx, ClinicianDashboardBody.tsx, and
// ReceptionDashboardBody.tsx — rather than a panel in this shared layout.
