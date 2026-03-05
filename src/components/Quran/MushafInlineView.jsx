import React, { useMemo } from "react";
import SmartAyahRenderer from "./SmartAyahRenderer";
import { toAr, getSurah } from "../../data/surahs";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";

/* ── Circular ayah-end marker (style Mushaf authentique) ── */
function AyahMarker({ num, lang }) {
  const display = lang === "ar" ? toAr(num) : num;
  return (
    <span className="mp-ayah-marker" aria-label={`Fin verset ${num}`}>
      <svg
        className="mp-ayah-marker-svg"
        viewBox="0 0 36 36"
        width="1.15em"
        height="1.15em"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle cx="18" cy="18" r="17" fill="none" strokeWidth="1.4" className="mp-ring-outer" />
        {/* Inner ring */}
        <circle cx="18" cy="18" r="13" fill="none" strokeWidth="0.9" className="mp-ring-inner" />
        {/* Decorative petals */}
        <path d="M18,1 L20,7 L18,5 L16,7 Z" className="mp-petal" />
        <path d="M18,35 L20,29 L18,31 L16,29 Z" className="mp-petal" />
        <path d="M1,18 L7,20 L5,18 L7,16 Z" className="mp-petal" />
        <path d="M35,18 L29,20 L31,18 L29,16 Z" className="mp-petal" />
      </svg>
      <span className="mp-ayah-num">{display}</span>
    </span>
  );
}

/**
 * MushafInlineView – affichage style page Mushaf authentique.
 * Fonctionne pour Hafs (police var(--font-quran)) et Warsh QCF4
 * (SmartAyahRenderer gère les polices par mot automatiquement).
 */
export default function MushafInlineView({
  ayahs,
  translations,
  surahNum,
  isQCF4,
  showTajwid,
  showTranslation,
  currentPlayingAyah,
  calibration,
  riwaya,
  lang,
  fontSize,
  onAyahClick,
}) {
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);

  const juzNum = useMemo(
    () => (ayahs.length > 0 ? getJuzForAyah(surahNum, ayahs[0].numberInSurah) : 1),
    [ayahs, surahNum],
  );
  const juzNumEnd = useMemo(
    () =>
      ayahs.length > 0
        ? getJuzForAyah(surahNum, ayahs[ayahs.length - 1].numberInSurah)
        : juzNum,
    [ayahs, surahNum, juzNum],
  );

  const showBasmala =
    surahNum !== 1 &&
    surahNum !== 9 &&
    ayahs.length > 0 &&
    ayahs[0].numberInSurah === 1;

  const surahNameAr = surahMeta?.ar || "";
  const surahNameDisplay =
    lang === "ar" ? surahNameAr : lang === "fr" ? surahMeta?.fr || surahNameAr : surahMeta?.en || surahNameAr;

  const revelBadge =
    surahMeta?.type === "Meccan"
      ? lang === "fr" ? "Mecquoise" : lang === "ar" ? "مكية" : "Meccan"
      : lang === "fr" ? "Médinoise" : lang === "ar" ? "مدنية" : "Medinan";

  const juzLabel = lang === "ar" ? "جزء" : "Juz";
  const ayahCountLabel = surahMeta?.ayahs ?? "?";

  return (
    <div className={`mp-frame${isQCF4 ? " mp-qcf4" : ""}`}>
      {/* ══════════════ CADRE EXTÉRIEUR ══════════════ */}
      <div className="mp-outer-border">
        <div className="mp-inner-border">

          {/* ── En-tête sourate ── */}
          <div className="mp-header" dir="rtl">
            {/* Coin gauche: numéro juz */}
            <div className="mp-header-side">
              <span className="mp-header-label">{juzLabel}</span>
              <span className="mp-header-value">
                {lang === "ar" ? toAr(juzNum) : juzNum}
                {juzNumEnd !== juzNum && (
                  <span className="mp-header-value-end">
                    {" - "}
                    {lang === "ar" ? toAr(juzNumEnd) : juzNumEnd}
                  </span>
                )}
              </span>
            </div>

            {/* Centre: nom de la sourate */}
            <div className="mp-header-center">
              <span className="mp-ornament" aria-hidden="true">﴾</span>
              <div className="mp-surah-title">
                <span className="mp-surah-name-ar" dir="rtl">{surahNameAr}</span>
                {lang !== "ar" && surahNameDisplay !== surahNameAr && (
                  <span className="mp-surah-name-tr">{surahNameDisplay}</span>
                )}
              </div>
              <span className="mp-ornament" aria-hidden="true">﴿</span>
            </div>

            {/* Coin droit: type + nb versets */}
            <div className="mp-header-side mp-header-side--end">
              <span className="mp-header-label">{revelBadge}</span>
              <span className="mp-header-value">
                {lang === "ar" ? toAr(ayahCountLabel) : ayahCountLabel}
                {" "}
                <span className="mp-header-label">
                  {lang === "ar" ? "آية" : lang === "fr" ? "v." : "v."}
                </span>
              </span>
            </div>
          </div>

          {/* ── Séparateur ornemental ── */}
          <div className="mp-separator" aria-hidden="true">
            <span className="mp-sep-line"></span>
            <span className="mp-sep-diamond">◆</span>
            <span className="mp-sep-line"></span>
          </div>

          {/* ── Corps du texte ── */}
          <div
            className={`mp-body${isQCF4 ? " mp-body-qcf4" : ""}`}
            style={{ "--mp-fs": `${fontSize ?? 28}px` }}
            dir="rtl"
            lang="ar"
          >
            {/* Basmala */}
            {showBasmala && (
              <div className="mp-basmala" dir="rtl" aria-label="Basmala">
                {isQCF4 ? "﷽" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </div>
            )}

            {/* Ayahs en flux inline */}
            {ayahs.map((ayah) => {
              const isPlaying =
                currentPlayingAyah?.ayah === ayah.numberInSurah &&
                (currentPlayingAyah?.surah === surahNum || currentPlayingAyah?.surah == null);

              return (
                <React.Fragment key={ayah.number ?? ayah.numberInSurah}>
                  <span
                    id={`ayah-${ayah.numberInSurah}`}
                    className={`mp-ayah${isPlaying ? " mp-ayah--playing" : ""}`}
                    onClick={() => onAyahClick?.(ayah.numberInSurah)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onAyahClick?.(ayah.numberInSurah)}
                    aria-label={`Verset ${ayah.numberInSurah}`}
                  >
                    <SmartAyahRenderer
                      ayah={ayah}
                      showTajwid={showTajwid}
                      isPlaying={isPlaying}
                      surahNum={surahNum}
                      calibration={calibration}
                      riwaya={riwaya}
                    />
                  </span>
                  <AyahMarker num={ayah.numberInSurah} lang={lang} />
                  {"\u200C"}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Séparateur bas ── */}
          <div className="mp-separator mp-separator--bottom" aria-hidden="true">
            <span className="mp-sep-line"></span>
            <span className="mp-sep-diamond">◆</span>
            <span className="mp-sep-line"></span>
          </div>
        </div>
      </div>

      {/* ── Traductions (hors cadre) ── */}
      {showTranslation && translations?.length > 0 && (
        <div className="mp-translations">
          {translations.map((tr, idx) =>
            tr ? (
              <div key={tr.number ?? idx} className="mp-trans-row">
                <span className="mp-trans-num">
                  {lang === "ar" ? toAr(idx + 1) : idx + 1}.
                </span>
                <span className="mp-trans-text">{tr.text}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
