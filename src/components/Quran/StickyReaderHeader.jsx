import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getSurah } from "../../data/surahs";
import { t } from "../../i18n";

/**
 * StickyReaderHeader – appears on top of the screen
 * when the user scrolls past the surah header, just
 * like Quran.com's sticky reading header.
 */
export default function StickyReaderHeader({ surahNum, scrollContainerRef }) {
  const { state, dispatch } = useApp();
  const { lang, showTranslation, showTajwid, theme } = state;
  const [visible, setVisible] = useState(false);
  const surahData = getSurah(surahNum);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > 200);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  if (!surahData) return null;

  const surahLabel = lang === "fr" ? surahData.fr : surahData.en;
  const surahAr = surahData.ar;

  return (
    <div
      className={`reader-sticky-header${visible ? " is-visible" : ""}`}
      role="banner"
      aria-hidden={!visible}
    >
      {/* Back to top */}
      <button
        className="reader-sticky-header__back"
        title={t("nav.scrollTop", lang)}
        onClick={() => scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("nav.scrollTop", lang)}
      >
        <i className="fas fa-chevron-up" />
      </button>

      {/* Surah info */}
      <div className="reader-sticky-header__info">
        <span className="reader-sticky-header__surah-name">{surahLabel}</span>
        <span className="reader-sticky-header__meta" dir="rtl" lang="ar">
          {surahAr} · {surahData.ayahs} {t("quran.ayahs", lang)}
        </span>
      </div>

      {/* Quick action buttons */}
      <div className="reader-sticky-header__actions">
        {/* Translation toggle */}
        <button
          className={`reader-sticky-btn ${showTranslation ? "active" : ""}`}
          title={lang === "fr" ? "Traduction" : "Translation"}
          onClick={() => dispatch({ type: "SET", payload: { showTranslation: !showTranslation } })}
          aria-label="Toggle translation"
        >
          <i className="fas fa-language" />
        </button>

        {/* Tajweed toggle */}
        <button
          className={`reader-sticky-btn ${showTajwid ? "active" : ""}`}
          title={lang === "fr" ? "Couleurs Tajwid" : "Tajweed Colors"}
          onClick={() => dispatch({ type: "SET", payload: { showTajwid: !showTajwid } })}
          aria-label="Toggle tajweed"
        >
          <i className="fas fa-palette" />
        </button>

        {/* Settings */}
        <button
          className="reader-sticky-btn"
          title={t("nav.settings", lang)}
          onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
          aria-label={t("nav.settings", lang)}
        >
          <i className="fas fa-sliders" />
        </button>
      </div>
    </div>
  );
}
