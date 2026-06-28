import React, { memo } from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";

const SurahRecitationRow = memo(function SurahRecitationRow({
  surah,
  lang,
  onPlay,
  onOpen,
  downloadUrl,
}) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;

  return (
    <div className="recitation-row group flex min-w-0 items-center gap-3 border-b border-border bg-transparent px-2 py-3.5 transition-colors duration-150 hover:bg-[rgba(var(--primary-rgb),0.03)]">
      <span className="recitation-row__index inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--primary-rgb),0.08)] font-mono text-xs font-bold text-[var(--primary)]">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>

      <div className="recitation-row__copy min-w-0 flex-1">
        <div className="recitation-row__title truncate text-[0.92rem] font-bold text-text-primary">
          {label}
        </div>
        <div className="recitation-row__arabic mt-0.5 truncate text-[0.8rem] text-text-muted">
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
