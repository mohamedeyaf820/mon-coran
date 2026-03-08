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
  displayMode,
  currentPage,
  currentJuz,
  isQCF4,
  showTajwid,
  showTranslation,
  currentPlayingAyah,
  calibration,
  riwaya,
  lang,
  fontSize,
  onAyahClick,
  onIncreaseFont,
  onDecreaseFont,
  canIncreaseFont,
  canDecreaseFont,
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

  const surahNameLatin = surahMeta?.en || surahMeta?.fr || surahNameAr;

  const revelBadge =
    surahMeta?.type === "Meccan"
      ? lang === "fr" ? "Mecquoise" : lang === "ar" ? "مكية" : "Meccan"
      : lang === "fr" ? "Médinoise" : lang === "ar" ? "مدنية" : "Medinan";

  const juzLabel = lang === "ar" ? "جزء" : "Juz";
  const ayahCountLabel = surahMeta?.ayahs ?? "?";
  const pageStart = (displayMode === "page" ? currentPage : null) ?? ayahs[0]?.page ?? null;
  const pageEnd = ayahs[ayahs.length - 1]?.page ?? pageStart;
  const hizbNumber = ayahs[0]?.hizbQuarter ? Math.ceil(ayahs[0].hizbQuarter / 4) : null;
  const activeJuz = displayMode === "juz" ? currentJuz ?? juzNum : juzNum;
  const heroSubtitle =
    lang === "ar"
      ? `${revelBadge} · ${toAr(ayahCountLabel)} آية`
      : `${revelBadge} · ${ayahCountLabel} ${lang === "fr" ? "versets" : "ayahs"}`;
  const basmalaTranslation =
    lang === "fr"
      ? "Au nom d'Allah, le Tout Misericordieux, le Tres Misericordieux"
      : lang === "ar"
        ? null
        : "In the Name of Allah, the Most Compassionate, the Most Merciful";
  const mushafFontSize = Math.max((fontSize ?? 28) + 8, 38);
  const hasTranslationPanel = showTranslation && translations?.length > 0;

  return (
    <div className={`mp-frame${isQCF4 ? " mp-qcf4" : ""}${hasTranslationPanel ? " mp-frame--with-translations" : ""}`}>
      <div className="mp-shell">
        <div className="mp-topbar">
          <div className="mp-topbar-start">
            <span className="mp-topbar-kicker">
              {displayMode === "page"
                ? t("settings.pageMode", lang)
                : displayMode === "juz"
                  ? t("settings.juzMode", lang)
                  : t("settings.surahMode", lang)}
            </span>
            <span className="mp-topbar-title">
              {lang === "ar" ? surahNameAr : `${surahNum}. ${surahNameDisplay}`}
            </span>
          </div>

          <div className="mp-topbar-meta">
            <div className="mp-font-controls" aria-label={lang === "fr" ? "Taille du texte" : lang === "ar" ? "حجم النص" : "Text size"}>
              <button
                type="button"
                className="mp-font-btn"
                onClick={onDecreaseFont}
                disabled={!canDecreaseFont}
                aria-label={lang === "fr" ? "Reduire le texte" : lang === "ar" ? "تصغير النص" : "Decrease text size"}
              >
                A-
              </button>
              <span className="mp-font-value">{mushafFontSize}px</span>
              <button
                type="button"
                className="mp-font-btn"
                onClick={onIncreaseFont}
                disabled={!canIncreaseFont}
                aria-label={lang === "fr" ? "Agrandir le texte" : lang === "ar" ? "تكبير النص" : "Increase text size"}
              >
                A+
              </button>
            </div>
            {pageStart && (
              <span className="mp-topbar-pill">
                {t("quran.page", lang)} {lang === "ar" ? toAr(pageStart) : pageStart}
                {pageEnd && pageEnd !== pageStart && `-${lang === "ar" ? toAr(pageEnd) : pageEnd}`}
              </span>
            )}
            <span className="mp-topbar-pill">
              {juzLabel} {lang === "ar" ? toAr(activeJuz) : activeJuz}
              {juzNumEnd !== activeJuz && displayMode !== "juz" && (
                <>-{lang === "ar" ? toAr(juzNumEnd) : juzNumEnd}</>
              )}
            </span>
            {hizbNumber && (
              <span className="mp-topbar-pill">
                {lang === "ar" ? `حزب ${toAr(hizbNumber)}` : `Hizb ${hizbNumber}`}
              </span>
            )}
          </div>
        </div>

        <div className="mp-canvas">
          <div className="mp-hero">
            <div className="mp-hero-ar" dir="rtl">{surahNameAr}</div>
            <div className="mp-hero-copy">
              <div className="mp-hero-title-row">
                <span className="mp-hero-title">
                  {lang === "ar" ? `${toAr(surahNum)}. ${surahNameAr}` : `${surahNum}. ${surahNameLatin}`}
                </span>
                <span className="mp-hero-badge">info</span>
              </div>
              <span className="mp-hero-subtitle">{heroSubtitle}</span>
            </div>
          </div>

          {showBasmala && (
            <div className="mp-basmala-wrap">
              <div className="mp-basmala" dir="rtl" aria-label="Basmala">
                {isQCF4 ? "﷽" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </div>
              {basmalaTranslation && (
                <div className="mp-basmala-translation">{basmalaTranslation}</div>
              )}
            </div>
          )}

          <div
            className={`mp-body${isQCF4 ? " mp-body-qcf4" : ""}`}
            style={{ "--mp-fs": `${mushafFontSize}px` }}
            dir="rtl"
            lang="ar"
          >
            {ayahs.map((ayah) => {
              const isPlaying =
                currentPlayingAyah?.ayah === ayah.numberInSurah &&
                (currentPlayingAyah?.surah === surahNum || currentPlayingAyah?.surah == null);
              const ayahKey = ayah.number ?? ayah.numberInSurah;

              return (
                <React.Fragment key={ayahKey}>
                  <span
                    id={`ayah-${ayah.numberInSurah}`}
                    className={`mp-ayah${isPlaying ? " mp-ayah--playing" : ""}`}
                    onClick={() => onAyahClick?.(ayahKey)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onAyahClick?.(ayahKey)}
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
        </div>
      </div>

      {showTranslation && translations?.length > 0 && (
        <div className="mp-translations">
          <div className="mp-translations-head">
            {lang === "ar" ? "الترجمة" : lang === "fr" ? "Traduction" : "Translation"}
          </div>
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
