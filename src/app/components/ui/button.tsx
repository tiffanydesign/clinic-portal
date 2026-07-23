import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // When disabled, the WHY must be explicable — either pass this (renders
  // as a title tooltip) or handle onClick yourself to toast a reason. A
  // disabled button with no explanation anywhere is a dead end for the user.
  disabledReason?: string;
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
  default: "h-[var(--control-h)] px-4 text-data",
  sm: "h-[var(--control-h-sm)] px-3 text-label",
};

// The ONE Button implementation for the whole app — four variants only
// (Primary/Secondary/Ghost/Destructive), never a fifth ad-hoc style at a
// call site. .touch-extend is unconditional: every Button always has a
// real ≥44pt hit area even at the compact `sm` visual height, so no call
// site can forget it.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", disabledReason, disabled, className = "", title, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        title={disabled ? (disabledReason ?? title) : title}
        className={`touch-extend inline-flex items-center justify-center gap-2 rounded-control font-bold transition-colors
          ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
