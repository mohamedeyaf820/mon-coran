import React, { useState, useRef, useEffect } from "react";
import { Settings, Play, Loader2, Home, ChevronDown, BookOpen, AlignJustify, Languages } from "lucide-react";
import { cn } from "../../lib/utils";
import { getSurah, toAr } from "../../data/surahs";
import { t } from "../../i18n";

function lbl(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

/**
 * QCReaderHeader — sticky reading page header inspired by Quran.com.
 *
 * Layout:
 *   [← Home]  [Surah name ▾]  [Page · Juz]     [View pills]     [⚙] [▶]
 */
export default function QCReaderHeader({
  lang,
  displayMode,
  currentSurah,
  currentPage,
  currentJuz,
  readingView,           // "verseByVerse" | "translation" | "reading"
  onReadingViewChange,   // (view) => void
  onSettingsOpen,
  onPlaySurah,
  onGoHome,
  preparingSurah,
  isPlaying,
}) {
  const surahMeta = getSurah(currentSurah);
  const [surahDropOpen, setSurahDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!surahDropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setSurahDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [surahDropOpen]);

  const surahDisplayName =
    lang === "ar"
      ? surahMeta?.ar || `سورة ${currentSurah}`
      : lang === "fr"
      ? surahMeta?.fr || surahMeta?.en || `Sourate ${currentSurah}`
      : surahMeta?.en || `Surah ${currentSurah}`;

  const contextBadge =
    displayMode === "page"
      ? `${lbl(lang, "Page", "Page", "صفحة")} ${lang === "ar" ? toAr(currentPage) : currentPage}`
      : displayMode === "juz"
      ? `${lbl(lang, "Juz", "Juz", "جزء")} ${lang === "ar" ? toAr(currentJuz) : currentJuz}`
      : `${lbl(lang, "S.", "S.", "س.")}${currentSurah}`;

  const isPreparing = Boolean(preparingSurah);

  return (
    <header
      className={cn(
        "qc-reader-header sticky top-0 z-[200]",
        "flex items-center gap-2 px-3 sm:px-4 h-[56px]",
        "border-b border-[var(--border)]",
        "bg-[var(--bg-primary)]/95 backdrop-blur-xl",
        "shadow-[0_1px_8px_rgba(0,0,0,0.06)]",
      )}
      role="banner"
    >
      {/* ── Left: Back home ── */}
      <button
        type="button"
        onClick={onGoHome}
        title={lbl(lang, "Accueil", "Home", "الرئيسية")}
        aria-label={lbl(lang, "Retour à l'accueil", "Back to home", "العودة للرئيسية")}
        className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)] transition-all shrink-0"
      >
        <Home size={16} />
      </button>

      {/* ── Center-left: Surah/page/juz selector ── */}
      <div className="relative flex items-center gap-2 min-w-0 flex-1" ref={dropRef}>
        <button
          type="button"
          onClick={() => setSurahDropOpen((v) => !v)}
          aria-expanded={surahDropOpen}
          aria-haspopup="listbox"
          className={cn(
            "flex items-center gap-1.5 max-w-[200px] min-w-0",
            "font-[var(--font-ui)] font-bold text-[0.88rem] text-[var(--text-primary)]",
            "hover:text-[var(--primary)] transition-colors",
          )}
        >
          <span className="truncate">{surahDisplayName}</span>
          <ChevronDown size={14} className={cn("shrink-0 transition-transform duration-200", surahDropOpen && "rotate-180")} />
        </button>

        {/* Context badge */}
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.62rem] font-semibold text-[var(--text-muted)] shrink-0">
          {contextBadge}
        </span>

        {/* Juz badge (in surah mode) */}
        {displayMode === "surah" && currentJuz && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.62rem] font-semibold text-[var(--text-muted)] shrink-0">
            {lbl(lang, "Juz", "Juz", "جزء")} {lang === "ar" ? toAr(currentJuz) : currentJuz}
          </span>
        )}

        {/* Page badge (in surah mode) */}
        {displayMode === "surah" && currentPage && (
          <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.62rem] font-semibold text-[var(--text-muted)] shrink-0">
            {lbl(lang, "Page", "Page", "صفحة")} {lang === "ar" ? toAr(currentPage) : currentPage}
          </span>
        )}
      </div>

      {/* ── Center: View mode pills ── */}
      <div
        className="hidden sm:flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 gap-0.5 shrink-0"
        role="group"
        aria-label={lbl(lang, "Mode de lecture", "Reading mode", "وضع القراءة")}
      >
        <button
          type="button"
          role="radio"
          aria-checked={readingView === "verseByVerse"}
          onClick={() => onReadingViewChange("verseByVerse")}
          title={lbl(lang, "Verset par verset", "Verse by verse", "آية بآية")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[0.72rem] font-semibold transition-all duration-150",
            readingView === "verseByVerse"
              ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm border border-[rgba(var(--primary-rgb),0.18)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          <AlignJustify size={13} />
          <span className="hidden md:inline">{lbl(lang, "Versets", "Verses", "الآيات")}</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={readingView === "translation"}
          onClick={() => onReadingViewChange("translation")}
          title={lbl(lang, "Traduction", "Translation", "Translation")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[0.72rem] font-semibold transition-all duration-150",
            readingView === "translation"
              ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm border border-[rgba(var(--primary-rgb),0.18)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          <Languages size={13} />
          <span className="hidden md:inline">{lbl(lang, "Traduction", "Translation", "Translation")}</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={readingView === "reading"}
          onClick={() => onReadingViewChange("reading")}
          title={lbl(lang, "Lecture", "Reading", "القراءة")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[0.72rem] font-semibold transition-all duration-150",
            readingView === "reading"
              ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm border border-[rgba(var(--primary-rgb),0.18)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          <BookOpen size={13} />
          <span className="hidden md:inline">{lbl(lang, "Lecture", "Reading", "قراءة")}</span>
        </button>
      </div>

      {/* ── Right: Settings + Play ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Mobile view toggle (icon only) */}
        <button
          type="button"
          onClick={() =>
            onReadingViewChange(
              readingView === "verseByVerse"
                ? "translation"
                : readingView === "translation"
                  ? "reading"
                  : "verseByVerse",
            )
          }
          title={readingView === "reading"
            ? lbl(lang, "Verset par verset", "Verse by verse")
            : lbl(lang, "Vue lecture", "Reading view")}
          className="sm:hidden h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)] transition-all"
        >
          {readingView === "verseByVerse" ? (
            <Languages size={15} />
          ) : readingView === "translation" ? (
            <BookOpen size={15} />
          ) : (
            <AlignJustify size={15} />
          )}
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onSettingsOpen}
          title={lbl(lang, "Paramètres", "Settings", "الإعدادات")}
          aria-label={lbl(lang, "Paramètres d'affichage", "Display settings", "إعدادات العرض")}
          className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)] transition-all"
        >
          <Settings size={15} />
        </button>

        {/* Play button */}
        <button
          type="button"
          onClick={onPlaySurah}
          disabled={isPreparing}
          title={lbl(lang, "Écouter", "Listen", "استمع")}
          aria-label={lbl(lang, "Écouter la sourate", "Listen", "استمع")}
          className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-full",
            "font-[var(--font-ui)] text-[0.72rem] font-semibold",
            "bg-[var(--primary)] text-white",
            "shadow-[0_2px_10px_rgba(var(--primary-rgb),0.35)]",
            "hover:brightness-110 active:scale-95 transition-all duration-150",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isPreparing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          <span className="hidden sm:inline">
            {isPreparing
              ? lbl(lang, "Chargement", "Loading")
              : lbl(lang, "Écouter", "Listen", "استمع")}
          </span>
        </button>
      </div>
    </header>
  );
}
