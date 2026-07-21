import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { RegisterStepIndicator } from "./RegisterStepIndicator";
import { checkWhitelist } from "./registrationData";
import { confirmEmail, useRedirectIfAuthenticated } from "./registrationStore";

const SIMULATE_OPTIONS = [
  { value: "", label: "Simulate: Valid / Not authorised / Already active" },
  { value: "berna@phenome.com", label: "Valid — berna@phenome.com" },
  { value: "yourname@phenomelongevity.com", label: "Valid — any @phenomelongevity.com address" },
  { value: "notonfile@phenome.com", label: "Not authorised — notonfile@phenome.com" },
  { value: "ebru@phenome.com", label: "Already active — ebru@phenome.com" },
];

export function RegisterEmailPage() {
  useRedirectIfAuthenticated();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [alreadyActive, setAlreadyActive] = useState(false);
  const navigate = useNavigate();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAlreadyActive(false);

    if (!email.trim()) {
      setError("Please enter your work email.");
      return;
    }

    const result = checkWhitelist(email);
    if (result === "not-authorised") {
      setError("This email is not authorised. Please contact your clinic administrator.");
      return;
    }
    if (result === "already-active") {
      setAlreadyActive(true);
      return;
    }

    confirmEmail(email.trim());
    navigate("/register/verify");
  };

  return (
    <AuthLayout>
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <RegisterStepIndicator step={1} />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Activate your account</h2>
          <p className="text-ink-muted text-sm">Enter your work email to get started</p>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {error && (
            <div className="p-3 rounded-card bg-danger/10 text-danger-ink text-sm font-medium border border-danger/30">{error}</div>
          )}
          {alreadyActive && (
            <div className="p-3 rounded-card bg-info/10 text-info-ink text-sm font-medium border border-info/30">
              This account is already active. Please{" "}
              <Link to="/login" className="underline font-bold hover:text-ink">
                sign in
              </Link>{" "}
              instead.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink-soft">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setAlreadyActive(false);
              }}
              placeholder="you@clinic.com"
              className="w-full px-4 py-3 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-card text-white font-bold text-section btn-primary shadow-md transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info"
            >
              Continue
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-ink-muted">Already have an account? </span>
          <Link to="/login" className="text-sm font-semibold text-brand-ink hover:text-ink transition-colors">
            Sign in
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-divider">
          <div className="bg-surface-page p-4 rounded-card border border-divider space-y-1.5">
            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider text-center mb-2">Demo Settings</h4>
            <select
              onChange={(e) => e.target.value && setEmail(e.target.value)}
              defaultValue=""
              className="w-full px-3 py-2 rounded-card border border-divider text-sm bg-surface"
            >
              {SIMULATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
