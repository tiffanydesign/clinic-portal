import * as React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // When disabled, the WHY must be explicable — either pass this (renders
  // as a title tooltip) or handle onClick yourself to toast a reason. A
  // disabled button with no explanation anywhere is a dead end for the user.
  disabledReason?: string;
  // In-flight state for an async action (submit, save, delete...). Distinct
  // from `disabled`: the button keeps its normal fill (never dims — dimming
  // reads as "unavailable", not "working") and swaps its leading content for
  // a spinner instead. Still blocks re-clicks like disabled does.
  loading?: boolean;
};

// .btn-primary is theme.css's own existing primary-button component class
// (solid Phenome Blue, no gradient) — reused here rather than re-declaring
// the same fill/hover colours a second time.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "bg-surface text-ink-soft border border-divider hover:bg-surface-hover",
  ghost: "bg-transparent text-ink-soft border border-transparent hover:bg-surface-hover",
  destructive: "bg-danger-ink text-white border border-transparent hover:opacity-90",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  // v4: button height dropped 40px -> 36px (--button-h), independent of
  // Input/Select which stay at --control-h (40px) — the two were split
  // apart in the compaction pass since only Button was asked to shrink.
  default: "h-[var(--button-h)] px-[14px] text-data",
  sm: "h-[var(--control-h-sm)] px-3 text-label",
  // 36x36 icon-only button (no label) — same visual height as `sm`, square.
  icon: "h-[var(--control-h-sm)] w-[var(--control-h-sm)] p-0 shrink-0",
};

// The ONE Button implementation for the whole app — four variants only
// (Primary/Secondary/Ghost/Destructive), never a fifth ad-hoc style at a
// call site. .touch-extend is unconditional: every Button always has a
// real ≥44pt hit area even at the compact `sm` visual height, so no call
// site can forget it.
//
// A flat neutral grey — never a dimmed version of the variant's own colour
// (dimming a coloured fill still reads as "that action, fainter", not
// "unavailable"). Same look regardless of variant, so Disabled is instantly
// recognisable at a glance across Primary/Secondary/Ghost/Destructive alike.
const DISABLED_CLASS = "bg-surface-hover text-ink-muted border border-divider cursor-not-allowed";

// Four states, all driven from here (never re-implemented at a call site):
// Normal / Hover are the variant's own CSS (:hover on btn-primary, hover:
// utilities on the other three — no separate Active/pressed treatment);
// Disabled swaps the variant's fill out entirely for a flat grey + blocks
// clicks; Loading blocks clicks WITHOUT dimming (full colour + spinner)
// since "in progress" must read differently from "unavailable" — see the
// Design System's Controls page for a live example.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", disabledReason, disabled, loading, className = "", title, children, ...props }, ref) => {
    const isInteractionBlocked = disabled || loading;
    const isDisabledLook = disabled && !loading;
    return (
      <button
        ref={ref}
        disabled={isInteractionBlocked}
        aria-busy={loading || undefined}
        title={disabled ? (disabledReason ?? title) : title}
        className={`touch-extend inline-flex items-center justify-center gap-2 rounded-control font-bold transition-colors
          ${SIZE_CLASS[size]} ${isDisabledLook ? DISABLED_CLASS : VARIANT_CLASS[variant]}
          ${loading ? "cursor-wait" : ""}
          ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
