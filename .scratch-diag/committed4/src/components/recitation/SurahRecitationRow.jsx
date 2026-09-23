import React, { memo } from "react";
import RowActions from "./RowActions";
import { toAr } from "../../data/surahs";
import { getSurahVerseCountByRiwaya } from "../../constants/warshSource";
import { t } from "../../i18n";

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
  const ayahLabel = t("quran.versesWord", lang);
  const verseCount = getSurahVerseCountByRiwaya(surah.n, riwaya) || surah.ayahs;
  const isMeccan = surah.type === "Meccan";
  const typeLabel = t(isMeccan ? "quran.meccanShort" : "quran.medinanShort", lang);

  return (
    <div className="recitation-row group" role="listitem">
      <span className="recitation-row__index">
        {lang === "ar" ? toAr(surah.n) : surah.n}
      </span>

      <div className="recitation-row__copy">
        <div className="recitation-row__title">
          <span className="recitation-row__name">{label}</span>
          <span
            className={`recitation-row__type${isMeccan ? " recitation-row__type--meccan" : " recitation-row__type--medinan"}`}
            aria-label={t(isMeccan ? "quran.meccanAria" : "quran.medinanAria", lang)}
          >
            {typeLabel}
          </span>
        </div>
        <div className="recitation-row__meta">
          <span className="recitation-row__arabic" dir="rtl" lang="ar">
            {surah.ar}
          </span>
          <span aria-hidden="true">·</span>
          <span>{lang === "ar" ? toAr(verseCount) : verseCount} {ayahLabel}</span>
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
