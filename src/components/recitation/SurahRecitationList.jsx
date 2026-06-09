import React, { useCallback, useEffect, useMemo, useState } from "react";
import SURAHS from "../../data/surahs";
import SurahRecitationRow from "./SurahRecitationRow";

const INITIAL_VISIBLE_SURAHS = 36;
const CHUNK_SIZE = 36;

function scheduleIdle(callback) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 900 });
    return () => window.cancelIdleCallback?.(id);
  }

  const timer = window.setTimeout(callback, 140);
  return () => window.clearTimeout(timer);
}

export default function SurahRecitationList({ lang, reciter, getDownloadUrl, onPlaySurah, onOpenSurah }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SURAHS);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_SURAHS);
    return scheduleIdle(() => {
      setVisibleCount((current) => Math.min(SURAHS.length, current + CHUNK_SIZE));
    });
  }, [reciter?.id]);

  const visibleSurahs = useMemo(
    () => SURAHS.slice(0, Math.min(SURAHS.length, visibleCount)),
    [visibleCount],
  );

  const revealMore = useCallback(() => {
    setVisibleCount((current) => Math.min(SURAHS.length, current + CHUNK_SIZE));
  }, []);

  const handleScroll = useCallback((event) => {
    const node = event.currentTarget;
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 320) {
      revealMore();
    }
  }, [revealMore]);

  const handlePlay = useCallback((surahN) => {
    onPlaySurah(surahN, reciter);
  }, [onPlaySurah, reciter]);

  const handleOpen = useCallback((surahN) => {
    onOpenSurah(surahN, reciter);
  }, [onOpenSurah, reciter]);

  return (
    <div
      className="recitation-surah-list flex flex-1 min-h-0 flex-col gap-0 overflow-y-auto"
      onScroll={handleScroll}
    >
      {visibleSurahs.map((surah) => (
        <SurahRecitationRow
          key={`${reciter.id}-${surah.n}`}
          surah={surah}
          lang={lang}
          downloadUrl={getDownloadUrl(reciter, surah.n)}
          onPlay={() => handlePlay(surah.n)}
          onOpen={() => handleOpen(surah.n)}
        />
      ))}
      {visibleCount < SURAHS.length ? (
        <button
          type="button"
          className="recitation-row--load-more border-t border-border bg-transparent py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-bg-secondary/50"
          onClick={revealMore}
        >
          {lang === "fr" ? "Afficher plus de sourates" : lang === "ar" ? "عرض المزيد من السور" : "Show more surahs"}
        </button>
      ) : null}
    </div>
  );
}
