import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { Staff, StaffRole, MOCK_STAFF, OTHER_CLINICIANS } from "./staffData";

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500";
const labelCls = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2";

// Two-step "Add Staff Member" dialog: personal/account info, then role-specific setup.
export function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Staff) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+90 ");
  const [role, setRole] = useState<StaffRole | "">("");
  const [employeeId, setEmployeeId] = useState(`EMP-${String(MOCK_STAFF.length + 1).padStart(3, "0")}`);
  const [specialisation, setSpecialisation] = useState("");
  const [duration, setDuration] = useState("45 min");
  const [license, setLicense] = useState("");
  const [assignedClinicians, setAssignedClinicians] = useState<string[]>([]);
  const [permissionTemplate, setPermissionTemplate] = useState("Use role default");

  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || phone.trim().length < 7 || !role) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  const handleCreate = () => {
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
      specialisation: specialisation || undefined,
      licenseNumber: license || undefined,
    });
    toast.success(`Staff member created. Invitation sent to ${email}`);
  };

  const toggleClinician = (c: string) => {
    setAssignedClinicians((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
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
          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className={`flex items-center font-bold text-sm ${step === 1 ? "text-blue-700" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${step === 1 ? "bg-blue-100" : "bg-gray-100"}`}>1</div>
              Personal &amp; Account Info
            </div>
            <div className="w-12 h-px bg-gray-200" />
            <div className={`flex items-center font-bold text-sm ${step === 2 ? "text-blue-700" : "text-gray-400"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${step === 2 ? "bg-blue-100" : "bg-gray-100"}`}>2</div>
              Initial Setup
            </div>
          </div>

          {step === 1 ? (
            <>
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
            </>
          ) : (
            <>
              {role === "Clinician" && (
                <>
                  <div>
                    <label className={labelCls}>Specialisation</label>
                    <input type="text" value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} className={inputCls} placeholder="e.g. Preventive Medicine" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Default Consultation Duration</label>
                      <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputCls} bg-white`}>
                        <option>30 min</option>
                        <option>45 min</option>
                        <option>60 min</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>License Number</label>
                      <input type="text" value={license} onChange={(e) => setLicense(e.target.value)} className={inputCls} placeholder="TC-2026-XXXXX" />
                    </div>
                  </div>
                </>
              )}

              {role === "Nurse" && (
                <div>
                  <label className={labelCls}>Assigned to Clinician</label>
                  <div className="border border-gray-300 rounded divide-y divide-gray-100">
                    {OTHER_CLINICIANS.concat("Dr. Claudia Reis").map((c) => (
                      <label key={c} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={assignedClinicians.includes(c)} onChange={() => toggleClinician(c)} className="rounded text-slate-600 focus:ring-slate-500 mr-2.5" />
                        {c}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Optional — can be configured later in the staff details.</p>
                </div>
              )}

              {role === "Receptionist" && (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded p-4">
                  No additional setup is required for the {role} role.
                </div>
              )}

              <div>
                <label className={labelCls}>Permission Template</label>
                <select value={permissionTemplate} onChange={(e) => setPermissionTemplate(e.target.value)} className={`${inputCls} bg-white`}>
                  <option>Use role default</option>
                  <option>Custom (configure after creation)</option>
                </select>
              </div>

              <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <Info className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
                An invitation email will be sent to the staff member with login credentials. They will be required to set up 2FA on first login.
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between shrink-0">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="flex items-center px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
          ) : <span />}
          {step === 1 ? (
            <button onClick={handleNext} className="flex items-center px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button onClick={handleCreate} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
              Create Staff Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
