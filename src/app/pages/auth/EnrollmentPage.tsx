import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useAppContext } from "../../context/AppContext";

export function EnrollmentPage() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const { pendingAuth, login } = useAppContext();

  const handleContinue = () => {
    if (accepted) {
      if (pendingAuth) {
        login(pendingAuth.role);
      } else {
        login("Admin"); // Fallback for dropdown preview
      }
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white">
        
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Welcome to Phenome</h2>
          <p className="text-slate-500 text-sm">Please review the system terms to continue.</p>
        </div>

        <div className="space-y-6">
          
          {/* Terms Block */}
          <div className="h-48 overflow-y-auto p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 leading-relaxed shadow-inner">
            <p className="mb-3 font-semibold text-slate-800">Authorised Access Policy</p>
            <p className="mb-3">
              By accessing the Phenome Portal, you agree that you are an authorised clinical staff member. You agree to use this system exclusively for clinic operations and patient care management.
            </p>
            <p className="mb-3">
              All data within this portal is confidential and subject to data protection regulations. Unauthorized access, sharing, or modification of patient records is strictly prohibited and logged.
            </p>
            <p>
              Please ensure you log out when leaving your workstation unattended.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6] transition-colors"
              />
            </div>
            <div className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              I accept the system terms and agree to maintain patient confidentiality.
            </div>
          </label>

          {/* Action */}
          <div className="pt-4">
            <button
              onClick={handleContinue}
              disabled={!accepted}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077B6]
                ${accepted 
                  ? "bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] text-white shadow-md shadow-[#0077B6]/20 active:scale-[0.98]" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              Accept and Continue
            </button>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
