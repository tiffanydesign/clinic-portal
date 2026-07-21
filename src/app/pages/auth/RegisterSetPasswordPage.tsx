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
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white relative">
        <button
          onClick={() => navigate("/register/verify")}
          className="absolute top-8 left-8 text-ink-muted hover:text-ink-soft transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <RegisterStepIndicator step={3} />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Create your password</h2>
          <p className="text-ink-muted text-sm">Set a password to secure your account</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-5">
          <div className="flex items-center justify-between px-4 py-3 rounded-card border border-success/30 bg-success/10">
            <span className="text-sm font-medium text-ink-soft">{email}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-success-ink">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink-soft">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-16 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink-soft"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <PasswordStrengthChecklist password={password} rulesMet={rulesMet} />

          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-semibold text-ink-soft">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-16 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink-soft"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {mismatch && <p className="text-xs font-medium text-danger-ink mt-1">Passwords do not match.</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canActivate}
              className={`w-full py-3.5 px-4 rounded-card text-white font-bold text-section transition-all transform shadow-md ${
                canActivate
                  ? "btn-primary active:scale-[0.98]"
                  : "bg-surface-sunken shadow-none cursor-not-allowed"
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
