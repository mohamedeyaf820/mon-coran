import React from "react";
import { getSurah, toAr } from "../../data/surahs";
import { t } from "../../i18n";

/**
 * SurahHeader component – renders the decorative header for each surah.
 */
const SurahHeader = React.memo(function SurahHeader({ surahNum, lang }) {
  const s = getSurah(surahNum);
  if (!s) return null;

  const surahLabel = lang === "ar" ? toAr(surahNum) : surahNum;
  const isMeccan = s.type === "Meccan";

  return (
    <div className="qc-surah-header" data-surah-type={isMeccan ? "meccan" : "medinan"}>

      <div className="qc-header-top">
        <span className="qc-header-num">{surahLabel}</span>
      </div>

      {/* ── Parchment Mushaf banner ── */}
      <div className="qc-sh-parchment">
        <h1 className="qc-header-name-ar" dir="rtl" lang="ar">سُورَةُ {s.ar}</h1>
      </div>

      <div className="qc-header-meta">
        <span className="qc-header-name-en">{lang === "fr" ? s.fr : s.en}</span>
        {lang !== "ar" && <span className="qc-header-name-lat">{s.en}</span>}
        <div className="qc-header-details">
          <span className="qc-sh-type-pill">
            {isMeccan ? t("quran.meccan", lang) : t("quran.medinan", lang)}
          </span>
          <span className="qc-sh-detail-sep">·</span>
          <span className="qc-sh-ayah-count">
            {s.ayahs} {t("quran.ayahs", lang)}
          </span>
        </div>
      </div>
    </div>
  );
});

export default SurahHeader;
