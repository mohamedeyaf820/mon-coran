import React, { useEffect, useState } from "react";
import { ArrowUp, BookOpenText } from "lucide-react";
import {
  useAppActions,
  useAppLocale,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import { getSurah } from "../data/surahs";
import { THEMES } from "../data/themes";
import siteConfig from "../../site.config.json";
import "../styles/domains/footer-refonte.css";

// What readers come back to most. Ayat al-Kursi is a verse, the rest are surahs.
const POPULAR = [
  { surah: 2, ayah: 255, label: "footer.ayatKursi" },
  { surah: 36 },
  { surah: 67 },
  { surah: 55 },
  { surah: 56 },
  { surah: 18 },
  { surah: 73 },
];

function FooterAction({ label, href, onClick }) {
  return href
    ? <a href={href} onClick={onClick}>{label}</a>
    : <button type="button" onClick={onClick}>{label}</button>;
}

function themeName(theme, lang) {
  return lang === "ar" ? theme.ar : lang === "en" ? theme.en : theme.fr;
}

export default function Footer({ goSurah }) {
  const { set, dispatch } = useAppActions();
  const { lang } = useAppLocale();
  const theme = useAppSelector((state) => state.theme);
  const [verseIndex, setVerseIndex] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // WCAG 2.2.2: the rotating verse must stop for people who ask for reduced
  // motion, and pause while a visitor reads or tabs through it.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || rotationPaused || FOOTER_VERSES.length < 2) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setVerseIndex((current) => (current + 1) % FOOTER_VERSES.length);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, rotationPaused]);

  const scrollTop = () => {
    const main = document.querySelector("#main-content");
    if (main) main.scrollTo({ top: 0, behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Every destination is a real link, so it can be opened in a new tab or
  // copied; a plain click stays inside the app and keeps the audio running.
  const go = (href, action) => ({
    href,
    onClick: (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      action();
    },
  });
  const leaveAnyPage = { legalPage: null, routeNotFound: false, showDuas: false, showPrayers: false };
  const openHome = (homeSection) => () => {
    set({ ...leaveAnyPage, showHome: true, homeSection, sidebarOpen: false });
    scrollTop();
  };
  const openPage = (page) => () => {
    set({ legalPage: page, showHome: false, showDuas: false, showPrayers: false });
    scrollTop();
  };
  const openSurah = (surah, ayah = 1) => () => {
    set({ ...leaveAnyPage, displayMode: "surah", showHome: false });
    if (goSurah && ayah === 1) goSurah(surah);
    else dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const navigateLinks = [
    { key: "home", label: t("nav.home", lang), ...go("/", openHome("surah")) },
    { key: "recitations", label: t("footer.navRecitations", lang), ...go("/", openHome("audio")) },
    {
      key: "prayers",
      label: t("nav.prayers", lang),
      ...go("/prieres", () => {
        set({ ...leaveAnyPage, showHome: false, showPrayers: true });
        scrollTop();
      }),
    },
    {
      key: "duas",
      label: t("nav.duas", lang),
      ...go("/duas", () => {
        set({ ...leaveAnyPage, showHome: false, showDuas: true });
        scrollTop();
      }),
    },
    // Panels are actions, not destinations: they render as buttons.
    { key: "directory", label: t("nav.surahList", lang), onClick: () => set({ sidebarOpen: true }) },
    { key: "library", label: t("library.title", lang), onClick: () => set({ libraryOpen: true, libraryTab: "favorites" }) },
    { key: "search", label: t("nav.search", lang), onClick: () => dispatch({ type: "TOGGLE_SEARCH" }) },
  ];
  const legalItems = [
    ["about", t("footer.legalAbout", lang)],
    ["privacy", t("footer.legalPrivacy", lang)],
    ["legal", t("footer.legalNotice", lang)],
    ["sources", t("footer.legalSources", lang)],
  ];
  const repository = siteConfig.repositoryUrl.replace(/\/$/, "");

  const currentVerse = FOOTER_VERSES[verseIndex];
  const verseTranslation = lang === "en" ? currentVerse.en : currentVerse.fr;
  const verseReference = lang === "ar"
    ? `${currentVerse.surahAr} · ${currentVerse.refAr}`
    : `${lang === "en" ? currentVerse.surahEn : currentVerse.surahFr} · ${currentVerse.ref}`;
  // These hardcoded meanings are paraphrases rather than one published edition
  // verbatim, so they are labelled as approximate and routed to the Sources
  // register the footer already links to instead of claiming an edition.
  const verseAttribution = t("footer.verseAttribution", lang);

  const popularName = ({ surah, label }) => {
    if (label) return t(label, lang);
    const entry = getSurah(surah);
    return lang === "ar" ? entry?.ar : lang === "en" ? entry?.en : entry?.fr;
  };

  return (
    <footer className="mp-footer-v2">
      <div className="mp-footer-v2__shell">
        <div
          className="mp-footer-v2__verse"
          aria-label={verseReference}
          onMouseEnter={() => setRotationPaused(true)}
          onMouseLeave={() => setRotationPaused(false)}
          onFocus={() => setRotationPaused(true)}
          onBlur={() => setRotationPaused(false)}
        >
          <span className="mp-footer-v2__verse-icon" aria-hidden="true">
            <BookOpenText size={14} />
          </span>
          <div className="mp-footer-v2__verse-copy" key={currentVerse.ref}>
            <p className="mp-footer-v2__verse-text" dir="rtl" lang="ar">
              {currentVerse.ar}
            </p>
            {lang !== "ar" ? (
              <p className="mp-footer-v2__verse-translation">{verseTranslation}</p>
            ) : null}
            {lang !== "ar" ? (
              <cite className="mp-footer-v2__verse-source">
                {verseAttribution}
              </cite>
            ) : null}
          </div>
          <span className="mp-footer-v2__verse-ref">{verseReference}</span>
        </div>

        <div className="mp-footer-v2__directory">
          <div className="mp-footer-v2__about">
            <span className="mp-footer-v2__wordmark">Mushaf<b>Plus</b></span>
            <h2>{t("footer.mission", lang)}</h2>
            <p>{t("footer.missionP1", lang)}</p>
            <p>{t("footer.missionP2", lang)}</p>
          </div>

          <nav className="mp-footer-v2__group" aria-labelledby="mp-footer-navigate">
            <h2 id="mp-footer-navigate">{t("footer.colNavigate", lang)}</h2>
            <ul>
              {navigateLinks.map(({ key, ...item }) => (
                <li key={key}><FooterAction {...item} /></li>
              ))}
            </ul>
          </nav>

          <nav className="mp-footer-v2__group mp-footer-v2__group--resources" aria-labelledby="mp-footer-resources">
            <h2 id="mp-footer-resources">{t("footer.colResources", lang)}</h2>
            <ul>
              <li><a href={repository} target="_blank" rel="noopener noreferrer">{t("footer.sourceCode", lang)}</a></li>
              <li><a href={`${repository}/issues`} target="_blank" rel="noopener noreferrer">{t("footer.reportCorrection", lang)}</a></li>
              <li><a href={siteConfig.contactUrl} target="_blank" rel="noopener noreferrer">{t("footer.contact", lang)}</a></li>
            </ul>
          </nav>

          <nav className="mp-footer-v2__group mp-footer-v2__group--popular" aria-labelledby="mp-footer-popular">
            <h2 id="mp-footer-popular">{t("footer.colPopular", lang)}</h2>
            <ul>
              {POPULAR.map((item) => (
                <li key={`${item.surah}:${item.ayah || 1}`}>
                  <a {...go(item.ayah ? `/surah/${item.surah}/${item.ayah}` : `/surah/${item.surah}`, openSurah(item.surah, item.ayah))}>
                    {popularName(item)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mp-footer-v2__bottom">
          <div className="mp-footer-v2__fine">
            <nav className="mp-footer-v2__legal" aria-label={t("footer.legalNotice", lang)}>
              <ul>
                {legalItems.map(([key, label]) => (
                  <li key={key}><a {...go(`/${key}`, openPage(key))}>{label}</a></li>
                ))}
              </ul>
            </nav>
            <p className="mp-footer-v2__copyright">
              <span className="mp-footer-v2__brand">v{siteConfig.version}</span>
              <span>{t("footer.copyright", lang)}</span>
            </p>
          </div>

          <div className="mp-footer-v2__tools">
            <a className="mp-footer-v2__contribute" href={repository} target="_blank" rel="noopener noreferrer">
              {t("footer.contribute", lang)}
            </a>
            <label className="mp-footer-v2__select">
              <span className="sr-only">{t("footer.themeLabel", lang)}</span>
              <select value={theme} onChange={(event) => set({ theme: event.target.value })}>
                {THEMES.map((item) => (
                  <option key={item.id} value={item.id}>{themeName(item, lang)}</option>
                ))}
              </select>
            </label>
            <label className="mp-footer-v2__select">
              <span className="sr-only">{t("footer.languageLabel", lang)}</span>
              <select value={lang} onChange={(event) => set({ lang: event.target.value })}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </label>
            <button type="button" className="mp-footer-v2__top" onClick={scrollTop} aria-label={t("footer.backToTop", lang)} title={t("footer.backToTop", lang)}>
              <ArrowUp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FOOTER_VERSES = [
  {
    ref: "51:56",
    refAr: "٥١:٥٦",
    surahFr: "Adh-Dhariyat",
    surahEn: "Adh-Dhariyat",
    surahAr: "الذاريات",
    ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    fr: "Je n’ai créé les djinns et les hommes que pour qu’ils M’adorent.",
    en: "I did not create jinn and humans except to worship Me.",
  },
  {
    ref: "94:5",
    refAr: "٩٤:٥",
    surahFr: "Ash-Sharh",
    surahEn: "Ash-Sharh",
    surahAr: "الشرح",
    ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    fr: "À côté de la difficulté est, certes, une facilité.",
    en: "Surely with hardship comes ease.",
  },
  {
    ref: "13:28",
    refAr: "١٣:٢٨",
    surahFr: "Ar-Ra‘d",
    surahEn: "Ar-Ra'd",
    surahAr: "الرعد",
    ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    fr: "C’est par l’évocation d’Allah que les cœurs se tranquillisent.",
    en: "Surely in the remembrance of Allah do hearts find comfort.",
  },
  {
    ref: "2:286",
    refAr: "٢:٢٨٦",
    surahFr: "Al-Baqara",
    surahEn: "Al-Baqarah",
    surahAr: "البقرة",
    ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    fr: "Allah n’impose à aucune âme une charge supérieure à sa capacité.",
    en: "Allah does not burden any soul with more than it can bear.",
  },
];
