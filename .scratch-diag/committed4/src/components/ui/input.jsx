import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-sm shadow-xs",
        "text-[var(--text-primary)] font-[var(--font-ui)]",
        "transition-colors duration-150",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)]",
        "placeholder:text-[var(--text-muted)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-primary)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
