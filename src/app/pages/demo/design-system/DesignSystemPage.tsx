import React from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { DesignSystemLogo } from "./DesignSystemLogo";
import { DesignSystemColors } from "./DesignSystemColors";
import { DesignSystemTypography } from "./DesignSystemTypography";
import { DesignSystemSpacing } from "./DesignSystemSpacing";
import { DesignSystemLayout } from "./DesignSystemLayout";
import { DesignSystemControls } from "./DesignSystemControls";
import { DesignSystemCards } from "./DesignSystemCards";

const SECTIONS = [
  { id: "logo", label: "Logo" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing / Radius / Height" },
  { id: "layout", label: "Page Layout" },
  { id: "controls", label: "Controls" },
  { id: "cards", label: "Cards" },
];

// The living, single-source-of-truth showcase of the frozen design tokens
// and standardized components. Demo-build only (see App.tsx's IS_DEMO_BUILD
// gate) — never reachable from any role's sidebar, never bundled into the
// official build. Every value on this page renders from an actual token or
// an actual shared component; nothing here is a copied literal.
export function DesignSystemPage() {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto bg-surface-page">
      <div className="sticky top-0 z-10 h-12 px-4 border-b border-divider bg-surface flex items-center gap-3">
        {/* Full-page nav, not a modal — matches the app's own Back
            convention (JourneyDetailPage, PatientHeader) rather than a
            corner X, which reads as "close" not "return to where I was". */}
        <button
          onClick={() => navigate(-1)}
          className="touch-extend flex items-center gap-1 text-sm font-bold text-ink-muted hover:text-ink transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-divider shrink-0" />
        <h1 className="text-sm font-bold text-ink">Design System</h1>
      </div>
      <div className="flex">
        <nav className="w-44 shrink-0 h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto p-4 border-r border-divider bg-surface">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block py-1.5 text-sm text-ink-soft hover:text-ink">{s.label}</a>
          ))}
        </nav>
        <div className="flex-1 min-w-0 p-6 space-y-10">
          <DesignSystemLogo />
          <DesignSystemColors />
          <DesignSystemTypography />
          <DesignSystemSpacing />
          <DesignSystemLayout />
          <DesignSystemControls />
          <DesignSystemCards />
        </div>
      </div>
    </div>
  );
}
