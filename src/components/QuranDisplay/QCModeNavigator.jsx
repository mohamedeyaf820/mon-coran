import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { t } from "../../i18n";

export default function QCModeNavigator({
  lang,
  displayMode,
  currentSurah,
  currentPage,
  currentJuz,
  onPrev,
  onNext,
  centerLabel,
  isPrevDisabled,
  isNextDisabled,
}) {
  const isRtl = lang === "ar";

  const labels = {
    surah: {
      prev: t("quran.prevSurah", lang),
      next: t("quran.nextSurah", lang),
    },
    page: {
      prev: t("quran.prevPage", lang),
      next: t("quran.nextPage", lang),
    },
    juz: {
      prev: t("quran.prevJuz", lang),
      next: t("quran.nextJuz", lang),
    },
  };

  const modeLabels = labels[displayMode] || labels.surah;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      className="qc-mode-navigator flex items-center justify-between gap-4 px-4 py-5 border-t border-[var(--border)]"
      aria-label={t("nav.navigation", lang)}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={isPrevDisabled}
        aria-label={modeLabels.prev}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full",
          "font-[var(--font-ui)] text-sm font-semibold",
          "border border-[rgba(var(--primary-rgb),0.25)] text-[var(--primary)]",
          "transition-all duration-200",
          "hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-px",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--primary)] disabled:hover:shadow-none disabled:hover:translate-y-0",
        )}
      >
        <PrevIcon size={16} />
        <span className="hidden sm:inline">{modeLabels.prev}</span>
      </button>

      {centerLabel && (
        <div className="flex-1 text-center">
          <span className="inline-flex items-center justify-center min-w-[80px] px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] font-[var(--font-ui)] text-[0.8rem] font-semibold text-[var(--text-secondary)]">
            {centerLabel}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        aria-label={modeLabels.next}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full",
          "font-[var(--font-ui)] text-sm font-semibold",
          "bg-[var(--primary)] text-white",
          "shadow-[0_3px_10px_rgba(var(--primary-rgb),0.3)]",
          "transition-all duration-200",
          "hover:shadow-[0_6px_18px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-px",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0",
        )}
      >
        <span className="hidden sm:inline">{modeLabels.next}</span>
        <NextIcon size={16} />
      </button>
    </nav>
  );
}
