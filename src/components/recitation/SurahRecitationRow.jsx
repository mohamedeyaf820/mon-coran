import React, { memo } from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";

const SurahRecitationRow = memo(function SurahRecitationRow({ surah, lang, onPlay, onOpen, downloadUrl }) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;

  return (
    <div className="recitation-row group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-bg-card/65 px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/35 hover:bg-bg-card hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] sm:px-4">
      <span className="recitation-row__index inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] text-xs font-black font-mono transition-all duration-300 group-hover:bg-[rgba(var(--primary-rgb),0.16)] group-hover:shadow-[0_2px_8px_rgba(var(--primary-rgb),0.15)]">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>
      
      <div className="recitation-row__copy min-w-0 flex-1">
        <div className="recitation-row__title truncate text-sm font-extrabold text-text-primary transition-colors duration-200 group-hover:text-primary">
          {label}
        </div>
        <div className="recitation-row__arabic mt-0.5 truncate text-[0.72rem] text-text-secondary opacity-80">
          {surah.ar}
        </div>
      </div>
      
      <RowActions
        lang={lang}
        onPlay={onPlay}
        onOpen={onOpen}
        downloadUrl={downloadUrl}
      />
    </div>
  );
});

export default SurahRecitationRow;
