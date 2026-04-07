import React from "react";
import { toAr } from "../../data/surahs";

export default function CleanPageTranslationPanel({
  ayahs,
  currentPlayingAyah,
  getTranslation,
  lang,
  surahNum,
}) {
  return (
    <div
      className="cpv-trans-panel mt-[1.8rem] flex flex-col gap-0 rounded-2xl border border-white/12 border-t-[1px] border-t-[rgba(var(--primary-rgb),0.12)] bg-[rgba(8,16,32,0.72)] p-3.5 pt-[1.4rem] [font-family:var(--font-ui)]"
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-label={lang === "ar" ? "\u0627\u0644\u062a\u0631\u062c\u0645\u0629" : lang === "fr" ? "Traductions" : "Translations"}
    >
      {ayahs.map((ayah) => {
        const translations = getTranslation(ayah);
        if (!Array.isArray(translations) || translations.length === 0) return null;
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          (currentPlayingAyah?.surah === surahNum || currentPlayingAyah?.surah == null);

        return (
          <div
            key={ayah.numberInSurah}
            className={`cpv-trans-entry flex items-baseline gap-3 rounded-[0.35rem] border-b border-[rgba(var(--primary-rgb),0.05)] px-[0.4rem] py-[0.55rem] text-[0.88rem] leading-[1.9] text-[var(--text-secondary)] transition-[background,color] duration-150 ease-out last:border-b-0 hover:bg-[rgba(var(--primary-rgb),0.025)] hover:text-[var(--text-primary)] max-[640px]:px-[0.3rem] max-[640px]:py-[0.45rem] max-[640px]:text-[0.82rem]${isPlaying ? " cpv-trans-entry--playing bg-[rgba(212,168,32,0.03)] text-[color:color-mix(in_srgb,var(--text-secondary)_80%,var(--gold,#c9a33d)_20%)]" : ""}`}
          >
            <span className={`cpv-trans-num inline-flex h-[1.85rem] min-w-[1.85rem] shrink-0 items-center justify-center rounded-full border border-[rgba(var(--primary-rgb),0.12)] bg-[rgba(var(--primary-rgb),0.06)] font-["Scheherazade_New","Amiri",serif] text-[0.72rem] font-bold leading-none text-[var(--primary)] [direction:rtl] transition-[background] duration-150 ease-out max-[640px]:h-[1.6rem] max-[640px]:min-w-[1.6rem] max-[640px]:text-[0.66rem]${isPlaying ? " border-[rgba(212,168,32,0.3)] bg-[rgba(212,168,32,0.12)] text-[var(--gold,#c9a33d)]" : ""}`}>
              {toAr(ayah.numberInSurah)}
            </span>
            <div className="cpv-trans-content flex-1">
              {translations.map((translation, index) => (
                <div key={index} className="cpv-trans-item">
                  {translations.length > 1 ? (
                    <span className="cpv-trans-edition">
                      [{translation.edition?.name || translation.edition?.identifier}]{" "}
                    </span>
                  ) : null}
                  <span className="cpv-trans-text flex-1 font-[420] tracking-[0.008em]">
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
