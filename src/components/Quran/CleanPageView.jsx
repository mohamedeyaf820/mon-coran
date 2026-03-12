import React, { useMemo, useEffect, useRef } from "react";
import { toAr, getSurah } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";

/**
 * Surah title header banner — mushaf-style decorated box.
 */
function SurahHeader({ surahMeta, lang }) {
  const subtitle = lang === "fr" ? surahMeta?.fr : lang === "ar" ? null : surahMeta?.en;
  return (
    <div className="cpv-surah-header">
      <span className="cpv-surah-header-line" />
      <div className="cpv-surah-header-frame">
        <span className="cpv-surah-header-name" dir="rtl" lang="ar">
          سُورَةُ {surahMeta?.ar}
        </span>
        {subtitle && (
          <span className="cpv-surah-header-sub">{subtitle}</span>
        )}
      </div>
      <span className="cpv-surah-header-line" />
    </div>
  );
}

/**
 * Ornamental verse-end medallion — quran.com style.
 * Rendered inline after each verse's text, sized relative to the font.
 */
function VerseMedallion({ num }) {
  const display = toAr(num);
  return (
    <span className="cpv-medallion" aria-label={`Verse ${num}`}>
      <svg className="cpv-medallion-svg" viewBox="0 0 44 44" aria-hidden="true">
        {/* Outer ring */}
        <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        {/* Inner fill */}
        <circle cx="22" cy="22" r="16.5" fill="currentColor" opacity="0.1" />
        {/* Inner ring */}
        <circle cx="22" cy="22" r="16.5" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.35" />
        {/* 8 diamond petal tips at cardinal and diagonal points */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 22 + 20.8 * Math.sin(rad);
          const y1 = 22 - 20.8 * Math.cos(rad);
          const x2 = 22 + 18.5 * Math.sin(rad - 0.18);
          const y2 = 22 - 18.5 * Math.cos(rad - 0.18);
          const x3 = 22 + 16.8 * Math.sin(rad);
          const y3 = 22 - 16.8 * Math.cos(rad);
          const x4 = 22 + 18.5 * Math.sin(rad + 0.18);
          const y4 = 22 - 18.5 * Math.cos(rad + 0.18);
          return (
            <polygon
              key={angle}
              points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
              fill="currentColor"
              opacity={angle % 90 === 0 ? 0.6 : 0.35}
            />
          );
        })}
      </svg>
      <span className="cpv-medallion-num">{display}</span>
    </span>
  );
}

/**
 * Page separator — a subtle horizontal rule with the page number centred.
 */
function PageSeparator({ pageNum }) {
  return (
    <div className="cpv-page-sep" aria-hidden="true">
      <span className="cpv-page-sep-line" />
      <span className="cpv-page-sep-label">{toAr(pageNum)}</span>
      <span className="cpv-page-sep-line" />
    </div>
  );
}

/**
 * CleanPageView — Mushaf-style flowing inline layout.
 *
 * All verses flow as continuous inline text (like a real Mushaf page).
 * Each verse ends with an ornamental medallion badge (quran.com style)
 * containing the verse number in Arabic numerals.
 *
 * Every verse span carries id="ayah-{numberInSurah}" so the parent
 * QuranDisplay auto-scroll effect can find and scroll to it during recitation.
 *
 * When showTranslation + getTranslation are provided, a numbered translation
 * panel is rendered below the flowing Arabic text.
 */
