import React from "react";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";

export default function CleanPageTranslationPanel({
  ayahs,
  currentPlayingAyah,
  getTranslation,
  lang,
  surahNum,
}) {
  return (
    <div
      className="cpv-translation-panel"
      dir={lang === "ar" ? "rtl" : "ltr"}
      role="region"
      aria-label={lang === "ar" ? "\u0627\u0644\u062a\u0631\u062c\u0645\u0629" : lang === "fr" ? "Traductions" : "Translations"}
    >
      {ayahs.map((ayah) => {
        const translations = getTranslation(ayah);
        if (!Array.isArray(translations) || translations.length === 0) return null;
        const ayahSurahNum = ayah.surah?.number || ayah.surah || surahNum;
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          (Number(currentPlayingAyah?.surah) === Number(ayahSurahNum) || currentPlayingAyah?.surah == null);

        return (
          <div
            key={ayah.numberInSurah}
            className={cn(
              "cpv-translation-row",
              isPlaying && "is-playing",
            )}
          >
            <span
              className={cn(
                "cpv-translation-number",
                isPlaying && "is-playing",
              )}
            >
              {lang === "ar" ? toAr(ayah.numberInSurah) : ayah.numberInSurah}
            </span>
            <div className="cpv-translation-copy">
              {translations.map((translation, index) => (
                <div key={index} className="cpv-translation-entry">
                  {translations.length > 1 ? (
                    <span className="cpv-translation-edition">
                      {translation.edition?.name || translation.edition?.identifier}
                    </span>
                  ) : null}
                  <span className="cpv-translation-text">
                    {translation.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
