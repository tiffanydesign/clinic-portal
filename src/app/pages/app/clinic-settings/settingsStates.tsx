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
      <span className="text-overline text-ink-muted">Demo</span>
      <div className="inline-flex bg-surface-hover rounded-card p-0.5 border border-divider">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-2 py-1 text-label font-bold rounded-control transition-colors ${
              state === o.v ? "bg-surface text-ink-soft shadow-sm" : "text-ink-muted hover:text-ink-soft"
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
    <div className="border border-divider rounded-card overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="h-11 bg-surface-page border-b border-divider" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 h-16 border-b border-divider last:border-b-0">
          <div className="w-10 h-10 rounded-card bg-surface-hover animate-pulse motion-reduce:animate-none shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-surface-hover rounded-control animate-pulse motion-reduce:animate-none" style={{ width: `${40 + ((i * 13) % 30)}%` }} />
            <div className="h-3 bg-surface-hover/70 rounded-control animate-pulse motion-reduce:animate-none" style={{ width: `${25 + ((i * 7) % 20)}%` }} />
          </div>
          <div className="w-20 h-6 bg-surface-hover rounded-full animate-pulse motion-reduce:animate-none shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ entity, onRetry }: { entity: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-danger-ink" />
      </div>
      <h2 className="text-lg font-bold text-ink mb-1">Couldn't load {entity}</h2>
      <p className="text-sm text-ink-muted max-w-sm mb-6">Something went wrong reaching the clinic's device service. Check your connection and try again.</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-card text-base font-bold hover:bg-ink transition-colors shadow-sm">
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, cta }: { icon: LucideIcon; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink-muted" />
      </div>
      <h2 className="text-lg font-bold text-ink mb-1">{title}</h2>
      <p className="text-sm text-ink-muted max-w-sm mb-6">{body}</p>
      {cta}
    </div>
  );
}
