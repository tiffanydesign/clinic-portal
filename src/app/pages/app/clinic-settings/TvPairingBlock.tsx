// TV pairing lifecycle UI for the device detail drawer. Three visible states —
// not paired, pairing (the open modal), paired — plus a mock "Simulate TV
// confirmation" that stands in for the physical TV app confirming the code.
// This build manages pairing only; it does not define what the TV shows.
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tv, Wifi, WifiOff, Check, RefreshCw, X, Link2Off } from "lucide-react";
import { DeviceView } from "./deviceView";
import { makePairingCode } from "./devicesData";
import { startPairing, confirmPairing, cancelPairing, unpairDevice } from "./devicesStore";
import { Pill, ConfirmDialog } from "./settingsUiShared";

const CODE_TTL = 5 * 60; // seconds

function PairingModal({ view, onClose }: { view: DeviceView; onClose: () => void }) {
  const [code, setCode] = useState(makePairingCode);
  const [remaining, setRemaining] = useState(CODE_TTL);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const expired = remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const regenerate = () => { setCode(makePairingCode()); setRemaining(CODE_TTL); };
  const cancel = () => { cancelPairing(view.id); onClose(); };
  const simulate = () => { confirmPairing(view.id); toast.success(`${view.label} paired.`); onClose(); };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-6" onClick={cancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 motion-reduce:animate-none" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Pair {view.label}</h2>
          <button onClick={cancel} aria-label="Cancel pairing" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">Open the Phenome TV app on this screen and enter this code:</p>
          <div className={`font-mono font-bold tabular-nums text-4xl tracking-[0.2em] ${expired ? "text-gray-300" : "text-gray-900"}`}>
            {code.slice(0, 3)} {code.slice(3)}
          </div>
          <div className="mt-3 text-xs font-semibold">
            {expired ? (
              <span className="text-red-600">Code expired</span>
            ) : (
              <span className="text-gray-400">Expires in <span className="tabular-nums text-gray-600">{mm}:{ss}</span></span>
            )}
          </div>
          <button onClick={regenerate} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate code
          </button>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-2">
          <button
            onClick={simulate}
            disabled={expired}
            className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${expired ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            <Check className="w-4 h-4" /> Simulate TV confirmation
          </button>
          <button onClick={cancel} className="w-full px-5 py-2 rounded-lg text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function TvPairingBlock({ view }: { view: DeviceView }) {
  const [modal, setModal] = useState(false);
  const [unpairing, setUnpairing] = useState(false);
  const paired = view.pairing === "paired";
  const online = view.status === "online";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tv className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pairing</h3>
      </div>

      {paired ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald"><Check className="w-3 h-3" /> Paired</Pill>
            {online
              ? <Pill tone="emerald"><Wifi className="w-3 h-3" /> Online</Pill>
              : <Pill tone="gray"><WifiOff className="w-3 h-3" /> Offline</Pill>}
          </div>
          <div className="text-xs text-gray-500">
            Paired {view.pairedOn ?? "recently"} · last seen {view.lastSeen}
          </div>
          <button
            onClick={() => setUnpairing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            <Link2Off className="w-3.5 h-3.5" /> Unpair
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Pill tone="slate"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Not paired</Pill>
          <p className="text-xs text-gray-500 leading-relaxed">This screen isn't paired yet, so it can't show content. Pair it with the Phenome TV app to bring it online.</p>
          <button
            onClick={() => { startPairing(view.id); setModal(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Tv className="w-4 h-4" /> Start pairing
          </button>
        </div>
      )}

      {modal && <PairingModal view={view} onClose={() => setModal(false)} />}
      {unpairing && (
        <ConfirmDialog
          title={`Unpair ${view.label}?`}
          body="The TV will stop receiving content until it's paired again."
          confirmLabel="Unpair"
          danger
          onCancel={() => setUnpairing(false)}
          onConfirm={() => { unpairDevice(view.id); toast.success(`${view.label} unpaired.`); setUnpairing(false); }}
        />
      )}
    </div>
  );
}
