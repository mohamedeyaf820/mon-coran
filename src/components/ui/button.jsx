import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-dark)] focus-visible:ring-[var(--primary)]",
        destructive:
          "bg-[var(--color-error)] text-white shadow-sm hover:opacity-90 focus-visible:ring-[var(--color-error)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text-primary)] shadow-sm hover:bg-[var(--hover-bg)] hover:border-[var(--border-strong)] focus-visible:ring-[var(--primary)]",
        secondary:
          "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm hover:bg-[var(--bg-tertiary)] focus-visible:ring-[var(--primary)]",
        ghost:
          "text-[var(--text-primary)] hover:bg-[var(--hover-bg)] focus-visible:ring-[var(--primary)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline focus-visible:ring-[var(--primary)]",
        gold: "bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)] text-white shadow-sm hover:opacity-90 focus-visible:ring-[var(--gold)]",
        glass:
          "bg-white/[0.07] text-white/75 hover:bg-white/[0.12] hover:text-white active:scale-95 focus-visible:ring-[var(--gold)]/40 focus-visible:ring-offset-transparent",
        glassActive:
          "bg-white/15 text-white shadow-sm hover:bg-white/[0.2] active:scale-95 focus-visible:ring-[var(--gold)]/40 focus-visible:ring-offset-transparent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
        iconSm: "h-9 w-9 rounded-xl text-xs",
        iconXs: "h-10 w-10 rounded-xl text-[0.9rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