export default function CleanPageView({
  ayahs,
  lang,
  fontSize,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  surahNum,
  calibration,
  riwaya,
  showTranslation,
  getTranslation,
}) {
  const containerRef = useRef(null);

  /* ── Surah metadata ── */
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);

  /* ── Basmala ── */
  const showBasmala = useMemo(
    () =>
      surahNum !== 1 &&
      surahNum !== 9 &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1,
    [surahNum, ayahs],
  );

  /* ── Surah header ── show at the start of every surah (ayah 1) ── */
  const showSurahHeader = useMemo(
    () => ayahs.length > 0 && ayahs[0].numberInSurah === 1 && surahMeta != null,
    [ayahs, surahMeta],
  );

  /* ── Basmala translation for FR/EN ── */
  const basmalaTranslation = useMemo(() => {
    if (!showBasmala) return null;
    if (lang === "ar") return null;
    return lang === "fr"
      ? "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux"
      : "In the Name of Allah, the Most Compassionate, the Most Merciful";
  }, [lang, showBasmala]);

  /* ── Build flat list: ayahs + page-separator markers ── */
  const items = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];
    const result = [];
    let lastPage = null;
    for (const ayah of ayahs) {
      const page = ayah.page || 1;
      if (lastPage !== null && page !== lastPage) {
        result.push({ type: "sep", pageNum: page });
      }
      result.push({ type: "ayah", data: ayah });
      lastPage = page;
    }
    return result;
  }, [ayahs]);

  /* ── Auto-scroll to currently playing verse ── */
  useEffect(() => {
    if (!currentPlayingAyah?.ayah) return;
    const el = document.getElementById(`ayah-${currentPlayingAyah.ayah}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentPlayingAyah]);

  const textStyle = fontSize ? { fontSize: `${fontSize}px` } : undefined;

  return (
    <div
      ref={containerRef}
      className={`cpv-container${isQCF4 ? " cpv-qcf4" : ""}`}
    >
      {/* Surah title header */}
      {showSurahHeader && (
        <SurahHeader surahMeta={surahMeta} lang={lang} />
      )}

      {/* Basmala */}
      {showBasmala && (
        <div className="cpv-basmala-wrap">
          <div
            className="cpv-basmala"
            style={textStyle}
            dir="rtl"
            lang="ar"
            aria-label="Basmala"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
          {basmalaTranslation && (
            <p className="cpv-basmala-translation">{basmalaTranslation}</p>
          )}
        </div>
      )}

      {/* Flowing text block — all verses inline */}
      <div
        className={`cpv-flow${isQCF4 ? " qcf4-container" : ""}`}
        style={textStyle}
        dir="rtl"
        lang="ar"
      >
        {items.map((item) => {
          /* Page separator — block-level break in the flow */
          if (item.type === "sep") {
            return (
              <PageSeparator
                key={`sep-${item.pageNum}`}
                pageNum={item.pageNum}
              />
            );
          }

          const ayah = item.data;
          const isPlaying =
            currentPlayingAyah?.ayah === ayah.numberInSurah &&
            currentPlayingAyah?.surah === surahNum;

          return (
            <span
              key={ayah.number}
              id={`ayah-${ayah.numberInSurah}`}
              className={`cpv-verse${isPlaying ? " cpv-verse--playing" : ""}`}
              aria-label={`${lang === "ar" ? "الآية" : lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
              aria-current={isPlaying ? "true" : undefined}
            >
              {/* Arabic text */}
              <SmartAyahRenderer
                ayah={ayah}
                showTajwid={showTajwid}
                isPlaying={isPlaying}
                surahNum={surahNum}
                calibration={calibration}
                riwaya={riwaya}
              />
              {/* Ornamental verse-end medallion */}
              <VerseMedallion num={ayah.numberInSurah} />
              {/* Hair space between verses for breathing room */}
              {"\u200A"}
            </span>
          );
        })}
        {/* Ornamental end-of-surah closure */}
        {ayahs.length > 0 && (
          <div className="cpv-closure" aria-hidden="true">
            <span className="cpv-closure-line" />
            <span className="cpv-closure-ornament">
              {surahMeta?.ar || "❖"}
            </span>
            <span className="cpv-closure-line" />
          </div>
        )}
      </div>

      {/* ── Translations panel — numbered list below the Arabic flow ── */}
      {showTranslation && getTranslation && ayahs.length > 0 && (
        <div
          className="cpv-trans-panel"
          dir={lang === "ar" ? "rtl" : "ltr"}
          aria-label={lang === "ar" ? "الترجمة" : lang === "fr" ? "Traductions" : "Translations"}
        >
          {ayahs.map((ayah) => {
            const trans = getTranslation(ayah);
            if (!trans?.text) return null;
            const isPlaying =
              currentPlayingAyah?.ayah === ayah.numberInSurah &&
              (currentPlayingAyah?.surah === surahNum ||
                currentPlayingAyah?.surah == null);
            return (
              <div
                key={ayah.numberInSurah}
                className={`cpv-trans-entry${isPlaying ? " cpv-trans-entry--playing" : ""}`}
              >
                <span className="cpv-trans-num">{toAr(ayah.numberInSurah)}</span>
                <span className="cpv-trans-text">{trans.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
