import React, { useState } from "react";
import { Info } from "lucide-react";
import { getSurah } from "../../data/surahs";
import { cn } from "../../lib/utils";
import SurahInfoPanel from "../QuranDisplay/SurahInfoPanel";

function labelFor(lang, fr, en) {
  return lang === "fr" ? fr : en;
}

const SurahHeader = React.memo(function SurahHeader({ surahNum, lang }) {
  const s = getSurah(surahNum);
  const [showInfo, setShowInfo] = useState(false);

  if (!s) return null;

  const isMeccan = s.type === "Meccan";
  const translatedName = lang === "en" ? s.fr || s.en : s.fr || s.en;
  const revelationLabel = isMeccan
    ? labelFor(lang, "Mecquoise", "Meccan")
    : labelFor(lang, "Medinoise", "Medinan");
  const ayahLabel = labelFor(lang, "versets", "verses");

  return (
    <section
      className="qc-reader-surah-header"
      aria-labelledby={`surah-title-${surahNum}`}
    >
      <div className="qc-reader-surah-header__number" aria-hidden="true">
        {surahNum}
      </div>

      <div className="qc-reader-surah-header__body">
        <div
          className="qc-reader-surah-header__arabic"
          dir="rtl"
          lang="ar"
          aria-label={s.ar}
        >
          {String(surahNum).padStart(3, "0")}
        </div>

        <h1
          id={`surah-title-${surahNum}`}
          className="qc-reader-surah-header__title"
        >
          {translatedName}
        </h1>
        <div className="qc-reader-surah-header__subtitle">{s.en}</div>

        <div className="qc-reader-surah-header__meta">
          <span
            className={cn(
              "qc-reader-surah-header__pill",
              isMeccan && "qc-reader-surah-header__pill--gold",
            )}
          >
            {revelationLabel}
          </span>
          <span className="qc-reader-surah-header__dot" aria-hidden="true">
            .
          </span>
          <span className="qc-reader-surah-header__pill">
            {s.ayahs} {ayahLabel}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="qc-reader-surah-header__info"
        onClick={() => setShowInfo((v) => !v)}
        aria-expanded={showInfo}
        aria-label={labelFor(lang, "Informations sur la sourate", "Surah information")}
      >
        <Info size={16} />
      </button>

      {showInfo ? <SurahInfoPanel surahNum={surahNum} lang={lang} /> : null}
    </section>
  );
});

export default SurahHeader;
