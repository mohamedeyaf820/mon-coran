import React, { useMemo, useState } from "react";
import "../styles/domains/duas-page.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import Footer from "./Footer";
import { Home, Search, BookOpen, Copy, ExternalLink, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { id: "all", fr: "Toutes", en: "All", ar: "الكل" },
  { id: "daily", fr: "Quotidien (Hisn)", en: "Daily (Hisn)", ar: "أذكار اليوم" },
  { id: "protection", fr: "Protection", en: "Protection", ar: "التحصين" },
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
    title: lang === "ar" ? "أدعية من القرآن والسنة" : lang === "fr" ? "Invocations & Citadelle du Musulman" : "Invocations & Fortress of the Muslim",
    subtitle:
      lang === "ar"
        ? "مجموعة شاملة للأدعية القرآنية وأذكار اليوم والليلة من حصن المسلم"
        : lang === "fr"
          ? "Une bibliothèque complète d'invocations coraniques et d'adhkar quotidiens (Hisn al-Muslim)."
          : "A complete library of Quranic supplications and daily adhkar from Hisn al-Muslim.",
    back: lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home",
    search:
      lang === "ar"
        ? "ابحث في الأدعية والأذكار..."
        : lang === "fr"
          ? "Rechercher une invocation, mosquée, pluie, réveil..."
          : "Search supplications, mosque, rain, morning...",
    collection:
      lang === "ar"
        ? "مكتبة الأدعية والأذكار"
        : lang === "fr"
          ? "Bibliothèque d'invocations"
          : "Supplication library",
    collectionCopy:
      lang === "ar"
        ? "قراءة مريحة: المصدر، الدعاء، الترجمة، مع إمكانية النسخ والمشاركة."
        : lang === "fr"
          ? "Cartes compactes : référence vérifiée, arabe vocalisé, phonétique et traduction."
          : "Compact cards: verified reference, vocalized Arabic, transliteration, and translation.",
    noResults: lang === "ar" ? "لا توجد نتائج مطابقة" : lang === "fr" ? "Aucune invocation trouvée" : "No results found",
  };

  const copyDua = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message: lang === "ar" ? "تم النسخ بنجاح!" : lang === "fr" ? "Invocation copiée !" : "Copied successfully!",
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
      return `${dua.arabic} ${dua.transliteration || ""} ${dua.fr || ""} ${dua.en || ""} ${dua.source || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [activeCategory, query]);

  const goToVerse = (surah, ayah) => {
    if (!surah) return;
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
            <Home size={16} aria-hidden="true" />
            {labels.back}
          </button>
        </div>

        <div className="duas-tools">
          <label className="duas-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              className="duas-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
              aria-label={labels.search}
            />
          </label>

          <div
            className="duas-categories scrollbar-hide"
            role="tablist"
            aria-label={t("duas.categoriesLabel", lang)}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`duas-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
                role="tab"
                aria-selected={activeCategory === cat.id}
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
          <div className="duas-results-badge" aria-live="polite">
            <span>{activeCategoryLabel}</span>
            <strong>{resultCountLabel}</strong>
          </div>
        </div>

        <div className="gallery-grid">
          {filteredDuas.length === 0 && (
            <div className="duas-empty">
              <Search size={24} />
              <p>{labels.noResults}</p>
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
                        onClick={() =>
                          copyDua(
                            `${dua.arabic}\n\n${dua.transliteration ? `${dua.transliteration}\n\n` : ""}${lang === "fr" ? dua.fr : dua.en}${dua.source ? `\n— ${dua.source}` : ""}`,
                          )
                        }
                        title={lang === "fr" ? "Copier" : lang === "ar" ? "نسخ الدعاء" : "Copy"}
                        aria-label={lang === "fr" ? "Copier l'invocation" : lang === "ar" ? "نسخ الدعاء" : "Copy supplication"}
                        type="button"
                      >
                        <Copy size={14} aria-hidden="true" />
                      </button>
                      {hasSurah && (
                        <button
                          className="dua-open-btn-v5"
                          onClick={() => goToVerse(dua.surah, dua.ayah)}
                          title={lang === "fr" ? "Ouvrir dans le Coran" : lang === "ar" ? "فتح في المصحف" : "Open in Quran"}
                          aria-label={lang === "fr" ? "Ouvrir dans le Coran" : lang === "ar" ? "فتح في المصحف" : "Open in Quran"}
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
                    <p className="dua-arabic">{String(dua.arabic || '').replace(/[\u060C\u061B\u061F,;.]/g, ' ').replace(/\s+/g, ' ')}</p>
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
                        aria-label={lang === "fr" ? "Lire le verset dans le Coran" : lang === "ar" ? "فتح الآية في المصحف" : "Read verse in Quran"}
                      >
                        <ArrowRight size={15} aria-hidden="true" />
                        <span>{lang === "fr" ? "Lire dans le Coran" : lang === "ar" ? "فتح في المصحف" : "Read in Quran"}</span>
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
