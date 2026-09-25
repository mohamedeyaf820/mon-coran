import React, { useMemo, useRef, useState } from "react";
import "../styles/domains/duas-page.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import { foldSearchText } from "../utils/searchIntelligence";
import Footer from "./Footer";
import { Home, Search, BookOpen, Copy, ExternalLink, ArrowRight, Share2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", fr: "Toutes", en: "All", ar: "الكل" },
  { id: "daily", fr: "Adhkars du jour", en: "Daily (Hisn)", ar: "أذكار اليوم" },
  { id: "protection", fr: "Protection", en: "Protection", ar: "التحصين" },
  { id: "ibadah", fr: "Adoration", en: "Worship", ar: "العبادة" },
  { id: "tawhid", fr: "Tawhid", en: "Tawhid", ar: "التوحيد" },
  { id: "hidayah", fr: "Guidance", en: "Guidance", ar: "الهداية" },
  { id: "forgiveness", fr: "Pardon", en: "Forgiveness", ar: "المغفرة" },
  { id: "steadfastness", fr: "Fermeté", en: "Steadfastness", ar: "الثبات" },
  { id: "family", fr: "Famille", en: "Family", ar: "الأسرة" },
  { id: "dunya-akhirah", fr: "Ici-bas et au-delà", en: "Dunya & Akhirah", ar: "الدنيا والآخرة" },
  { id: "ummah", fr: "Oumma", en: "Ummah", ar: "الأمة" },
  { id: "rizq", fr: "Rizq", en: "Provision", ar: "الرزق" },
  { id: "shifa", fr: "Guérison", en: "Healing", ar: "الشفاء" },
  { id: "safar", fr: "Voyage", en: "Travel", ar: "السفر" },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);

