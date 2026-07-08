import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF } from "./staffData";

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500";
const labelCls = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2";

// Single-step "Add Staff Member" dialog: personal & account info only.
export function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Staff) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+90 ");
  const [role, setRole] = useState<StaffRole | "">("");
  const [employeeId, setEmployeeId] = useState(`EMP-${String(MOCK_STAFF.length + 1).padStart(3, "0")}`);

  const handleCreate = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || phone.trim().length < 7 || !role) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const name = role === "Clinician" ? `Dr. ${firstName} ${lastName}` : `${firstName} ${lastName}`;
    onCreated({
      id: employeeId,
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Add Staff Member</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@phenome.com" />
            <p className="text-[10px] text-gray-400 mt-1">Used as the system account and 2FA email.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role <span className="text-red-500">*</span></label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={`${inputCls} bg-white`}>
                <option value="" disabled>Select role...</option>
                <option>Clinician</option>
                <option>Nurse</option>
                <option>Receptionist</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Admin accounts cannot be created here — the clinic has exactly one.</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Employee ID</label>
            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls} />
            <p className="text-[10px] text-gray-400 mt-1">Auto-generated — you can override it manually.</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
            Import &amp; Send Invitations
          </button>
        </div>
      </div>
    </div>
  );
}
