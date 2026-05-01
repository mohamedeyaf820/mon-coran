import React from "react";
import { cn } from "../../lib/utils";

export default function ModeNavigation({
  className,
  buttonClassName,
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  centerContent = null,
  lang,
}) {
  return (
    <nav
      className={cn(
        "mode-nav flex items-center justify-between gap-4 mt-6 py-4 border-t border-[var(--border)]",
        className,
      )}
      aria-label="Navigation"
    >
      <button
        onClick={onPrevious}
        disabled={previousDisabled}
        className={cn(
          "mode-nav-btn mode-nav-btn--previous flex items-center gap-2 px-5 py-2.5 rounded-full",
          "font-[var(--font-ui)] text-sm font-semibold",
          "border border-[rgba(var(--primary-rgb),0.25)] text-[var(--primary)]",
          "transition-all duration-200",
          "hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_4px_12px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-px",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--primary)] disabled:hover:shadow-none disabled:hover:translate-y-0",
          buttonClassName,
        )}
      >
        <i
          className={`fas fa-arrow-${lang === "ar" ? "right" : "left"} text-xs`}
        />
        <span className="hidden sm:inline">{previousLabel}</span>
      </button>

      {centerContent}

      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={cn(
          "mode-nav-btn mode-nav-btn--next flex items-center gap-2 px-5 py-2.5 rounded-full",
          "font-[var(--font-ui)] text-sm font-semibold",
          "bg-[var(--primary)] text-white",
          "shadow-[0_3px_10px_rgba(var(--primary-rgb),0.3)]",
          "transition-all duration-200",
          "hover:shadow-[0_6px_18px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-px",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0",
          buttonClassName,
        )}
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <i
          className={`fas fa-arrow-${lang === "ar" ? "left" : "right"} text-xs`}
        />
      </button>
    </nav>
  );
}
