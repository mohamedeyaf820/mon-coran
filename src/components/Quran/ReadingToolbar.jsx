import React from "react";
import {
  BookOpen,
  GraduationCap,
  Languages,
  List,
  Loader2,
  Palette,
  Play,
  Type,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

function ToolbarButton({
  active = false,
  primary = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        "reader-toolbar-btn inline-flex min-h-[34px] items-center gap-[5px] whitespace-nowrap rounded-[20px] border px-[11px] py-[6px]",
        "font-ui text-[0.75rem] font-medium transition duration-150",
        primary
          ? "reader-toolbar-btn--primary border-[var(--emerald)] bg-[linear-gradient(135deg,var(--emerald),var(--emerald-lit))] text-white shadow-[0_6px_16px_rgba(var(--primary-rgb),0.28)] disabled:opacity-65 disabled:shadow-none"
          : active
            ? "active border-[var(--emerald)] bg-[linear-gradient(135deg,var(--emerald),var(--emerald-lit))] text-white"
            : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--emerald)] hover:bg-[var(--emerald-tint)] hover:text-[var(--emerald)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * ReadingToolbar – Quran.com-style compact toolbar below the surah header.
 * Provides quick access to translation, word-by-word, tajweed, and font size.
 */
export default function ReadingToolbar({ surahNum, onPlaySurah, preparingSurah }) {
  const { state, set } = useApp();
  const {
    lang,
    showTranslation,
    showTajwid,
    showWordByWord,
    memMode,
    mushafLayout,
  } = state;

  const toggleTranslation = () => set({ showTranslation: !showTranslation });
  const toggleTajweed = () => set({ showTajwid: !showTajwid });
  const toggleWBW = () => set({ showWordByWord: !showWordByWord, memMode: false });
  const toggleMushaf = () =>
    set({
      mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
      fontFamily: "mushaf-tajweed",
    });
  const toggleMem = () => set({ memMode: !memMode, showWordByWord: false, mushafLayout: "list" });
  const mushafIsOn = mushafLayout === "mushaf";

  return (
    <div
      className="reader-toolbar sticky top-[var(--header-h,68px)] z-50 flex items-center justify-between gap-[10px] border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] px-[14px] py-2 backdrop-blur-[var(--glass-backdrop)] max-md:gap-[7px] max-md:px-[10px]"
      role="toolbar"
      aria-label={t("settings.title", lang)}
    >
      <div className="reader-toolbar__left flex items-center gap-[6px] max-md:gap-1">
        <ToolbarButton
          primary
          onClick={onPlaySurah}
          disabled={preparingSurah === surahNum}
          aria-label={t("audio.playSurah", lang)}
          className="gap-2 max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
        >
          {preparingSurah === surahNum ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          <span className="hidden sm:inline">
            {preparingSurah === surahNum
              ? lang === "fr" ? "Chargement..." : "Loading..."
              : t("audio.playSurah", lang)}
          </span>
        </ToolbarButton>
      </div>

      <div className="reader-toolbar__center flex flex-1 flex-wrap items-center justify-center gap-1 max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          active={mushafIsOn}
          onClick={toggleMushaf}
          title={
            mushafIsOn
              ? lang === "fr"
                ? "Revenir a la vue liste"
                : "Switch to list view"
              : lang === "fr"
                ? "Passer en vue Mushaf"
                : "Switch to Mushaf view"
          }
          aria-pressed={mushafIsOn}
          className="max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
        >
          {mushafIsOn ? <List size={16} /> : <BookOpen size={16} />}
          <span className="hidden md:inline">
            {mushafIsOn
              ? lang === "fr"
                ? "Liste"
                : "List"
              : "Mushaf"}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showTranslation}
          onClick={toggleTranslation}
          title={lang === "fr" ? "Traduction" : "Translation"}
          aria-pressed={showTranslation}
          className="max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
        >
          <Languages size={16} />
          <span className="hidden md:inline">
            {lang === "fr" ? "Traduction" : "Translation"}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showTajwid}
          onClick={toggleTajweed}
          title={lang === "fr" ? "Couleurs Tajwid" : "Tajweed Colors"}
          aria-pressed={showTajwid}
          className="max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
        >
          <Palette size={16} />
          <span className="hidden md:inline">Tajweed</span>
        </ToolbarButton>

        <ToolbarButton
            active={showWordByWord}
            onClick={toggleWBW}
            title={lang === "fr" ? "Mot à mot" : "Word by Word"}
            aria-pressed={showWordByWord}
            className="max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
          >
            <Type size={16} />
            <span className="hidden md:inline">
              {lang === "fr" ? "Mot à mot" : "WbW"}
            </span>
            <span className="md:hidden">
              {lang === "fr" ? "M-à-M" : "WbW"}
            </span>
        </ToolbarButton>
      </div>

      <div className="reader-toolbar__right flex items-center gap-[6px] max-md:gap-1">
        <ToolbarButton
          active={memMode}
          onClick={toggleMem}
          title={lang === "fr" ? "Mémorisation" : "Memorize"}
          aria-pressed={memMode}
          className="max-md:min-h-[33px] max-md:px-[9px] max-md:py-[6px] max-md:text-[0.71rem]"
        >
          <GraduationCap size={16} />
          <span className="hidden md:inline">
            {lang === "fr" ? "Mémo" : "Mem"}
          </span>
        </ToolbarButton>
      </div>
    </div>
  );
}
