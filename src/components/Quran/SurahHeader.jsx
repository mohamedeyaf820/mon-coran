import React, { useState } from "react";
import { Info, Play, Loader2 } from "lucide-react";
import { getSurah } from "../../data/surahs";
import { cn } from "../../lib/utils";
import SurahInfoPanel from "../QuranDisplay/SurahInfoPanel";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

const SurahHeader = React.memo(function SurahHeader({
  surahNum,
  lang,
  onPlaySurah,
  preparingSurah,
  translationLabel,
}) {
  const s = getSurah(surahNum);
  const [showInfo, setShowInfo] = useState(false);

  if (!s) return null;

  const isMeccan = s.type === "Meccan";
  const translatedName =
    lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;
  const revelationLabel = isMeccan
    ? labelFor(lang, "Mecquoise", "Meccan", "مكية")
    : labelFor(lang, "Médinoise", "Medinan", "مدنية");
  const ayahLabel = labelFor(lang, "versets", "verses", "آيات");
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);

  return (
    <section
      className="qc-surah-banner"
      aria-labelledby={`surah-title-${surahNum}`}
    >
      <div className="qc-surah-banner__inner">
        {/* Left: Arabic name + info */}
        <div className="qc-surah-banner__identity">
          {/* Arabic calligraphy */}
          <div
            className="qc-surah-banner__arabic"
            dir="rtl"
            lang="ar"
            aria-label={s.ar}
          >
            {s.ar}
          </div>

          {/* Text info */}
          <div className="qc-surah-banner__meta">
            <h1
              id={`surah-title-${surahNum}`}
              className="qc-surah-banner__title"
            >
              <span className="qc-surah-banner__num">{surahNum}.</span>{" "}
              {translatedName}
            </h1>
            <p className="qc-surah-banner__sub">{s.en}</p>
            <p className="qc-surah-banner__desc">
              {labelFor(
                lang,
                `Lisez et écoutez la Sourate ${s.fr || s.en} — traduction, tafsir, récitation audio.`,
                `Read and listen to Surah ${s.en} — translation, tafsir, audio recitation.`,
                `اقرأ واستمع إلى سورة ${s.ar}`,
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="qc-surah-banner__actions">
          {/* Badges */}
          <div className="qc-surah-banner__badges">
            <span
              className={cn(
                "qc-surah-banner__badge",
                isMeccan
                  ? "qc-surah-banner__badge--gold"
                  : "qc-surah-banner__badge--blue",
              )}
            >
              {revelationLabel}
            </span>
            <span className="qc-surah-banner__badge">
              {s.ayahs} {ayahLabel}
            </span>
          </div>

          {/* Buttons */}
          <div className="qc-surah-banner__btns">
            {onPlaySurah && (
              <button
                type="button"
                className="qc-surah-banner__play-btn"
                onClick={onPlaySurah}
                disabled={isPreparing}
                aria-label={labelFor(
                  lang,
                  "Écouter la sourate",
                  "Listen to surah",
                  "استمع للسورة",
                )}
              >
                {isPreparing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                <span>
                  {isPreparing
                    ? labelFor(lang, "Chargement...", "Loading...", "جاري...")
                    : labelFor(lang, "Écouter", "Listen", "استمع")}
                </span>
              </button>
            )}

            <button
              type="button"
              className="qc-surah-banner__info-btn"
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              aria-label={labelFor(
                lang,
                "Informations sur la sourate",
                "Surah information",
                "معلومات السورة",
              )}
            >
              <Info size={15} />
              <span className="hidden sm:inline">
                {labelFor(lang, "Info", "Info", "معلومات")}
              </span>
            </button>
          </div>

          {/* Translation label if provided */}
          {translationLabel && (
            <div className="qc-surah-banner__translation-label">
              {translationLabel}
            </div>
          )}
        </div>
      </div>

      {showInfo && <SurahInfoPanel surahNum={surahNum} lang={lang} />}
    </section>
  );
});

export default SurahHeader;
