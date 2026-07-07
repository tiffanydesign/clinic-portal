import React from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout, LogoMark } from "../../layouts/AuthLayout";
import { useRedirectIfAuthenticated, useRegistrationState, useRequireRegistrationStep } from "./registrationStore";

export function RegisterDonePage() {
  useRedirectIfAuthenticated();
  const { activated } = useRegistrationState();
  useRequireRegistrationStep(activated);

  if (!activated) return null;

  return (
    <AuthLayout>
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-10 border border-white text-center">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-[#0B1528]" />
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#0B1528] tracking-tight mb-2">Account activated</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
          Your account is ready. Sign in to continue.
        </p>

        <div className="pt-8">
          <Link
            to="/login"
            className="block w-full py-3.5 px-4 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096B4] hover:to-[#005B8C] shadow-md shadow-[#0077B6]/20 transition-all transform active:scale-[0.98]"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
