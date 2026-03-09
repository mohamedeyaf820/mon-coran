import React, { useMemo } from "react";
import { toAr } from "../../data/surahs";
import SmartAyahRenderer from "./SmartAyahRenderer";

/**
 * Circular verse marker badge (like quran.com)
 */
function VerseMarker({ num, lang }) {
  const display = lang === "ar" ? toAr(num) : num;
  return (
    <span className="clean-verse-marker" aria-label={`Verse ${num}`}>
      <svg
        className="clean-verse-marker-svg"
        viewBox="0 0 36 36"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="18"
          cy="18"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
      <span className="clean-verse-num">{display}</span>
    </span>
  );
}

/**
 * Page separator with page number
 */
function PageSeparator({ pageNum, lang }) {
  const display = lang === "ar" ? toAr(pageNum) : pageNum;
  return (
    <div className="clean-page-separator">
      <div className="clean-page-separator-line" />
      <span className="clean-page-separator-text">
        {lang === "ar" ? `صفحة ${display}` : `Page ${display}`}
      </span>
      <div className="clean-page-separator-line" />
    </div>
  );
}

/**
 * CleanPageView - Quran.com-style centered flowing text layout
 * Displays all ayahs with tajweed coloring and page separators with page numbers
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
  // Check if we should show basmala
  const showBasmala = useMemo(() => {
    return (
      surahNum !== 1 &&
      surahNum !== 9 &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1
    );
  }, [surahNum, ayahs]);

  const basmalaText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  // Build list of ayahs with page change indicators
  const ayahsWithPageMarkers = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];

    const result = [];
    let lastPage = null;

    for (let i = 0; i < ayahs.length; i++) {
      const ayah = ayahs[i];
      const currentPage = ayah.page || 1;

      // Add page marker if page changed
      if (lastPage !== null && currentPage !== lastPage) {
        result.push({
          type: "page-separator",
          pageNum: currentPage,
        });
      }

      // Add ayah
      result.push({
        type: "ayah",
        data: ayah,
      });

      lastPage = currentPage;
    }

    return result;
  }, [ayahs]);

  return (
    <div className="clean-page-container">
      {/* Basmala at the start if needed */}
      {showBasmala && (
        <div className="clean-basmala" style={{ fontSize: `${fontSize}px` }}>
          {basmalaText}
        </div>
      )}

      {/* Main text content with all ayahs and page separators */}
      <div
        className={`clean-page-text${isQCF4 ? " qcf4-container" : ""}`}
        style={{ fontSize: `${fontSize}px` }}
        dir="rtl"
      >
        {ayahsWithPageMarkers.map((item, idx) => {
          if (item.type === "page-separator") {
            return (
              <PageSeparator
                key={`sep-${item.pageNum}`}
                pageNum={item.pageNum}
                lang={lang}
              />
            );
          }

          const ayah = item.data;
          const isPlaying =
            currentPlayingAyah?.ayah === ayah.numberInSurah &&
            currentPlayingAyah?.surah === surahNum;

          return (
            <span
              key={`ayah-${ayah.number}`}
              className={`clean-ayah${isPlaying ? " clean-ayah-playing" : ""}`}
            >
              {/* Render the ayah text with tajweed coloring */}
              <SmartAyahRenderer
                ayah={ayah}
                showTajwid={showTajwid}
                isPlaying={isPlaying}
                surahNum={surahNum}
                calibration={calibration}
                riwaya={riwaya}
              />

              {/* Verse marker after the text */}
              <VerseMarker num={ayah.numberInSurah} lang={lang} />

              {/* Space after verse (except last one) */}
              {idx < ayahsWithPageMarkers.length - 1 && (
                <span className="clean-verse-space"> </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
