import React, { useEffect, useRef, useState } from "react";
import PlatformLogo from "./PlatformLogo";
import { t } from "../i18n";

const VERSE = {
  ar: "﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾",
  ref: "الحجر — ٩",
};

const SKIP_LABELS = { ar: "تخطّي", fr: "Passer", en: "Skip" };
const SPLASH_DURATION_MS = 3200;
const SPLASH_FADE_MS = 280;
const SKIP_DELAY_MS = 1300;

export default function SplashScreen({
  onDone,
  onPrefetch,
  lowPerfMode = false,
  lang = "fr",
}) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const dismissedRef = useRef(false);

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

    const prefetchResult = onPrefetch?.();
    if (prefetchResult && typeof prefetchResult.then === "function") {
      prefetchResult.catch(() => null);
    }

    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(closeTimer);
    };
  }, [dismiss, onPrefetch]);

  return (
    <div
      className={`splash-screen ${fadeOut ? "fade-out" : ""} ${lowPerfMode ? "perf-low" : ""}`}
      aria-label={t("splash.loading", lang)}
    >
      <div className="splash-pattern" aria-hidden="true" />
      <div className="splash-aura" aria-hidden="true" />

      {showSkip && !fadeOut ? (
        <button type="button" className="splash-skip" onClick={dismiss}>
          {SKIP_LABELS[lang] ?? SKIP_LABELS.fr}
          <span aria-hidden="true">›</span>
        </button>
      ) : null}

      <main className="splash-stage">
        <div className="splash-emblem" aria-hidden="true">
          <span className="splash-emblem__orbit" />
          <span className="splash-emblem__diamond splash-emblem__diamond--start" />
          <span className="splash-emblem__diamond splash-emblem__diamond--end" />
          <div className="splash-logo-frame">
            <PlatformLogo
              className="splash-logo-wrap"
              imgClassName="splash-logo"
              decorative
              priority
              width={144}
              height={144}
            />
          </div>
        </div>

        <div className="splash-wordmark">
          <h1>MushafPlus</h1>
          <p className="splash-subtitle" lang="ar" dir="rtl">القرآن الكريم</p>
        </div>

        <div className="splash-divider" aria-hidden="true">
          <span />
        </div>

        <blockquote className="splash-verse" lang="ar" dir="rtl">
          <p>{VERSE.ar}</p>
          <cite>{VERSE.ref}</cite>
        </blockquote>

        <div className="splash-progress" role="status" aria-live="polite">
          <span className="sr-only">{t("splash.loading", lang)}</span>
          <span className="splash-progress__track" aria-hidden="true">
            <span className="splash-progress__value" />
            <span className="splash-progress__spark" />
          </span>
          <span className="splash-loading-text" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
            {t("splash.loading", lang)}
          </span>
        </div>
      </main>

      <style>{`
        .splash-screen {
          --splash-gold: #d9ba65;
          --splash-gold-soft: #f1dda0;
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #f8fbf9;
          background:
            radial-gradient(circle at 50% 42%, rgba(217, 186, 101, 0.12), transparent 28rem),
            linear-gradient(155deg, #07170f 0%, #0c2618 48%, #102f20 100%);
          opacity: 1;
          transition: opacity ${SPLASH_FADE_MS}ms ease-out;
          contain: strict;
        }

        .splash-screen.fade-out { opacity: 0; pointer-events: none; }

        .splash-pattern {
          position: absolute;
          inset: -12%;
          opacity: 0.18;
          background-image:
            linear-gradient(30deg, transparent 47.5%, rgba(217, 186, 101, 0.16) 48%, rgba(217, 186, 101, 0.16) 49%, transparent 49.5%),
            linear-gradient(-30deg, transparent 47.5%, rgba(217, 186, 101, 0.12) 48%, rgba(217, 186, 101, 0.12) 49%, transparent 49.5%);
          background-size: 72px 124px;
          -webkit-mask-image: radial-gradient(circle at center, #000 0 22%, transparent 68%);
          mask-image: radial-gradient(circle at center, #000 0 22%, transparent 68%);
          transform: scale(1.03);
          animation: splashPatternIn 900ms ease-out both;
        }

        .splash-aura {
          position: absolute;
          width: min(35rem, 120vw);
          aspect-ratio: 1;
          border: 1px solid rgba(217, 186, 101, 0.11);
          border-radius: 50%;
          box-shadow:
            0 0 0 4rem rgba(217, 186, 101, 0.018),
            0 0 0 8rem rgba(217, 186, 101, 0.012);
          animation: splashAuraIn 900ms cubic-bezier(.22, 1, .36, 1) both;
        }

        .splash-stage {
          position: relative;
          z-index: 1;
          display: flex;
          width: min(90vw, 27rem);
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .splash-emblem {
          position: relative;
          display: grid;
          width: clamp(6.6rem, 22vw, 8.4rem);
          aspect-ratio: 1;
          place-items: center;
          opacity: 0;
          transform: translateY(0.8rem) scale(0.92);
          animation: splashEmblemIn 620ms 90ms cubic-bezier(.22, 1, .36, 1) forwards;
        }

        .splash-logo-frame {
          position: relative;
          z-index: 2;
          display: grid;
          width: 72%;
          aspect-ratio: 1;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(241, 221, 160, 0.3);
          border-radius: 29%;
          background: rgba(5, 26, 16, 0.78);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.28), inset 0 1px rgba(255,255,255,.1);
        }

        .splash-logo-wrap { display: grid; width: 100%; height: 100%; place-items: center; }
        .splash-logo { width: 78%; height: 78%; object-fit: contain; }

        .splash-emblem__orbit {
          position: absolute;
          inset: 2%;
          border: 1px solid rgba(217, 186, 101, 0.38);
          border-radius: 50%;
        }

        .splash-emblem__orbit::before,
        .splash-emblem__orbit::after {
          content: "";
          position: absolute;
          inset: 11%;
          border: 1px solid rgba(217, 186, 101, 0.12);
          border-radius: 50%;
        }

        .splash-emblem__orbit::after { inset: -5%; border-style: dashed; opacity: 0.45; }

        .splash-emblem__diamond {
          position: absolute;
          z-index: 3;
          top: 50%;
          width: 0.42rem;
          aspect-ratio: 1;
          background: var(--splash-gold);
          transform: translateY(-50%) rotate(45deg);
          box-shadow: 0 0 0 4px rgba(217, 186, 101, 0.08);
        }
        .splash-emblem__diamond--start { left: -0.1rem; }
        .splash-emblem__diamond--end { right: -0.1rem; }

        .splash-wordmark { margin-top: 0.7rem; opacity: 0; animation: splashCopyIn 480ms 500ms ease-out forwards; }
        .splash-wordmark h1 {
          margin: 0;
          color: #fff;
          font-family: "Cairo", system-ui, sans-serif;
          font-size: clamp(2rem, 7vw, 2.75rem);
          font-weight: 820;
          letter-spacing: -0.055em;
          line-height: 1.05;
        }
        .splash-wordmark p {
          margin: 0.32rem 0 0;
          color: rgba(241, 221, 160, 0.88);
          font-family: "Amiri Quran", "Amiri", serif;
          font-size: clamp(1.05rem, 4vw, 1.32rem);
          line-height: 1.4;
        }

        .splash-divider {
          display: flex;
          width: min(10rem, 42vw);
          align-items: center;
          gap: 0.6rem;
          margin: 1rem 0 0.78rem;
          color: rgba(217, 186, 101, 0.58);
          opacity: 0;
          animation: splashCopyIn 420ms 650ms ease-out forwards;
        }
        .splash-divider::before,
        .splash-divider::after { content: ""; height: 1px; flex: 1; background: linear-gradient(90deg, transparent, currentColor); }
        .splash-divider::after { transform: scaleX(-1); }
        .splash-divider span { width: 0.36rem; aspect-ratio: 1; background: currentColor; transform: rotate(45deg); }

        .splash-verse {
          max-width: 23rem;
          min-height: 4rem;
          margin: 0;
          color: rgba(250, 246, 231, 0.87);
          font-style: normal;
          opacity: 0;
          transform: translateY(0.5rem);
          animation: splashCopyIn 480ms 760ms ease-out forwards;
        }
        .splash-verse p { margin: 0; font-family: "Amiri Quran", "Amiri", serif; font-size: clamp(0.92rem, 3.1vw, 1.08rem); line-height: 1.9; }
        .splash-verse cite { display: block; margin-top: 0.12rem; color: rgba(217, 186, 101, 0.76); font-family: "Amiri", serif; font-size: 0.72rem; font-style: normal; }

        .splash-progress {
          display: grid;
          width: min(11.5rem, 52vw);
          gap: 0.55rem;
          margin-top: 1rem;
          opacity: 0;
          animation: splashCopyIn 380ms 900ms ease-out forwards;
        }
        .splash-progress__track { position: relative; height: 2px; overflow: visible; border-radius: 99px; background: rgba(255,255,255,.11); }
        .splash-progress__value { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(90deg, #8f6e1b, var(--splash-gold-soft)); transform: scaleX(0); transform-origin: left; animation: splashProgress 2.25s 800ms cubic-bezier(.2,.72,.25,1) forwards; }
        .splash-progress__spark { position: absolute; top: 50%; left: 0; width: 0.42rem; aspect-ratio: 1; border-radius: 50%; background: #fff4c8; box-shadow: 0 0 12px rgba(241,221,160,.82); transform: translate(-50%, -50%); animation: splashSpark 2.25s 800ms cubic-bezier(.2,.72,.25,1) forwards; }
        .splash-loading-text { color: rgba(248,251,249,.58); font-family: "Cairo", system-ui, sans-serif; font-size: 0.65rem; font-weight: 650; letter-spacing: 0.08em; }

        .splash-skip {
          position: absolute;
          z-index: 4;
          inset-inline-end: max(1rem, env(safe-area-inset-right));
          bottom: max(1rem, env(safe-area-inset-bottom));
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          gap: 0.45rem;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          padding: 0.45rem 0.82rem;
          color: rgba(255,255,255,.78);
          background: rgba(5, 26, 16, 0.74);
          font-size: 0.72rem;
          font-weight: 750;
          animation: splashCopyIn 260ms ease-out both;
        }
        .splash-skip:hover { border-color: rgba(241,221,160,.48); color: #fff; background: rgba(255,255,255,.08); }
        .splash-skip:focus-visible { outline: 3px solid var(--splash-gold-soft); outline-offset: 3px; }

        html[data-theme="light"] .splash-screen {
          color: #173527;
          background: radial-gradient(circle at 50% 40%, rgba(185,145,49,.14), transparent 28rem), linear-gradient(155deg, #f8faf5, #e7f0e7);
        }
        html[data-theme="sepia"] .splash-screen {
          color: #49331b;
          background: radial-gradient(circle at 50% 40%, rgba(143,94,30,.14), transparent 28rem), linear-gradient(155deg, #f5ecda, #e4d3b6);
        }
        html[data-theme="light"] .splash-logo-frame,
        html[data-theme="sepia"] .splash-logo-frame { background: rgba(255,255,255,.66); box-shadow: 0 16px 42px rgba(39,69,48,.13), inset 0 1px #fff; }
        html[data-theme="light"] .splash-wordmark h1,
        html[data-theme="sepia"] .splash-wordmark h1 { color: #173527; }
        html[data-theme="light"] .splash-wordmark p,
        html[data-theme="light"] .splash-verse cite,
        html[data-theme="sepia"] .splash-wordmark p,
        html[data-theme="sepia"] .splash-verse cite { color: #8b681c; }
        html[data-theme="light"] .splash-verse,
        html[data-theme="sepia"] .splash-verse { color: #365343; }
        html[data-theme="light"] .splash-progress__track,
        html[data-theme="sepia"] .splash-progress__track { background: rgba(22,68,44,.13); }
        html[data-theme="light"] .splash-loading-text,
        html[data-theme="sepia"] .splash-loading-text { color: rgba(34,69,49,.68); }
        html[data-theme="light"] .splash-skip,
        html[data-theme="sepia"] .splash-skip { border-color: rgba(25,82,52,.18); color: #24553a; background: rgba(255,255,255,.62); }

        .splash-screen.perf-low .splash-pattern,
        .splash-screen.perf-low .splash-aura,
        .splash-screen.perf-low .splash-emblem__orbit::after { display: none; }

        @keyframes splashPatternIn { from { opacity: 0; } to { opacity: .18; } }
        @keyframes splashAuraIn { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: scale(1); } }
        @keyframes splashEmblemIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes splashCopyIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes splashProgress { to { transform: scaleX(1); } }
        @keyframes splashSpark { to { left: 100%; } }

        @media (max-width: 480px) {
          .splash-stage { width: min(88vw, 22rem); }
          .splash-emblem { width: 6.8rem; }
          .splash-wordmark { margin-top: 0.45rem; }
          .splash-divider { margin-top: 0.78rem; }
          .splash-verse { min-height: 3.65rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-screen *, .splash-screen *::before, .splash-screen *::after {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0.01ms !important;
          }
          .splash-emblem, .splash-wordmark, .splash-divider, .splash-verse, .splash-progress { opacity: 1; transform: none; }
          .splash-progress__value { transform: scaleX(1); }
          .splash-progress__spark { left: 100%; }
        }
      `}</style>
    </div>
  );
}