// The dataset is static, so fold each record once at import time instead of
// rebuilding 85 normalized strings on every keystroke.
const DUA_SEARCH_INDEX = QURAN_DUAS.map((dua) => {
  const category = CATEGORY_MAP[dua.category];
  const surah = dua.surah ? SURAHS[dua.surah - 1] : null;
  return {
    dua,
    haystack: foldSearchText(
      [
        dua.arabic,
        dua.transliteration,
        dua.fr,
        dua.en,
        dua.source,
        dua.title?.fr,
        dua.title?.en,
        dua.title?.ar,
        surah && `${surah.fr} ${surah.en} ${surah.ar}`,
        category && `${category.fr} ${category.en} ${category.ar}`,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  };
});

export default function DuasPage() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const copyDua = async (text) => {
    let type = "success";
    let message = t("duas.copiedToast", lang);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      type = "error";
      message = t("duas.copyFailedToast", lang);
    }
    window.dispatchEvent(new CustomEvent("quran-toast", { detail: { type, message } }));
  };

  const filteredDuas = useMemo(() => {
    const terms = foldSearchText(query).split(" ").filter(Boolean);
    return DUA_SEARCH_INDEX.filter(({ dua, haystack }) => {
      if (activeCategory !== "all" && dua.category !== activeCategory) return false;
      return terms.every((term) => haystack.includes(term));
    }).map(({ dua }) => dua);
  }, [activeCategory, query]);

  const goToVerse = (surah, ayah) => {
    if (!surah) return;
    set({ showDuas: false, showHome: false, displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  // Reuses the verse share studio: same SVG→canvas card, with the category as
  // the "occasion" badge and the source as reference for non-Quranic adhkar.
  const shareDua = (dua, categoryLabel) => {
    set({
      shareImageOpen: true,
      shareVerseDraft: {
        kind: "dua",
        surah: dua.surah || 0,
        ayah: dua.ayah || 0,
        arabicText: dua.arabic || "",
        translationText: lang === "fr" ? dua.fr : dua.en,
        occasion: categoryLabel,
        source: dua.source || "Hisn al-Muslim",
      },
    });
  };

  const activeCategoryMeta = CATEGORY_MAP[activeCategory] || CATEGORY_MAP.all;
  const activeCategoryLabel =
    lang === "ar"
      ? activeCategoryMeta.ar
      : lang === "fr"
        ? activeCategoryMeta.fr
        : activeCategoryMeta.en;
  const resultCountLabel = t("duas.resultsCount", lang, filteredDuas.length);

  return (
    <div className="duas-page duas-page--platform">
      <section className="duas-hero">
        <div className="duas-hero-head">
          <div className="duas-hero-content">
            <h1 className="duas-title">{t("duas.title", lang)}</h1>
            <p className="duas-subtitle">{t("duas.subtitle", lang)}</p>
          </div>

          <button
            className="duas-back-btn"
            onClick={() => set({ showDuas: false, showHome: true })}
            type="button"
          >
            <Home size={16} aria-hidden="true" />
            {t("duas.back", lang)}
          </button>
        </div>

        <div className="duas-tools">
          <label className="duas-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              className="duas-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("duas.searchPlaceholder", lang)}
              aria-label={t("duas.searchPlaceholder", lang)}
            />
          </label>

          <div
            className="duas-categories scrollbar-hide"
            role="group"
            aria-label={t("duas.categoriesLabel", lang)}
            tabIndex={0}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`duas-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
                type="button"
              >
                {lang === "ar" ? cat.ar : lang === "fr" ? cat.fr : cat.en}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="duas-results">
        <div className="duas-results-head">
          <div>
            <h2 className="duas-results-title">{t("duas.collection", lang)}</h2>
            <p className="duas-results-copy">{t("duas.collectionCopy", lang)}</p>
          </div>
          <div className="duas-results-badge" aria-live="polite">
            <span>{activeCategoryLabel}</span>
            <strong>{resultCountLabel}</strong>
          </div>
        </div>

        <div className="gallery-grid">
          {filteredDuas.length === 0 && (
            <div className="duas-empty">
              <Search size={24} />
              <p>{t("duas.noResults", lang)}</p>
              <button
                className="duas-empty-reset"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                  searchRef.current?.focus();
                }}
                type="button"
              >
                {t("duas.resetFilters", lang)}
              </button>
            </div>
          )}

          {filteredDuas.map((dua, idx) => {
            const hasSurah = Boolean(dua.surah);
            const sIndex = (dua.surah || 1) - 1;
            const sData = SURAHS[sIndex] || {
              ar: "السورة",
              fr: "Sourate",
              en: "Surah",
            };
            const sTitle = lang === "ar" ? sData.ar : lang === "fr" ? sData.fr : sData.en;
            const category =
              CATEGORY_MAP[dua.category] || CATEGORY_MAP.all;
            const categoryLabel =
              lang === "ar" ? category.ar : lang === "fr" ? category.fr : category.en;

            return (
              <article key={`${dua.id}-${idx}`} className="dua-card-v5">
                <div className="dua-card-inner">
                  <div className="dua-card-head">
                    <div className="dua-head-main">
                      <div className="dua-ref-pill">
                        <BookOpen size={12} aria-hidden="true" />
                        <span>
                          {hasSurah ? (
                            <>
                              {sTitle}
                              <span className="dua-ref-nums"> · {dua.surah}:{dua.ayah}</span>
                            </>
                          ) : (
                            dua.source || "Hisn al-Muslim"
                          )}
                        </span>
                      </div>
                      <span className="dua-cat-pill">{categoryLabel}</span>
                    </div>
                    <div className="dua-head-actions">
                      <button
                        className="dua-open-btn-v5"
                        onClick={() => shareDua(dua, categoryLabel)}
                        title={t("duas.shareTitle", lang)}
                        aria-label={t("duas.shareAria", lang)}
                        type="button"
                      >
                        <Share2 size={14} aria-hidden="true" />
                      </button>
                      <button
                        className="dua-open-btn-v5"
                        onClick={() =>
                          copyDua(
                            `${dua.arabic}\n\n${dua.transliteration ? `${dua.transliteration}\n\n` : ""}${lang === "fr" ? dua.fr : dua.en}${dua.source ? `\n— ${dua.source}` : ""}`,
                          )
                        }
                        title={t("duas.copyTitle", lang)}
                        aria-label={t("duas.copyAria", lang)}
                        type="button"
                      >
                        <Copy size={14} aria-hidden="true" />
                      </button>
                      {hasSurah && (
                        <button
                          className="dua-open-btn-v5"
                          onClick={() => goToVerse(dua.surah, dua.ayah)}
                          title={t("duas.openInQuran", lang)}
                          aria-label={t("duas.openInQuran", lang)}
                          type="button"
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="dua-content-area">
                    {dua.title && (
                      <h3 className="dua-item-title">
                        {lang === "ar" ? dua.title.ar : lang === "fr" ? dua.title.fr : dua.title.en}
                      </h3>
                    )}
                    <p className="dua-arabic">
                      {String(dua.arabic || '').split(/([\u060C\u061B\u061F])/u).map((part, i) =>
                        /^[\u060C\u061B\u061F]$/u.test(part) ? (
                          <span key={i} className="dua-arabic-punct">{part}</span>
                        ) : (
                          part
                        )
                      )}
                    </p>
                    {dua.transliteration && <p className="dua-translit">{dua.transliteration}</p>}
                    <p className="dua-translation">
                      {lang === "ar" ? dua.en : lang === "fr" ? dua.fr : dua.en}
                    </p>
                  </div>

                  {hasSurah ? (
                    <div className="dua-card-footer">
                      <button
                        className="dua-card-footer-link"
                        onClick={() => goToVerse(dua.surah, dua.ayah)}
                        type="button"
                        aria-label={t("duas.readVerseAria", lang)}
                      >
                        <ArrowRight size={15} aria-hidden="true" />
                        <span>{t("duas.readInQuran", lang)}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="dua-card-footer dua-card-footer--sunnah">
                      <span className="dua-source-tag">
                        {dua.source || "Hisn al-Muslim (Citadelle du Musulman)"}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Footer
        goSurah={(n) => {
          set({ showDuas: false, showHome: false });
          dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
        }}
      />
    </div>
  );
}
