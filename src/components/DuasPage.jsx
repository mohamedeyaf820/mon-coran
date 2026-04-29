import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import Footer from "./Footer";

const CATEGORIES = [
  { id: "all", fr: "Toutes", en: "All", ar: "الكل" },
  { id: "ibadah", fr: "Adoration", en: "Worship", ar: "العبادة" },
  { id: "tawhid", fr: "Tawhid", en: "Tawhid", ar: "التوحيد" },
  { id: "hidayah", fr: "Guidee", en: "Guidance", ar: "الهداية" },
  { id: "forgiveness", fr: "Pardon", en: "Forgiveness", ar: "المغفرة" },
  { id: "steadfastness", fr: "Fermete", en: "Steadfastness", ar: "الثبات" },
  { id: "family", fr: "Famille", en: "Family", ar: "الاسرة" },
  { id: "dunya-akhirah", fr: "Dounya & Akhira", en: "Dunya & Akhirah", ar: "الدنيا والاخرة" },
  { id: "ummah", fr: "Oumma", en: "Ummah", ar: "الامة" },
  { id: "rizq", fr: "Rizq", en: "Provision", ar: "الرزق" },
  { id: "shifa", fr: "Guerison", en: "Healing", ar: "الشفاء" },
  { id: "safar", fr: "Voyage", en: "Travel", ar: "السفر" },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);

