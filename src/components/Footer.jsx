import React, { useEffect, useState } from "react";
import {
  BookOpenText,
  BookOpen,
  CircleUserRound,
  Database,
  Headphones,
  Home,
  Search,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  shallowEqual,
  useAppActions,
  useAppLocale,
  useAppSelector,
} from "../context/AppContext";
import { t } from "../i18n";
import siteConfig from "../../site.config.json";
import "../styles/domains/footer-refonte.css";

export default function Footer() {
  const { set } = useAppActions();
  const { lang } = useAppLocale();
  const [verseIndex, setVerseIndex] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const view = useAppSelector(
    (state) => ({
      homeSection: state.homeSection,
      legalPage: state.legalPage,
      showDuas: state.showDuas,
      showPrayers: state.showPrayers,
      showHome: state.showHome,
    }),
    shallowEqual,
  );

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

  const activeView = view.legalPage || view.showDuas || view.showPrayers
    ? null
    : view.showHome
      ? view.homeSection === "audio"
        ? "audio"
        : "home"
      : "read";

  const scrollTop = () => {
    const main = document.querySelector("#main-content");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openHome = () => {
    set({ legalPage: null, showHome: true, showDuas: false, showPrayers: false });
    scrollTop();
  };
  const openReader = () => {
    set({ legalPage: null, showHome: false, showDuas: false, showPrayers: false });
    scrollTop();
  };
  const openAudio = () => {
    set({ legalPage: null, showHome: true, showDuas: false, showPrayers: false, homeSection: "audio" });
    window.requestAnimationFrame(() => {
      document.querySelector(".home-content-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const navItems = [
    { key: "home",      Icon: Home,      label: t("nav.home", lang),      onClick: openHome },
    { key: "read",      Icon: BookOpen,  label: t("footer.navRead", lang),      onClick: openReader },
    { key: "search",    Icon: Search,    label: t("nav.search", lang),     onClick: () => set({ searchOpen: true }) },
    { key: "audio",     Icon: Headphones,label: t("footer.navListen", lang), onClick: openAudio },
  ];
  const legalLabels = {
    about: t("footer.legalAbout", lang),
    privacy: t("footer.legalPrivacy", lang),
    legal: t("footer.legalNotice", lang),
    sources: t("footer.legalSources", lang),
  };

  const pageItems = [
    { key: "about", Icon: CircleUserRound },
    { key: "privacy", Icon: ShieldCheck },
    { key: "legal", Icon: Scale },
    { key: "sources", Icon: Database },
  ];

  const openPage = (event, page) => {
    event.preventDefault();
    set({ legalPage: page, showHome: false, showDuas: false, showPrayers: false });
    scrollTop();
  };
  const currentVerse = FOOTER_VERSES[verseIndex];
  const verseTranslation = lang === "en" ? currentVerse.en : currentVerse.fr;
  const verseReference = lang === "ar"
    ? `${currentVerse.surahAr} · ${currentVerse.refAr}`
    : `${lang === "en" ? currentVerse.surahEn : currentVerse.surahFr} · ${currentVerse.ref}`;
  // These hardcoded meanings are paraphrases rather than one published edition
  // verbatim, so they are labelled as approximate and routed to the Sources
  // register the footer already links to instead of claiming an edition.
  const verseAttribution = t("footer.verseAttribution", lang);

  return (
    <footer className="mp-footer-v2" role="contentinfo">
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
              aria-current={item.key === activeView ? "page" : undefined}
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
            <span>MushafPlus</span>
            <strong>{t("footer.tagline", lang)}</strong>
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
            {t("footer.privacyNote", lang)}
          </span>
          <span className="mp-footer-v2__brand">v{siteConfig.version}</span>
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
    ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    fr: "Je n’ai créé les djinns et les hommes que pour qu’ils M’adorent.",
    en: "I did not create jinn and humans except to worship Me.",
  },
  {
    ref: "94:5",
    refAr: "٩٤:٥",
    surahFr: "Ash-Sharh",
    surahEn: "Ash-Sharh",
    surahAr: "الشرح",
    ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    fr: "À côté de la difficulté est, certes, une facilité.",
    en: "Surely with hardship comes ease.",
  },
  {
    ref: "13:28",
    refAr: "١٣:٢٨",
    surahFr: "Ar-Ra‘d",
    surahEn: "Ar-Ra'd",
    surahAr: "الرعد",
    ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    fr: "C’est par l’évocation d’Allah que les cœurs se tranquillisent.",
    en: "Surely in the remembrance of Allah do hearts find comfort.",
  },
  {
    ref: "2:286",
    refAr: "٢:٢٨٦",
    surahFr: "Al-Baqara",
    surahEn: "Al-Baqarah",
    surahAr: "البقرة",
    ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    fr: "Allah n’impose à aucune âme une charge supérieure à sa capacité.",
    en: "Allah does not burden any soul with more than it can bear.",
  },
];
