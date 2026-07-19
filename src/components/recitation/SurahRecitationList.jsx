import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import SURAHS from "../../data/surahs";
import SurahRecitationRow from "./SurahRecitationRow";

const INITIAL_VISIBLE_SURAHS = 24;
const CHUNK_SIZE = 24;

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function SurahRecitationList({
  lang,
  reciter,
  getDownloadUrl,
  onPlaySurah,
  onOpenSurah,
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SURAHS);
  const normalizedQuery = normalize(query);

  useEffect(() => {
    setQuery("");
  }, [reciter?.id]);

  const filteredSurahs = useMemo(() => {
    if (!normalizedQuery) return SURAHS;
    return SURAHS.filter((surah) =>
      normalize(`${surah.n} ${surah.fr} ${surah.en} ${surah.ar}`).includes(
        normalizedQuery,
      ),
    );
  }, [normalizedQuery]);

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
      if (node.scrollHeight - node.scrollTop - node.clientHeight < 320) {
        revealMore();
      }
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

  const searchLabel =
    lang === "fr"
      ? "Rechercher une sourate"
      : lang === "ar"
        ? "البحث عن سورة"
        : "Search a surah";

  return (
    <div className="recitation-library">
      <div className="recitation-library__toolbar">
        <label className="recitation-library__search">
          <Search size={15} aria-hidden="true" />
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
              aria-label={
                lang === "fr"
                  ? "Effacer la recherche"
                  : lang === "ar"
                    ? "مسح البحث"
                    : "Clear search"
              }
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </label>
        <span className="recitation-library__count">
          {filteredSurahs.length} {lang === "fr" ? "sourates" : lang === "ar" ? "سورة" : "surahs"}
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
            downloadUrl={getDownloadUrl(reciter, surah.n)}
            onPlay={() => handlePlay(surah.n)}
            onOpen={() => handleOpen(surah.n)}
          />
        ))}

        {visibleSurahs.length === 0 ? (
          <div className="recitation-library__empty" role="status">
            <Search size={20} aria-hidden="true" />
            <span>
              {lang === "fr"
                ? "Aucune sourate ne correspond à cette recherche."
                : lang === "ar"
                  ? "لا توجد سورة مطابقة لهذا البحث."
                  : "No surah matches this search."}
            </span>
          </div>
        ) : null}

        {visibleCount < filteredSurahs.length ? (
          <button
            type="button"
            className="recitation-row--load-more"
            onClick={revealMore}
          >
            {lang === "fr"
              ? "Afficher plus de sourates"
              : lang === "ar"
                ? "عرض المزيد من السور"
                : "Show more surahs"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
