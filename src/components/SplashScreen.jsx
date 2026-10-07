import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import PlatformLogo from "./PlatformLogo";
import { t } from "../i18n";

const VERSE = {
  ar: "﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾",
  ref: "الحجر — ٩",
};

// A reader who opens the app several times a day should not wait for an
// animation each time: the full sequence plays on the first launch after a
// pause, a short settle otherwise. Neither ever waits longer than the data does
// beyond its own minimum.
const SEEN_KEY = "mushaf-splash-seen";
const FULL_AFTER_MS = 12 * 60 * 60 * 1000;
const TIMING = {
  full: { min: 1150, max: 1900, skip: 700 },
  quick: { min: 450, max: 1400, skip: 700 },
};
const SPLASH_FADE_MS = 240;

function pickMode() {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "quick";
    const seen = Number(localStorage.getItem(SEEN_KEY)) || 0;
    return Date.now() - seen > FULL_AFTER_MS ? "full" : "quick";
  } catch {
    return "full";
  }
}

export default function SplashScreen({
  onDone,
  onPrefetch,
  lowPerfMode = false,
  lang = "fr",
}) {
  const [mode] = useState(pickMode);
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
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* private mode: the full sequence simply plays again */
    }
    window.setTimeout(onDone, SPLASH_FADE_MS);
  }, [onDone]);

  useEffect(() => {
    let active = true;
    const { min, max, skip } = TIMING[mode];
    const startedAt = performance.now();
    let readyTimer;
    const skipTimer = window.setTimeout(() => setShowSkip(true), skip);
    const closeTimer = window.setTimeout(dismiss, max);

    // The route chunks can finish early; the splash should never add seconds
    // of artificial waiting after they are ready.
    Promise.resolve(onPrefetchRef.current?.())
      .catch(() => null)
      .finally(() => {
        if (!active) return;
        readyTimer = window.setTimeout(dismiss, Math.max(0, min - (performance.now() - startedAt)));
      });

    return () => {
      active = false;
      window.clearTimeout(skipTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(readyTimer);
    };
  }, [dismiss, mode]);

  return ReactDOM.createPortal(
    <div
      className={`splash-screen sp-root sp-root--${mode}${fadeOut ? " sp-root--out" : ""}${lowPerfMode ? " sp-root--perf-low" : ""}`}
      aria-label={t("splash.loading", lang)}
      aria-live="polite"
    >
      <div className="sp-bloom" aria-hidden="true" />

      {showSkip && !fadeOut && (
        <button type="button" className="splash-skip" onClick={dismiss}>
          {t("splash.skip", lang)}
          <span aria-hidden="true">›</span>
        </button>
      )}

      <main className="sp-stage">
        {/* The logo is a raster emblem: it is lit, not redrawn. The shine is
            masked by the logo's own alpha; the glows and sparkles sit on the
            lanterns, the star and the book of the artwork. */}
        <div className="sp-mark" aria-hidden="true">
          <span className="sp-rays" />
          <PlatformLogo
            className="sp-logo-wrap"
            imgClassName="splash-logo sp-logo"
            decorative
            priority
            width={240}
            height={240}
          />
          <span className="sp-shine" />
          <span className="sp-lantern sp-lantern--l" />
          <span className="sp-lantern sp-lantern--r" />
          <span className="sp-spark sp-spark--1" />
          <span className="sp-spark sp-spark--2" />
          <span className="sp-spark sp-spark--3" />
        </div>

        <h1 className="sp-name">MushafPlus</h1>
        <p className="splash-subtitle" lang="ar" dir="rtl">القرآن الكريم</p>

        <blockquote className="splash-verse" lang="ar" dir="rtl">
          <p className="sp-verse__text">{VERSE.ar}</p>
          <cite className="sp-verse__ref">{VERSE.ref}</cite>
        </blockquote>

        <div className="sp-progress" role="status">
          <span className="sr-only">{t("splash.loading", lang)}</span>
          <span className="sp-progress__track" aria-hidden="true">
            <span className="sp-progress__fill" />
          </span>
          <span className="splash-loading-text" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
            {t("splash.loading", lang)}
          </span>
        </div>
      </main>

      <style>{`
        .sp-root {
          --sp-gold: #d4a843;
          --sp-gold-soft: #f0d17a;
          --sp-ink: #eef4f0;
          --sp-ease: cubic-bezier(.16, 1, .3, 1);
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: var(--sp-ink);
          /* The same deep greens as the home card, so the app opens in its own colours. */
          background: linear-gradient(145deg, #102d22, #0a1812 76%);
          opacity: 1;
          transition: opacity ${SPLASH_FADE_MS}ms ease, transform ${SPLASH_FADE_MS}ms ease;
        }
        .sp-root--out { opacity: 0; transform: scale(1.025); pointer-events: none; }

        .sp-bloom {
          position: absolute;
          left: 50%; top: 44%;
          width: min(46rem, 150vw);
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(222,190,96,.2) 0%, rgba(47,159,107,.1) 38%, transparent 68%);
          transform: translate(-50%, -50%) scale(.55);
          opacity: 0;
          animation: spBloom 1.1s var(--sp-ease) 40ms forwards;
        }

        .sp-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(88vw, 24rem);
          text-align: center;
        }

        /* ─── logo ──────────────────────────────────────────────── */
        .sp-mark {
          position: relative;
          width: min(62vw, 15rem);
          aspect-ratio: 1;
          animation: spLogoIn .9s var(--sp-ease) 90ms both;
        }
        .sp-logo-wrap, .sp-logo { display: block; width: 100%; height: 100%; }
        .sp-logo { object-fit: contain; filter: drop-shadow(0 10px 28px rgba(0,0,0,.45)); }

        .sp-rays {
          position: absolute;
          left: 50%; top: 52%;
          width: 150%; aspect-ratio: 1;
          transform: translate(-50%, -50%);
          background: repeating-conic-gradient(from 0deg, rgba(240,209,122,.11) 0 4deg, transparent 4deg 18deg);
          -webkit-mask-image: radial-gradient(circle, black 0 22%, transparent 58%);
          mask-image: radial-gradient(circle, black 0 22%, transparent 58%);
          opacity: 0;
          animation: spRays 1.2s ease-out 260ms forwards, spSpin 28s linear infinite;
        }

        /* a band of light crossing the artwork, clipped to the artwork */
        .sp-shine {
          position: absolute;
          inset: 0;
          -webkit-mask: url(/logo-ui.webp) center / contain no-repeat;
          mask: url(/logo-ui.webp) center / contain no-repeat;
          background: linear-gradient(105deg, transparent 38%, rgba(255,247,214,.95) 50%, transparent 62%) no-repeat;
          background-size: 280% 100%;
          background-position: 130% 0;
          mix-blend-mode: screen;
          animation: spShine .95s ease-in-out 520ms forwards;
        }

        .sp-lantern {
          position: absolute;
          top: 44%;
          width: 26%; aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,214,120,.55) 0%, rgba(255,190,70,.18) 42%, transparent 70%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: spBreathe 2.4s ease-in-out 700ms infinite;
        }
        .sp-lantern--l { left: 27.5%; }
        .sp-lantern--r { left: 74%; animation-delay: 1.3s; }

        .sp-spark {
          position: absolute;
          width: 9%; aspect-ratio: 1;
          transform: translate(-50%, -50%) scale(0);
          background: radial-gradient(circle, #fff 0 12%, rgba(255,236,160,.9) 22%, transparent 62%);
          clip-path: polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%);
          opacity: 0;
          animation: spTwinkle 2s ease-in-out infinite;
        }
        .sp-spark--1 { left: 50%; top: 29.5%; animation-delay: 650ms; }
        .sp-spark--2 { left: 39.5%; top: 34%; width: 6%; animation-delay: 1.15s; }
        .sp-spark--3 { left: 61.5%; top: 31.5%; width: 6%; animation-delay: 1.65s; }

        /* ─── words ─────────────────────────────────────────────── */
        .sp-name {
          position: absolute;
          width: 1px; height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
        .splash-subtitle {
          margin: .35rem 0 0;
          font-family: "Amiri Quran", "Noto Naskh Arabic", serif;
          font-size: 1.45rem;
          line-height: 1.5;
          color: var(--sp-gold-soft);
          opacity: 0;
          animation: spRise .7s var(--sp-ease) 760ms forwards;
        }
        .splash-verse {
          margin: .7rem 0 0;
          opacity: 0;
          animation: spRise .8s var(--sp-ease) 980ms forwards;
        }
        .sp-verse__text {
          margin: 0;
          font-family: "Amiri Quran", "Noto Naskh Arabic", serif;
          font-size: 1.05rem;
          line-height: 1.9;
          color: rgba(238,244,240,.78);
        }
        .sp-verse__ref {
          display: block;
          margin-top: .1rem;
          font-style: normal;
          font-size: .78rem;
          color: rgba(238,244,240,.5);
        }

        .sp-progress { display: flex; flex-direction: column; align-items: center; gap: .55rem; margin-top: 1.4rem; }
        .splash-loading-text { font-size: .75rem; letter-spacing: .08em; color: rgba(238,244,240,.55); }
        .sp-progress__track {
          display: block;
          width: 7.5rem; height: 2px;
          overflow: hidden;
          border-radius: 2px;
          background: rgba(212,168,67,.18);
        }
        .sp-progress__fill {
          display: block;
          width: 45%; height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--sp-gold-soft), transparent);
          animation: spSlide 1.1s ease-in-out infinite;
        }

        .splash-skip {
          position: absolute;
          top: max(1rem, env(safe-area-inset-top));
          inset-inline-end: 1rem;
          min-width: 44px; min-height: 44px;
          display: inline-flex; align-items: center; gap: .3rem;
          padding: 0 1rem;
          border: 1px solid rgba(212,168,67,.3);
          border-radius: 999px;
          background: rgba(255,255,255,.05);
          color: rgba(238,244,240,.85);
          font-size: .85rem;
          cursor: pointer;
          animation: spRise .4s ease both;
        }
        .splash-skip:hover { border-color: rgba(212,168,67,.6); color: #fff; }
        .splash-skip:focus-visible { outline: 2px solid var(--sp-gold-soft); outline-offset: 3px; }

        /* A returning reader sees the settled mark almost at once. */
        .sp-root--quick .sp-bloom { animation-duration: .35s; animation-delay: 0ms; }
        .sp-root--quick .sp-mark { animation-duration: .3s; animation-delay: 0ms; }
        .sp-root--quick .sp-rays { animation: spRays .4s ease-out forwards, spSpin 28s linear infinite; }
        .sp-root--quick .sp-shine { animation-duration: .6s; animation-delay: 160ms; }
        .sp-root--quick .splash-subtitle { animation-duration: .3s; animation-delay: 120ms; }
        .sp-root--quick .splash-verse { animation-duration: .3s; animation-delay: 180ms; }

        /* Low-power phones: opacity and transform only, no blur or blend. */
        .sp-root--perf-low .sp-shine, .sp-root--perf-low .sp-rays, .sp-root--perf-low .sp-spark { display: none; }
        .sp-root--perf-low .sp-lantern { mix-blend-mode: normal; animation: none; opacity: .6; }
        .sp-root--perf-low .sp-logo { filter: none; }

        @keyframes spBloom { to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes spLogoIn {
          from { opacity: 0; transform: translateY(10px) scale(.84); filter: blur(10px); }
          to   { opacity: 1; transform: none; filter: blur(0); }
        }
        @keyframes spRays { to { opacity: 1; } }
        @keyframes spSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes spShine { to { background-position: -40% 0; } }
        @keyframes spBreathe { 0%, 100% { opacity: .15; } 50% { opacity: .95; } }
        @keyframes spTwinkle {
          0%, 60%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(45deg); }
        }
        @keyframes spRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes spSlide { from { transform: translateX(-110%); } to { transform: translateX(260%); } }

        @media (max-height: 560px) {
          .splash-verse { display: none; }
          .sp-mark { width: min(40vh, 11rem); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sp-root *, .sp-root *::before, .sp-root *::after {
            animation: none !important;
            transition: none !important;
          }
          .sp-bloom { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          .sp-shine, .sp-rays, .sp-spark { display: none; }
          .sp-lantern { opacity: .45; }
          .splash-subtitle, .splash-verse { opacity: 1; }
          .sp-progress__fill { width: 100%; }
          .sp-root--out { transform: none; }
        }
      `}</style>
    </div>,
    document.body
  );
}
