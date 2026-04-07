import React from "react";
import { toAr } from "../../data/surahs";

export function CleanPageSurahHeader({ lang, surahMeta }) {
  const subtitle =
    lang === "fr" ? surahMeta?.fr : lang === "ar" ? null : surahMeta?.en;

  return (
    <div className="cpv-surah-header mb-6 flex items-center justify-center gap-[0.9rem] [direction:rtl]">
      <span className="cpv-surah-header-line h-px flex-1 bg-[linear-gradient(to_left,var(--cpv-gold),transparent)] opacity-[0.45]" />
      <div className="cpv-surah-header-frame relative inline-flex min-w-[210px] flex-col items-center border-[1.5px] border-[var(--cpv-gold)] bg-[linear-gradient(135deg,rgba(184,134,11,0.05)_0%,transparent_45%,transparent_55%,rgba(184,134,11,0.05)_100%)] px-8 pt-[0.45rem] pb-[0.5rem] shadow-[inset_0_0_0_3px_var(--cpv-bg),inset_0_0_0_5px_rgba(184,134,11,0.22)]">
        <span className="pointer-events-none absolute top-1/2 left-[-1.2em] -translate-y-1/2 text-[0.55rem] leading-none text-[var(--cpv-gold)] opacity-70">
          {"\u2756"}
        </span>
        <span className="cpv-surah-header-name" dir="rtl" lang="ar">
          {"\u0633\u064f\u0648\u0631\u064e\u0629\u064f"} {surahMeta?.ar}
        </span>
        {subtitle ? (
          <span className="cpv-surah-header-sub mt-[0.1rem] font-[var(--font-ui)] text-[0.62rem] uppercase tracking-[0.08em] text-[var(--text-secondary)] opacity-[0.55] [direction:ltr]">
            {subtitle}
          </span>
        ) : null}
        <span className="pointer-events-none absolute top-1/2 right-[-1.2em] -translate-y-1/2 text-[0.55rem] leading-none text-[var(--cpv-gold)] opacity-70">
          {"\u2756"}
        </span>
      </div>
      <span className="cpv-surah-header-line h-px flex-1 bg-[linear-gradient(to_right,var(--cpv-gold),transparent)] opacity-[0.45]" />
    </div>
  );
}

export function VerseMedallion({ isPlaying = false, num }) {
  return (
    <span
      className={`cpv-medallion verse-stop-medallion${isPlaying ? " is-playing" : ""}`}
      aria-label={`Verse ${num}`}
    >
      <span className="verse-stop-medallion__ring" />
      <span className="verse-stop-number">{toAr(num)}</span>
    </span>
  );
}

export function CleanPageSeparator({ isDarkTheme = false, pageNum }) {
  return (
    <div className="cpv-page-sep my-[1.2rem] mb-[1rem] flex w-full items-center gap-[0.85rem]" aria-hidden="true">
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
      <span className={`cpv-page-sep-label whitespace-nowrap font-["Scheherazade_New","Amiri",serif] text-[0.82rem] font-semibold tracking-[0.05em] text-[var(--primary)] [direction:rtl]${isDarkTheme ? " opacity-[0.42]" : " opacity-[0.55]"}`}>
        {toAr(pageNum)}
      </span>
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
    </div>
  );
}
