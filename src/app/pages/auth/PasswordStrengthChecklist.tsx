import React from "react";
import { Check } from "lucide-react";
import { PASSWORD_RULES } from "./registrationData";

const STRENGTH_COLOR = ["bg-slate-200", "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"];

// Shared between account activation and password reset so both flows enforce
// the exact same password policy — one source of truth, not two copies that
// could quietly drift apart.
export function PasswordStrengthChecklist({ password, rulesMet }: { password: string; rulesMet: number }) {
  return (
    <>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < rulesMet ? STRENGTH_COLOR[rulesMet] : "bg-slate-200"}`} />
        ))}
      </div>

      <ul className="space-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? "text-emerald-600" : "text-slate-400"}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${met ? "bg-emerald-100" : "bg-slate-100"}`}>
                {met && <Check className="w-2.5 h-2.5" />}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </>
  );
}
