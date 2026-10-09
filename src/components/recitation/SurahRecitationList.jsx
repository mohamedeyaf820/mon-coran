import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { filterSurahDirectory } from "../../utils/searchIntelligence";
import SurahRecitationRow from "./SurahRecitationRow";
import { t } from "../../i18n";

const INITIAL_VISIBLE_SURAHS = 18;
const CHUNK_SIZE = 18;

export default function SurahRecitationList({
  lang,
  reciter,
  onPlaySurah,
  onOpenSurah,
  onOpenSurahIntent,
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SURAHS);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim();

  useEffect(() => {
    setQuery("");
  }, [reciter?.id]);

  const filteredSurahs = useMemo(
    () => filterSurahDirectory(normalizedQuery),
    [normalizedQuery],
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_SURAHS);
  }, [filteredSurahs.length, normalizedQuery, reciter?.id]);

  const visibleSurahs = useMemo(
    () => filteredSurahs.slice(0, Math.min(filteredSurahs.length, visibleCount)),
    [filteredSurahs, visibleCount],
  );

  const revealMore = useCallback(() => {
    setVisibleCount((current) =>
      Math.min(filteredSurahs.length, current + CHUNK_SIZE),
    );
  }, [filteredSurahs.length]);

  const handleScroll = useCallback(
    (event) => {
      const node = event.currentTarget;
      // RAF-defer layout reads so they don't block the scroll compositor
      requestAnimationFrame(() => {
        if (!node) return;
        if (node.scrollHeight - node.scrollTop - node.clientHeight < 320) {
          revealMore();
        }
      });
    },
    [revealMore],
  );

  const handlePlay = useCallback(
    (surahN) => onPlaySurah(surahN, reciter),
    [onPlaySurah, reciter],
  );
  const handleOpen = useCallback(
    (surahN) => onOpenSurah(surahN, reciter),
    [onOpenSurah, reciter],
  );
  const handleOpenIntent = useCallback(
    (surahN) => onOpenSurahIntent?.(surahN),
    [onOpenSurahIntent],
  );

  const searchLabel = t("recitation.searchSurah", lang);

  return (
    <div className="recitation-library">
      <div className="recitation-library__toolbar">
        <label className="recitation-library__search">
          <Search className="recitation-icon recitation-icon--sm" size={15} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("home.clearSearch", lang)}
            >
              <X className="recitation-icon recitation-icon--sm" size={14} aria-hidden="true" />
            </button>
          ) : null}
        </label>
        <span className="recitation-library__count">
          {t("recitation.surahCount", lang, filteredSurahs.length)}
        </span>
      </div>

      <div
        className="recitation-surah-list"
        onScroll={handleScroll}
        role="list"
      >
        {visibleSurahs.map((surah) => (
          <SurahRecitationRow
            key={`${reciter.id}-${surah.n}`}
            surah={surah}
            lang={lang}
            reciter={reciter}
            riwaya={reciter.verifiedWarsh ? "warsh" : "hafs"}
            onPlay={() => handlePlay(surah.n)}
            onOpen={() => handleOpen(surah.n)}
            onOpenIntent={() => handleOpenIntent(surah.n)}
          />
        ))}

        {visibleSurahs.length === 0 ? (
          <div className="recitation-library__empty" role="status">
            <Search className="recitation-icon recitation-icon--lg" size={20} aria-hidden="true" />
            <span>
              {t("recitation.noMatch", lang)}
            </span>
          </div>
        ) : null}

        {visibleCount < filteredSurahs.length ? (
          <button
            type="button"
            className="recitation-row--load-more"
            onClick={revealMore}
          >
            {t("recitation.showMore", lang)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
