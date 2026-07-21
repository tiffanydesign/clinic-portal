import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { RegisterStepIndicator } from "./RegisterStepIndicator";
import { CodeInputBoxes } from "./CodeInputBoxes";
import { MOCK_VERIFICATION_CODE, maskEmail } from "./registrationData";
import { confirmCode, useRedirectIfAuthenticated, useRegistrationState, useRequireRegistrationStep } from "./registrationStore";

const RESEND_SECONDS = 60;

export function RegisterVerifyPage() {
  useRedirectIfAuthenticated();
  const { email, emailConfirmed } = useRegistrationState();
  useRequireRegistrationStep(emailConfirmed);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6 || fullCode !== MOCK_VERIFICATION_CODE) {
      setError("Incorrect or expired code. Please try again.");
      return;
    }
    confirmCode();
    navigate("/register/set-password");
  };

  if (!emailConfirmed) return null;

  return (
    <AuthLayout>
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white relative">
        <button
          onClick={() => navigate("/register")}
          className="absolute top-8 left-8 text-ink-muted hover:text-ink-soft transition-colors"
          aria-label="Change email"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <RegisterStepIndicator step={2} />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Check your email</h2>
          <p className="text-ink-muted text-sm">
            We sent a 6-digit code to <span className="text-brand-ink">{maskEmail(email)}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-3 rounded-card bg-danger/10 text-danger-ink text-sm font-medium border border-danger/30 text-center">{error}</div>
          )}

          <CodeInputBoxes code={code} onChange={(next) => { setCode(next); setError(""); }} />

          <p className="text-center text-xs text-ink-muted">This code expires in 10 minutes</p>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-card text-white font-bold text-section btn-primary shadow-md transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info"
            >
              Verify
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-ink-muted">Resend in {countdown}s</p>
          ) : (
            <button
              onClick={() => {
                setCountdown(RESEND_SECONDS);
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              className="text-sm font-semibold text-brand-ink hover:text-ink transition-colors"
            >
              Resend code
            </button>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-divider text-center text-xs text-ink-muted">
          Demo Note: the mock code is 123456 — anything else shows the error state.
        </div>
      </div>
    </AuthLayout>
  );
}
