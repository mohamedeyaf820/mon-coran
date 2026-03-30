import React, { useMemo, useRef } from "react";
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
    <span className="cpv-medallion" aria-label={`Verse ${num}`}>{display}</span>
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

function getFlowFontClass(fontSize) {
  const size = Number(fontSize);
  if (!Number.isFinite(size)) return "text-[40px]";
  if (size <= 34) return "text-[34px]";
  if (size <= 38) return "text-[38px]";
  if (size <= 42) return "text-[42px]";
  if (size <= 46) return "text-[46px]";
  if (size <= 50) return "text-[50px]";
  if (size <= 56) return "text-[56px]";
  return "text-[62px]";
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
  showSurahHeader = true,
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
  const showEmbeddedSurahHeader = useMemo(
    () =>
      showSurahHeader &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1 &&
      surahMeta != null,
    [showSurahHeader, ayahs, surahMeta],
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

  const flowFontClass = getFlowFontClass(fontSize);

  return (
    <div
      ref={containerRef}
      className={`cpv-container${isQCF4 ? " cpv-qcf4" : ""} relative overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(170deg,rgba(7,13,24,0.94),rgba(4,9,18,0.98))] p-4 shadow-[0_22px_46px_rgba(2,7,18,0.52)]`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.11]"
        aria-hidden="true"
      />
      {/* Surah title header */}
      {showEmbeddedSurahHeader && (
        <SurahHeader surahMeta={surahMeta} lang={lang} />
      )}

      {/* Basmala */}
      {showBasmala && (
        <div className="cpv-basmala-wrap">
          <div
            className={`cpv-basmala ${flowFontClass}`}
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
        className={`cpv-flow${isQCF4 ? " qcf4-container" : ""} ${flowFontClass} relative z-10 rounded-2xl border border-white/12 bg-[rgba(8,15,30,0.56)] p-5`}
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
              data-surah-number={surahNum}
              data-ayah-number={ayah.numberInSurah}
              data-ayah-global={ayah.number}
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
          className="cpv-trans-panel mt-4 rounded-2xl border border-white/12 bg-[rgba(8,16,32,0.72)] p-3.5"
          dir={lang === "ar" ? "rtl" : "ltr"}
          aria-label={lang === "ar" ? "الترجمة" : lang === "fr" ? "Traductions" : "Translations"}
        >
          {ayahs.map((ayah) => {
            const transArray = getTranslation(ayah);
            if (!Array.isArray(transArray) || transArray.length === 0) return null;
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
                <div className="cpv-trans-content">
                  {transArray.map((t, idx) => (
                    <div key={idx} className="cpv-trans-item">
                      {transArray.length > 1 && (
                        <span className="cpv-trans-edition">
                          [{t.edition?.name || t.edition?.identifier}]{" "}
                        </span>
                      )}
                      <span className="cpv-trans-text">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
