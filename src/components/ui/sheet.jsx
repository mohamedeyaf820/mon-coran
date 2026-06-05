import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "right",
  size = "md",
  showCloseButton = true,
  className,
}) {
  const sheetRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const sideClasses = {
    right: "right-0 top-0 h-full border-l",
    left: "left-0 top-0 h-full border-r",
    bottom: "bottom-0 left-0 right-0 max-h-[90vh] border-t rounded-t-3xl",
  };

  const sizeClasses = {
    sm: side === "bottom" ? "max-h-[40vh]" : "w-80",
    md: side === "bottom" ? "max-h-[60vh]" : "w-96",
    lg: side === "bottom" ? "max-h-[80vh]" : "w-[480px]",
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]" role="dialog" aria-modal="true" aria-labelledby={title ? "sheet-title" : undefined}>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={cn(
          "fixed z-10 bg-[var(--bg-card)]",
          "animate-slideIn",
          sideClasses[side] || sideClasses.right,
          sizeClasses[size] || sizeClasses.md,
          "overflow-y-auto",
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:rotate-90"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        )}
        {title && (
          <h2 id="sheet-title" className="px-6 pt-6 text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
        )}
        <div className={cn(!title && "pt-6")}>{children}</div>
      </div>
    </div>
  );
}
