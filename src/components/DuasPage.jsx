import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import QURAN_DUAS from "../data/duas";
import SURAHS from "../data/surahs";
import "../styles/duas-page.css";

const CATEGORIES = [
  { id: "all", fr: "Toutes", en: "All", ar: "الكل" },
  { id: "forgiveness", fr: "Pardon", en: "Forgiveness", ar: "المغفرة" },
  { id: "family", fr: "Famille", en: "Family", ar: "الأسرة" },
  { id: "dunya-akhirah", fr: "Dounya & Akhira", en: "Dunya & Akhirah", ar: "الدنيا والآخرة" },
  { id: "steadfastness", fr: "Fermeté", en: "Steadfastness", ar: "الثبات" },
  { id: "ibadah", fr: "Adoration", en: "Worship", ar: "العبادة" },
  { id: "hidayah", fr: "Guidée", en: "Guidance", ar: "الهداية" },
  { id: "ummah", fr: "Oumma", en: "Ummah", ar: "الأمة" },
  { id: "tawhid", fr: "Tawhid", en: "Tawhid", ar: "التوحيد" },
];

export default function DuasPage() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filteredDuas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QURAN_DUAS.filter((dua) => {
      const categoryOk = activeCategory === "all" || dua.category === activeCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      const haystack = `${dua.arabic} ${dua.transliteration} ${dua.fr} ${dua.en}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, query]);

  const goToVerse = (surah, ayah) => {
    set({ showDuas: false, showHome: false, displayMode: "surah" });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const homeLabel =
    lang === "ar" ? "العودة للرئيسية" : lang === "fr" ? "Retour à l'accueil" : "Back to home";

  return (
    <div className="duas-page">
      <section className="duas-hero">
        <div className="duas-hero-head">
          <div>
            <span className="duas-chip">
              <i className="fas fa-hands-praying" aria-hidden="true"></i>
              {lang === "ar" ? "أدعية قرآنية" : lang === "fr" ? "Douas coraniques" : "Quranic Duas"}
            </span>
            <h1 className="duas-title">
              {lang === "ar"
                ? "أدعية من القرآن"
                : lang === "fr"
                  ? "Invocations tirées du Coran"
                  : "Invocations from the Quran"}
            </h1>
            <p className="duas-subtitle">
              {lang === "ar"
                ? "تصفح الأدعية مع النص العربي والترجمة والترجمة الصوتية"
                : lang === "fr"
                  ? "Parcourez des douas avec arabe, translittération et traduction"
                  : "Browse duas with Arabic, transliteration and translation"}
            </p>
          </div>

          <button className="duas-back-btn" onClick={() => set({ showDuas: false, showHome: true })}>
            <i className="fas fa-house" aria-hidden="true"></i>
            {homeLabel}
          </button>
        </div>

        <div className="duas-tools">
          <div className="duas-categories" role="tablist" aria-label="Dua categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`duas-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
              >
                {lang === "ar" ? cat.ar : lang === "fr" ? cat.fr : cat.en}
              </button>
            ))}
          </div>

          <div className="duas-search-wrap">
            <i className="fas fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="text"
              className="duas-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ar" ? "ابحث في الأدعية..." : lang === "fr" ? "Rechercher dans les douas..." : "Search duas..."}
              aria-label={lang === "ar" ? "بحث الأدعية" : lang === "fr" ? "Rechercher des douas" : "Search duas"}
            />
          </div>
        </div>
      </section>

      <section className="duas-list" aria-live="polite">
        {filteredDuas.length === 0 && (
          <div className="duas-empty">
            {lang === "ar"
              ? "لا توجد نتائج مطابقة"
              : lang === "fr"
                ? "Aucune doua trouvée"
                : "No duas found"}
          </div>
        )}

        {filteredDuas.map((dua) => {
          const surahName = SURAHS[dua.surah - 1];
          return (
            <article key={dua.id} className="dua-card">
              <div className="dua-card-head">
                <span className="dua-ref-pill">
                  {lang === "ar" ? surahName?.ar : lang === "fr" ? surahName?.fr : surahName?.en}
                  <span> · {dua.surah}:{dua.ayah}</span>
                </span>
                <button
                  className="dua-open-btn"
                  onClick={() => goToVerse(dua.surah, dua.ayah)}
                >
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  {lang === "ar" ? "فتح الآية" : lang === "fr" ? "Ouvrir le verset" : "Open verse"}
                </button>
              </div>

              <p className="dua-arabic">{dua.arabic}</p>
              <p className="dua-translit">{dua.transliteration}</p>
              <p className="dua-translation">{lang === "fr" ? dua.fr : lang === "ar" ? dua.fr : dua.en}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
