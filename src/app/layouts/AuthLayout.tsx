import React from "react";
import Logo from "../../imports/Logo-1";

export const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 2C8.26801 2 2 8.26801 2 16C2 23.732 8.26801 30 16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16Z" fill="currentColor"/>
    <path d="M16 2C23.732 2 30 8.26801 30 16H26C26 10.4772 21.5228 6 16 6V2Z" fill="currentColor" opacity="0.8"/>
  </svg>
);

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:h-screen w-full overflow-x-hidden bg-slate-50 font-sans">
      {/* Left Brand Panel — full 55% split on lg+ (iPad landscape and up);
          collapses to a compact header bar below lg so narrow/portrait
          screens stay usable without horizontal scrolling. */}
      <div className="relative flex items-center justify-between px-6 py-4 lg:flex-col lg:justify-between lg:items-stretch lg:w-[55%] lg:p-12 bg-gradient-to-br from-[#0B1528] via-[#122A50] to-[#1E4E8C] text-white overflow-hidden shrink-0">
        {/* Decorative background elements (large screens only) */}
        <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="hidden lg:block absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#00B4D8]/10 blur-3xl pointer-events-none"></div>

        {/* Compact header (below lg) */}
        <div className="flex items-center gap-2 z-10 lg:hidden">
          <LogoMark className="w-7 h-7 text-white" />
          <span className="font-bold tracking-tight">Phenome Portal</span>
        </div>

        {/* Full brand header + hero copy (lg and up) */}
        <div className="hidden lg:flex items-center z-10">
          <div className="transform scale-[0.6] origin-top-left -ml-2">
            <Logo property1="full" property2="mono" />
          </div>
        </div>
        <div className="hidden lg:block max-w-xl z-10 mt-[-10vh]">
          <h1 className="text-6xl font-bold mb-6 tracking-tight leading-tight">Phenome Portal</h1>
          <p className="text-xl text-blue-100/80 leading-relaxed font-light mb-2">
            Your clinic operations, in one place.
          </p>
          <p className="text-lg text-blue-100/60 leading-relaxed font-light">
            Secure access for authorised clinical staff.
          </p>
        </div>
        <div className="hidden lg:block z-10 text-sm text-blue-200/50">
          © 2026 Phenome Longevity · Authorised clinical staff only
        </div>
      </div>

      {/* Right Sign-in Panel (approx 45% on lg+, full width below) */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F7F9] px-6 py-8 lg:p-12 shrink-0 relative lg:overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
