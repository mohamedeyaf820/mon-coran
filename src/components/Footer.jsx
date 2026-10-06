import React, { useEffect, useState } from "react";
import {
  ArrowUp,
  BookOpenText,
  CircleUserRound,
  Database,
  Flag,
  Github,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  useAppActions,
  useAppLocale,
} from "../context/AppContext";
import { t } from "../i18n";
import { getSurah } from "../data/surahs";
import siteConfig from "../../site.config.json";
import "../styles/domains/footer-refonte.css";

// Surahs people come back to most; the reader opens them from any page.
const POPULAR_SURAHS = [18, 36, 55, 56, 67, 112];

function FooterAction({ label, href, onClick }) {
  return href
    ? <a href={href} onClick={onClick}>{label}</a>
    : <button type="button" onClick={onClick}>{label}</button>;
}

export default function Footer({ goSurah }) {
  const { set, dispatch } = useAppActions();
  const { lang } = useAppLocale();
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
  const openSurah = (number) => () => {
    set({ ...leaveAnyPage, displayMode: "surah", showHome: false });
    if (goSurah) goSurah(number);
    else dispatch({ type: "NAVIGATE_SURAH", payload: { surah: number, ayah: 1 } });
  };

  const exploreLinks = [
    { key: "home", label: t("nav.home", lang), ...go("/", openHome("surah")) },
    // Panels are actions, not destinations: they render as buttons.
    { key: "directory", label: t("nav.surahList", lang), onClick: () => set({ sidebarOpen: true }) },
    { key: "library", label: t("library.title", lang), onClick: () => set({ libraryOpen: true, libraryTab: "favorites" }) },
    { key: "search", label: t("nav.search", lang), onClick: () => dispatch({ type: "TOGGLE_SEARCH" }) },
  ];
  const listenLinks = [
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
  ];
  const legalItems = [
    { key: "about", Icon: CircleUserRound, label: t("footer.legalAbout", lang) },
    { key: "privacy", Icon: ShieldCheck, label: t("footer.legalPrivacy", lang) },
    { key: "legal", Icon: Scale, label: t("footer.legalNotice", lang) },
    { key: "sources", Icon: Database, label: t("footer.legalSources", lang) },
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

  const surahName = (number) => {
    const surah = getSurah(number);
    return lang === "ar" ? surah?.ar : lang === "en" ? surah?.en : surah?.fr;
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
            <span className="mp-footer-v2__wordmark">MushafPlus</span>
            <strong>{t("footer.tagline", lang)}</strong>
            <p>{t("footer.mission", lang)}</p>
            <span className="mp-footer-v2__privacy">
              <ShieldCheck size={14} aria-hidden="true" />
              {t("footer.privacyNote", lang)}
            </span>
          </div>

          <nav className="mp-footer-v2__group" aria-labelledby="mp-footer-explore">
            <h2 id="mp-footer-explore">{t("footer.colExplore", lang)}</h2>
            <ul>
              {exploreLinks.map(({ key, ...item }) => (
                <li key={key}><FooterAction {...item} /></li>
              ))}
            </ul>
          </nav>

          <nav className="mp-footer-v2__group" aria-labelledby="mp-footer-listen">
            <h2 id="mp-footer-listen">{t("footer.colListen", lang)}</h2>
            <ul>
              {listenLinks.map(({ key, ...item }) => (
                <li key={key}><FooterAction {...item} /></li>
              ))}
            </ul>
          </nav>

          <nav className="mp-footer-v2__group mp-footer-v2__group--popular" aria-labelledby="mp-footer-popular">
            <h2 id="mp-footer-popular">{t("footer.colPopular", lang)}</h2>
            <ul>
              {POPULAR_SURAHS.map((number) => (
                <li key={number}>
                  <a {...go(`/surah/${number}`, openSurah(number))}>{surahName(number)}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mp-footer-v2__group mp-footer-v2__group--project">
            <h2 id="mp-footer-project">{t("footer.colProject", lang)}</h2>
            <nav className="mp-footer-v2__legal" aria-labelledby="mp-footer-project">
              <ul>
                {legalItems.map(({ key, Icon, label }) => (
                  <li key={key}>
                    <a {...go(`/${key}`, openPage(key))}>
                      <Icon size={14} aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <ul className="mp-footer-v2__external">
              <li>
                <a href={repository} target="_blank" rel="noopener noreferrer">
                  <Github size={14} aria-hidden="true" />
                  <span>{t("footer.sourceCode", lang)}</span>
                </a>
              </li>
              <li>
                <a href={`${repository}/issues`} target="_blank" rel="noopener noreferrer">
                  <Flag size={14} aria-hidden="true" />
                  <span>{t("footer.reportCorrection", lang)}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mp-footer-v2__bottom">
          <span className="mp-footer-v2__credit">{t("footer.credit", lang)}</span>
          <span className="mp-footer-v2__third-party">{t("footer.thirdParty", lang)}</span>
          <span className="mp-footer-v2__brand">v{siteConfig.version}</span>
          <button type="button" className="mp-footer-v2__top" onClick={scrollTop}>
            <ArrowUp size={14} aria-hidden="true" />
            <span>{t("footer.backToTop", lang)}</span>
          </button>
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
