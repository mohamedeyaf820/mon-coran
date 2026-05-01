import React from "react";
import AyahMarker from "./AyahMarker";

export function CleanPageSurahHeader({ lang, surahMeta }) {
  const title = lang === "en" ? surahMeta?.en : surahMeta?.fr || surahMeta?.en;

  return (
    <div className="cpv-surah-header qcom-surah-title-card">
      <div className="qcom-surah-title-card__arabic font-surah-names" dir="rtl" lang="ar">
        {surahMeta?.ar}
      </div>
      <div className="qcom-surah-title-card__text">
        <strong>
          {surahMeta?.n}. {surahMeta?.en}
        </strong>
        <span>{title}</span>
      </div>
    </div>
  );
}

export function VerseMedallion({ isPlaying = false, num }) {
  return (
    <AyahMarker
      num={num}
      isPlaying={isPlaying}
      className="qcom-verse-stop verse-end-marker"
      size="md"
    />
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
