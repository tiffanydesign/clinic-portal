import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

// Same label-on-top/error/disabled contract as Input (see input.tsx) —
// the two must always look like one family, never diverge independently.
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, disabled, rows = 3, ...props }, ref) => {
    const taId = id ?? React.useId();
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={taId} className="text-label font-medium text-ink-soft mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          className={`px-3 py-2 min-h-[80px] rounded-control border text-data bg-surface outline-none transition-colors resize-y
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
Textarea.displayName = "Textarea";
