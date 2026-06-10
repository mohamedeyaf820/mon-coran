import React, { useEffect, useState } from "react";
import {
  Brain,
  BookOpen,
  Languages,
  List,
  Loader2,
  Palette,
  Pause,
  Play,
  Type,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import audioService from "../../services/audioService";
import ArabicFontControls from "../ArabicFontControls";
import HizbRukuNavigator from "./HizbRukuNavigator";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

function toolbarLabelsFor(lang) {
  return {
    toolbar: labelFor(lang, "Outils de lecture", "Reading tools", "\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0642\u0631\u0627\u0621\u0629"),
    mushaf: labelFor(lang, "Mushaf", "Mushaf", "\u0627\u0644\u0645\u0635\u062d\u0641"),
    list: labelFor(lang, "Liste", "List", "\u0642\u0627\u0626\u0645\u0629"),
    translation: labelFor(lang, "Traduction", "Translation", "\u0627\u0644\u062a\u0631\u062c\u0645\u0629"),
    wordByWord: labelFor(lang, "Mot \u00e0 mot", "Word by word", "\u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629"),
    tajweed: labelFor(lang, "Tajweed", "Tajweed", "\u0627\u0644\u062a\u062c\u0648\u064a\u062f"),
    memorization: labelFor(lang, "M\u00e9morisation", "Memorization", "\u0627\u0644\u062d\u0641\u0638"),
    listen: labelFor(lang, "\u00c9couter", "Listen", "\u0627\u0633\u062a\u0645\u0627\u0639"),
    pause: labelFor(lang, "Pause", "Pause", "\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a"),
    loading: labelFor(lang, "Chargement", "Loading", "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644"),
  };
}

export default function ReadingToolbar({
  contextLabel,
  onPlay,
  onPlaySurah,
  playLabel,
  preparingSurah,
  surahNum,
  currentAyah,
  currentPage,
  onNavigateToAyah,
  onToggleMushaf,
  onToggleWordByWord,
  onToggleMemorization,
}) {
  const { state, set } = useApp();
  const {
    currentSurah,
    lang,
    memMode,
    mushafLayout,
    showTajwid,
    showTranslation,
    showWordByWord,
    isPlaying,
  } = state;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";
  const isPlayingThisContext = isPlaying;

  const labels = {
    toolbar: labelFor(lang, "Outils de lecture", "Reading tools", "أدوات القراءة"),
    mushaf: labelFor(lang, "Mushaf", "Mushaf", "المصحف"),
    list: labelFor(lang, "Liste", "List", "قائمة"),
    translation: labelFor(lang, "Traduction", "Translation", "الترجمة"),
    wordByWord: labelFor(lang, "Mot à mot", "Word by word", "كلمة بكلمة"),
    tajweed: labelFor(lang, "Tajweed", "Tajweed", "التجويد"),
    memorization: labelFor(lang, "Mémorisation", "Memorization", "الحفظ"),
    listen: labelFor(lang, "Écouter", "Listen", "استماع"),
    pause: labelFor(lang, "Pause", "Pause", "إيقاف مؤقت"),
    loading: labelFor(lang, "Chargement", "Loading", "جار التحميل"),
  };

  Object.assign(labels, toolbarLabelsFor(lang));

  const setMushafLayout = () => {
    if (mushafIsOn) return;
    if (onToggleMushaf) {
      onToggleMushaf();
      return;
    }
    set({
      mushafLayout: "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
    });
  };

  const setListLayout = () => {
    if (!mushafIsOn) return;
    if (onToggleMushaf) {
      onToggleMushaf();
      return;
    }
    set({ mushafLayout: "list" });
  };

  const toggleMemorization =
    onToggleMemorization ||
    (() =>
      set({
        memMode: !memMode,
        mushafLayout: "list",
        showWordByWord: false,
      }));

  const toggleWordByWord =
    onToggleWordByWord ||
    (() =>
      set({
        showWordByWord: !showWordByWord,
        memMode: false,
      }));

  const handlePrimaryPlay = () => {
    if (isPlayingThisContext) {
      audioService.pause();
      return;
    }
    playHandler?.();
  };

  return (
    <div
      className={cn(
        "qc-reader-toolbar mx-auto mb-6 flex w-full max-w-[980px] flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 backdrop-blur-md transition-all duration-300 md:flex-row",
        scrolled && "qc-reader-toolbar--sticky",
      )}
      style={{
        boxShadow: scrolled
          ? "0 8px 32px -6px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)"
          : "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
        color: "var(--text-primary)",
      }}
      role="toolbar"
      aria-label={labels.toolbar}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
        {contextLabel && (
          <span className="shrink-0 rounded-xl bg-[rgba(var(--primary-rgb),0.06)] px-3 py-1.5 font-[var(--font-ui)] text-[0.72rem] font-bold tracking-wide text-[var(--primary)]">
            {contextLabel}
          </span>
        )}
        <HizbRukuNavigator
          currentSurah={currentSurah}
          currentAyah={currentAyah || 1}
          currentPage={currentPage}
          onNavigate={onNavigateToAyah}
          className="shrink-0"
        />
      </div>

      <div className="scrollbar-none flex w-full items-center justify-start gap-2 overflow-x-auto pb-1 md:w-auto md:justify-center md:pb-0">
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
          <div className="flex items-center gap-1" role="group" aria-label={labels.toolbar}>
            <button
              type="button"
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                mushafIsOn
                  ? "bg-[var(--bg-card)] font-bold text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
              onClick={setMushafLayout}
              aria-pressed={mushafIsOn}
              aria-label={labels.mushaf}
            >
              <BookOpen size={13} aria-hidden="true" />
              <span>{labels.mushaf}</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                !mushafIsOn
                  ? "bg-[var(--bg-card)] font-bold text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
              onClick={setListLayout}
              aria-pressed={!mushafIsOn}
              aria-label={labels.list}
            >
              <List size={13} aria-hidden="true" />
              <span>{labels.list}</span>
            </button>
          </div>
        </div>

        <div className="mx-1 hidden h-6 w-px shrink-0 bg-[var(--border)] sm:block" />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={cn(
              "reader-toolbar-btn--word-by-word flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              showTranslation
                ? "border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={() => set({ showTranslation: !showTranslation })}
            aria-pressed={showTranslation}
            aria-label={labels.translation}
            title={`${labels.translation} (T)`}
          >
            <Languages size={13} aria-hidden="true" />
            <span>{labels.translation}</span>
          </button>

          <button
            type="button"
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              showWordByWord
                ? "border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={toggleWordByWord}
            aria-pressed={showWordByWord}
            aria-label={labels.wordByWord}
            title={`${labels.wordByWord} (W)`}
          >
            <Type size={13} aria-hidden="true" />
            <span>{labels.wordByWord}</span>
          </button>

          <button
            type="button"
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              showTajwid
                ? "border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={() => set({ showTajwid: !showTajwid })}
            aria-pressed={showTajwid}
            aria-label={labels.tajweed}
            title={`${labels.tajweed} (J)`}
          >
            <Palette size={13} aria-hidden="true" />
            <span>{labels.tajweed}</span>
          </button>

          <button
            type="button"
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              memMode
                ? "border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={toggleMemorization}
            aria-pressed={memMode}
            aria-label={labels.memorization}
            title={`${labels.memorization} (M)`}
          >
            <Brain size={13} aria-hidden="true" />
            <span>{labels.memorization}</span>
          </button>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-2.5 md:w-auto md:justify-end md:border-t-0 md:pt-0">
        <ArabicFontControls lang={lang} compact />

        {playHandler && (
          <button
            type="button"
            onClick={handlePrimaryPlay}
            disabled={isPreparing}
            className={cn(
              "reader-toolbar-btn--primary btn-play-surah flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50",
              isPlayingThisContext
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[var(--primary)] hover:bg-[var(--primary-dark,var(--primary))]",
            )}
            aria-label={isPlayingThisContext ? labels.pause : playLabel || labels.listen}
            title={`${isPlayingThisContext ? labels.pause : labels.listen} (Space)`}
          >
            {isPreparing ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : isPlayingThisContext ? (
              <Pause size={13} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={13} fill="currentColor" aria-hidden="true" />
            )}
            <span>
              {isPreparing
                ? labels.loading
                : isPlayingThisContext
                  ? labels.pause
                  : labels.listen}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
