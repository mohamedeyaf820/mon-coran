import React, { useCallback, useLayoutEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, BookOpen, Check, Headphones, HandHeart, Smartphone } from "lucide-react";
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

const SHOTS = "/images/landing/";
const RECITER_PHOTOS = [
  "ar.alafasy",
  "ar.abdurrahmaansudais",
  "ar.husary",
  "ar.minshawi",
  "ar.abdulbasitmurattal",
  "hani_rifai",
];

// Only an https address can become a store button; an empty field keeps the
// honest "coming soon" state.
const storeUrl = (value) => (typeof value === "string" && /^https:\/\//.test(value) ? value : "");

/**
 * Scroll motion for the welcome page, kept out of React state: the bar gains a
 * border once the page scrolls, blocks marked data-reveal rise into view once,
 * and the figures count up. With reduced motion (or no IntersectionObserver)
 * nothing is hidden and nothing moves.
 */
function useLandingMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onScroll = () => root.classList.toggle("landing--scrolled", root.scrollTop > 8);
    root.addEventListener("scroll", onScroll, { passive: true });

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      return () => root.removeEventListener("scroll", onScroll);
    }

    root.classList.add("landing--motion");
    let frame = 0;
    const countUp = (node) => {
      const target = Number(node.dataset.count);
      if (!Number.isFinite(target)) return;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / 1100, 1);
        node.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      node.textContent = "0";
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          entry.target.querySelectorAll("[data-count]").forEach(countUp);
          observer.unobserve(entry.target);
        }
      },
      { root, threshold: 0.18 },
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));

    return () => {
      root.removeEventListener("scroll", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
      root.classList.remove("landing--motion");
    };
  }, [rootRef]);
}

/** An app screenshot in a phone frame, without the capture's status bar. */
function Phone({ name, alt, eager = false, className = "" }) {
  return (
    <figure className={`landing-phone ${className}`}>
      <img
        src={`${SHOTS}${name}.jpg`}
        alt={alt}
        width="540"
        height="1080"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        {...(eager ? { fetchpriority: "high" } : {})}
      />
    </figure>
  );
}

function Feature({ id, Icon, copy, onClick, reverse, children, Arrow }) {
  return (
    <section className={`landing-feature${reverse ? " landing-feature--reverse" : ""}`} aria-labelledby={`landing-${id}`}>
      <div className="landing-feature__text" data-reveal>
        <p className="landing__kicker">
          <Icon size={16} aria-hidden="true" />
          <span>{copy.kicker}</span>
        </p>
        <h2 id={`landing-${id}`}>{copy.title}</h2>
        <p className="landing-feature__lead">{copy.text}</p>
        <ul className="landing-feature__points">
          {copy.points.map((point) => (
            <li key={point}>
              <Check size={18} aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="landing__btn landing__btn--solid" onClick={onClick}>
          <span>{copy.cta}</span>
          <Arrow size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="landing-feature__media" data-reveal data-reveal-delay="1">{children}</div>
    </section>
  );
}

export default function LandingPage() {
  const { state, dispatch, set } = useApp();
  const { lang, displayMode, currentSurah, currentAyah, currentPage, currentJuz } = state;
  const copy = landingCopy(lang);
  const isRtl = lang === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const rootRef = useRef(null);
  useLandingMotion(rootRef);

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
    <div ref={rootRef} className="landing" dir={isRtl ? "rtl" : "ltr"} lang={lang} data-view="landing">
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
              {copy.openApp}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="landing__main">
        <section className="landing__hero" aria-labelledby="landing-title">
          <div className="landing__hero-pattern" aria-hidden="true" />
          <div className="landing__hero-orb" aria-hidden="true" />
          <div className="landing__hero-copy">
            <p className="landing__eyebrow">{copy.eyebrow}</p>
            <h1 id="landing-title">{copy.title}</h1>
            <p className="landing__lead">{copy.lead}</p>
            <div className="landing__actions">
              <button type="button" className="landing__btn landing__btn--gold" onClick={openReading}>
                <BookOpen size={18} aria-hidden="true" />
                <span>{primaryLabel}</span>
              </button>
              <button type="button" className="landing__btn landing__btn--ghost" onClick={openApp}>
                {copy.openApp}
              </button>
            </div>
          </div>
          <div className="landing__hero-phones">
            <Phone name="dark-home" alt="" className="landing-phone--back" eager />
            <Phone name="sepia-home" alt={copy.mobileAlt} className="landing-phone--front" eager />
          </div>
        </section>

        <div className="landing__ticker" aria-hidden="true">
          <div className="landing__ticker-track">
            {[0, 1].map((copyIndex) => (
              <ul key={copyIndex}>
                {copy.ticker.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <ul className="landing__facts" data-reveal>
          {copy.facts.map(([value, label]) => (
            <li key={label}>
              <strong data-count={value}>{value}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <Feature id="read" Icon={BookOpen} copy={copy.read} onClick={openReading} Arrow={Arrow}>
          <Phone name="sepia-reader" alt={copy.read.alt} />
        </Feature>

        <Feature id="duas" Icon={HandHeart} copy={copy.duas} onClick={openDuas} Arrow={Arrow} reverse>
          <Phone name="dark-adhkar" alt={copy.duas.alt} />
        </Feature>

        <Feature id="listen" Icon={Headphones} copy={copy.listen} onClick={openAudio} Arrow={Arrow}>
          <ul className="landing-reciters">
            {RECITER_PHOTOS.map((photo, index) => (
              <li key={photo} style={{ "--i": index }}>
                <img src={`/images/reciters/${photo}.webp`} alt="" width="96" height="96" loading="lazy" decoding="async" />
                <span>{copy.listen.reciters[index]}</span>
              </li>
            ))}
          </ul>
        </Feature>

        <section className="landing__mobile" aria-labelledby="landing-mobile-title" data-reveal>
          <div className="landing__hero-pattern" aria-hidden="true" />
          <div className="landing__mobile-copy">
            <p className="landing__kicker landing__kicker--light">
              <Smartphone size={16} aria-hidden="true" />
              <span>{copy.mobileKicker}</span>
            </p>
            <h2 id="landing-mobile-title">{copy.mobileTitle}</h2>
            <p>{copy.mobileText}</p>
            {android || ios ? (
              <div className="landing__stores">
                {android ? (
                  <a className="landing__btn landing__btn--gold" href={android} rel="noopener noreferrer">
                    {copy.mobileAndroid}
                  </a>
                ) : null}
                {ios ? (
                  <a className="landing__btn landing__btn--gold" href={ios} rel="noopener noreferrer">
                    {copy.mobileIos}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="landing__soon">{copy.mobileSoon}</p>
            )}
          </div>
          <Phone name="light-home" alt={copy.mobileAlt} className="landing-phone--band" />
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
