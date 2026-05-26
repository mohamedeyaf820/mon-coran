import React from "react";
import SURAHS from "../../data/surahs";
import SurahRecitationRow from "./SurahRecitationRow";

export default function SurahRecitationList({ lang, reciter, getDownloadUrl, onPlaySurah, onOpenSurah }) {
  return (
    <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
      {SURAHS.map((surah) => (
        <SurahRecitationRow
          key={`${reciter.id}-${surah.n}`}
          surah={surah}
          lang={lang}
          downloadUrl={getDownloadUrl(reciter, surah.n)}
          onPlay={() => onPlaySurah(surah.n, reciter)}
          onOpen={() => onOpenSurah(surah.n, reciter)}
        />
      ))}
    </div>
  );
}
