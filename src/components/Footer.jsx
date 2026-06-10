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
import "../styles/domains/footer-refonte.css";

function pick(lang, values) {
  return values[lang] || values.fr;
}

export default function Footer() {
  const { dispatch, set } = useAppActions();
  const { lang } = useAppLocale();

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const openHome = () => {
    set({ showHome: true, showDuas: false });
    scrollTop();
  };
  const openDuas = () => {
    set({ showHome: false, showDuas: true });
    scrollTop();
  };

  const navItems = [
    {
      Icon: Home,
      label: pick(lang, {
        fr: "Accueil",
        en: "Home",
        ar: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
      }),
      onClick: openHome,
    },
    {
      Icon: Search,
      label: pick(lang, {
        fr: "Recherche",
        en: "Search",
        ar: "\u0628\u062d\u062b",
      }),
      onClick: () => dispatch({ type: "TOGGLE_SEARCH" }),
    },
    {
      Icon: Bookmark,
      label: pick(lang, {
        fr: "Signets",
        en: "Bookmarks",
        ar: "\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062a",
      }),
      onClick: () => dispatch({ type: "TOGGLE_BOOKMARKS" }),
    },
    {
      Icon: HandHeart,
      label: pick(lang, {
        fr: "Douas",
        en: "Duas",
        ar: "\u0627\u0644\u0623\u062f\u0639\u064a\u0629",
      }),
      onClick: openDuas,
    },
    {
      Icon: Settings,
      label: pick(lang, {
        fr: "R\u00e9glages",
        en: "Settings",
        ar: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
      }),
      onClick: () => dispatch({ type: "TOGGLE_SETTINGS" }),
    },
  ];

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
            {"\u0648\u064e\u0645\u064e\u0627 \u062e\u064e\u0644\u064e\u0642\u0652\u062a\u064f \u0627\u0644\u0652\u062c\u0650\u0646\u0651\u064e \u0648\u064e\u0627\u0644\u0652\u0625\u0650\u0646\u0633\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0644\u0650\u064a\u064e\u0639\u0652\u0628\u064f\u062f\u064f\u0648\u0646\u0650"}
          </p>
          <span className="mp-footer-v2__verse-ref">
            {pick(lang, {
              fr: "Adh-Dhariyat \u00b7 51:56",
              en: "Adh-Dhariyat \u00b7 51:56",
              ar: "\u0627\u0644\u0630\u0627\u0631\u064a\u0627\u062a \u00b7 \u0665\u0661:\u0665\u0666",
            })}
          </span>
        </div>

        <nav
          className="mp-footer-v2__nav"
          aria-label={pick(lang, {
            fr: "Navigation rapide",
            en: "Quick navigation",
            ar: "\u0627\u0644\u062a\u0646\u0642\u0644 \u0627\u0644\u0633\u0631\u064a\u0639",
          })}
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
                <item.Icon size={14} />
              </span>
              <span className="mp-footer-v2__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mp-footer-v2__bottom">
          <span className="mp-footer-v2__credit">
            {pick(lang, {
              fr: "Lire, \u00e9couter, m\u00e9moriser",
              en: "Read, listen, memorize",
              ar: "\u0627\u0642\u0631\u0623\u060c \u0627\u0633\u062a\u0645\u0639\u060c \u0627\u062d\u0641\u0638",
            })}
          </span>
          <span className="mp-footer-v2__brand">Mushaf.plus</span>
        </div>
      </div>
    </footer>
  );
}
