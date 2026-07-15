// Five-state scaffolding for the Rooms & Devices pages. The app's data is all
// in-memory, so "loading" and "error" have no natural trigger — this hook
// simulates a one-time fetch on first mount (per key, per session) so the
// loading skeleton genuinely renders, and exposes a discreet demo control that
// lets a reviewer force loading / error / ready to see every state.
import React, { useEffect, useState } from "react";
import { LucideIcon, RefreshCw, AlertCircle } from "lucide-react";

export type ResourceState = "loading" | "error" | "ready";

const loadedOnce = new Set<string>();
const LOAD_MS = 650;

export function useSimulatedResource(key: string) {
  const [state, setState] = useState<ResourceState>(loadedOnce.has(key) ? "ready" : "loading");

  useEffect(() => {
    if (loadedOnce.has(key) || state !== "loading") return;
    const t = setTimeout(() => {
      loadedOnce.add(key);
      setState("ready");
    }, LOAD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state]);

  const set = (s: ResourceState) => {
    if (s === "loading") {
      loadedOnce.delete(key);
      setState("loading");
    } else {
      loadedOnce.add(key);
      setState(s);
    }
  };
  return { state, set };
}

// Discreet demo affordance — clearly labelled as a prototype control so it
// doesn't read as a shipping feature.
export function DemoStateControl({ state, onChange }: { state: ResourceState; onChange: (s: ResourceState) => void }) {
  const opts: { v: ResourceState; label: string }[] = [
    { v: "ready", label: "Live" },
    { v: "loading", label: "Loading" },
    { v: "error", label: "Error" },
  ];
  return (
    <div className="flex items-center gap-1.5" title="Prototype control — preview each data state">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Demo</span>
      <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors ${
              state === o.v ? "bg-white text-slate-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Skeleton list — a few shimmering rows sized like the real table.
export function LoadingState() {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="h-11 bg-gray-50 border-b border-gray-200" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 h-16 border-b border-gray-100 last:border-b-0">
          <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse motion-reduce:animate-none shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-100 rounded animate-pulse motion-reduce:animate-none" style={{ width: `${40 + ((i * 13) % 30)}%` }} />
            <div className="h-3 bg-gray-100/70 rounded animate-pulse motion-reduce:animate-none" style={{ width: `${25 + ((i * 7) % 20)}%` }} />
          </div>
          <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse motion-reduce:animate-none shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ entity, onRetry }: { entity: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Couldn't load {entity}</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">Something went wrong reaching the clinic's device service. Check your connection and try again.</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg text-base font-bold hover:bg-slate-700 transition-colors shadow-sm">
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, cta }: { icon: LucideIcon; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{body}</p>
      {cta}
    </div>
  );
}