export default function DuasPage() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const labels = {
    title: lang === "ar" ? "أدعية من القرآن" : lang === "fr" ? "Invocations du Coran" : "Quranic Invocations",
    subtitle:
      lang === "ar"
        ? "مجموعة واضحة للادعية القرآنية مع وصول مباشر للآيات"
        : lang === "fr"
          ? "Une bibliotheque claire d'invocations coraniques, avec acces direct aux versets."
          : "A clear library of Quranic supplications with direct access to each verse.",
    back: lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home",
    search:
      lang === "ar"
        ? "ابحث في الادعية..."
        : lang === "fr"
          ? "Rechercher une invocation..."
          : "Search supplications...",
    collection:
      lang === "ar"
        ? "Bibliotheque d'invocations"
        : lang === "fr"
          ? "Bibliotheque d'invocations"
          : "Supplication library",
    collectionCopy:
      lang === "ar"
        ? "قراءة مريحة: المرجع، الدعاء، الترجمة، ثم actions."
        : lang === "fr"
          ? "Cartes simples: reference, categorie, arabe lisible, traduction, puis actions."
          : "Simple cards: reference, category, readable Arabic, translation, then actions.",
    noResults: lang === "ar" ? "لا توجد نتائج مطابقة" : lang === "fr" ? "Aucune invocation trouvee" : "No results found",
  };

  const copyDua = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message: lang === "ar" ? "تم النسخ!" : "Copie !",
          },
        }),
      );
    });
  };

  const filteredDuas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QURAN_DUAS.filter((dua) => {
      const categoryOk = activeCategory === "all" || dua.category === activeCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return `${dua.arabic} ${dua.transliteration} ${dua.fr} ${dua.en}`
        .toLowerCase()
        .includes(q);
    });
  }, [activeCategory, query]);

  const goToVerse = (surah, ayah) => {
    set({ showDuas: false, showHome: false, displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const activeCategoryMeta = CATEGORY_MAP[activeCategory] || CATEGORY_MAP.all;
  const activeCategoryLabel =
    lang === "ar"
      ? activeCategoryMeta.ar
      : lang === "fr"
        ? activeCategoryMeta.fr
        : activeCategoryMeta.en;
  const resultCountLabel =
    lang === "ar"
      ? `${filteredDuas.length} دعاء`
      : lang === "fr"
        ? `${filteredDuas.length} invocation${filteredDuas.length > 1 ? "s" : ""}`
        : `${filteredDuas.length} supplication${filteredDuas.length > 1 ? "s" : ""}`;

  return (
    <div className="duas-page duas-page--platform">
      <section className="duas-hero">
        <div className="duas-hero-head">
          <div className="duas-hero-content">
            <h1 className="duas-title">{labels.title}</h1>
            <p className="duas-subtitle">{labels.subtitle}</p>
          </div>

          <button
            className="duas-back-btn"
            onClick={() => set({ showDuas: false, showHome: true })}
            type="button"
          >
            <i className="fas fa-house" aria-hidden="true" />
            {labels.back}
          </button>
        </div>

        <div className="duas-tools">
          <label className="duas-search-wrap">
            <i className="fas fa-magnifying-glass" aria-hidden="true" />
            <input
              type="text"
              className="duas-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
            />
          </label>

          <div className="duas-hero-stats">
            <div className="duas-hero-stat">
              <span className="duas-hero-stat-label">
                {lang === "ar" ? "العرض" : lang === "fr" ? "Affichage" : "View"}
              </span>
              <strong>{resultCountLabel}</strong>
            </div>
            <div className="duas-hero-stat">
              <span className="duas-hero-stat-label">
                {lang === "ar" ? "الفئة" : lang === "fr" ? "Categorie" : "Category"}
              </span>
              <strong>{activeCategoryLabel}</strong>
            </div>
            <div className="duas-hero-stat duas-hero-stat--hint">
              <span className="duas-hero-stat-label">
                {lang === "ar" ? "Usage" : lang === "fr" ? "Usage" : "Use"}
              </span>
              <strong>
                {lang === "fr"
                  ? "Copier ou ouvrir le verset"
                  : lang === "ar"
                    ? "انسخ الدعاء او افتح الآية"
                    : "Copy or open the verse"}
              </strong>
            </div>
          </div>

          <div className="duas-categories scrollbar-hide" role="tablist" aria-label="Dua categories">
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

      <section className="duas-results" aria-live="polite">
        <div className="duas-results-head">
          <div>
            <h2 className="duas-results-title">{labels.collection}</h2>
            <p className="duas-results-copy">{labels.collectionCopy}</p>
          </div>
          <div className="duas-results-badge">{resultCountLabel}</div>
        </div>

        <div className="gallery-grid">
          {filteredDuas.length === 0 && (
            <div className="duas-empty">
              <i className="fas fa-magnifying-glass-minus" />
              <p>{labels.noResults}</p>
            </div>
          )}

          {filteredDuas.map((dua, idx) => {
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
                        <i className="fas fa-book-open" aria-hidden="true" />
                        <span>
                          {sTitle}
                          <span className="dua-ref-nums"> · {dua.surah}:{dua.ayah}</span>
                        </span>
                      </div>
                      <span className="dua-cat-pill">{categoryLabel}</span>
                    </div>
                    <div className="dua-head-actions">
                      <button
                        className="dua-open-btn-v5"
                        onClick={() =>
                          copyDua(
                            `${dua.arabic}\n\n${dua.transliteration ? `${dua.transliteration}\n\n` : ""}${lang === "fr" ? dua.fr : dua.en}`,
                          )
                        }
                        title={lang === "fr" ? "Copier" : lang === "ar" ? "نسخ الدعاء" : "Copy"}
                        aria-label={lang === "fr" ? "Copier l'invocation" : lang === "ar" ? "نسخ الدعاء" : "Copy supplication"}
                        type="button"
                      >
                        <i className="fas fa-copy" aria-hidden="true" />
                      </button>
                      <button
                        className="dua-open-btn-v5"
                        onClick={() => goToVerse(dua.surah, dua.ayah)}
                        title={lang === "fr" ? "Ouvrir dans le Coran" : lang === "ar" ? "فتح في المصحف" : "Open in Quran"}
                        type="button"
                      >
                        <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="dua-content-area">
                    <p className="dua-arabic">{dua.arabic}</p>
                    {dua.transliteration && <p className="dua-translit">{dua.transliteration}</p>}
                    <p className="dua-translation">
                      {lang === "ar" ? dua.en : lang === "fr" ? dua.fr : dua.en}
                    </p>
                  </div>

                  <div className="dua-card-footer">
                    <span className="dua-card-footer-copy">
                      {lang === "fr"
                        ? "Source coranique accessible directement"
                        : lang === "ar"
                          ? "انتقال مباشر الى موضع الآية"
                          : "Direct access to the verse location"}
                    </span>
                    <button
                      className="dua-card-footer-link"
                      onClick={() => goToVerse(dua.surah, dua.ayah)}
                      type="button"
                    >
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                      <span>{lang === "fr" ? "Lire" : lang === "ar" ? "فتح" : "Open"}</span>
                    </button>
                  </div>
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
