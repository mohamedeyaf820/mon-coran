import React from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";

export default function SurahRecitationRow({ surah, lang, onPlay, onOpen, downloadUrl }) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-bg-card/45 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-[1px] hover:border-primary/30 hover:bg-bg-card hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--primary-rgb),0.07)] text-[var(--primary)] text-xs font-bold font-mono">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>
      
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
          {label}
        </div>
        <div className="text-[0.68rem] text-text-secondary opacity-80 mt-0.5">
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
}
