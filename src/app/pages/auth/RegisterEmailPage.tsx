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
  { value: "claudia@phenome.com", label: "Already active — claudia@phenome.com" },
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
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <RegisterStepIndicator step={1} />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Activate your account</h2>
          <p className="text-slate-500 text-sm">Enter your work email to get started</p>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">{error}</div>
          )}
          {alreadyActive && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
              This account is already active. Please{" "}
              <Link to="/login" className="underline font-bold hover:text-[#0B1528]">
                sign in
              </Link>{" "}
              instead.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setAlreadyActive(false);
              }}
              placeholder="you@clinic.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077B6]"
            >
              Continue
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-slate-500">Already have an account? </span>
          <Link to="/login" className="text-sm font-semibold text-[#0077B6] hover:text-[#0B1528] transition-colors">
            Sign in
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-2">Demo Settings</h4>
            <select
              onChange={(e) => e.target.value && setEmail(e.target.value)}
              defaultValue=""
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
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
