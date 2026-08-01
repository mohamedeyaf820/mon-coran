import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const isRtl = lang === "ar";
  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      className={cn("reader-mode-nav", className)}
      aria-label={lang === "fr" ? "Navigation de lecture" : "Reading navigation"}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={previousDisabled}
        aria-label={previousLabel}
        className={cn(
          "reader-mode-nav__button reader-mode-nav__button--previous",
          buttonClassName,
        )}
      >
        <PreviousIcon size={18} aria-hidden="true" />
        <span>{previousLabel}</span>
      </button>

      {centerContent ? (
        <div className="reader-mode-nav__current">{centerContent}</div>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextLabel}
        className={cn(
          "reader-mode-nav__button reader-mode-nav__button--next",
          buttonClassName,
        )}
      >
        <span>{nextLabel}</span>
        <NextIcon size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
