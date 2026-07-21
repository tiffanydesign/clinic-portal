import React, { useState } from "react";
import { Link } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PasswordStrengthChecklist } from "./PasswordStrengthChecklist";
import { CodeInputBoxes } from "./CodeInputBoxes";
import { ALLOWED_DOMAIN, MOCK_VERIFICATION_CODE, PASSWORD_RULES, passwordRulesMet } from "./registrationData";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"A" | "B" | "C" | "D">("A");

  // Step A
  const [email, setEmail] = useState("");
  const [errorA, setErrorA] = useState("");

  // Step B
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [errorB, setErrorB] = useState("");

  // Step C
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rulesMet = passwordRulesMet(newPassword);
  const allRulesMet = rulesMet === PASSWORD_RULES.length;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmitC = allRulesMet && confirmPassword.length > 0 && !mismatch;

  const handleStepA = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorA("");
    if (!email.trim().toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      setErrorA("We couldn't find an account with that email.");
      return;
    }
    setStep("B");
  };

  const handleStepB = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorB("");
    const fullCode = code.join("");
    if (fullCode.length < 6 || fullCode !== MOCK_VERIFICATION_CODE) {
      setErrorB("Incorrect or expired code. Please try again.");
      return;
    }
    setStep("C");
  };

  const handleStepC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitC) return;
    setStep("D");
  };

  const renderContent = () => {
    switch (step) {
      case "A":
        return (
          <form onSubmit={handleStepA} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Reset Password</h2>
              <p className="text-ink-muted text-sm">Enter your email to receive a verification code.</p>
            </div>
            {errorA && (
              <div className="p-3 rounded-card bg-danger/10 text-danger-ink text-sm font-medium border border-danger/30 text-center">
                {errorA}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink-soft">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorA(""); }}
                placeholder="you@clinic.com"
                required
                className="w-full px-4 py-3 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all"
              />
            </div>
            <button type="submit" className="w-full py-3.5 px-4 rounded-card text-white font-bold btn-primary shadow-md transition-all transform active:scale-[0.98]">
              Send code
            </button>
          </form>
        );
      
      case "B":
        return (
          <form onSubmit={handleStepB} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Verify Email</h2>
              <p className="text-ink-muted text-sm">Enter the code sent to {email}</p>
            </div>
            {errorB && (
              <div className="p-3 rounded-card bg-danger/10 text-danger-ink text-sm font-medium border border-danger/30 text-center">
                {errorB}
              </div>
            )}
            <CodeInputBoxes code={code} onChange={(next) => { setCode(next); setErrorB(""); }} />
            <button type="submit" className="w-full py-3.5 px-4 rounded-card text-white font-bold btn-primary shadow-md transition-all transform active:scale-[0.98]">
              Verify
            </button>
          </form>
        );

      case "C":
        return (
          <form onSubmit={handleStepC} className="space-y-5">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">New Password</h2>
              <p className="text-ink-muted text-sm">Create a secure new password.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink-soft">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-16 rounded-card border border-divider bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink-soft">
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <PasswordStrengthChecklist password={newPassword} rulesMet={rulesMet} />

            <div className="space-y-1.5 pt-2">
              <label className="block text-sm font-semibold text-ink-soft">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-16 rounded-card border border-divider bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink-soft">
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {mismatch && <p className="text-xs font-medium text-danger-ink mt-1">Passwords do not match.</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmitC}
                className={`w-full py-3.5 px-4 rounded-card text-white font-bold text-section transition-all transform shadow-md ${
                  canSubmitC
                    ? "btn-primary active:scale-[0.98]"
                    : "bg-surface-sunken shadow-none cursor-not-allowed"
                }`}
              >
                Reset Password
              </button>
            </div>
          </form>
        );

      case "D":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success-ink" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Password Reset</h2>
            <p className="text-ink-muted text-sm">Your password has been successfully updated.</p>
            <div className="pt-6">
              <Link to="/login" className="block w-full py-3.5 px-4 rounded-card text-white font-bold btn-primary shadow-md transition-all transform active:scale-[0.98]">
                Return to Login
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthLayout>
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white relative">
        {step !== "D" && (
          <button 
            onClick={() => {
              if (step === "A") window.history.back();
              if (step === "B") { setErrorB(""); setCode(["", "", "", "", "", ""]); setStep("A"); }
              if (step === "C") { setStep("B"); }
            }}
            className="absolute top-8 left-8 text-ink-muted hover:text-ink-soft transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        {renderContent()}
      </div>
    </AuthLayout>
  );
}
