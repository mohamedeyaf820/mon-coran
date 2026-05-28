import React, { useCallback } from "react";
import SURAHS from "../../data/surahs";
import SurahRecitationRow from "./SurahRecitationRow";

export default function SurahRecitationList({ lang, reciter, getDownloadUrl, onPlaySurah, onOpenSurah }) {
  const handlePlay = useCallback((surahN) => {
    onPlaySurah(surahN, reciter);
  }, [onPlaySurah, reciter]);

  const handleOpen = useCallback((surahN) => {
    onOpenSurah(surahN, reciter);
  }, [onOpenSurah, reciter]);

  return (
    <div className="recitation-surah-list grid flex-1 min-h-0 grid-cols-1 gap-2.5 overflow-y-auto pr-1 md:grid-cols-2">
      {SURAHS.map((surah) => (
        <SurahRecitationRow
          key={`${reciter.id}-${surah.n}`}
          surah={surah}
          lang={lang}
          downloadUrl={getDownloadUrl(reciter, surah.n)}
          onPlay={() => handlePlay(surah.n)}
          onOpen={() => handleOpen(surah.n)}
        />
      ))}
    </div>
  );
}
