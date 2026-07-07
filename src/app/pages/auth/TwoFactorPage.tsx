import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft } from "lucide-react";
import { CodeInputBoxes } from "./CodeInputBoxes";

export function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const { pendingAuth, login } = useAppContext();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (fullCode !== "123456") {
      setError("Invalid code. Please try again.");
      return;
    }

    // Success
    if (pendingAuth) {
      if (pendingAuth.isFirstLogin) {
        navigate("/enrollment");
      } else {
        login(pendingAuth.role);
        navigate("/dashboard");
      }
    } else {
      // If accessed directly from dropdown for demo, just go to dashboard or login
      login("Admin"); // default fallback
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white relative">
        <Link to="/login" className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Two-Factor Authentication</h2>
          <p className="text-slate-500 text-sm">
            A verification code has been sent to <span className="text-[#0077B6] cursor-default">a****z@example.com</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}

          <CodeInputBoxes code={code} onChange={(next) => { setCode(next); setError(""); }} />

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077B6]"
            >
              Verify
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-slate-500">Resend code in {countdown}s</p>
          ) : (
            <button 
              onClick={() => { setCountdown(30); setCode(["","","","","",""]); setError(""); }}
              className="text-sm font-semibold text-[#0077B6] hover:text-[#0B1528] transition-colors"
            >
              Resend code
            </button>
          )}
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Demo Note: the mock code is 123456 — anything else shows the error state.
        </div>
      </div>
    </AuthLayout>
  );
}
