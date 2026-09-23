import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAppLocale } from "../../context/AppContext";
import { t } from "../../i18n";

// Mirrors the trap used by `ui/modal.jsx` and the ayah action sheets so every
// dismissible surface keeps keyboard focus inside itself while it is open.
const SHEET_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  const { lang } = useAppLocale();
  const sheetRef = useRef(null);
  const restoreFocusRef = useRef(null);
  // `onClose` is usually an inline arrow in the parent: reading it through a
  // ref keeps a fresh identity from re-running the focus effect and stealing
  // focus from the user while the sheet is open.
  const closeHandlerRef = useRef(onClose);

  useEffect(() => {
    closeHandlerRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const sheet = sheetRef.current;
    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = sheet?.querySelector(SHEET_FOCUSABLE_SELECTOR);
      (firstFocusable || sheet)?.focus();
    }, 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeHandlerRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;

      const focusable = Array.from(
        sheet.querySelectorAll(SHEET_FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );

      if (!focusable.length) {
        event.preventDefault();
        sheet.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !sheet.contains(active);

      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const restoreTarget = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restoreTarget?.isConnected) restoreTarget.focus();
    };
  }, [open]);

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
        tabIndex={-1}
        className={cn(
          "fixed z-10 bg-[var(--bg-card)] outline-none",
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
            className="absolute top-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:rotate-90"
            aria-label={t("audio.close", lang)}
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
