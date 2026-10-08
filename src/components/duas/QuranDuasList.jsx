import React, { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { t } from "../../i18n";
import { hubText } from "../../utils/duasHubText";
import DuasHeader from "./DuasHeader";
import DuasSearchBox from "./DuasSearchBox";
import QuranDuaCard from "./QuranDuaCard";
import { DUAS_ROUTES } from "./duasRoute";
import {
  QURAN_CATEGORIES,
  QURAN_CATEGORY_MAP,
  categoryLabel,
  searchQuranSupplications,
} from "./quranDuas";

const INITIAL_CATEGORY_COUNT = 5;

export default function QuranDuasList({ lang, headingRef }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const duas = useMemo(() => searchQuranSupplications(query, activeCategory), [query, activeCategory]);

  const activeMeta = QURAN_CATEGORY_MAP[activeCategory] || QURAN_CATEGORY_MAP.all;
  const firstCategories = QURAN_CATEGORIES.slice(0, INITIAL_CATEGORY_COUNT);
  const visibleCategories = categoriesExpanded
    ? QURAN_CATEGORIES
    : firstCategories.some((category) => category.id === activeCategory)
      ? firstCategories
      : [...firstCategories, activeMeta];
  const hiddenCategoryCount = QURAN_CATEGORIES.length - visibleCategories.length;

  const reset = () => {
    setQuery("");
    setActiveCategory("all");
    searchRef.current?.focus();
  };

  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={hubText("quranTitle", lang)}
        subtitle={t("duas.collectionCopy", lang)}
        back={{ to: DUAS_ROUTES.hub, label: hubText("backToHub", lang) }}
      >
        <DuasSearchBox lang={lang} value={query} onChange={setQuery} inputRef={searchRef} />

        <div
          className="duas-categories scrollbar-hide"
          role="group"
          aria-label={t("duas.categoriesLabel", lang)}
          tabIndex={0}
        >
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              className={`duas-cat-btn ${activeCategory === category.id ? "active" : ""}`}
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              type="button"
            >
              {categoryLabel(category, lang)}
            </button>
          ))}
        </div>
        {hiddenCategoryCount > 0 || categoriesExpanded ? (
          <button
            type="button"
            className="duas-categories-toggle"
            aria-expanded={categoriesExpanded}
            onClick={() => setCategoriesExpanded((expanded) => !expanded)}
          >
            {categoriesExpanded
              ? t("ux.fewerCategories", lang)
              : t("ux.moreCategories", lang).replace("{count}", String(hiddenCategoryCount))}
          </button>
        ) : null}
      </DuasHeader>

      <section className="duas-results">
        <div className="duas-results-head">
          <div>
            <h2 className="duas-results-title">{t("duas.collection", lang)}</h2>
          </div>
          <div className="duas-results-badge" aria-live="polite">
            <span>{categoryLabel(activeMeta, lang)}</span>
            <strong>{t("duas.resultsCount", lang, duas.length)}</strong>
          </div>
        </div>

        <div className="gallery-grid">
          {duas.length === 0 && (
            <div className="duas-empty">
              <Search size={24} aria-hidden="true" />
              <p>{t("duas.noResults", lang)}</p>
              <button className="duas-empty-reset" onClick={reset} type="button">
                {t("duas.resetFilters", lang)}
              </button>
            </div>
          )}
          {duas.map((dua) => (
            <QuranDuaCard key={dua.id} dua={dua} lang={lang} />
          ))}
        </div>
      </section>
    </>
  );
}
