import React, { useState } from "react";
import { Link } from "react-router";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"A" | "B" | "C" | "D">("A");
  
  // Step A
  const [email, setEmail] = useState("");
  
  // Step B
  const [code, setCode] = useState("");
  
  // Step C
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorC, setErrorC] = useState("");

  const handleStepA = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("B");
  };

  const handleStepB = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length > 3) setStep("C");
  };

  const handleStepC = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorC("Passwords must match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorC("Password must be at least 8 characters.");
      return;
    }
    setStep("D");
  };

  const renderContent = () => {
    switch (step) {
      case "A":
        return (
          <form onSubmit={handleStepA} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Reset Password</h2>
              <p className="text-slate-500 text-sm">Enter your email to receive a verification code.</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all"
              />
            </div>
            <button type="submit" className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98]">
              Send code
            </button>
          </form>
        );
      
      case "B":
        return (
          <form onSubmit={handleStepB} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Verify Email</h2>
              <p className="text-slate-500 text-sm">Enter the code sent to {email}</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 123456"
                required
                className="w-full px-4 py-3 text-center tracking-widest rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all"
              />
            </div>
            <button type="submit" className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98]">
              Verify
            </button>
          </form>
        );

      case "C":
        return (
          <form onSubmit={handleStepC} className="space-y-5">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">New Password</h2>
              <p className="text-slate-500 text-sm">Create a secure new password.</p>
            </div>
            {errorC && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">
                {errorC}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorC(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className={`text-xs mt-1 font-medium ${newPassword.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
                  Strength: {newPassword.length >= 8 ? 'Good' : 'Too short (min 8)'}
                </div>
              )}
            </div>
            <div className="space-y-1.5 pt-2">
              <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorC(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/50 focus:border-[#00B4D8] transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98]">
                Reset Password
              </button>
            </div>
          </form>
        );

      case "D":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Password Reset</h2>
            <p className="text-slate-500 text-sm">Your password has been successfully updated.</p>
            <div className="pt-6">
              <Link to="/login" className="block w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98]">
                Return to Login
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white relative">
        {step !== "D" && (
          <button 
            onClick={() => {
              if (step === "A") window.history.back();
              if (step === "B") setStep("A");
              if (step === "C") setStep("B");
            }} 
            className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-6 mt-4">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        {renderContent()}
      </div>
    </AuthLayout>
  );
}
