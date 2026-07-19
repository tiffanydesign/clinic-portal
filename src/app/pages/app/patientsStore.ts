// Mutable patient registry — the single source of truth for "who is a patient".
//
// Built on the same tiny external-store pattern as appointmentsStore /
// availabilityStore (subscribe + getSnapshot via useSyncExternalStore), seeded
// from patientsData's MOCK_PATIENTS. Before this existed MOCK_PATIENTS was a
// static array read directly by the Patients list, so a newly registered
// patient could never appear anywhere — which is why Register Patient had no
// working destination.
//
// dashboardData.APPTS still projects its own Appt.patient shape off
// MOCK_PATIENTS at module load (see P() there); `toApptPatient` below is the
// same projection, exposed so a patient registered at runtime can be attached
// to a booking without dashboardData needing to know this store exists.

import { useSyncExternalStore } from "react";
import { MOCK_PATIENTS, Patient, Group } from "./patientsData";
import type { Patient as ApptPatient } from "./dashboard/dashboardData";
import { logAudit, AUDIT_ACTOR } from "./clinic-settings/auditStore";

let patients: Patient[] = [...MOCK_PATIENTS];
const listeners = new Set<() => void>();

function emit() {
  patients = [...patients];
  listeners.forEach((l) => l());
}

export function usePatients(): Patient[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => patients
  );
}

/** Non-reactive read — for event handlers and pure lookups. */
export function getPatientsSnapshot(): Patient[] {
  return patients;
}

// --- duplicate detection -----------------------------------------------------
// Phone is the identity key at the front desk (a walk-in may not have email),
// so it's the blocking check; email is a secondary signal. Both normalise
// before comparing: "+90 532 111 2233" and "05321112233" are the same person.

export function normalisePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^0+/, "").replace(/^90/, "");
}

export function findByPhone(phone: string): Patient | undefined {
  const n = normalisePhone(phone);
  if (!n) return undefined;
  return patients.find((p) => normalisePhone(p.phone) === n);
}

export function findByEmail(email: string): Patient | undefined {
  const e = email.trim().toLowerCase();
  if (!e) return undefined;
  return patients.find((p) => p.email.trim().toLowerCase() === e);
}

// --- creation ----------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1992-03-12" (native date input) -> "12 Mar 1992" (this app's display format). */
export function formatDob(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Age in whole years, anchored to the same mock "today" the rest of the app uses. */
export function ageFromDob(iso: string, today = new Date(2026, 6, 3)): number {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return 0;
  let age = today.getFullYear() - y;
  const hadBirthday = today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return Math.max(0, age);
}

function initials(first: string, last: string): string {
  return `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`.toUpperCase();
}

function nextPatientId(): string {
  const nums = patients
    .map((p) => parseInt(p.patientId.split("-").pop() ?? "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PH-2026-${String(next).padStart(4, "0")}`;
}

export type NewPatientInput = {
  firstName: string;
  lastName: string;
  email: string;
  // Everything below is optional — only name + email are required to register.
  title?: string;
  dob?: string;   // ISO from <input type="date">
  sex?: Patient["sex"];
  phone?: string;
  group?: Group;
};

/**
 * Registers a patient and returns the created record.
 *
 * `status: "Pending Onboarding"` is deliberate: a just-registered patient has
 * no first visit yet, which is exactly what the Patients page's "Pending
 * Onboarding" stat already counts ("registered but no first visit").
 */
export function createPatient(input: NewPatientInput, actor: string = AUDIT_ACTOR): Patient {
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const patientId = nextPatientId();
  const created: Patient = {
    id: `p-${patientId}`,
    name,
    patientId,
    avatar: initials(input.firstName, input.lastName),
    // Optional fields fall back to display-tolerant sentinels: no DOB -> "—"
    // and age 0 (the list/table read age via `ageSexLabel`, which hides a 0).
    dob: input.dob ? formatDob(input.dob) : "—",
    age: input.dob ? ageFromDob(input.dob) : 0,
    sex: input.sex ?? "Other",
    phone: input.phone?.trim() ?? "",
    email: input.email.trim(),
    group: input.group ?? "—",
    clinician: null,
    nurse: null,
    status: "Pending Onboarding",
    lastVisit: "—",
    nextAppt: null,
    consent: "Not Sent",
    payment: "N/A",
    checkIn: "Not Arrived",
    journeyStep: null,
    flag: "No flag",
    notesCount: 0,
  };

  patients = [created, ...patients];
  emit();

  logAudit({
    actor,
    entityType: "patient",
    entityId: patientId,
    action: "Registered patient",
    detail: name,
  });

  return created;
}

/** Records that an operator knowingly created a duplicate (see the dedupe gate). */
export function logDuplicateOverride(existing: Patient, name: string, actor: string = AUDIT_ACTOR) {
  logAudit({
    actor,
    entityType: "patient",
    entityId: existing.patientId,
    action: "Registered despite duplicate",
    detail: `${name} shares a phone number with ${existing.name} (${existing.patientId})`,
  });
}

// --- projection --------------------------------------------------------------

/**
 * Projects a registry Patient into the shape Appt.patient uses — the same
 * mapping dashboardData's private P() performs, so a runtime-registered
 * patient can be booked exactly like a seeded one. Both must stay in step.
 */
export function toApptPatient(p: Patient): ApptPatient {
  return {
    name: p.name,
    route: `/patients/${p.patientId}`,
    avatar: p.avatar,
    patientId: p.patientId,
    group: p.group,
    dob: p.dob,
    age: p.age,
    sex: p.sex === "M" ? "Male" : p.sex === "F" ? "Female" : "Other",
    phone: p.phone,
    email: p.email,
    alert: p.alert,
  };
}
