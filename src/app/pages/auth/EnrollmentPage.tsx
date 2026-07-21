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
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white">
        
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Welcome to Phenome</h2>
          <p className="text-ink-muted text-sm">Please review the system terms to continue.</p>
        </div>

        <div className="space-y-6">
          
          {/* Terms Block */}
          <div className="h-48 overflow-y-auto p-4 rounded-card border border-divider bg-surface-page text-sm text-ink-soft leading-relaxed shadow-inner">
            <p className="mb-3 font-semibold text-ink">Authorised Access Policy</p>
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
                className="w-4 h-4 rounded-control border-divider text-brand-ink focus:ring-info transition-colors"
              />
            </div>
            <div className="text-sm text-ink-soft group-hover:text-ink transition-colors">
              I accept the system terms and agree to maintain patient confidentiality.
            </div>
          </label>

          {/* Action */}
          <div className="pt-4">
            <button
              onClick={handleContinue}
              disabled={!accepted}
              className={`w-full py-3.5 px-4 rounded-card font-bold text-section transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info
                ${accepted 
                  ? "btn-primary text-white shadow-md active:scale-[0.98]" 
                  : "bg-surface-sunken text-ink-muted cursor-not-allowed"}`}
            >
              Accept and Continue
            </button>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
