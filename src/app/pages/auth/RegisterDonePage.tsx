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
      <div className="bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-card p-4 border border-white text-center">
        <div className="flex justify-center mb-6">
          <LogoMark className="w-12 h-12 text-ink" />
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-ink" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">Account activated</h2>
        <p className="text-ink-muted text-sm leading-relaxed max-w-sm mx-auto">
          Your account is ready. Sign in to continue.
        </p>

        <div className="pt-4">
          <Link
            to="/login"
            className="block w-full py-3.5 px-4 rounded-card text-white font-bold text-section btn-primary shadow-md transition-all transform active:scale-[0.98]"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
