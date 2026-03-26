import React from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";

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
          style={{ gap: 8 }}
        >
          <i className={`fas fa-${preparingSurah === surahNum ? "circle-notch fa-spin" : "play"}`} />
          <span className="hidden sm:inline">
            {preparingSurah === surahNum
              ? lang === "fr" ? "Préparation..." : "Loading..."
              : t("audio.playSurah", lang)}
          </span>
        </button>
      </div>

      {/* Center: Reading mode toggles */}
      <div className="reader-toolbar__center" style={{ gap: 4 }}>
        <button
          className={`reader-toolbar-btn${mushafIsOn ? " active" : ""}`}
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
          <i className={`fas ${mushafIsOn ? "fa-list-ul" : "fa-book-open"}`} />
          <span className="hidden md:inline">
            {mushafIsOn
              ? lang === "fr"
                ? "Liste"
                : "List"
              : "Mushaf"}
          </span>
        </button>

        <button
          className={`reader-toolbar-btn${showTranslation ? " active" : ""}`}
          onClick={toggleTranslation}
          title={lang === "fr" ? "Traduction" : "Translation"}
          aria-pressed={showTranslation}
        >
          <i className="fas fa-language" />
          <span className="hidden md:inline">
            {lang === "fr" ? "Traduction" : "Translation"}
          </span>
        </button>

        <button
          className={`reader-toolbar-btn${showTajwid ? " active" : ""}`}
          onClick={toggleTajweed}
          title={lang === "fr" ? "Couleurs Tajwid" : "Tajweed Colors"}
          aria-pressed={showTajwid}
        >
          <i className="fas fa-palette" />
          <span className="hidden md:inline">Tajweed</span>
        </button>

        {riwaya !== "warsh" && (
          <button
            className={`reader-toolbar-btn${showWordByWord ? " active" : ""}`}
            onClick={toggleWBW}
            title={lang === "fr" ? "Mot à mot" : "Word by Word"}
            aria-pressed={showWordByWord}
          >
            <i className="fas fa-text-width" />
            <span className="hidden md:inline">
              {lang === "fr" ? "Mot à mot" : "Word by Word"}
            </span>
          </button>
        )}
      </div>

      {/* Right: View mode */}
      <div className="reader-toolbar__right">
        <button
          className={`reader-toolbar-btn${memMode ? " active" : ""}`}
          onClick={toggleMem}
          title={lang === "fr" ? "Mémorisation" : "Memorize"}
          aria-pressed={memMode}
        >
          <i className="fas fa-graduation-cap" />
          <span className="hidden md:inline">
            {lang === "fr" ? "Memo" : "Mem"}
          </span>
        </button>
      </div>
    </div>
  );
}
