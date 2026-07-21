import React from "react";

// Buttons, DESIGN_STYLE.md §5.8. Only one "primary" (gradient) button is
// meant to exist per page (§5.6, "one gradient CTA") — every other save/
// submit action on a page should use "secondary", not a second gradient.
export type FrostedButtonVariant = "primary" | "secondary" | "destructive" | "ghost-destructive";

export function GlassButton({ children, variant = "secondary", onClick, disabled, title, className = "" }: {
  children: React.ReactNode;
  variant?: FrostedButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const base = "px-4 py-2.5 rounded-[var(--radius-frosted-sm)] text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center justify-center gap-2";

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={title}
        className={`${base} cursor-not-allowed ${className}`}
        style={{ backgroundColor: "color-mix(in srgb, var(--ink-400) 12%, transparent)", color: "var(--ink-400)" }}
      >
        {children}
      </button>
    );
  }

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        title={title}
        className={`${base} text-white hover:brightness-110 focus-visible:ring-[var(--phenome-blue-400)] ${className}`}
        style={{ backgroundColor: "var(--phenome-blue-400)" }}
      >
        {children}
      </button>
    );
  }

  if (variant === "destructive") {
    return (
      <button
        onClick={onClick}
        title={title}
        className={`${base} text-white hover:brightness-105 focus-visible:ring-[var(--status-danger)] ${className}`}
        style={{ backgroundColor: "var(--status-danger)" }}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost-destructive") {
    return (
      <button
        onClick={onClick}
        title={title}
        className={`${base} bg-transparent hover:underline focus-visible:ring-[var(--status-danger)] ${className}`}
        style={{ color: "var(--status-danger)" }}
      >
        {children}
      </button>
    );
  }

  // secondary
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${base} bg-white/70 backdrop-blur-sm hover:bg-white focus-visible:ring-[var(--phenome-blue-400)] ${className}`}
      style={{ color: "var(--phenome-blue-500)", border: "1px solid var(--divider)" }}
    >
      {children}
    </button>
  );
}
