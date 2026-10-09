import React from "react";
import { getSurahLigature } from "../../data/surahs";

function TitleFlourish({ mirrored = false }) {
  return (
    <span
      className="cpv-divider-diamond"
      aria-hidden="true"
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}

export function CleanPageSurahHeader({ lang, surahMeta }) {
  const title = lang === "en" ? surahMeta?.en : surahMeta?.fr || surahMeta?.en;
  const displayName = title || surahMeta?.en || "";
  const surahNum = surahMeta?.n || surahMeta?.id || surahMeta?.number;
  const surahLigature = getSurahLigature(surahNum);
  const accessibleArabicTitle = surahMeta?.ar ? `سورة ${surahMeta.ar}` : "سورة";

  return (
    <div className="cpv-surah-header-container flex items-center justify-center w-full my-1 select-none pointer-events-none">
      <div className="cpv-surah-header-divider flex items-center justify-center w-full gap-2 px-1">
        <div className="cpv-divider-line h-px flex-grow bg-gradient-to-r from-transparent via-[#c8a84b]/40 to-[#c8a84b]/70" />
        <TitleFlourish />

        <div className="cpv-surah-title-box border rounded-sm px-6 py-1 shadow-sm flex items-center justify-center min-w-[200px]">
          <span
            className="cpv-surah-name-ar"
            dir="rtl"
            lang="ar"
            aria-label={accessibleArabicTitle}
            role="img"
          >
            <span
              className="cpv-surah-name-ligature font-surah-names"
              dir="ltr"
              lang="en"
              aria-hidden="true"
            >
              {surahLigature}
            </span>
          </span>
          <span className="cpv-surah-name-tr text-[9px] font-semibold tracking-[0.14em] uppercase hidden">
            {displayName}
          </span>
        </div>

        <TitleFlourish mirrored />
        <div className="cpv-divider-line h-px flex-grow bg-gradient-to-l from-transparent via-[#c8a84b]/40 to-[#c8a84b]/70" />
      </div>
    </div>
  );
}

