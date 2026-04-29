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
      className="qc-surah-header qc-surah-header--minimal"
      data-surah-type={isMeccan ? "meccan" : "medinan"}
    >
      <div className="qc-surah-header__summary">
        <div className="qc-surah-header__arabic font-surah-names" dir="rtl" lang="ar">
          {s.ar}
        </div>

        <div className="qc-surah-header__title">
          <h1>
            <span>{surahNum}. </span>
            {s.en}
          </h1>
          <span>{translatedName}</span>
        </div>

        <div className="qc-surah-header__meta">
          <span
            className={cn(
              "qc-surah-header__pill",
              isMeccan
                ? "qc-surah-header__pill--gold"
                : "qc-surah-header__pill--green",
            )}
          >
            {revelationLabel}
          </span>
          <span>
            {s.ayahs} {ayahLabel}
          </span>
        </div>

        <button
          type="button"
          className="qc-sh-info-toggle"
          onClick={() => setShowInfo((value) => !value)}
          aria-expanded={showInfo}
          aria-label={labelFor(lang, "Informations sur la sourate", "Surah information")}
        >
          <Info size={15} />
          <span>Info</span>
        </button>
      </div>

      {showInfo ? <SurahInfoPanel surahNum={surahNum} lang={lang} /> : null}
    </section>
  );
});

export default SurahHeader;
