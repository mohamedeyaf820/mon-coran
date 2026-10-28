import React, { useCallback } from "react";
import { BookOpen, Headphones, HandHeart, Smartphone } from "lucide-react";
import siteConfig from "../../../site.config.json";
import SURAHS from "../../data/surahs";
import { useApp } from "../../context/AppContext";
import { landingCopy } from "./landingCopy";
import "../../styles/landing.css";

const LANGS = [
  ["fr", "FR", "Français"],
  ["en", "EN", "English"],
  ["ar", "ع", "العربية"],
];

// Only an https address can become a store button; an empty field keeps the
// honest "coming soon" state.
const storeUrl = (value) => (typeof value === "string" && /^https:\/\//.test(value) ? value : "");

export default function LandingPage() {
  const { state, dispatch, set } = useApp();
  const { lang, displayMode, currentSurah, currentAyah, currentPage, currentJuz } = state;
  const copy = landingCopy(lang);
  const isRtl = lang === "ar";

  const hasHistory =
    displayMode === "page" || displayMode === "juz" || currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);
  const surah = SURAHS[currentSurah - 1];
  const surahLabel = surah ? (lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr) : "";

  let primaryLabel = copy.start;
  if (hasHistory) {
    primaryLabel =
      displayMode === "page"
        ? copy.resumePage.replace("{page}", currentPage)
        : displayMode === "juz"
          ? copy.resumeJuz.replace("{juz}", currentJuz)
          : copy.resume.replace("{surah}", surahLabel).replace("{ayah}", currentAyah);
  }

  const openReading = useCallback(() => {
    set({ landing: false });
    if (hasHistory && displayMode === "juz") dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else if (hasHistory && displayMode === "page") dispatch({ type: "NAVIGATE_PAGE", payload: { page: currentPage } });
    else dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah, ayah: currentAyah } });
  }, [dispatch, set, hasHistory, displayMode, currentJuz, currentPage, currentSurah, currentAyah]);

  const openApp = useCallback(() => set({ showHome: true }), [set]);
  const openDuas = useCallback(() => set({ showDuas: true, landing: false }), [set]);
  const openAudio = useCallback(() => set({ showHome: true, homeSection: "audio" }), [set]);
  const openLegal = useCallback((page) => set({ legalPage: page, landing: false }), [set]);

  const android = storeUrl(siteConfig.mobileApp?.androidUrl);
  const ios = storeUrl(siteConfig.mobileApp?.iosUrl);

  return (
    <div className="landing" dir={isRtl ? "rtl" : "ltr"} lang={lang} data-view="landing">
      <header className="landing__bar">
        <span className="landing__brand" aria-label={copy.brandAria}>
          <img src="/logo-ui.webp" alt="" width="32" height="32" />
          <strong>MushafPlus</strong>
        </span>
        <div className="landing__langs" role="group" aria-label={copy.langLabel}>
          {LANGS.map(([code, short, full]) => (
            <button
              key={code}
              type="button"
              className="landing__lang"
              aria-pressed={lang === code}
              aria-label={`${short} ${full}`}
              lang={code}
              onClick={() => set({ lang: code })}
            >
              {short}
            </button>
          ))}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="landing__main">
        <section className="landing__hero" aria-labelledby="landing-title">
          <p className="landing__eyebrow">{copy.eyebrow}</p>
          <h1 id="landing-title">{copy.title}</h1>
          <p className="landing__lead">{copy.lead}</p>
          <div className="landing__actions">
            <button type="button" className="landing__btn landing__btn--primary" onClick={openReading}>
              <BookOpen size={18} aria-hidden="true" />
              <span>{primaryLabel}</span>
            </button>
            <button type="button" className="landing__btn landing__btn--ghost" onClick={openApp}>
              {copy.openApp}
            </button>
          </div>
        </section>

        <section className="landing__features" aria-labelledby="landing-features-title">
          <h2 id="landing-features-title" className="landing__section-title">{copy.featuresTitle}</h2>
          <ul className="landing__grid">
            {[
              { key: "read", Icon: BookOpen, onClick: openReading },
              { key: "duas", Icon: HandHeart, onClick: openDuas },
              { key: "listen", Icon: Headphones, onClick: openAudio },
            ].map(({ key, Icon, onClick }) => (
              <li key={key} className="landing__card">
                <Icon size={24} aria-hidden="true" />
                <h3>{copy[key].title}</h3>
                <p>{copy[key].text}</p>
                <button type="button" className="landing__btn landing__btn--card" onClick={onClick}>
                  {copy[key].cta}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing__mobile" aria-labelledby="landing-mobile-title">
          <Smartphone size={28} aria-hidden="true" />
          <div>
            <h2 id="landing-mobile-title">{copy.mobileTitle}</h2>
            <p>{copy.mobileText}</p>
            {android || ios ? (
              <div className="landing__stores">
                {android ? (
                  <a className="landing__btn landing__btn--primary" href={android} rel="noopener noreferrer">
                    {copy.mobileAndroid}
                  </a>
                ) : null}
                {ios ? (
                  <a className="landing__btn landing__btn--primary" href={ios} rel="noopener noreferrer">
                    {copy.mobileIos}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="landing__soon">{copy.mobileSoon}</p>
            )}
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <p>{copy.footerNote}</p>
        <nav aria-label="MushafPlus">
          {["about", "privacy", "sources"].map((page) => (
            <button key={page} type="button" className="landing__link" onClick={() => openLegal(page)}>
              {copy.links[page]}
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
