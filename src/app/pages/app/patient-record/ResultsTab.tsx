import React from "react";
import { Fingerprint } from "lucide-react";

export function ResultsTab() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <div className="w-28 h-28 rounded-full bg-surface-hover flex items-center justify-center mb-6">
        <Fingerprint className="w-14 h-14 text-ink-muted" />
      </div>
      <h2 className="text-xl font-bold text-ink-soft mb-2">Digital Twin — Coming Soon</h2>
      <p className="text-sm text-ink-muted max-w-md">
        Detailed results and health insights will be available here in a future release.
      </p>
    </div>
  );
}
