import React from "react";

export function RegisterStepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-6">
      <div className="text-center text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Step {step} of 3</div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-info" : "bg-surface-sunken"}`} />
        ))}
      </div>
    </div>
  );
}
