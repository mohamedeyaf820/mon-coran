import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-white shadow",
        secondary:
          "border-transparent bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
        destructive:
          "border-transparent bg-[var(--color-error)] text-white shadow",
        outline:
          "text-[var(--text-primary)] border-[var(--border)]",
        gold:
          "border-[rgba(184,134,11,0.3)] bg-[var(--gold-pale)] text-[var(--gold)]",
        success:
          "border-transparent bg-[rgba(27,94,59,0.1)] text-[var(--emerald)]",
        muted:
          "border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[0.65rem]",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-px text-[0.6rem]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
