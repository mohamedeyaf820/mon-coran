import React from "react";
import {
  BookOpenText,
  Bookmark,
  HandHeart,
  Home,
  Search,
  Settings,
} from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";
import "../styles/domains/footer-refonte.css";

export default function Footer() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const openHome = () => {
    set({ legalPage: null, showHome: true, showDuas: false });
    scrollTop();
  };
  const openDuas = () => {
    set({ legalPage: null, showHome: false, showDuas: true });
    scrollTop();
  };

  const navItems = [
    { key: "home",      Icon: Home,      label: t("nav.home", lang),      onClick: openHome },
    { key: "search",    Icon: Search,    label: t("nav.search", lang),     onClick: () => dispatch({ type: "TOGGLE_SEARCH" }) },
    { key: "bookmarks", Icon: Bookmark,  label: t("nav.bookmarks", lang),  onClick: () => dispatch({ type: "TOGGLE_BOOKMARKS" }) },
    { key: "duas",      Icon: HandHeart, label: t("nav.duas", lang),       onClick: openDuas },
    { key: "settings",  Icon: Settings,  label: t("nav.settings", lang),   onClick: () => dispatch({ type: "TOGGLE_SETTINGS" }) },
  ];
  const legalLabels = {
    fr: { privacy: "Confidentialité", legal: "Mentions légales", sources: "Sources" },
    en: { privacy: "Privacy", legal: "Legal notice", sources: "Sources" },
    ar: { privacy: "الخصوصية", legal: "إشعار قانوني", sources: "المصادر" },
  }[lang] || { privacy: "Confidentialité", legal: "Mentions légales", sources: "Sources" };

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
            aria-label="Adh-Dhariyat 51:56"
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
            >
              <span className="mp-footer-v2__nav-icon" aria-hidden="true">
                <item.Icon size={14} />
              </span>
              <span className="mp-footer-v2__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mp-footer-v2__bottom">
          <span className="mp-footer-v2__credit">
            {t("footer.credit", lang)}
          </span>
          <nav className="mp-footer-v2__legal" aria-label={legalLabels.legal}>
            {Object.entries(legalLabels).map(([page, label]) => (
              <button
                key={page}
                type="button"
                onClick={() => set({ legalPage: page, showHome: false, showDuas: false })}
              >
                {label}
              </button>
            ))}
          </nav>
          <span className="mp-footer-v2__brand">MushafPlus</span>
        </div>
      </div>
    </footer>
  );
}
