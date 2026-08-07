import React from "react";
import {
  BookOpenText,
  BookOpen,
  CircleUserRound,
  Database,
  Headphones,
  Home,
  LibraryBig,
  ListOrdered,
  Search,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";
import "../styles/domains/footer-refonte.css";

export default function Footer() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const scrollTop = () => {
    const main = document.querySelector("#main-content");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openHome = () => {
    set({ legalPage: null, showHome: true, showDuas: false });
    scrollTop();
  };
  const openReader = () => {
    set({ legalPage: null, showHome: false, showDuas: false });
    scrollTop();
  };
  const openAudio = () => {
    set({ legalPage: null, showHome: true, showDuas: false, homeSection: "audio" });
    window.requestAnimationFrame(() => {
      document.querySelector(".home-content-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const navItems = [
    { key: "home",      Icon: Home,      label: t("nav.home", lang),      onClick: openHome },
    { key: "read",      Icon: BookOpen,  label: lang === "fr" ? "Lire" : lang === "ar" ? "اقرأ" : "Read", onClick: openReader },
    { key: "search",    Icon: Search,    label: t("nav.search", lang),     onClick: () => set({ searchOpen: true }) },
    { key: "audio",     Icon: Headphones,label: lang === "fr" ? "Écouter" : lang === "ar" ? "استمع" : "Listen", onClick: openAudio },
    { key: "library",   Icon: LibraryBig,label: lang === "fr" ? "Bibliothèque" : lang === "ar" ? "المكتبة" : "Library", onClick: () => dispatch({ type: "TOGGLE_LIBRARY" }) },
  ];
  const legalLabels = {
    fr: {
      surahs: "Liste des sourates",
      about: "À propos",
      privacy: "Confidentialité",
      legal: "Mentions légales",
      sources: "Sources",
    },
    en: {
      surahs: "Surah list",
      about: "About",
      privacy: "Privacy",
      legal: "Legal notice",
      sources: "Sources",
    },
    ar: {
      surahs: "قائمة السور",
      about: "حول التطبيق",
      privacy: "الخصوصية",
      legal: "إشعار قانوني",
      sources: "المصادر",
    },
  }[lang] || {
    surahs: "Liste des sourates",
    about: "À propos",
    privacy: "Confidentialité",
    legal: "Mentions légales",
    sources: "Sources",
  };

  const pageItems = [
    { key: "surahs", Icon: ListOrdered },
    { key: "about", Icon: CircleUserRound },
    { key: "privacy", Icon: ShieldCheck },
    { key: "legal", Icon: Scale },
    { key: "sources", Icon: Database },
  ];

  const openPage = (event, page) => {
    event.preventDefault();
    set({ legalPage: page, showHome: false, showDuas: false });
    scrollTop();
  };

  return (
    <footer className="mp-footer-v2" role="contentinfo">
      <div className="mp-footer-v2__shell">
        <div className="mp-footer-v2__verse">
          <span className="mp-footer-v2__verse-icon" aria-hidden="true">
            <BookOpenText size={14} />
          </span>
          <p
            className="mp-footer-v2__verse-text"
            dir="rtl"
            lang="ar"
            aria-label={t("footer.verseRef", lang)}
          >
            {"وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ"}
          </p>
          <span className="mp-footer-v2__verse-ref">
            {t("footer.verseRef", lang)}
          </span>
        </div>

        <nav
          className="mp-footer-v2__nav"
          aria-label={t("nav.quickNav", lang)}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="mp-footer-v2__nav-btn"
              onClick={item.onClick}
              aria-label={item.label}
              aria-current={item.key === "home" ? "page" : undefined}
            >
              <span className="mp-footer-v2__nav-icon" aria-hidden="true">
                <item.Icon size={14} />
              </span>
              <span className="mp-footer-v2__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mp-footer-v2__directory">
          <div className="mp-footer-v2__directory-copy">
            <span>{lang === "ar" ? "استكشف" : lang === "en" ? "Explore" : "Explorer"}</span>
            <strong>{lang === "ar" ? "القراءة والمشروع" : lang === "en" ? "Reading & project" : "Lecture & projet"}</strong>
          </div>
          <nav className="mp-footer-v2__legal" aria-label={legalLabels.legal}>
            {pageItems.map(({ key, Icon }) => (
              <a key={key} href={`/${key}`} onClick={(event) => openPage(event, key)}>
                <Icon size={14} aria-hidden="true" />
                <span>{legalLabels[key]}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="mp-footer-v2__bottom">
          <span className="mp-footer-v2__credit">{t("footer.credit", lang)}</span>
          <span className="mp-footer-v2__privacy">
            <ShieldCheck size={13} aria-hidden="true" />
            {lang === "ar" ? "قراءة خاصة، بلا حساب" : lang === "en" ? "Private reading, no account" : "Lecture privée, sans compte"}
          </span>
          <span className="mp-footer-v2__brand">MushafPlus</span>
        </div>
      </div>
    </footer>
  );
}
