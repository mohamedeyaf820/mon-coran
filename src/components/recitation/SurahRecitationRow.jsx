import React, { memo } from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";

const SurahRecitationRow = memo(function SurahRecitationRow({
  surah,
  lang,
  onPlay,
  onOpen,
  onOpenIntent,
  reciter,
  riwaya,
}) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;
  const ayahLabel =
    lang === "fr" ? "versets" : lang === "ar" ? "آيات" : "verses";
  const isMeccan = surah.type === "Meccan";
  const typeLabel = isMeccan
    ? (lang === "ar" ? "مكية" : lang === "fr" ? "Mak." : "Mak.")
    : (lang === "ar" ? "مدنية" : lang === "fr" ? "Méd." : "Med.");

  return (
    <div className="recitation-row group" role="listitem">
      <span className="recitation-row__index">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>

      <div className="recitation-row__copy">
        <div className="recitation-row__title">
          {label}
          <span
            className={`recitation-row__type${isMeccan ? " recitation-row__type--meccan" : " recitation-row__type--medinan"}`}
            aria-label={isMeccan ? (lang === "ar" ? "مكية" : "Meccan") : (lang === "ar" ? "مدنية" : "Medinan")}
          >
            {typeLabel}
          </span>
        </div>
        <div className="recitation-row__meta">
          <span className="recitation-row__arabic" dir="rtl" lang="ar">
            {surah.ar}
          </span>
          <span aria-hidden="true">·</span>
          <span>{surah.ayahs} {ayahLabel}</span>
        </div>
      </div>

      <RowActions
        lang={lang}
        surahLabel={`${label} (${surah.n})`}
        onPlay={onPlay}
        onOpen={onOpen}
        onOpenIntent={onOpenIntent}
        surah={surah}
        reciter={reciter}
        riwaya={riwaya}
      />
    </div>
  );
});

export default SurahRecitationRow;
