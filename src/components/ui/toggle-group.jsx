import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cn } from "../../lib/utils"

const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
})

const toggleGroupVariants = {
  base: "inline-flex items-center justify-center gap-1 rounded-lg bg-white/[0.06] border border-white/[0.08] p-1",
  variants: {
    variant: {
      default: "",
      outline: "border border-[var(--border)]",
    },
    size: {
      default: "",
      sm: "gap-0.5 p-0.5",
      lg: "gap-1.5 p-1.5",
    },
  },
}

const toggleItemVariants = {
  base: "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,175,55,0.5)] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  variants: {
    variant: {
      default: "bg-transparent text-white/50 border border-transparent hover:text-white/75 hover:bg-white/[0.05] data-[state=on]:bg-white/[0.16] data-[state=on]:text-white data-[state=on]:shadow-[0_1px_4px_rgba(0,0,0,0.1)] data-[state=on]:border-white/[0.18]",
      outline: "border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white data-[state=on]:border-[var(--primary)]",
      ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] data-[state=on]:bg-[var(--primary-light)] data-[state=on]:text-[var(--primary)]",
    },
    size: {
      default: "px-2.5 py-[5px] text-[0.68rem]",
      sm: "px-2 py-1 text-[0.62rem]",
      lg: "px-3.5 py-2 text-sm",
    },
  },
}

function getVariantClasses(variants, variant, size) {
  const variantClass = variants.variants?.variant?.[variant] || ""
  const sizeClass = variants.variants?.size?.[size] || ""
  return `${variants.base} ${variantClass} ${sizeClass}`
}

const ToggleGroup = React.forwardRef(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(
        getVariantClasses(toggleGroupVariants, variant, size),
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
)
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef(
  ({ className, children, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    const resolvedVariant = variant || context.variant
    const resolvedSize = size || context.size

    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          getVariantClasses(toggleItemVariants, resolvedVariant, resolvedSize),
          className
        )}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    )
  }
)
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
