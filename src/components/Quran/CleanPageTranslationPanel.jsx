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
      className="mt-6 flex flex-col gap-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 [font-family:var(--font-ui)] shadow-sm"
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
            className={cn(
              "flex items-start gap-4 rounded-xl border-b border-[var(--border)] px-3 py-3 text-[0.88rem] leading-[1.8] text-[var(--text-secondary)] transition-[background,color] duration-200 ease-out last:border-b-0 hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
              "max-[640px]:px-2 max-[640px]:py-3 max-[640px]:text-[0.82rem] max-[640px]:gap-3",
              isPlaying && "bg-[rgba(var(--primary-rgb),0.05)] text-[var(--text-primary)] shadow-sm border border-[rgba(var(--primary-rgb),0.2)]"
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full font-[var(--font-ui)] text-[0.75rem] font-bold leading-none select-none transition-colors mt-0.5",
                isPlaying
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]",
                "max-[640px]:h-6 max-[640px]:min-w-6 max-[640px]:text-[0.65rem]"
              )}
            >
              {lang === "ar" ? toAr(ayah.numberInSurah) : ayah.numberInSurah}
            </span>
            <div className="flex-1 space-y-2">
              {translations.map((translation, index) => (
                <div key={index} className="flex flex-col gap-0.5">
                  {translations.length > 1 ? (
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {translation.edition?.name || translation.edition?.identifier}
                    </span>
                  ) : null}
                  <span className="flex-1 font-medium text-[var(--text-secondary)]">
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
