import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useAppContext, Role } from "../../context/AppContext";
import { ALLOWED_DOMAIN, MOCK_VERIFICATION_CODE } from "./registrationData";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [demoRole, setDemoRole] = useState<Role>("Admin");
  const [demoFirstLogin, setDemoFirstLogin] = useState(false);

  const { setPendingAuth } = useAppContext();
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!email.trim().toLowerCase().endsWith(ALLOWED_DOMAIN) || password !== MOCK_VERIFICATION_CODE) {
      setError("Incorrect email or password.");
      return;
    }

    setPendingAuth({ role: demoRole, isFirstLogin: demoFirstLogin });
    navigate("/login/2fa");
  };

  return (
    <AuthLayout>
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Welcome back</h2>
          <p className="text-ink-muted text-sm">Sign in to your clinic portal</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          {error && (
            <div className="p-3 rounded-card bg-danger/10 text-danger-ink text-sm font-medium border border-danger/30">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink-soft">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              className="w-full px-4 py-3 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink-soft">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-16 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink-soft focus:outline-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link to="/forgot-password" className="text-sm font-semibold text-brand-ink hover:text-ink transition-colors">
              Forgot Password?
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-card text-white font-bold text-section btn-primary shadow-md transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm font-semibold text-brand-ink hover:text-ink transition-colors">
            Activate your account
          </Link>
        </div>

        <div className="mt-8 text-center px-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            Authorised clinical staff only.<br/>
            Trouble signing in? Contact your clinic administrator.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-divider">
          <div className="bg-surface-page p-4 rounded-card border border-divider space-y-4">
            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider text-center">Demo Settings</h4>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-soft">Sign in as:</label>
              <select 
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-card border border-divider text-sm bg-surface"
              >
                <option value="Admin">Admin</option>
                <option value="Reception">Reception</option>
                <option value="Nurse">Nurse</option>
                <option value="Clinician">Clinician</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={demoFirstLogin}
                onChange={(e) => setDemoFirstLogin(e.target.checked)}
                className="rounded-control text-brand-ink focus:ring-info"
              />
              <span className="text-xs font-medium text-ink-soft">Simulate first-time login (Enrollment)</span>
            </label>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
