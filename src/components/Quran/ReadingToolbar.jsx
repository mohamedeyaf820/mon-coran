import React from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import { 
  Play, 
  Loader2, 
  List, 
  BookOpen, 
  Languages, 
  Palette, 
  Type, 
  GraduationCap 
} from "lucide-react";
import { cn } from "../../lib/utils";

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
    riwaya,
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
    <div className="reader-toolbar" role="toolbar" aria-label={t("settings.title", lang)}>
      {/* Left: Play button */}
      <div className="reader-toolbar__left">
        <button
          className="reader-toolbar-btn reader-toolbar-btn--primary"
          onClick={onPlaySurah}
          disabled={preparingSurah === surahNum}
          aria-label={t("audio.playSurah", lang)}
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
        </button>
      </div>

      {/* Center: Reading mode toggles */}
      <div className="reader-toolbar__center" style={{ gap: 4 }}>
        <button
          className={cn("reader-toolbar-btn", mushafIsOn && "active")}
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
        >
          {mushafIsOn ? <List size={16} /> : <BookOpen size={16} />}
          <span className="hidden md:inline">
            {mushafIsOn
              ? lang === "fr"
                ? "Liste"
                : "List"
              : "Mushaf"}
          </span>
        </button>

        <button
          className={cn("reader-toolbar-btn", showTranslation && "active")}
          onClick={toggleTranslation}
          title={lang === "fr" ? "Traduction" : "Translation"}
          aria-pressed={showTranslation}
        >
          <Languages size={16} />
          <span className="hidden md:inline">
            {lang === "fr" ? "Traduction" : "Translation"}
          </span>
        </button>

        <button
          className={cn("reader-toolbar-btn", showTajwid && "active")}
          onClick={toggleTajweed}
          title={lang === "fr" ? "Couleurs Tajwid" : "Tajweed Colors"}
          aria-pressed={showTajwid}
        >
          <Palette size={16} />
          <span className="hidden md:inline">Tajweed</span>
        </button>

        {riwaya !== "warsh" && (
          <button
            className={cn("reader-toolbar-btn", showWordByWord && "active")}
            onClick={toggleWBW}
            title={lang === "fr" ? "Mot à mot" : "Word by Word"}
            aria-pressed={showWordByWord}
          >
            <Type size={16} />
            <span className="hidden md:inline">
              {lang === "fr" ? "Mot à mot" : "WbW"}
            </span>
            <span className="md:hidden">
              {lang === "fr" ? "M-à-M" : "WbW"}
            </span>
          </button>
        )}
      </div>

      {/* Right: View mode */}
      <div className="reader-toolbar__right">
        <button
          className={cn("reader-toolbar-btn", memMode && "active")}
          onClick={toggleMem}
          title={lang === "fr" ? "Mémorisation" : "Memorize"}
          aria-pressed={memMode}
        >
          <GraduationCap size={16} />
          <span className="hidden md:inline">
            {lang === "fr" ? "Mémo" : "Mem"}
          </span>
        </button>
      </div>
    </div>
  );
}
