import React from "react";
import { Search } from "lucide-react";
import { t } from "../../i18n";
import { hubText } from "../../utils/duasHubText";
import HisnChapterRow from "./HisnChapterRow";
import { chapterTitleFor } from "./hisnText";
import HisnItemCard from "./HisnItemCard";
import QuranDuaCard from "./QuranDuaCard";

/**
 * Results of a search over Hisn al-Muslim (and, from the hub, the Quranic
 * supplications): matching chapters first, then the invocations themselves.
 */
export default function HisnSearchResults({
  result,
  quranResults = [],
  lang,
  translation,
  translationFailed,
  onReset,
}) {
  const hasResults = result.chapters.length + result.itemTotal + quranResults.length > 0;

  if (!hasResults) {
    return (
      <div className="duas-empty">
        <Search size={24} aria-hidden="true" />
        <p>{t("duas.noResults", lang)}</p>
        <button className="duas-empty-reset" onClick={onReset} type="button">
          {t("duas.resetFilters", lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="duas-search-results" aria-live="polite">
      {result.chapters.length > 0 && (
        <section className="duas-block" aria-labelledby="duas-results-chapters">
          <h2 id="duas-results-chapters" className="duas-section-title">
            {hubText("resultsChapters", lang)}
          </h2>
          <ul className="hisn-rows">
            {result.chapters.map((chapter) => (
              <HisnChapterRow key={chapter.id} chapter={chapter} translation={translation} lang={lang} />
            ))}
          </ul>
        </section>
      )}

      {result.itemTotal + quranResults.length > 0 && (
        <section className="duas-block" aria-labelledby="duas-results-items">
          <h2 id="duas-results-items" className="duas-section-title">
            {hubText("resultsInvocations", lang)}
          </h2>
          <div className="gallery-grid">
            {result.items.map(({ chapter, item }) => (
              <HisnItemCard
                key={`${chapter.id}-${item.id}`}
                item={item}
                lang={lang}
                chapterTitle={chapterTitleFor(chapter, translation, lang)}
                showChapter
                translationText={translation?.items?.[item.id]}
                translationFailed={translationFailed}
              />
            ))}
            {quranResults.map((dua) => (
              <QuranDuaCard key={dua.id} dua={dua} lang={lang} />
            ))}
          </div>
          {result.itemTotal > result.items.length && (
            <p className="duas-results-note">{hubText("resultsLimited", lang, result.items.length)}</p>
          )}
        </section>
      )}
    </div>
  );
}
