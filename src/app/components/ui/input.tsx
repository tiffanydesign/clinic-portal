import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

// The ONE Input implementation for the whole app — label sits on top (12px,
// 4px gap below it), never inline/floating: the most robust layout for
// narrow iPad-portrait columns and long Turkish-language labels that don't
// fit beside a control. Visual height is --control-h (40px); disabled and
// error states are baked in here so no call site improvises its own.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, disabled, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-label font-medium text-ink-soft mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          className={`h-[var(--control-h)] px-3 rounded-control border text-data bg-surface outline-none transition-colors
            ${error ? "border-danger focus:ring-2 focus:ring-danger/40" : "border-divider focus:ring-2 focus:ring-info/40 focus:border-border-strong"}
            ${disabled ? "bg-surface-sunken text-ink-muted cursor-not-allowed" : "text-ink"}
            ${className}`}
          {...props}
        />
        {error && <p className="text-label text-danger-ink mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
