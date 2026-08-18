import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import PlatformLogo from "./PlatformLogo";
import { t } from "../i18n";

const VERSE = {
  ar: "﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾",
  ref: "الحجر — ٩",
};

const SKIP_LABELS = { ar: "تخطّي", fr: "Passer", en: "Skip" };
const SPLASH_DURATION_MS = 3600;
const SPLASH_FADE_MS = 400;
const SKIP_DELAY_MS = 1400;

export default function SplashScreen({
  onDone,
  onPrefetch,
  lowPerfMode = false,
  lang = "fr",
}) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const dismissedRef = useRef(false);
  const onPrefetchRef = useRef(onPrefetch);

  // Keep ref current without it becoming an effect dep
  useEffect(() => { onPrefetchRef.current = onPrefetch; });

  const dismiss = React.useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setShowSkip(false);
    setFadeOut(true);
    window.setTimeout(onDone, SPLASH_FADE_MS);
  }, [onDone]);

  useEffect(() => {
    const skipTimer = window.setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    const closeTimer = window.setTimeout(dismiss, SPLASH_DURATION_MS);

    // onPrefetch called via ref — not in deps, so timer never resets on state changes
    const result = onPrefetchRef.current?.();
    if (result?.catch) result.catch(() => null);

    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(closeTimer);
    };
  }, [dismiss]);

  return ReactDOM.createPortal(
    <div
      className={`sp-root${fadeOut ? " sp-root--out" : ""}${lowPerfMode ? " sp-root--perf-low" : ""}`}
      aria-label={t("splash.loading", lang)}
      aria-live="polite"
    >
      {/* Geometric background pattern */}
      <div className="sp-geo" aria-hidden="true" />

      {/* Radial glow layers */}
      <div className="sp-glow sp-glow--gold" aria-hidden="true" />
      <div className="sp-glow sp-glow--green" aria-hidden="true" />

      {/* Outer decorative ring */}
      <div className="sp-halo" aria-hidden="true">
        <span className="sp-halo__ring sp-halo__ring--1" />
        <span className="sp-halo__ring sp-halo__ring--2" />
        {/* 8-point cardinal diamonds */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <span
            key={deg}
            className="sp-halo__dot"
            style={{ "--deg": `${deg}deg` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Skip button */}
      {showSkip && !fadeOut && (
        <button type="button" className="sp-skip" onClick={dismiss}>
          {SKIP_LABELS[lang] ?? SKIP_LABELS.fr}
          <span aria-hidden="true">›</span>
        </button>
      )}

      {/* Main content column */}
      <main className="sp-stage">

        {/* Logo emblem */}
        <div className="sp-emblem" aria-hidden="true">
          {/* Rotating outer orbit */}
          <span className="sp-emblem__spin" />
          {/* Static inner ring */}
          <span className="sp-emblem__ring" />
          {/* Diamond accent at 3 and 9 o'clock */}
          <span className="sp-emblem__gem sp-emblem__gem--l" />
          <span className="sp-emblem__gem sp-emblem__gem--r" />
          {/* Logo frame */}
          <div className="sp-frame">
            <div className="sp-frame__shimmer" />
            <PlatformLogo
              className="sp-logo-wrap"
              imgClassName="sp-logo"
              decorative
              priority
              width={144}
              height={144}
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className="sp-wordmark">
          <h1 className="sp-wordmark__app">MushafPlus</h1>
          <p className="sp-wordmark__ar" lang="ar" dir="rtl">القرآن الكريم</p>
        </div>

        {/* Ornamental divider */}
        <div className="sp-divider" aria-hidden="true">
          <span className="sp-divider__line" />
          <span className="sp-divider__gem" />
          <span className="sp-divider__line" />
        </div>

        {/* Quran verse */}
        <blockquote className="sp-verse" lang="ar" dir="rtl">
          <p className="sp-verse__text">{VERSE.ar}</p>
          <cite className="sp-verse__ref">{VERSE.ref}</cite>
        </blockquote>

        {/* Loading progress */}
        <div className="sp-progress" role="status">
          <span className="sr-only">{t("splash.loading", lang)}</span>
          <span className="sp-progress__track" aria-hidden="true">
            <span className="sp-progress__fill" />
            <span className="sp-progress__spark" />
          </span>
          <span className="sp-progress__label" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
            {t("splash.loading", lang)}
          </span>
        </div>

      </main>

      <style>{`
        /* ─── tokens ────────────────────────────────────────────── */
        .sp-root {
          --sp-gold:        #d4a843;
          --sp-gold-soft:   #f0d17a;
          --sp-gold-dim:    rgba(212,168,67,.18);
          --sp-ink:         #eef4f0;
          --sp-muted:       rgba(238,244,240,.54);
          --sp-bg-deep:     #030e08;
          --sp-fade: ${SPLASH_FADE_MS}ms;
        }

        /* ─── root ──────────────────────────────────────────────── */
        .sp-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: var(--sp-ink);
          background-color: #071b10;
          background-image:
            radial-gradient(ellipse 70% 60% at 50% 44%, rgba(195,152,48,.11) 0%, transparent 68%),
            linear-gradient(160deg, #030f09 0%, #071b10 40%, #0d2519 65%, #071b10 100%);
          opacity: 1;
          transition: opacity var(--sp-fade) cubic-bezier(.4,0,.2,1);
        }
        .sp-root--out { opacity: 0; pointer-events: none; }

        /* ─── geometric background ──────────────────────────────── */
        .sp-geo {
          position: absolute;
          inset: -10%;
          opacity: 0;
          background-image:
            linear-gradient(60deg, transparent 47%, rgba(212,168,67,.055) 47.8%, rgba(212,168,67,.055) 52.2%, transparent 53%),
            linear-gradient(-60deg, transparent 47%, rgba(212,168,67,.042) 47.8%, rgba(212,168,67,.042) 52.2%, transparent 53%),
            linear-gradient(0deg, transparent 47%, rgba(212,168,67,.035) 47.8%, rgba(212,168,67,.035) 52.2%, transparent 53%);
          background-size: 60px 60px;
          -webkit-mask-image: radial-gradient(circle at 50% 46%, black 0 18%, transparent 62%);
          mask-image: radial-gradient(circle at 50% 46%, black 0 18%, transparent 62%);
          animation: spGeoIn 1.1s 80ms ease-out forwards;
        }
        .sp-root--perf-low .sp-geo { display: none; }

        /* ─── glow layers ───────────────────────────────────────── */
        .sp-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .sp-glow--gold {
          width: min(34rem, 115vw);
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(195,152,48,.13) 0%, transparent 68%);
          top: 50%; left: 50%;
          transform: translate(-50%, -52%);
          animation: spPulse 3.6s 400ms ease-in-out infinite;
        }
        .sp-glow--green {
          width: min(55rem, 160vw);
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(14,80,43,.16) 0%, transparent 60%);
          top: 50%; left: 50%;
          transform: translate(-50%, -48%);
          opacity: 0;
          animation: spGlowGreenIn 1.4s 200ms ease-out forwards;
        }
        .sp-root--perf-low .sp-glow { display: none; }

        /* ─── halo rings ────────────────────────────────────────── */
        .sp-halo {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -52%);
          width: min(30rem, 108vw);
          aspect-ratio: 1;
          opacity: 0;
          animation: spHaloIn 1s 160ms cubic-bezier(.22,1,.36,1) forwards;
        }
        .sp-halo__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(212,168,67,.13);
        }
        .sp-halo__ring--2 { inset: 8%; border-color: rgba(212,168,67,.07); }
        .sp-halo__dot {
          position: absolute;
          top: 50%; left: 50%;
          width: 0.38rem;
          aspect-ratio: 1;
          background: var(--sp-gold);
          opacity: 0.45;
          transform:
            translate(-50%, -50%)
            rotate(var(--deg))
            translateY(calc(min(15rem, 54vw) * -1))
            rotate(45deg);
        }
        .sp-root--perf-low .sp-halo { display: none; }

        /* ─── stage ─────────────────────────────────────────────── */
        .sp-stage {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: min(90vw, 28rem);
          gap: 0;
        }

        /* ─── emblem ────────────────────────────────────────────── */
        .sp-emblem {
          position: relative;
          display: grid;
          place-items: center;
          width: clamp(6.8rem, 22vw, 8.8rem);
          aspect-ratio: 1;
          opacity: 0;
          transform: translateY(1rem) scale(0.88);
          animation: spEmblemIn 700ms 100ms cubic-bezier(.22,1,.36,1) forwards;
        }
        .sp-emblem__spin {
          position: absolute;
          inset: -2%;
          border-radius: 50%;
          border: 1px dashed rgba(212,168,67,.32);
          animation: spSpin 18s linear infinite;
        }
        .sp-emblem__ring {
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          border: 1px solid rgba(212,168,67,.42);
        }
        .sp-emblem__gem {
          position: absolute;
          top: 50%;
          z-index: 3;
          width: 0.45rem;
          aspect-ratio: 1;
          background: var(--sp-gold);
          transform: translateY(-50%) rotate(45deg);
          box-shadow: 0 0 8px rgba(212,168,67,.5);
        }
        .sp-emblem__gem--l { left: -0.12rem; }
        .sp-emblem__gem--r { right: -0.12rem; }
        .sp-root--perf-low .sp-emblem__spin,
        .sp-root--perf-low .sp-emblem__gem { display: none; }

        /* ─── logo frame ────────────────────────────────────────── */
        .sp-frame {
          position: relative;
          z-index: 2;
          display: grid;
          place-items: center;
          width: 70%;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 28%;
          border: 1px solid rgba(212,168,67,.36);
          background: rgba(3,14,8,.8);
          box-shadow:
            0 0 0 3px rgba(3,14,8,.6),
            0 20px 50px rgba(0,0,0,.35),
            inset 0 1px rgba(255,255,255,.08),
            0 0 28px rgba(195,152,48,.12);
        }
        .sp-frame__shimmer {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,.0) 0%,
            rgba(255,255,255,.06) 40%,
            rgba(255,255,255,.0) 60%
          );
          background-size: 200% 200%;
          animation: spShimmer 2.8s 300ms ease-in-out infinite;
        }
        .sp-logo-wrap { display: grid; width: 100%; height: 100%; place-items: center; }
        .sp-logo { width: 76%; height: 76%; object-fit: contain; }

        /* ─── wordmark ──────────────────────────────────────────── */
        .sp-wordmark {
          margin-top: 1rem;
          opacity: 0;
          transform: translateY(0.6rem);
          animation: spSlideUp 520ms 480ms cubic-bezier(.22,1,.36,1) forwards;
        }
        .sp-wordmark__app {
          margin: 0;
          font-family: "Cairo", system-ui, sans-serif;
          font-size: clamp(2.1rem, 7.2vw, 2.9rem);
          font-weight: 850;
          letter-spacing: -0.045em;
          line-height: 1;
          background: linear-gradient(160deg, #fff 0%, rgba(240,209,122,.92) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 12px rgba(212,168,67,.28));
        }
        .sp-wordmark__ar {
          margin: 0.3rem 0 0;
          font-family: "Amiri Quran", "Amiri", serif;
          font-size: clamp(1.05rem, 3.8vw, 1.3rem);
          color: rgba(240,209,122,.82);
          line-height: 1.4;
        }

        /* ─── divider ───────────────────────────────────────────── */
        .sp-divider {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: min(9rem, 40vw);
          margin: 1.1rem 0 0.9rem;
          color: rgba(212,168,67,.5);
          opacity: 0;
          animation: spSlideUp 420ms 660ms ease-out forwards;
        }
        .sp-divider__line { flex: 1; height: 1px; background: currentColor; }
        .sp-divider__gem { width: 0.34rem; aspect-ratio: 1; background: currentColor; transform: rotate(45deg); flex-shrink: 0; }

        /* ─── verse ─────────────────────────────────────────────── */
        .sp-verse {
          max-width: 22rem;
          margin: 0;
          font-style: normal;
          opacity: 0;
          clip-path: inset(0 0 100% 0);
          animation: spReveal 600ms 780ms cubic-bezier(.22,1,.36,1) forwards;
        }
        .sp-verse__text {
          margin: 0;
          font-family: "Amiri Quran", "Amiri", serif;
          font-size: clamp(0.9rem, 3vw, 1.06rem);
          color: rgba(238,244,240,.86);
          line-height: 2;
        }
        .sp-verse__ref {
          display: block;
          margin-top: 0.18rem;
          font-family: "Amiri", serif;
          font-size: 0.7rem;
          font-style: normal;
          color: rgba(212,168,67,.72);
        }

        /* ─── progress ──────────────────────────────────────────── */
        .sp-progress {
          display: grid;
          gap: 0.52rem;
          width: min(12rem, 54vw);
          margin-top: 1.15rem;
          opacity: 0;
          animation: spSlideUp 360ms 960ms ease-out forwards;
        }
        .sp-progress__track {
          position: relative;
          height: 2px;
          border-radius: 99px;
          background: rgba(255,255,255,.1);
          overflow: visible;
        }
        .sp-progress__fill {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(139,107,27,.7), var(--sp-gold-soft));
          transform: scaleX(0);
          transform-origin: left;
          animation: spBar ${SPLASH_DURATION_MS - 400}ms 900ms cubic-bezier(.18,.78,.22,1) forwards;
        }
        .sp-progress__spark {
          position: absolute;
          top: 50%;
          left: 0;
          width: 0.45rem;
          aspect-ratio: 1;
          border-radius: 50%;
          background: #fff8d6;
          box-shadow: 0 0 10px rgba(240,209,122,.9), 0 0 22px rgba(240,209,122,.5);
          transform: translate(-50%, -50%);
          animation: spSpark ${SPLASH_DURATION_MS - 400}ms 900ms cubic-bezier(.18,.78,.22,1) forwards;
        }
        .sp-progress__label {
          font-family: "Cairo", system-ui, sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--sp-muted);
          text-transform: uppercase;
        }

        /* ─── skip button ───────────────────────────────────────── */
        .sp-skip {
          position: absolute;
          z-index: 10;
          inset-inline-end: max(1.2rem, env(safe-area-inset-right));
          bottom: max(1.2rem, env(safe-area-inset-bottom));
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.9rem;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px;
          background: rgba(3,14,8,.7);
          color: rgba(255,255,255,.72);
          font-family: "Cairo", system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 750;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: spSlideUp 300ms ease-out both;
        }
        .sp-skip:hover { border-color: rgba(212,168,67,.5); color: #fff; background: rgba(255,255,255,.09); }
        .sp-skip:focus-visible { outline: 2px solid var(--sp-gold-soft); outline-offset: 3px; }


        /* ─── keyframes ─────────────────────────────────────────── */
        @keyframes spGeoIn    { to { opacity: 1; } }
        @keyframes spGlowGreenIn { to { opacity: 1; } }
        @keyframes spHaloIn   { to { opacity: 1; } }
        @keyframes spEmblemIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spSlideUp  { to { opacity: 1; transform: translateY(0); } }
        @keyframes spReveal   { to { opacity: 1; clip-path: inset(0 0 0% 0); } }
        @keyframes spBar      { to { transform: scaleX(1); } }
        @keyframes spSpark    { to { left: 100%; } }
        @keyframes spSpin     { to { transform: rotate(360deg); } }
        @keyframes spPulse {
          0%, 100% { opacity: .9; transform: translate(-50%,-52%) scale(1); }
          50%      { opacity: .6; transform: translate(-50%,-52%) scale(1.06); }
        }
        @keyframes spShimmer {
          0%   { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }

        /* ─── mobile ────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .sp-stage    { width: min(88vw, 23rem); }
          .sp-emblem   { width: 7rem; }
          .sp-wordmark { margin-top: 0.75rem; }
          .sp-divider  { margin-top: 0.85rem; margin-bottom: 0.7rem; }
        }

        /* ─── reduced motion ────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .sp-root *, .sp-root *::before, .sp-root *::after {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0.01ms !important;
          }
          .sp-emblem, .sp-wordmark, .sp-divider, .sp-verse,
          .sp-progress, .sp-geo { opacity: 1; transform: none; clip-path: none; }
          .sp-progress__fill { transform: scaleX(1); }
          .sp-progress__spark { left: 100%; }
        }
      `}</style>
    </div>,
    document.body
  );
}
