import React, { useCallback, useMemo, useRef } from "react";
import siteConfig from "../../../site.config.json";
import SURAHS from "../../data/surahs";
import { useApp } from "../../context/AppContext";
import { landingCopy } from "./landingCopy";
import { TINTS, storeUrl, tintForTheme, tintSequence } from "./landingData";
import { useLandingMotion, useMedia, usePlayback, useReducedMotion } from "./useLandingMotion";
import LandingHero from "./LandingHero";
import LandingDemo from "./LandingDemo";
import LandingThemes from "./LandingThemes";
import { LandingFooter, LandingMobile } from "./LandingMobile";
import "../../styles/landing.css";

const LANGS = [
  ["fr", "FR", "Français"],
  ["en", "EN", "English"],
  ["ar", "ع", "العربية"],
];

/**
 * Welcome page (/): five folios, a mushaf turned into a page. The page starts in the colours
 * of the theme the reader chose; its tint then follows what the page shows (motion lives in
 * useLandingMotion). State, URL and navigation stay with the app: this component only reads
 * the saved position and sets the same flags the rest of the app does.
 */
export default function LandingPage() {
  const { state, dispatch, set } = useApp();
  const { lang, theme, displayMode, currentSurah, currentAyah, currentPage, currentJuz } = state;
  const copy = landingCopy(lang);
  const isRtl = lang === "ar";
  const rootRef = useRef(null);
  const reduce = useReducedMotion();
  const wide = useMedia("(min-width: 1024px)");
  const playback = usePlayback(reduce);
  const base = tintForTheme(theme);
  const sequence = useMemo(() => tintSequence(base), [base]);
  const setTint = useLandingMotion(rootRef, base);

  const hasHistory =
    displayMode === "page" || displayMode === "juz" || currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);
  const surah = SURAHS[currentSurah - 1];
  const surahLabel = surah ? (lang === "ar" ? surah.ar : lang === "en" ? surah.en : surah.fr) : "";

  let primaryLabel = copy.hero.start;
  if (hasHistory) {
    primaryLabel =
      displayMode === "page"
        ? copy.hero.resumePage.replace("{page}", currentPage)
        : displayMode === "juz"
          ? copy.hero.resumeJuz.replace("{juz}", currentJuz)
          : copy.hero.resume.replace("{surah}", surahLabel).replace("{ayah}", currentAyah);
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
  const actions = useMemo(() => ({ read: openReading, duas: openDuas, listen: openAudio }), [openReading, openDuas, openAudio]);

  const android = storeUrl(siteConfig.mobileApp?.androidUrl);
  const ios = storeUrl(siteConfig.mobileApp?.iosUrl);
  // With reduced motion the page keeps a single tint: the reader's own theme.
  const layers = reduce ? [base] : Object.keys(TINTS);

  return (
    <div
      ref={rootRef}
      className="landing"
      dir={isRtl ? "rtl" : "ltr"}
      lang={lang}
      data-view="landing"
      data-tint={base}
      data-shot={base}
    >
      <div className="landing__tints" aria-hidden="true">
        {layers.map((tint) => (
          <div key={tint} className="landing__tint" data-tint={tint} />
        ))}
      </div>

      <header className="landing__bar">
        <div className="landing__bar-inner">
          <span className="landing__brand" aria-label={copy.brandAria}>
            <img src="/logo-ui.webp" alt="" width="36" height="36" />
            <strong>MushafPlus</strong>
          </span>
          <div className="landing__bar-end">
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
            <button type="button" className="landing__btn landing__btn--bar" onClick={openApp}>
              {copy.hero.openApp}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="landing__main">
        <LandingHero
          copy={copy}
          numeral={copy.folios[0]}
          sequence={sequence}
          primaryLabel={primaryLabel}
          onStart={openReading}
          onOpenApp={openApp}
        />
        <LandingDemo copy={copy.demo} numeral={copy.folios[1]} wide={wide} playback={playback} actions={actions} />
        <LandingThemes
          copy={copy.themes}
          numeral={copy.folios[2]}
          wide={wide}
          playback={playback}
          setTint={setTint}
        />
        <LandingMobile copy={copy.mobile} numeral={copy.folios[3]} android={android} ios={ios} />
      </main>

      <LandingFooter copy={copy.footer} numeral={copy.folios[4]} onOpenLegal={openLegal} />
    </div>
  );
}
