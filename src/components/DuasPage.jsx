import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import Footer from "./Footer";
import "../styles/duas-page.css";

const CATEGORIES = [
  { id: "all", fr: "Toutes", en: "All", ar: "الكل" },
  { id: "ibadah", fr: "Adoration", en: "Worship", ar: "العبادة" },
  { id: "tawhid", fr: "Tawhid", en: "Tawhid", ar: "التوحيد" },
  { id: "hidayah", fr: "Guidée", en: "Guidance", ar: "الهداية" },
  { id: "forgiveness", fr: "Pardon", en: "Forgiveness", ar: "المغفرة" },
  { id: "steadfastness", fr: "Fermeté", en: "Steadfastness", ar: "الثبات" },
  { id: "family", fr: "Famille", en: "Family", ar: "الأسرة" },
  {
    id: "dunya-akhirah",
    fr: "Dounya & Akhira",
    en: "Dunya & Akhirah",
    ar: "الدنيا والآخرة",
  },
  { id: "ummah", fr: "Oumma", en: "Ummah", ar: "الأمة" },
  { id: "rizq", fr: "Rizq", en: "Provision", ar: "الرزق" },
  { id: "shifa", fr: "Guérison", en: "Healing", ar: "الشفاء" },
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

  const copyDua = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message: lang === "ar" ? "تم النسخ!" : "Copié !",
          },
        }),
      );
    });
  };

  const filteredDuas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QURAN_DUAS.filter((dua) => {
      const categoryOk =
        activeCategory === "all" || dua.category === activeCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      const haystack =
        `${dua.arabic} ${dua.transliteration} ${dua.fr} ${dua.en}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, query]);

  const goToVerse = (surah, ayah) => {
    set({ showDuas: false, showHome: false, displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const homeLabel =
    lang === "ar"
      ? "العودة للرئيسية"
      : lang === "fr"
        ? "Retour à l'accueil"
        : "Back to home";
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
    <div className="duas-page duas-page--platform !space-y-3 !px-3 !pb-4 sm:!space-y-4 sm:!px-4">
      <section className="duas-hero !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.95),rgba(8,15,30,0.94))] !p-4 !shadow-[0_24px_60px_rgba(1,8,22,0.45)] sm:!p-5">
        <div className="duas-hero-head !flex !flex-wrap !items-start !justify-between !gap-3">
          <div className="duas-hero-content">
            <h1 className="duas-title">
              {lang === "ar"
                ? "أدعية من القرآن"
                : lang === "fr"
                  ? "Invocations du Coran"
                  : "Quranic Invocations"}
            </h1>
            <p className="duas-subtitle">
              {lang === "ar"
                ? "تصفح كنوز الأدعية القرآنية لتنوير قلبك"
                : lang === "fr"
                  ? "Explorez les trésors des invocations coraniques pour illuminer votre cœur"
                  : "Explore the treasures of Quranic supplications to illuminate your heart"}
            </p>
          </div>

          <button
            className="duas-back-btn !inline-flex !min-h-11 !items-center !gap-2 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3.5 !py-2 hover:!bg-white/[0.12]"
            onClick={() => set({ showDuas: false, showHome: true })}
          >
            <i className="fas fa-house" aria-hidden="true"></i>
            {homeLabel}
          </button>
        </div>

        <div className="duas-tools !mt-3 !space-y-3">
          <div className="duas-hero-stats !grid !grid-cols-1 !gap-2 sm:!grid-cols-3">
            <div className="duas-hero-stat !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
              <span className="duas-hero-stat-label">
                {lang === "ar" ? "العرض" : lang === "fr" ? "Affichage" : "View"}
              </span>
              <strong>{resultCountLabel}</strong>
            </div>
            <div className="duas-hero-stat !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
              <span className="duas-hero-stat-label">
                {lang === "ar"
                  ? "الفئة"
                  : lang === "fr"
                    ? "Catégorie"
                    : "Category"}
              </span>
              <strong>{activeCategoryLabel}</strong>
            </div>
            <div className="duas-hero-stat duas-hero-stat--hint !rounded-2xl !border !border-white/10 !bg-white/[0.04] !p-3">
              <span className="duas-hero-stat-label">
                {lang === "ar" ? "استخدام" : lang === "fr" ? "Usage" : "Use"}
              </span>
              <strong>
                {lang === "ar"
                  ? "افتح الآية مباشرة داخل المصحف"
                  : lang === "fr"
                    ? "Ouvrez chaque verset directement dans la lecture"
                    : "Open any verse directly in reading mode"}
              </strong>
            </div>
          </div>

          <div
            className="duas-categories scrollbar-hide !flex !gap-2 !overflow-x-auto !pb-1"
            role="tablist"
            aria-label="Dua categories"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`duas-cat-btn !inline-flex !min-h-11 !items-center !rounded-xl !border !px-3 !py-2 !text-sm !transition-all hover:!border-sky-200/40 hover:!bg-white/[0.12] ${activeCategory === cat.id ? "active !border-sky-200/40 !bg-sky-500/20 !text-white" : "!border-white/14 !bg-white/[0.05]"}`}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
              >
                {lang === "ar" ? cat.ar : lang === "fr" ? cat.fr : cat.en}
              </button>
            ))}
          </div>

          <div className="duas-search-wrap !relative !rounded-2xl !border !border-white/14 !bg-white/[0.04] !px-3">
            <i className="fas fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="text"
              className="duas-search !min-h-11 !w-full !bg-transparent !pl-7 !pr-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "ابحث في الأدعية..."
                  : lang === "fr"
                    ? "Rechercher une invocation..."
                    : "Search supplications..."
              }
            />
          </div>
        </div>
      </section>

      <section className="duas-results !rounded-3xl !border !border-white/10 !bg-white/[0.03] !p-4 sm:!p-5" aria-live="polite">
        <div className="duas-results-head !mb-3 !flex !flex-wrap !items-start !justify-between !gap-2">
          <div>
            <h2 className="duas-results-title">
              {lang === "ar"
                ? "مختارات الدعاء"
                : lang === "fr"
                  ? "Collection d'invocations"
                  : "Supplication collection"}
            </h2>
            <p className="duas-results-copy">
              {lang === "ar"
                ? "بطاقات أوضح للقراءة السريعة والتنقل المباشر نحو الآية."
                : lang === "fr"
                  ? "Des cartes plus lisibles, avec une hiérarchie plus claire entre arabe, translittération et traduction."
                  : "Cleaner cards with a clearer hierarchy between Arabic, transliteration and translation."}
            </p>
          </div>
          <div className="duas-results-badge !rounded-full !border !border-white/14 !bg-white/[0.05] !px-3 !py-1.5 !text-xs">{resultCountLabel}</div>
        </div>

        <div className="gallery-grid !grid !grid-cols-1 !gap-3 xl:!grid-cols-2">
          {filteredDuas.length === 0 && (
            <div className="duas-empty !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-6 !text-center">
              <i className="fas fa-magnifying-glass-minus" />
              <p>
                {lang === "ar"
                  ? "لا توجد نتائج مطابقة"
                  : lang === "fr"
                    ? "Aucune invocation trouvée"
                    : "No results found"}
              </p>
            </div>
          )}

          {filteredDuas.map((dua, idx) => {
            const sIndex = (dua.surah || 1) - 1;
            const sData = SURAHS[sIndex] || {
              ar: "السورة",
              fr: "Sourate",
              en: "Surah",
            };
            const sTitle =
              lang === "ar" ? sData.ar : lang === "fr" ? sData.fr : sData.en;

            return (
              <article key={`${dua.id}-${idx}`} className="dua-card-v5 !rounded-2xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(13,24,46,0.75),rgba(9,17,33,0.8))] !p-3 !shadow-[0_12px_28px_rgba(1,8,22,0.28)]">
                <div className="dua-card-inner !space-y-3">
                  <div className="dua-card-head !flex !items-start !justify-between !gap-2">
                    <div className="dua-head-main">
                      <div className="dua-ref-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.06] !px-2.5 !py-1.5 !text-xs">
                        <i className="fas fa-book-sparkles" />
                        <span>
                          {sTitle}{" "}
                          <span className="dua-ref-nums">
                            · {dua.surah}:{dua.ayah}
                          </span>
                        </span>
                      </div>
                      <span className="dua-cat-pill !ml-1 !inline-flex !rounded-full !border !border-sky-200/30 !bg-sky-500/18 !px-2.5 !py-1 !text-xs">
                        {lang === "ar"
                          ? CATEGORY_MAP[dua.category]?.ar ||
                            CATEGORY_MAP.all.ar
                          : lang === "fr"
                            ? CATEGORY_MAP[dua.category]?.fr ||
                              CATEGORY_MAP.all.fr
                            : CATEGORY_MAP[dua.category]?.en ||
                              CATEGORY_MAP.all.en}
                      </span>
                    </div>
                    <div className="dua-head-actions">
                      <button
                        className="dua-open-btn-v5"
                        onClick={() =>
                          copyDua(
                            `${dua.arabic}\n\n${dua.transliteration ? dua.transliteration + "\n\n" : ""}${lang === "fr" ? dua.fr : dua.en}`,
                          )
                        }
                        title={
                          lang === "ar"
                            ? "نسخ الدعاء"
                            : lang === "fr"
                              ? "Copier"
                              : "Copy"
                        }
                        aria-label={
                          lang === "ar"
                            ? "نسخ الدعاء"
                            : lang === "fr"
                              ? "Copier l'invocation"
                              : "Copy supplication"
                        }
                      >
                        <i className="fas fa-copy" aria-hidden="true"></i>
                      </button>
                      <button
                        className="dua-open-btn-v5 !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]"
                        onClick={() => goToVerse(dua.surah, dua.ayah)}
                        title={
                          lang === "ar" ? "فتح في المصحف" : "Open in Quran"
                        }
                      >
                        <i
                          className="fas fa-arrow-up-right-from-square"
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>
                  </div>

                  <div className="dua-content-area !space-y-2">
                    <p className="dua-arabic">{dua.arabic}</p>
                    {dua.transliteration && (
                      <p className="dua-translit">{dua.transliteration}</p>
                    )}
                    <p className="dua-translation">
                      {lang === "ar" ? dua.en : lang === "fr" ? dua.fr : dua.en}
                    </p>
                  </div>

                  <div className="dua-card-footer !flex !items-center !justify-between !gap-2 !rounded-xl !border !border-white/10 !bg-white/[0.03] !px-3 !py-2">
                    <span className="dua-card-footer-copy">
                      {lang === "ar"
                        ? "انتقال سريع إلى موضع الآية"
                        : lang === "fr"
                          ? "Accès direct à l’emplacement du verset"
                          : "Jump directly to the verse location"}
                    </span>
                    <button
                      className="dua-card-footer-link !inline-flex !items-center !gap-1.5 !rounded-lg !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1.5 !text-xs hover:!bg-white/[0.12]"
                      onClick={() => goToVerse(dua.surah, dua.ayah)}
                    >
                      <i className="fas fa-arrow-right"></i>
                      <span>
                        {lang === "ar"
                          ? "فتح"
                          : lang === "fr"
                            ? "Lire"
                            : "Open"}
                      </span>
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
