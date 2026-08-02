import React from "react";
import { getSurahLigature } from "../../data/surahs";

export function CleanPageSurahHeader({ lang, surahMeta }) {
  const title = lang === "en" ? surahMeta?.en : surahMeta?.fr || surahMeta?.en;
  const displayName = title || surahMeta?.en || "";
  const surahNum = surahMeta?.n || surahMeta?.id || surahMeta?.number;
  const surahLigature = getSurahLigature(surahNum);
  const accessibleArabicTitle = surahMeta?.ar ? `سورة ${surahMeta.ar}` : "سورة";

  return (
    <div className="cpv-surah-header-container flex items-center justify-center w-full my-8 select-none pointer-events-none">
      <div className="cpv-surah-header-divider flex items-center justify-center w-full gap-4 px-2">
        <div className="cpv-divider-line h-px flex-grow bg-gradient-to-r from-transparent via-[#c8a84b]/40 to-[#c8a84b]/70" />
        <div className="cpv-divider-diamond text-[#c8a84b] text-xs">❖</div>

        <div className="cpv-surah-title-box border rounded-lg px-8 py-3 shadow-lg flex flex-col items-center justify-center min-w-[220px]">
          <span
            className="cpv-surah-name-ar"
            dir="rtl"
            lang="ar"
            aria-label={accessibleArabicTitle}
          >
            <span
              className={surahLigature ? "cpv-surah-name-ligature" : "cpv-surah-name-fallback"}
              dir={surahLigature ? "ltr" : "rtl"}
              lang={surahLigature ? "en" : "ar"}
              aria-hidden="true"
            >
              {surahLigature || surahMeta?.ar}
            </span>
          </span>
          <span className="cpv-surah-name-tr text-[9.5px] font-semibold tracking-[0.14em] uppercase mt-0.5">
            {displayName}
          </span>
        </div>

        <div className="cpv-divider-diamond text-[#c8a84b] text-xs">❖</div>
        <div className="cpv-divider-line h-px flex-grow bg-gradient-to-l from-transparent via-[#c8a84b]/40 to-[#c8a84b]/70" />
      </div>
    </div>
  );
}

export function CleanPageSeparator({ isDarkTheme = false, pageNum }) {
  return (
    <div
      className="cpv-page-sep my-[1.2rem] mb-[1rem] flex w-full items-center gap-[0.85rem]"
      aria-hidden="true"
    >
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
      <span
        className={`cpv-page-sep-label whitespace-nowrap font-[var(--font-ui)] text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]${isDarkTheme ? " opacity-[0.42]" : " opacity-[0.55]"}`}
      >
        Page {pageNum}
      </span>
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
    </div>
  );
}
