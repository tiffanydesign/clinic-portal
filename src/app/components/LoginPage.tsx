import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";

const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 2C8.26801 2 2 8.26801 2 16C2 23.732 8.26801 30 16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16Z" fill="currentColor"/>
    <path d="M16 2C23.732 2 30 8.26801 30 16H26C26 10.4772 21.5228 6 16 6V2Z" fill="currentColor" opacity="0.8"/>
  </svg>
);

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/2fa");
  };

  return (
    <div className="flex h-screen w-screen min-w-[1024px] overflow-hidden bg-surface-page font-sans">
      {/* Left Brand Panel (approx 55%) */}
      <div className="w-[55%] relative flex flex-col justify-between p-4 bg-gradient-to-br from-ink via-[var(--phenome-blue-900)] to-[var(--phenome-blue-500)] text-white overflow-hidden shrink-0">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-surface/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-info/10 blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex items-center space-x-3 z-10">
          <LogoMark className="w-9 h-9 text-white" />
          <span className="text-xl font-semibold tracking-wide">Phenome Longevity</span>
        </div>

        {/* Center Content */}
        <div className="max-w-xl z-10 mt-[-10vh]">
          <h1 className="text-6xl font-bold mb-6 tracking-tight leading-tight">Phenome Portal</h1>
          <p className="text-xl text-white/80 leading-relaxed font-light mb-2">
            Your clinic operations, in one place.
          </p>
          <p className="text-lg text-white/70 leading-relaxed font-light">
            Secure access for authorised clinical staff.
          </p>
        </div>

        {/* Footer */}
        <div className="z-10 text-sm text-white/50">
          © 2026 Phenome Longevity · Authorised clinical staff only
        </div>
      </div>

      {/* Right Sign-in Panel (approx 45%) */}
      <div className="w-[45%] flex items-center justify-center bg-surface-page p-4 shrink-0">
        <div className="w-full max-w-[440px] bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white">
          
          <div className="flex justify-center mb-6">
            <LogoMark className="w-12 h-12 text-ink" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Welcome back</h2>
            <p className="text-ink-muted text-sm">Sign in to your clinic portal</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink-soft">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                required
                className="w-full px-4 py-3 rounded-card border border-divider bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info transition-all shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink-soft">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-sm font-semibold text-brand-ink hover:text-ink transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-card text-white font-bold text-section btn-primary shadow-md transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Helper Text */}
          <div className="mt-8 text-center px-4">
            <p className="text-xs text-ink-muted leading-relaxed">
              Authorised clinical staff only.<br/>
              Trouble signing in? Contact your clinic administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
