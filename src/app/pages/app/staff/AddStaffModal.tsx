import React, { useState } from "react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF } from "./staffData";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const inputCls = "w-full px-3 py-2 border border-divider rounded-control text-data outline-none focus:border-border-strong bg-surface";
const labelCls = "block text-label font-bold text-ink-soft uppercase tracking-wider mb-2";

const PHONE_PREFIX = "+90 ";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Keeps the "+90 " country-code prefix fixed, strips anything that isn't a
// digit or space from the rest, and caps the number itself at 10 digits
// (Turkish mobile numbers: 3-3-4 grouping).
function sanitizePhone(raw: string): string {
  if (!raw.startsWith("+90")) return PHONE_PREFIX;
  const rest = raw.slice(3).replace(/[^\d\s]/g, "");
  let digitCount = 0;
  let capped = "";
  for (const ch of rest) {
    if (/\d/.test(ch)) {
      if (digitCount === 10) continue;
      digitCount++;
    }
    capped += ch;
  }
  return `+90${capped}`;
}

// Single-step "Add Staff Member" dialog: personal & account info only.
export function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Staff) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [role, setRole] = useState<StaffRole | "">("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const handleCreate = () => {
    const emailValid = EMAIL_RE.test(email.trim());
    const phoneDigits = phone.replace(/\D/g, "").length; // "90" + 10-digit number = 12
    const phoneValid = phoneDigits === 12;

    const nextErrors: { email?: string; phone?: string } = {};
    if (!emailValid) nextErrors.email = "Enter a valid email address.";
    if (!phoneValid) nextErrors.phone = "Enter a valid 10-digit phone number.";
    setErrors(nextErrors);

    if (!firstName.trim() || !lastName.trim() || !role || Object.keys(nextErrors).length > 0) {
      toast.error(Object.keys(nextErrors).length > 0 ? "Please fix the highlighted fields." : "Please fill in all required fields.");
      return;
    }

    const name = role === "Clinician" ? `Dr. ${firstName} ${lastName}` : `${firstName} ${lastName}`;
    onCreated({
      id: `EMP-${String(MOCK_STAFF.length + 1).padStart(3, "0")}`,
      name,
      avatar: (firstName[0] + lastName[0]).toUpperCase(),
      role: role as StaffRole,
      email,
      phone,
      status: "Active",
      today: "Off",
      patients: role === "Clinician" || role === "Nurse" ? 0 : null,
      workload: role === "Clinician" || role === "Nurse" ? 0 : null,
      nextShift: "—",
      lastActive: "Never",
      lastActiveDays: 0,
      joined: "4 Jul 2026",
    });
    toast.success(`Staff member created. Invitation sent to ${email}`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Staff Member"
      size="form"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Import &amp; Send Invitations</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>First Name <span className="text-danger-ink">*</span></label>
            <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Last Name <span className="text-danger-ink">*</span></label>
            <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Email <span className="text-danger-ink">*</span></label>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
            className={errors.email ? "border-danger focus:ring-danger/40" : ""}
            placeholder="name@phenome.com"
          />
          {errors.email ? (
            <p className="text-label text-danger-ink font-semibold mt-1">{errors.email}</p>
          ) : (
            <p className="text-label text-ink-muted mt-1">Used as the system account and 2FA email.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phone <span className="text-danger-ink">*</span></label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(sanitizePhone(e.target.value)); setErrors((prev) => ({ ...prev, phone: undefined })); }}
              className={errors.phone ? "border-danger focus:ring-danger/40" : ""}
            />
            {errors.phone && <p className="text-label text-danger-ink font-semibold mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className={labelCls}>Role <span className="text-danger-ink">*</span></label>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputCls}>
              <option value="" disabled>Select role...</option>
              <option>Clinician</option>
              <option>Nurse</option>
              <option>Receptionist</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
