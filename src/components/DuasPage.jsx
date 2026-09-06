import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/domains/duas-page.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import Footer from "./Footer";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Home,
  LibraryBig,
  Search,
  X,
} from "lucide-react";

const CATEGORIES = [
  "all",
  "daily",
  "protection",
  "ibadah",
  "tawhid",
  "hidayah",
  "forgiveness",
  "steadfastness",
  "family",
  "dunya-akhirah",
  "ummah",
  "rizq",
  "shifa",
  "safar",
];

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase();
}

async function writeToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

export default function DuasPage() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [copiedDua, setCopiedDua] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const labels = {
    title: t("duas.title", lang),
    eyebrow: t("duas.eyebrow", lang),
    subtitle: t("duas.subtitle", lang),
    back: t("duas.back", lang),
    search: t("duas.search", lang),
    clearSearch: t("duas.clearSearch", lang),
    collection: t("duas.collection", lang),
    collectionCopy: t("duas.collectionCopy", lang),
    noResults: t("duas.noResults", lang),
    noResultsHint: t("duas.noResultsHint", lang),
    resetFilters: t("duas.resetFilters", lang),
    copy: t("duas.copy", lang),
    copied: t("duas.copied", lang),
    copyError: t("duas.copyError", lang),
    openQuran: t("duas.openQuran", lang),
    quranSource: t("duas.quranSource", lang),
    sunnahSource: t("duas.sunnahSource", lang),
  };

  const notify = (type, message) => {
    window.dispatchEvent(
      new CustomEvent("quran-toast", {
        detail: { type, message },
      }),
    );
  };

  const copyDua = async (text, duaKey) => {
    try {
      await writeToClipboard(text);
      window.clearTimeout(copyTimerRef.current);
      setCopiedDua(duaKey);
      copyTimerRef.current = window.setTimeout(() => setCopiedDua(null), 1800);
      notify("success", labels.copied);
    } catch {
      notify("error", labels.copyError);
    }
  };

  const filteredDuas = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return QURAN_DUAS.filter((dua) => {
      const categoryMatches = activeCategory === "all" || dua.category === activeCategory;
      if (!categoryMatches) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        dua.arabic,
        dua.transliteration,
        dua.fr,
        dua.en,
        dua.source,
        dua.title?.fr,
        dua.title?.en,
        dua.title?.ar,
        t(`duas.categories.${dua.category}`, lang),
      ].join(" ");

      return normalizeSearchText(searchableText).includes(normalizedQuery);
    });
  }, [activeCategory, lang, query]);

  const goToVerse = (surah, ayah) => {
    if (!surah) return;
    set({ showDuas: false, showHome: false, displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const resetFilters = () => {
    setActiveCategory("all");
    setQuery("");
  };

  const activeCategoryLabel = t(`duas.categories.${activeCategory}`, lang);
  const resultCountLabel = t("duas.resultCount", lang, filteredDuas.length);
  const totalCountLabel = t("duas.totalCount", lang, QURAN_DUAS.length);

  return (
    <div className="duas-page duas-page--platform duas-page--revamp" id="duas-page">
      <section className="duas-hero" aria-labelledby="duas-page-title">
        <div className="duas-hero-head">
          <div className="duas-hero-content">
            <p className="duas-eyebrow">
              <LibraryBig size={15} aria-hidden="true" />
              <span>{labels.eyebrow}</span>
              <span className="duas-eyebrow-divider" aria-hidden="true" />
              <strong>{totalCountLabel}</strong>
            </p>
            <h1 className="duas-title" id="duas-page-title">{labels.title}</h1>
            <p className="duas-subtitle">{labels.subtitle}</p>
          </div>

          <button
            className="duas-back-btn"
            onClick={() => set({ showDuas: false, showHome: true })}
            type="button"
          >
            <Home size={17} aria-hidden="true" />
            <span>{labels.back}</span>
          </button>
        </div>

        <div className="duas-tools">
          <label className="duas-search-wrap">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              className="duas-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
              aria-label={labels.search}
              autoComplete="off"
            />
            {query && (
              <button
                className="duas-search-clear"
                type="button"
                onClick={() => setQuery("")}
                aria-label={labels.clearSearch}
                title={labels.clearSearch}
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </label>

          <div
            className="duas-categories scrollbar-hide"
            role="group"
            aria-label={t("duas.categoriesLabel", lang)}
          >
            {CATEGORIES.map((categoryId) => (
              <button
                key={categoryId}
                className={`duas-cat-btn ${activeCategory === categoryId ? "active" : ""}`}
                onClick={() => setActiveCategory(categoryId)}
                aria-pressed={activeCategory === categoryId}
                type="button"
              >
                {t(`duas.categories.${categoryId}`, lang)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="duas-results" aria-labelledby="duas-results-title">
        <div className="duas-results-head">
          <div className="duas-results-heading">
            <p className="duas-results-kicker">{activeCategoryLabel}</p>
            <h2 className="duas-results-title" id="duas-results-title">{labels.collection}</h2>
            <p className="duas-results-copy">{labels.collectionCopy}</p>
          </div>
          <output className="duas-results-badge" aria-live="polite">
            {resultCountLabel}
          </output>
        </div>

        <div className="gallery-grid" id="duas-results-grid">
          {filteredDuas.length === 0 && (
            <div className="duas-empty" role="status">
              <span className="duas-empty-icon" aria-hidden="true"><Search size={25} /></span>
              <div>
                <h3>{labels.noResults}</h3>
                <p>{labels.noResultsHint}</p>
              </div>
              <button type="button" onClick={resetFilters}>{labels.resetFilters}</button>
            </div>
          )}

          {filteredDuas.map((dua, idx) => {
            const hasSurah = Boolean(dua.surah);
            const sIndex = (dua.surah || 1) - 1;
            const sData = SURAHS[sIndex] || { ar: "السورة", fr: "Sourate", en: "Surah" };
            const sTitle = lang === "ar" ? sData.ar : lang === "fr" ? sData.fr : sData.en;
            const categoryLabel = t(`duas.categories.${dua.category}`, lang);
            const duaKey = `${dua.id}-${idx}`;
            const itemTitle = dua.title
              ? lang === "ar"
                ? dua.title.ar
                : lang === "fr"
                  ? dua.title.fr
                  : dua.title.en
              : null;

            return (
              <article
                key={duaKey}
                className="dua-card-v5"
                data-source-type={hasSurah ? "quran" : "sunnah"}
              >
                <div className="dua-card-inner">
                  <header className="dua-card-head">
                    <div className="dua-head-main">
                      <span className="dua-ref-pill">
                        <BookOpen size={14} aria-hidden="true" />
                        <span>
                          {hasSurah ? (
                            <>
                              {sTitle}
                              <span className="dua-ref-nums"> · {dua.surah}:{dua.ayah}</span>
                            </>
                          ) : (
                            labels.sunnahSource
                          )}
                        </span>
                      </span>
                      <span className="dua-cat-pill">{categoryLabel}</span>
                    </div>

                    <button
                      className={`dua-open-btn-v5 ${copiedDua === duaKey ? "is-copied" : ""}`}
                      onClick={() =>
                        copyDua(
                          `${dua.arabic}\n\n${dua.transliteration ? `${dua.transliteration}\n\n` : ""}${lang === "fr" ? dua.fr : dua.en}${dua.source ? `\n— ${dua.source}` : ""}`,
                          duaKey,
                        )
                      }
                      title={copiedDua === duaKey ? labels.copied : labels.copy}
                      aria-label={copiedDua === duaKey ? labels.copied : labels.copy}
                      type="button"
                    >
                      {copiedDua === duaKey ? (
                        <Check size={17} aria-hidden="true" />
                      ) : (
                        <Copy size={17} aria-hidden="true" />
                      )}
                    </button>
                  </header>

                  <div className="dua-content-area">
                    {itemTitle && <h3 className="dua-item-title">{itemTitle}</h3>}
                    <blockquote className="dua-arabic" lang="ar" dir="rtl">
                      {String(dua.arabic || "").split(/([\u060C\u061B\u061F])/u).map((part, partIndex) =>
                        /^[\u060C\u061B\u061F]$/u.test(part) ? (
                          <span key={partIndex} className="dua-arabic-punct">{part}</span>
                        ) : (
                          part
                        ),
                      )}
                    </blockquote>
                    <div className="dua-meaning">
                      {dua.transliteration && (
                        <p className="dua-translit" lang="ar-Latn">{dua.transliteration}</p>
                      )}
                      <p className="dua-translation">
                        {lang === "ar" ? dua.en : lang === "fr" ? dua.fr : dua.en}
                      </p>
                    </div>
                  </div>

                  {hasSurah ? (
                    <footer className="dua-card-footer">
                      <span className="dua-source-caption">{labels.quranSource}</span>
                      <button
                        className="dua-card-footer-link"
                        onClick={() => goToVerse(dua.surah, dua.ayah)}
                        type="button"
                        aria-label={`${labels.openQuran} · ${sTitle} ${dua.surah}:${dua.ayah}`}
                      >
                        <span>{labels.openQuran}</span>
                        <ExternalLink size={16} aria-hidden="true" />
                      </button>
                    </footer>
                  ) : (
                    <footer className="dua-card-footer dua-card-footer--sunnah">
                      <span className="dua-source-tag">
                        <BookOpen size={13} aria-hidden="true" />
                        {dua.source || labels.sunnahSource}
                      </span>
                    </footer>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Footer
        goSurah={(surah) => {
          set({ showDuas: false, showHome: false });
          dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: 1 } });
        }}
      />
    </div>
  );
}
