import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import PlatformLogo from "./PlatformLogo";
import { toAr } from "../data/surahs";

/* ─────────────────────────────────────────
   NAVIGATE — Sourates essentielles
───────────────────────────────────────── */
const FOOTER_NAVIGATE = [
  { n: 1, ar: "الْفَاتِحَة", fr: "Al-Fâtiha", en: "The Opening", ayat: 7 },
  { n: 2, ar: "الْبَقَرَة", fr: "Al-Baqara", en: "The Cow", ayat: 286 },
  { n: 18, ar: "الْكَهْف", fr: "Al-Kahf", en: "The Cave", ayat: 110 },
  { n: 36, ar: "يس", fr: "Yâ-Sîn", en: "Ya-Sin", ayat: 83 },
  { n: 55, ar: "الرَّحْمَن", fr: "Ar-Rahmân", en: "The Beneficent", ayat: 78 },
  { n: 67, ar: "الْمُلْك", fr: "Al-Mulk", en: "The Sovereignty", ayat: 30 },
  { n: 112, ar: "الْإِخْلَاص", fr: "Al-Ikhlâs", en: "Sincerity", ayat: 4 },
  { n: 113, ar: "الْفَلَق", fr: "Al-Falaq", en: "The Daybreak", ayat: 5 },
  { n: 114, ar: "النَّاس", fr: "An-Nâs", en: "Mankind", ayat: 6 },
];

/* ─────────────────────────────────────────
   POPULAR — Sourates populaires
───────────────────────────────────────── */
const FOOTER_POPULAR = [
  {
    n: 3,
    ar: "آلُ عِمْرَان",
    fr: "Âl Imrân",
    en: "Family of Imran",
    ayat: 200,
  },
  { n: 4, ar: "النِّسَاء", fr: "An-Nisâ", en: "The Women", ayat: 176 },
  { n: 19, ar: "مَرْيَم", fr: "Maryam", en: "Mary", ayat: 98 },
  { n: 32, ar: "السَّجْدَة", fr: "As-Sajda", en: "The Prostration", ayat: 30 },
  { n: 56, ar: "الْوَاقِعَة", fr: "Al-Wâqi'a", en: "The Inevitable", ayat: 96 },
  { n: 67, ar: "الْمُلْك", fr: "Al-Mulk", en: "The Sovereignty", ayat: 30 },
  {
    n: 73,
    ar: "الْمُزَّمِّل",
    fr: "Al-Muzzammil",
    en: "The Enshrouded",
    ayat: 20,
  },
  { n: 78, ar: "النَّبَأ", fr: "An-Naba'", en: "The Tidings", ayat: 40 },
  { n: 87, ar: "الْأَعْلَى", fr: "Al-A'lâ", en: "The Most High", ayat: 19 },
];

/* ─────────────────────────────────────────
   FEATURES — Fonctionnalités
───────────────────────────────────────── */
const FEATURES = [
  {
    icon: "fa-palette",
    fr: "Tajwîd coloré",
    en: "Color Tajweed",
    ar: "تجويد ملون",
  },
  {
    icon: "fa-language",
    fr: "Mot à mot",
    en: "Word by Word",
    ar: "كلمة بكلمة",
  },
  {
    icon: "fa-headphones",
    fr: "18+ récitateurs",
    en: "18+ Reciters",
    ar: "١٨+ قارئ",
  },
  {
    icon: "fa-bookmark",
    fr: "Signets & notes",
    en: "Bookmarks & Notes",
    ar: "إشارات وملاحظات",
  },
  {
    icon: "fa-moon",
    fr: "Mode nuit & sépia",
    en: "Night & Sepia mode",
    ar: "وضع ليلي",
  },
  {
    icon: "fa-wifi-slash",
    fr: "Hors ligne",
    en: "Offline support",
    ar: "دون اتصال",
  },
];

