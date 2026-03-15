import React, { useMemo } from "react";
import SmartAyahRenderer from "./SmartAyahRenderer";
import { toAr, getSurah } from "../../data/surahs";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";

/* ── Circular ayah-end marker (style Mushaf authentique) ── */
function AyahMarker({ num, lang }) {
  const display = lang === "ar" ? toAr(num) : num;
  // 8 diamond petals every 45°
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <span className="mp-ayah-marker" aria-label={`Fin verset ${num}`}>
      <svg
        className="mp-ayah-marker-svg"
        viewBox="0 0 44 44"
        width="1.5em"
        height="1.5em"
        aria-hidden="true"
      >
        {/* Subtle center fill */}
        <circle cx="22" cy="22" r="11" className="mp-center-fill" />
        {/* 8 diamond petals */}
        {petals.map(angle => (
          <path
            key={angle}
            d="M22,3.5 L24,11 L22,18 L20,11 Z"
            transform={`rotate(${angle}, 22, 22)`}
            className="mp-petal"
          />
        ))}
        {/* Inner ring */}
        <circle cx="22" cy="22" r="12" fill="none" strokeWidth="0.9" className="mp-ring-inner" />
        {/* Outer ring */}
        <circle cx="22" cy="22" r="20" fill="none" strokeWidth="1.4" className="mp-ring-outer" />
        {/* 8 tiny accent dots at inter-petal positions */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(a => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle
              key={a}
              cx={22 + 20 * Math.cos(rad)}
              cy={22 + 20 * Math.sin(rad)}
              r="1"
              className="mp-dot"
            />
          );
        })}
      </svg>
      <span className="mp-ayah-num">{display}</span>
    </span>
  );
}

function getMushafFontClass(size) {
  const n = Number(size);
  if (!Number.isFinite(n)) return "text-[58px]";
  if (n <= 54) return "text-[54px]";
  if (n <= 58) return "text-[58px]";
  if (n <= 62) return "text-[62px]";
  if (n <= 66) return "text-[66px]";
  return "text-[70px]";
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
    () =>
      ayahs.length > 0 ? getJuzForAyah(surahNum, ayahs[0].numberInSurah) : 1,
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
    lang === "ar"
      ? surahNameAr
      : lang === "fr"
        ? surahMeta?.fr || surahNameAr
        : surahMeta?.en || surahNameAr;

  const revelBadge =
    surahMeta?.type === "Meccan"
      ? lang === "fr"
        ? "Mecquoise"
        : lang === "ar"
          ? "مكية"
          : "Meccan"
      : lang === "fr"
        ? "Médinoise"
        : lang === "ar"
          ? "مدنية"
          : "Medinan";

  const juzLabel = lang === "ar" ? "جزء" : "Juz";
  const ayahCountLabel = surahMeta?.ayahs ?? "?";
  const pageStart =
    (displayMode === "page" ? currentPage : null) ?? ayahs[0]?.page ?? null;
  const pageEnd = ayahs[ayahs.length - 1]?.page ?? pageStart;
  const hizbNumber = ayahs[0]?.hizbQuarter
    ? Math.ceil(ayahs[0].hizbQuarter / 4)
    : null;
  const activeJuz = displayMode === "juz" ? (currentJuz ?? juzNum) : juzNum;
  const heroSubtitle =
    lang === "ar"
      ? `${revelBadge} · ${toAr(ayahCountLabel)} آية`
      : `${revelBadge} · ${ayahCountLabel} ${lang === "fr" ? "versets" : "ayahs"}`;
  const heroBadge =
    riwaya === "warsh"
      ? lang === "ar"
        ? "ورش"
        : "Warsh"
      : lang === "ar"
        ? "حفص"
        : "Hafs";
  const basmalaTranslation =
    lang === "fr"
      ? "Au nom d'Allah, le Tout Misericordieux, le Tres Misericordieux"
      : lang === "ar"
        ? null
        : "In the Name of Allah, the Most Compassionate, the Most Merciful";
  const mushafFontSize = Math.min(Math.max((fontSize ?? 38) + 16, 54), 72);
  const mushafFontClass = getMushafFontClass(mushafFontSize);
  const hasTranslationPanel = showTranslation && translations?.length > 0;

  return (
    <div className={`mp-frame${isQCF4 ? " mp-qcf4" : ""} relative overflow-hidden rounded-[30px] border border-[rgba(186,148,74,0.26)] bg-[linear-gradient(165deg,rgba(247,237,213,0.94)_0%,rgba(236,220,183,0.96)_100%)] shadow-[0_20px_38px_rgba(12,18,14,0.14)]`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(132,102,46,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(132,102,46,0.07)_1px,transparent_1px)] bg-size-[60px_60px] opacity-[0.12]"
        aria-hidden="true"
      />
      {/* ══════════════ CADRE EXTÉRIEUR ══════════════ */}
      <div className="mp-outer-border relative z-10">
        <div className="mp-inner-border rounded-2xl border border-[rgba(186,148,74,0.22)] bg-[rgba(240,226,190,0.2)] p-3">
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
              <span className="mp-ornament" aria-hidden="true">
                ﴾
              </span>
              <div className="mp-surah-title">
                <span className="mp-surah-name-ar" dir="rtl">
                  سُورَةُ {surahNameAr}
                </span>
                {lang !== "ar" && surahNameDisplay !== surahNameAr && (
                  <span className="mp-surah-name-tr">{surahNameDisplay}</span>
                )}
              </div>
              <span className="mp-ornament" aria-hidden="true">
                ﴿
              </span>
            </div>

            {/* Coin droit: type + nb versets */}
            <div className="mp-header-side mp-header-side--end">
              <span className="mp-header-label">{revelBadge}</span>
              <span className="mp-header-value">
                {lang === "ar" ? toAr(ayahCountLabel) : ayahCountLabel}{" "}
                <span className="mp-header-label">
                  {lang === "ar" ? "آية" : lang === "fr" ? "v." : "v."}
                </span>
              </span>
            </div>
          </div>

          {showBasmala && (
            <div className="mp-basmala-wrap">
              <div className="mp-basmala" dir="rtl" aria-label="Basmala">
                {isQCF4 ? "﷽" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </div>
              {basmalaTranslation && (
                <div className="mp-basmala-translation">
                  {basmalaTranslation}
                </div>
              )}
            </div>
          )}

          <div
            className={`mp-ayahs-flow ${mushafFontClass} rounded-2xl border border-[rgba(184,146,72,0.22)] bg-[rgba(231,210,160,0.16)] px-3 py-4`}
            dir="rtl"
          >
            {/* Ayahs en flux inline */}
            {ayahs.map((ayah) => {
              const isPlaying =
                currentPlayingAyah?.ayah === ayah.numberInSurah &&
                (currentPlayingAyah?.surah === surahNum ||
                  currentPlayingAyah?.surah == null);

              return (
                <React.Fragment key={ayah.number ?? ayah.numberInSurah}>
                  <span
                    id={`ayah-${ayah.numberInSurah}`}
                    data-surah-number={surahNum}
                    data-ayah-number={ayah.numberInSurah}
                    data-ayah-global={ayah.number}
                    className={`mp-ayah${isPlaying ? " mp-ayah--playing" : ""}`}
                    onClick={() => onAyahClick?.(ayah.numberInSurah)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onAyahClick?.(ayah.numberInSurah)
                    }
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
                  {/* QCF4 fonts embed ayah-end numbers inside glyphs — skip separate marker */}
                  {!isQCF4 && <AyahMarker num={ayah.numberInSurah} lang={lang} />}
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
    </div>
  );
}
