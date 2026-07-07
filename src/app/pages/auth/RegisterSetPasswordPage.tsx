import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { RegisterStepIndicator } from "./RegisterStepIndicator";
import { PasswordStrengthChecklist } from "./PasswordStrengthChecklist";
import { PASSWORD_RULES, passwordRulesMet } from "./registrationData";
import { activateAccount, useRedirectIfAuthenticated, useRegistrationState, useRequireRegistrationStep } from "./registrationStore";

export function RegisterSetPasswordPage() {
  useRedirectIfAuthenticated();
  const { email, codeVerified } = useRegistrationState();
  useRequireRegistrationStep(codeVerified);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const rulesMet = passwordRulesMet(password);
  const allRulesMet = rulesMet === PASSWORD_RULES.length;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canActivate = allRulesMet && confirm.length > 0 && !mismatch;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canActivate) return;
    activateAccount();
    navigate("/register/done");
  };

  if (!codeVerified) return null;

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white relative">
        <button
          onClick={() => navigate("/register/verify")}
          className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <RegisterStepIndicator step={3} />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Create your password</h2>
          <p className="text-slate-500 text-sm">Set a password to secure your account</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-5">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
            <span className="text-sm font-medium text-slate-700">{email}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <PasswordStrengthChecklist password={password} rulesMet={rulesMet} />

          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {mismatch && <p className="text-xs font-medium text-red-600 mt-1">Passwords do not match.</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canActivate}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-[15px] transition-all transform shadow-md ${
                canActivate
                  ? "bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-[#0077B6]/20 active:scale-[0.98]"
                  : "bg-slate-300 shadow-none cursor-not-allowed"
              }`}
            >
              Activate Account
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