export default function Footer({ goSurah }) {
  const { state, dispatch, set } = useApp();
  const { lang } = state;
  const isRtl = lang === "ar";
  const currentYear = new Date().getFullYear();

  const [navExpanded, setNavExpanded] = useState(false);
  const [popExpanded, setPopExpanded] = useState(false);
  const [juzExpanded, setJuzExpanded] = useState(false);

  /* Navigate to a surah */
  const handleSurah = (n) => {
    if (!goSurah) return;
    goSurah(n);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Open Duas page */
  const handleDuas = () => {
    set({ showHome: false, showDuas: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Go home */
  const handleHome = () => {
    set({ showHome: true, showDuas: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Open search */
  const handleSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const handleSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const handleBookmarks = () => dispatch({ type: "TOGGLE_BOOKMARKS" });

  /* i18n helper */
  const t = (obj) => (lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en);

  /* Render a surah link row */
  const renderLink = (s) => (
    <li key={s.n}>
      <button className="ftr-link" onClick={() => handleSurah(s.n)}>
        <span className="ftr-link__num">{isRtl ? toAr(s.n) : s.n}</span>
        <span className="ftr-link__body">
          <span className="ftr-link__name">
            {lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}
          </span>
          <span className="ftr-link__sub">
            {s.ayat} {lang === "ar" ? "آية" : "Ayat"}
          </span>
        </span>
        <span className="ftr-link__ar" dir="rtl">
          {s.ar}
        </span>
      </button>
    </li>
  );

  return (
    <footer className="site-footer" role="contentinfo">
      {/* Decorative glow */}
      <div className="site-footer__glow" aria-hidden="true" />

      {/* ══ Ornamental ayah strip ══ */}
      <div className="site-footer__ayah-strip">
        <div className="site-footer__ayah-ornament" aria-hidden="true">
          ❧
        </div>
        <p className="site-footer__ayah-ar" dir="rtl">
          وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
        </p>
        <span className="site-footer__ayah-ref">
          {lang === "ar"
            ? "سورة الذاريات · ٥١:٥٦"
            : lang === "fr"
              ? "Sūrat Adh-Dhāriyāt · 51:56"
              : "Sūrat Adh-Dhāriyāt · 51:56"}
        </span>
      </div>

      {/* ══ Main grid ══ */}
      <div className="site-footer__inner">
        {/* ── Brand ── */}
        <div className="site-footer__brand">
          <button
            className="site-footer__brand-link"
            onClick={handleHome}
            title="MushafPlus"
            aria-label="MushafPlus home"
          >
            <div className="site-footer__logo-row">
            <PlatformLogo
              className="site-footer__logo"
              imgClassName="site-footer__logo-img"
              decorative
            />
            <div className="site-footer__brand-text">
              <span className="site-footer__site-name">MushafPlus</span>
              <span className="site-footer__site-tagline">
                {t({
                  fr: "La Parole d'Allah en beauté",
                  en: "The Holy Quran in beauty",
                  ar: "القرآن الكريم في جمال",
                })}
              </span>
            </div>
            </div>
          </button>

          <p className="site-footer__desc">
            {t({
              fr: "Application de lecture du Saint Coran avec tajwîd, mot à mot, douas et signets — riwâyas Ḥafs & Warsh.",
              en: "Holy Quran reader with tajweed, word-by-word, duas, bookmarks — Hafs & Warsh.",
              ar: "تطبيق لقراءة القرآن الكريم بروايتَي حفص وورش مع التجويد والكلمة بالكلمة والأدعية.",
            })}
          </p>

          <div className="site-footer__brand-links" aria-label="Brand links">
            <button className="site-footer__brand-mini-link" onClick={handleHome}>
              {t({ fr: "Accueil", en: "Home", ar: "الرئيسية" })}
            </button>
            <button
              className="site-footer__brand-mini-link"
              onClick={() => handleSurah(1)}
            >
              Al-Fatiha
            </button>
            <button
              className="site-footer__brand-mini-link"
              onClick={() => handleSurah(36)}
            >
              Ya-Sin
            </button>
          </div>

          {/* Quick-action buttons */}
          <div className="site-footer__actions">
            <button
              className="ftr-action-btn ftr-action-btn--primary"
              onClick={handleHome}
            >
              <i className="fas fa-home" />
              {t({ fr: "Accueil", en: "Home", ar: "الرئيسية" })}
            </button>
            <button className="ftr-action-btn" onClick={handleDuas}>
              <i className="fas fa-hands-praying" />
              {t({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
            </button>
            <button className="ftr-action-btn" onClick={handleSearch}>
              <i className="fas fa-magnifying-glass" />
              {t({ fr: "Recherche", en: "Search", ar: "بحث" })}
            </button>
            <button className="ftr-action-btn" onClick={handleBookmarks}>
              <i className="fas fa-bookmark" />
              {t({ fr: "Favoris", en: "Bookmarks", ar: "إشارات" })}
            </button>
            <button className="ftr-action-btn" onClick={handleSettings}>
              <i className="fas fa-gear" />
              {t({ fr: "Paramètres", en: "Settings", ar: "الإعدادات" })}
            </button>
          </div>

          {/* Feature badges */}
          <div className="site-footer__features">
            {FEATURES.slice(0, 4).map((f) => (
              <span key={f.icon} className="site-footer__feature-chip">
                <i className={`fas ${f.icon}`} />
                {t(f)}
              </span>
            ))}
          </div>
        </div>

        {/* ── Navigate ── */}
        <div className="site-footer__col">
          <h3 className="site-footer__col-title">
            <span className="site-footer__col-bar" aria-hidden="true" />
            {t({ fr: "Navigation", en: "Navigate", ar: "تصفح" })}
          </h3>
          <ul className="site-footer__surah-list">
            {(navExpanded ? FOOTER_NAVIGATE : FOOTER_NAVIGATE.slice(0, 6)).map(
              renderLink,
            )}
          </ul>
          {FOOTER_NAVIGATE.length > 6 && (
            <button
              className="ftr-show-more"
              onClick={() => setNavExpanded((v) => !v)}
            >
              <i className={`fas fa-chevron-${navExpanded ? "up" : "down"}`} />
              {navExpanded
                ? t({ fr: "Réduire", en: "Show less", ar: "أقل" })
                : t({ fr: "Voir plus", en: "Show more", ar: "المزيد" })}
            </button>
          )}
        </div>

        {/* ── Popular ── */}
        <div className="site-footer__col">
          <h3 className="site-footer__col-title">
            <span className="site-footer__col-bar" aria-hidden="true" />
            {t({ fr: "Populaires", en: "Popular", ar: "الأكثر قراءة" })}
          </h3>
          <ul className="site-footer__surah-list">
            {(popExpanded ? FOOTER_POPULAR : FOOTER_POPULAR.slice(0, 6)).map(
              renderLink,
            )}
          </ul>
          {FOOTER_POPULAR.length > 6 && (
            <button
              className="ftr-show-more"
              onClick={() => setPopExpanded((v) => !v)}
            >
              <i className={`fas fa-chevron-${popExpanded ? "up" : "down"}`} />
              {popExpanded
                ? t({ fr: "Réduire", en: "Show less", ar: "أقل" })
                : t({ fr: "Voir plus", en: "Show more", ar: "المزيد" })}
            </button>
          )}
        </div>

        {/* ── Quick Juz access ── */}
        <div className="site-footer__col site-footer__col--juz">
          <h3 className="site-footer__col-title">
            <span className="site-footer__col-bar" aria-hidden="true" />
            {t({ fr: "Accès Juz", en: "Juz Access", ar: "الأجزاء" })}
          </h3>
          <div className="ftr-juz-grid">
            {(juzExpanded
              ? Array.from({ length: 30 }, (_, i) => i + 1)
              : Array.from({ length: 15 }, (_, i) => i + 1)
            ).map((juz) => (
              <button
                key={juz}
                className="ftr-juz-btn"
                onClick={() => {
                  set({ showHome: false, showDuas: false });
                  dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title={`Juz ${juz}`}
              >
                {isRtl ? toAr(juz) : juz}
              </button>
            ))}
          </div>
          <button
            className="ftr-show-more"
            onClick={() => setJuzExpanded((v) => !v)}
          >
            <i className={`fas fa-chevron-${juzExpanded ? "up" : "down"}`} />
            {juzExpanded
              ? t({ fr: "Moins de Juz", en: "Less Juz", ar: "أجزاء أقل" })
              : t({ fr: "Voir tous les Juz", en: "Show all Juz", ar: "عرض كل الأجزاء" })}
          </button>
        </div>
      </div>

      {/* ══ Bottom bar ══ */}
      <div className="site-footer__bottom">
        <span className="site-footer__copy">
          {lang === "fr"
            ? `© ${currentYear} MushafPlus — Lecture du Coran`
            : lang === "ar"
              ? `© ${currentYear} مصحف بلس`
              : `© ${currentYear} MushafPlus — Holy Quran Reader`}
        </span>

        <nav className="site-footer__bottom-links" aria-label="Quick links">
          {[
            { n: 1, label: "Al-Fâtiha" },
            { n: 36, label: "Yâ-Sîn" },
            { n: 55, label: "Ar-Rahmân" },
            { n: 67, label: "Al-Mulk" },
            { n: 112, label: "Al-Ikhlâs" },
          ].map((lnk, idx, arr) => (
            <React.Fragment key={lnk.n}>
              <button
                className="site-footer__bottom-link"
                onClick={() => handleSurah(lnk.n)}
              >
                {lnk.label}
              </button>
              {idx < arr.length - 1 && (
                <span className="site-footer__bottom-dot" aria-hidden="true">
                  ·
                </span>
              )}
            </React.Fragment>
          ))}
          <span className="site-footer__bottom-dot" aria-hidden="true">
            ·
          </span>
          <button className="site-footer__bottom-link" onClick={handleDuas}>
            {t({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
          </button>
          <span className="site-footer__bottom-dot" aria-hidden="true">
            ·
          </span>
          <button className="site-footer__bottom-link" onClick={handleSearch}>
            {t({ fr: "Rechercher", en: "Search", ar: "بحث" })}
          </button>
          <span className="site-footer__bottom-dot" aria-hidden="true">
            ·
          </span>
          <button className="site-footer__bottom-link" onClick={handleSettings}>
            {t({ fr: "Paramètres", en: "Settings", ar: "إعدادات" })}
          </button>
        </nav>

        <span className="site-footer__bismallah" aria-hidden="true" dir="rtl">
          ﷽
        </span>
      </div>
    </footer>
  );
}
