import React from "react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";

export default function Footer() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navItems = [
    {
      icon: "fa-house",
      label: t({ fr: "Accueil", en: "Home", ar: "الرئيسية" }, lang),
      onClick: () => { set({ showHome: true, showDuas: false }); scrollTop(); },
    },
    {
      icon: "fa-magnifying-glass",
      label: t({ fr: "Recherche", en: "Search", ar: "بحث" }, lang),
      onClick: () => dispatch({ type: "TOGGLE_SEARCH" }),
    },
    {
      icon: "fa-bookmark",
      label: t({ fr: "Favoris", en: "Bookmarks", ar: "إشارات" }, lang),
      onClick: () => dispatch({ type: "TOGGLE_BOOKMARKS" }),
    },
    {
      icon: "fa-hands-praying",
      label: t({ fr: "Douas", en: "Duas", ar: "الأدعية" }, lang),
      onClick: () => { set({ showHome: false, showDuas: true }); scrollTop(); },
    },
    {
      icon: "fa-gear",
      label: t({ fr: "Réglages", en: "Settings", ar: "الإعدادات" }, lang),
      onClick: () => dispatch({ type: "TOGGLE_SETTINGS" }),
    },
  ];

  return (
    <footer className="mp-footer-v2" role="contentinfo">
      <div className="mp-footer-v2__shell">

        {/* Verset */}
        <div className="mp-footer-v2__verse">
          <span className="mp-footer-v2__verse-icon" aria-hidden="true">
            <i className="fas fa-star-and-crescent" />
          </span>
          <p
            className="mp-footer-v2__verse-text"
            dir="rtl"
            lang="ar"
            aria-label="Verset 51:56"
          >
            {"وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ"}
          </p>
          <span className="mp-footer-v2__verse-ref">
            {t({ fr: "Az-Zariyat · 51:56", en: "Az-Zariyat · 51:56", ar: "الذاريات · ٥١:٥٦" }, lang)}
          </span>
        </div>

        {/* Corps */}
        <div className="mp-footer-v2__body">
          <nav
            className="mp-footer-v2__nav"
            aria-label={t({ fr: "Navigation rapide", en: "Quick navigation", ar: "التنقل السريع" }, lang)}
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="mp-footer-v2__nav-btn"
                onClick={item.onClick}
                aria-label={item.label}
              >
                <span className="mp-footer-v2__nav-icon" aria-hidden="true">
                  <i className={`fas ${item.icon}`} />
                </span>
                <span className="mp-footer-v2__nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mp-footer-v2__bottom">
            <span className="mp-footer-v2__credit">
              {t({ fr: "Le Saint Coran", en: "The Holy Quran", ar: "القرآن الكريم" }, lang)}
            </span>
            <span className="mp-footer-v2__brand">Mushaf.plus</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
