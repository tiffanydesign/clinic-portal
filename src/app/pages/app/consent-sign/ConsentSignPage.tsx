import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppointments, signConsent } from "../dashboard/appointmentsStore";
import { CONSENT_FORM_VERSIONS } from "../clinic-settings/consentFormData";
import { SignatureCanvas, SignatureCanvasHandle } from "./SignatureCanvas";

const ACTIVE_FORM = CONSENT_FORM_VERSIONS.find((v) => v.status === "active") ?? CONSENT_FORM_VERSIONS[0];

// The patient-facing kiosk flow: a receptionist taps Sign Consent, hands the
// iPad over, and everything else on screen — sidebar, topbar, role switcher,
// notifications — disappears. Registered in App.tsx outside AppShell so
// none of that shell ever mounts here.
export function ConsentSignPage() {
  const { apptId } = useParams();
  const navigate = useNavigate();
  const appts = useAppointments();
  const appt = useMemo(() => appts.find((a) => a.id === apptId), [appts, apptId]);

  const [stage, setStage] = useState<"signing" | "done">("signing");
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hasSignature, setHasSignature] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvasHandle>(null);

  const requiredSections = ACTIVE_FORM.content.sections.filter((s) => s.required);
  const allRequiredChecked = requiredSections.every((s) => checked[s.id]);
  const canSubmit = scrolledToEnd && allRequiredChecked && hasSignature;

  // Escape-proofing: push a history entry on mount and re-push on every
  // popstate, so the browser back gesture can never leave this screen. The
  // only sanctioned exits are the Staff button (confirm required) and
  // completing the flow.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setScrolledToEnd(true);
  };

  const handleSubmit = () => {
    if (!canSubmit || !appt) return;
    signConsent(appt.id);
    setStage("done");
  };

  const handleDone = () => navigate("/dashboard");
  const handleExitConfirm = () => navigate("/dashboard");

  if (!appt) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Appointment not found.</p>
          <button onClick={() => navigate("/dashboard")} className="px-5 py-2.5 bg-slate-600 text-white font-bold rounded hover:bg-slate-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-5">
          <Check className="w-9 h-9" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank you, {appt.patient.name.split(" ")[0]}.</h1>
        <p className="text-gray-500 max-w-sm">Please hand the iPad back to reception.</p>
        <button onClick={handleDone} className="mt-8 px-8 py-3.5 bg-slate-600 text-white font-bold text-base rounded-xl hover:bg-slate-700 transition-colors min-w-[160px]">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phenome Clinic</div>
          <h1 className="text-lg font-bold text-gray-800 mt-0.5">{ACTIVE_FORM.content.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{appt.patient.name} · {appt.type.replace(" (in-person)", "").replace(" (video)", "")} · {appt.timeLabel}</p>
        </div>
        <button
          onClick={() => setExitConfirmOpen(true)}
          className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors shrink-0"
        >
          Staff
        </button>
      </div>

      {/* Scrollable consent document */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="max-w-[720px] mx-auto px-8 py-8">
          <div className="text-[15px] leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: ACTIVE_FORM.content.introductionHtml }} />

          <div className="mt-8 space-y-8">
            {ACTIVE_FORM.content.sections.map((section) => (
              <div key={section.id}>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                  {section.title}{section.required && <span className="text-red-500 ml-1">*</span>}
                </h2>
                <div className="text-[15px] leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: section.bodyHtml }} />
                <label className="flex items-start gap-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!checked[section.id]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [section.id]: e.target.checked }))}
                    className="mt-1 w-5 h-5 accent-slate-600 shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {section.required ? "I have read and agree to this section." : "I agree (optional)."}
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: ACTIVE_FORM.content.footerHtml }} />

          {/* Signature */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-800">Signature</h2>
              <button
                onClick={() => signatureRef.current?.clear()}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 h-40">
              <SignatureCanvas ref={signatureRef} onChange={setHasSignature} className="w-full h-full" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Sign above using your finger or a stylus.</p>
          </div>

          {/* Bottom padding so the sticky footer never covers the last field */}
          <div className="h-4" />
        </div>
      </div>

      {/* Sticky footer with Agree & Sign */}
      <div className="shrink-0 border-t border-gray-200 px-8 py-4 bg-white">
        <div className="max-w-[720px] mx-auto">
          {!canSubmit && (
            <p className="text-xs text-amber-600 font-medium mb-2 text-center">
              {!scrolledToEnd
                ? "Please scroll to the end of the document."
                : !allRequiredChecked
                ? "Please agree to all required sections."
                : "Please sign above to continue."}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full h-14 rounded-xl text-base font-bold transition-colors ${
              canSubmit ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Agree &amp; Sign
          </button>
        </div>
      </div>

      {exitConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Cancel signing?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">This will return to the dashboard without saving a signature.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
              <button onClick={() => setExitConfirmOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors">
                Stay
              </button>
              <button onClick={handleExitConfirm} className="px-6 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Cancel signing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
