import React from "react";
import {
  Brain,
  BookOpen,
  Languages,
  List,
  Loader2,
  Palette,
  Play,
  Pause,
  Type,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import ArabicFontControls from "../ArabicFontControls";
import HizbRukuNavigator from "./HizbRukuNavigator";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
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

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";

  const toggleMushaf = onToggleMushaf || (() =>
    set({
      mushafLayout: mushafIsOn ? "list" : "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
    }));

  const toggleMemorization =
    onToggleMemorization ||
    (() =>
      set({
        memMode: !memMode,
        mushafLayout: "list",
        showWordByWord: false,
      }));

  // Determine if audio is playing for this specific surah/page
  const isPlayingThisContext = isPlaying;

  return (
    <div
      className="qc-reader-toolbar sticky top-[var(--header-h,68px)] z-40 mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-[980px] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300"
      style={{
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
        color: "var(--text-primary)"
      }}
      role="toolbar"
      aria-label={labelFor(lang, "Outils de lecture", "Reading tools")}
    >
      {/* 1. LEFT SECTION: Context label & Navigator */}
      <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-3 flex-wrap">
        {contextLabel && (
          <span className="px-3 py-1.5 rounded-xl bg-[rgba(var(--primary-rgb),0.06)] text-[var(--primary)] text-[0.72rem] font-bold font-[var(--font-ui)] tracking-wide shrink-0">
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

      {/* 2. CENTER SECTION: View Switcher & Toggles */}
      <div className="flex w-full md:w-auto items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-start md:justify-center">
        {/* Segmented control for Mushaf vs List */}
        <div className="flex items-center gap-1 rounded-xl bg-[var(--bg-secondary)] p-1 border border-[var(--border)] shrink-0">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              mushafIsOn
                ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            onClick={toggleMushaf}
          >
            <BookOpen size={13} />
            <span>Mushaf</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              !mushafIsOn
                ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            onClick={toggleMushaf}
          >
            <List size={13} />
            <span>{labelFor(lang, "Liste", "List")}</span>
          </button>
        </div>

        {/* Small separator */}
        <div className="h-6 w-[1px] bg-[var(--border)] shrink-0 hidden sm:block mx-1" />

        {/* Feature Toggles Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Translation Toggle */}
          <button
            type="button"
            className={cn(
              "reader-toolbar-btn--word-by-word",
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              showTranslation
                ? "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] border-[rgba(var(--primary-rgb),0.2)]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => set({ showTranslation: !showTranslation })}
            title={labelFor(lang, "Traduction", "Translation")}
          >
            <Languages size={13} />
            <span>{labelFor(lang, "Traduction", "Translation")}</span>
          </button>

          {/* Word By Word Toggle */}
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              showWordByWord
                ? "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] border-[rgba(var(--primary-rgb),0.2)]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={onToggleWordByWord || (() => set({ showWordByWord: !showWordByWord, memMode: false }))}
            title={labelFor(lang, "Mot à mot", "Word by word")}
          >
            <Type size={13} />
            <span>{labelFor(lang, "Mot à mot", "WbW")}</span>
          </button>

          {/* Tajweed Toggle */}
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              showTajwid
                ? "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] border-[rgba(var(--primary-rgb),0.2)]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => set({ showTajwid: !showTajwid })}
            title="Tajweed"
          >
            <Palette size={13} />
            <span>Tajweed</span>
          </button>

          {/* Memorization Toggle */}
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
              memMode
                ? "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] border-[rgba(var(--primary-rgb),0.2)]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={toggleMemorization}
            title={labelFor(lang, "Mémorisation", "Memorization")}
          >
            <Brain size={13} />
            <span>{labelFor(lang, "Mémorisation", "Memo")}</span>
          </button>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Font Adjustments & Primary Play Button */}
      <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-[var(--border)] flex-wrap">
        <ArabicFontControls lang={lang} compact />
        
        {playHandler && (
          <button
            type="button"
            onClick={playHandler}
            disabled={isPreparing}
            className={cn(
              "reader-toolbar-btn--primary btn-play-surah",
              "flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50",
              isPlayingThisContext
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[var(--primary)] hover:bg-[var(--primary-dark,var(--primary))]"
            )}
            title={playLabel || labelFor(lang, "Écouter", "Listen")}
          >
            {isPreparing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isPlayingThisContext ? (
              <Pause size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
            <span>
              {isPreparing
                ? labelFor(lang, "Chargement", "Loading")
                : isPlayingThisContext
                ? labelFor(lang, "Pause", "Pause")
                : labelFor(lang, "Écouter", "Listen")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
