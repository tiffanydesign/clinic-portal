import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useAppContext, Role } from "../../context/AppContext";

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

    if (email === "wrong@clinic.com" || password === "wrong") {
      setError("Incorrect email or password.");
      return;
    }

    setPendingAuth({ role: demoRole, isFirstLogin: demoFirstLogin });
    navigate("/login/2fa");
  };

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Welcome back</h2>
          <p className="text-slate-500 text-sm">Sign in to your clinic portal</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link to="/forgot-password" className="text-sm font-semibold text-[#0077B6] hover:text-[#0B1528] transition-colors">
              Forgot Password?
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077B6]"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-8 text-center px-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Authorised clinical staff only.<br/>
            Trouble signing in? Contact your clinic administrator.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Demo Settings</h4>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Sign in as:</label>
              <select 
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
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
                className="rounded text-[#0077B6] focus:ring-[#0077B6]"
              />
              <span className="text-xs font-medium text-slate-600">Simulate first-time login (Enrollment)</span>
            </label>
          </div>
        </div>

      </div>
    </AuthLayout>
  );
}
