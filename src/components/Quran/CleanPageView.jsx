import React, { useMemo, useEffect, useRef } from "react";
import { toAr } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";

/**
 * Ornamental verse-end medallion — quran.com style.
 * Rendered inline after each verse's text, sized relative to the font.
 */
function VerseMedallion({ num }) {
  const display = toAr(num);
  return (
    <span className="cpv-medallion" aria-label={`Verse ${num}`}>
      <svg className="cpv-medallion-svg" viewBox="0 0 40 40" aria-hidden="true">
        {/* Outer decorative ring */}
        <circle
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
        />
        {/* Inner ring */}
        <circle
          cx="20"
          cy="20"
          r="14.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.35"
        />
        {/* Subtle fill */}
        <circle cx="20" cy="20" r="13.5" fill="currentColor" opacity="0.07" />
        {/* Diamond petals at 4 cardinal points */}
        <polygon
          points="20,1.5 21.6,5.5 20,4 18.4,5.5"
          fill="currentColor"
          opacity="0.5"
        />
        <polygon
          points="20,38.5 21.6,34.5 20,36 18.4,34.5"
          fill="currentColor"
          opacity="0.5"
        />
        <polygon
          points="1.5,20 5.5,21.6 4,20 5.5,18.4"
          fill="currentColor"
          opacity="0.5"
        />
        <polygon
          points="38.5,20 34.5,21.6 36,20 34.5,18.4"
          fill="currentColor"
          opacity="0.5"
        />
        {/* Corner accent dots */}
        <circle cx="7" cy="7" r="1.1" fill="currentColor" opacity="0.3" />
        <circle cx="33" cy="7" r="1.1" fill="currentColor" opacity="0.3" />
        <circle cx="7" cy="33" r="1.1" fill="currentColor" opacity="0.3" />
        <circle cx="33" cy="33" r="1.1" fill="currentColor" opacity="0.3" />
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
}) {
  const containerRef = useRef(null);

  /* ── Basmala ── */
  const showBasmala = useMemo(
    () =>
      surahNum !== 1 &&
      surahNum !== 9 &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1,
    [surahNum, ayahs],
  );

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
      {/* Basmala */}
      {showBasmala && (
        <div
          className="cpv-basmala"
          style={textStyle}
          dir="rtl"
          lang="ar"
          aria-label="Basmala"
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
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
              aria-label={`Verse ${ayah.numberInSurah}`}
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
      </div>
    </div>
  );
}
