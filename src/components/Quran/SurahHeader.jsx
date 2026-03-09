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

  return (
    <div className="qc-surah-header">
      <div className="qc-header-top">
        <span className="qc-header-num">{surahLabel}</span>
        <h1 className="qc-header-name-ar">{s.ar}</h1>
      </div>
      <div className="qc-header-meta">
        <span className="qc-header-name-en">{lang === "fr" ? s.fr : s.en}</span>
        <span className="qc-header-details">
          {s.ayahs} {t("quran.ayahs", lang)} ·{" "}
          {s.type === "Meccan"
            ? t("quran.meccan", lang)
            : t("quran.medinan", lang)}
        </span>
      </div>
    </div>
  );
});

export default SurahHeader;
