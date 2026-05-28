import React, { memo } from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";

const SurahRecitationRow = memo(function SurahRecitationRow({ surah, lang, onPlay, onOpen, downloadUrl }) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;

  return (
    <div className="recitation-row group flex items-center gap-3 rounded-2xl border border-border bg-bg-card/45 px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-[1px] hover:border-primary/30 hover:border-l-2 hover:border-l-[var(--primary)] hover:bg-bg-card hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <span className="recitation-row__index inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--primary-rgb),0.09)] text-[var(--primary)] text-xs font-bold font-mono transition-all duration-300 group-hover:bg-[rgba(var(--primary-rgb),0.15)] group-hover:shadow-[0_2px_8px_rgba(var(--primary-rgb),0.15)]">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>
      
      <div className="recitation-row__copy min-w-0 flex-1">
        <div className="recitation-row__title truncate text-sm font-bold text-text-primary group-hover:text-primary transition-colors duration-200">
          {label}
        </div>
        <div className="recitation-row__arabic text-[0.68rem] text-text-secondary opacity-80 mt-0.5">
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
