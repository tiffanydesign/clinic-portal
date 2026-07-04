import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft } from "lucide-react";

export function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { pendingAuth, login } = useAppContext();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, "");
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (fullCode === "000000") {
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

          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-slate-200 bg-white text-[#0B1528] focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all shadow-sm"
              />
            ))}
          </div>

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
          Demo Note: Enter any code except '000000' to succeed.
        </div>
      </div>
    </AuthLayout>
  );
}
