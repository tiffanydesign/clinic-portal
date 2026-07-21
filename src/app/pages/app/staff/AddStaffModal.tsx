import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF } from "./staffData";

const inputCls = "w-full px-3 py-2 border border-divider rounded-control text-sm outline-none focus:border-border-strong";
const errorInputCls = "w-full px-3 py-2 border border-danger rounded-control text-sm outline-none focus:border-danger";
const labelCls = "block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2";

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
    <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-divider flex justify-between items-center bg-surface-page shrink-0">
          <h2 className="text-lg font-bold text-ink">Add Staff Member</h2>
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink-soft hover:bg-surface-sunken rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name <span className="text-danger-ink">*</span></label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name <span className="text-danger-ink">*</span></label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-danger-ink">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              className={errors.email ? errorInputCls : inputCls}
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
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(sanitizePhone(e.target.value)); setErrors((prev) => ({ ...prev, phone: undefined })); }}
                className={errors.phone ? errorInputCls : inputCls}
              />
              {errors.phone && <p className="text-label text-danger-ink font-semibold mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className={labelCls}>Role <span className="text-danger-ink">*</span></label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={`${inputCls} bg-surface`}>
                <option value="" disabled>Select role...</option>
                <option>Clinician</option>
                <option>Nurse</option>
                <option>Receptionist</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-page border-t border-divider flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-6 py-2 bg-ink hover:bg-surface-sunken text-white rounded-control text-sm font-bold transition-colors shadow-sm">
            Import &amp; Send Invitations
          </button>
        </div>
      </div>
    </div>
  );
}
