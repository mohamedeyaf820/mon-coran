import React, { useEffect, useRef } from "react";
import {
  BookOpen,
  Languages,
  List,
  Loader2,
  Maximize2,
  Palette,
  Pause,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../../context/AppContext";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import audioService from "../../services/audioService";
import ArabicFontControls from "../ArabicFontControls";

function toolbarLabels(lang) {
  return {
    toolbar: t("reader.toolbar", lang),
    mushaf: t("reader.mushaf", lang),
    list: t("reader.list", lang),
    translation: t("reader.translationToggle", lang),
    tajweed: t("reader.tajweedToggle", lang),
    listen: t("reader.listen", lang),
    pause: t("reader.pause", lang),
    loading: t("reader.loading", lang),
    fullscreen: t("reader.fullscreen", lang),
    text: t("reader.text", lang),
  };
}

export default function ReadingToolbar({
  onPlay,
  onPlaySurah,
  playLabel,
  preparingSurah,
  surahNum,
  onToggleMushaf,
  onOpenFullscreen,
}) {
  const { set } = useAppActions();
  const {
    lang,
    mushafLayout,
    showTajwid,
    showTranslation,
    isPlaying,
    readerTypographyOpen,
  } = useAppSelector(
    (s) => ({
      lang: s.lang,
      mushafLayout: s.mushafLayout,
      showTajwid: s.showTajwid,
      showTranslation: s.showTranslation,
      isPlaying: s.isPlaying,
      readerTypographyOpen: s.readerTypographyOpen,
    }),
    shallowEqual,
  );

  const showTypography = Boolean(readerTypographyOpen);

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";
  const isPlayingThisContext = isPlaying;

  const labels = toolbarLabels(lang);

  const setMushafLayout = () => {
    if (mushafIsOn) return;
    if (onToggleMushaf) {
      onToggleMushaf();
      return;
    }
    set({
      mushafLayout: "mushaf",
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

  const handlePrimaryPlay = () => {
    if (isPlayingThisContext) {
      audioService.pause();
      return;
    }
    playHandler?.();
  };

  const typographyRef = useRef(null);
  const typographyTriggerRef = useRef(null);

  useEffect(() => {
    if (!showTypography) return undefined;
    const handlePointerDown = (event) => {
      if (!typographyRef.current?.contains(event.target)) {
        set({ readerTypographyOpen: false });
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        set({ readerTypographyOpen: false });
        typographyTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showTypography, set]);

  return (
    <div
      className={cn(
        "reader-command-bar qc-reader-toolbar mx-auto flex w-full flex-wrap items-center justify-between gap-2.5 p-2.5 transition-all duration-300",
      )}
      role="toolbar"
      aria-label={labels.toolbar}
    >
      {/* ── Left side: View switcher + Study toggles ── */}
      <div className="qc-reader-toolbar__modes flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Segmented Layout Switcher (Mushaf / List) */}
        <div
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 shadow-inner"
          role="group"
          aria-label={labels.toolbar}
        >
          <button
            type="button"
            className={cn(
              "flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
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
              "flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
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

        {/* A printed Mushaf page carries no translation band, so this control
            has no state to show there: the separator and the button go, rather
            than a disabled button parked in the reader's way. */}
        {!mushafIsOn && (
          <>
            <div className="hidden h-5 w-px bg-[var(--border)] sm:block" />

            <button
              type="button"
              className={cn(
                "reader-toolbar-btn--translation flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-all",
                showTranslation
                  ? "border-[rgba(var(--primary-rgb),0.3)] bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] font-bold shadow-sm"
                  : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
              )}
              onClick={() => set({ showTranslation: !showTranslation })}
              aria-pressed={showTranslation}
              aria-label={labels.translation}
              title={`${labels.translation} (T)`}
            >
              <Languages size={13} aria-hidden="true" />
              <span>{labels.translation}</span>
            </button>
          </>
        )}

        {/* Tajweed toggle */}
        <button
          type="button"
          className={cn(
            "reader-toolbar-btn--tajweed flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-all",
            showTajwid
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
              : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
          )}
          onClick={() => set({ showTajwid: !showTajwid })}
          aria-pressed={showTajwid}
          aria-label={labels.tajweed}
          title={`${labels.tajweed} (J)`}
        >
          <Palette size={13} aria-hidden="true" />
          <span>{labels.tajweed}</span>
        </button>
      </div>

      {/* ── Right side: Fullscreen, Typography, Audio ── */}
      <div className="qc-reader-toolbar__utilities flex flex-wrap items-center gap-1.5 sm:gap-2">
        {onOpenFullscreen ? (
          <button
            type="button"
            className="reader-fullscreen-trigger flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all hover:bg-emerald-600/20 hover:border-emerald-600/50 shadow-sm"
            onClick={onOpenFullscreen}
            aria-label={labels.fullscreen}
            title={`${labels.fullscreen} (F)`}
          >
            <Maximize2 size={13} aria-hidden="true" />
            <span>{labels.fullscreen}</span>
          </button>
        ) : null}

        <div className="relative" ref={typographyRef}>
          <button
            type="button"
            ref={typographyTriggerRef}
            className={cn(
              "reader-typography-trigger flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-all",
              showTypography
                ? "border-[rgba(var(--primary-rgb),0.3)] bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] font-bold shadow-sm"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
            )}
            onClick={() => set({ readerTypographyOpen: !showTypography })}
            aria-expanded={showTypography}
            aria-controls="reader-toolbar-typography-panel"
          >
            <SlidersHorizontal size={13} aria-hidden="true" />
            <span>{labels.text}</span>
          </button>

          <div
            id="reader-toolbar-typography-panel"
            className={cn(
              "reader-typography-panel",
              showTypography && "reader-typography-panel--open",
            )}
          >
            <ArabicFontControls lang={lang} compact />
          </div>
        </div>

        {playHandler && (
          <button
            type="button"
            onClick={handlePrimaryPlay}
            disabled={isPreparing}
            className={cn(
              "reader-toolbar-btn--primary btn-play-surah flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
              isPlayingThisContext
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                : "bg-[var(--primary)] hover:brightness-110 shadow-[rgba(var(--primary-rgb),0.25)]",
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
