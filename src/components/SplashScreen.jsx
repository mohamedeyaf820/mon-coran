import React, { useEffect, useState } from "react";
import PlatformLogo from "./PlatformLogo";
import { t } from "../i18n";

/* Un seul verset stabilise le premier rendu et garde le splash apaisé. */
const VERSE = {
  ar: "﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾",
  ref: "الحجر — 9",
};

const skipLabels = { ar: 'تخطي', fr: 'Passer', en: 'Skip' };
const SPLASH_MIN_VISIBLE_MS = 3000;
const SPLASH_MAX_VISIBLE_MS = 4500;
const SPLASH_FADE_MS = 240;
const SPLASH_SKIP_DELAY_MS = 2200;

export default function SplashScreen({
  onDone,
  onPrefetch,
  lowPerfMode = false,
  lang = "fr",
}) {
  const [fadeOut, setFadeOut] = useState(false);
  const dismissedRef = React.useRef(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setShowSkip(true),
      SPLASH_SKIP_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const dismiss = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setFadeOut(true);
      setTimeout(onDone, SPLASH_FADE_MS);
    };

    let prefetchDone = false;
    let timerDone = false;
    const tryEarlyDismiss = () => {
      if (prefetchDone && timerDone) dismiss();
    };

    if (onPrefetch) {
      const result = onPrefetch();
      if (result && typeof result.then === "function") {
        result.then(() => { prefetchDone = true; tryEarlyDismiss(); }).catch(() => { prefetchDone = true; tryEarlyDismiss(); });
      } else {
        prefetchDone = true;
      }
    } else {
      prefetchDone = true;
    }

    // Keep the branded opening visible for three seconds while the actual app
    // renders behind it. Slow prefetches may extend it, but never beyond 4.5 s.
    const minTimer = setTimeout(() => {
      timerDone = true;
      tryEarlyDismiss();
    }, SPLASH_MIN_VISIBLE_MS);
    const maxTimer = setTimeout(() => dismiss(), SPLASH_MAX_VISIBLE_MS);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [onDone, onPrefetch]);

  return (
    <div
      className={`splash-screen ${fadeOut ? "fade-out" : ""} ${lowPerfMode ? "perf-low" : ""}`}
    >
      {showSkip && !fadeOut && (
        <button
          type="button"
          className="splash-skip"
          onClick={() => {
            if (dismissedRef.current) return;
            dismissedRef.current = true;
            setShowSkip(false);
            setFadeOut(true);
            setTimeout(onDone, SPLASH_FADE_MS);
          }}
        >
          {skipLabels[lang] ?? skipLabels.fr} ›
        </button>
      )}
      {/* Halo doré central */}
      <div className="splash-halo" aria-hidden="true" />

      {/* Motif arabesque discret en fond */}
      <div className="splash-arabesque" aria-hidden="true">
        {"✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦ ٭ ✦"}
      </div>

      <div className="splash-content">
        <PlatformLogo
          className="splash-logo-wrap"
          imgClassName="splash-logo"
          decorative
          priority
          width={160}
          height={160}
        />
        <div className="splash-title" aria-label="MushafPlus">MushafPlus</div>
        <p className="splash-subtitle" lang="ar" dir="rtl">
          القرآن الكريم
        </p>

        {/* Verset d'ouverture */}
        <div className="splash-verse-wrap verse-in">
          <p className="splash-verse" lang="ar" dir="rtl">{VERSE.ar}</p>
          <p className="splash-verse-ref" lang="ar" dir="rtl">{VERSE.ref}</p>
        </div>

        {/* Barre de progression */}
        <div
          className="splash-loader"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">{t("splash.loading", lang)}</span>
          <div className="splash-loader-bar" />
        </div>
        <div className="splash-ornament" aria-hidden="true">
          ✦ ✦ ✦
        </div>
        <p
          className="splash-loading-text"
          lang={lang}
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {t("splash.loading", lang)}…
        </p>
      </div>

      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #071A0F 0%, #102A1A 35%, #1A3828 65%, #0B1F12 100%);
          transition: opacity 0.18s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .splash-screen.perf-low {
          transition: opacity 0.2s linear;
          background: #0e2117;
        }
        .splash-screen.fade-out { opacity: 0; pointer-events: none; }

        /* ── Halo ── */
        .splash-halo {
          position: absolute;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 50%, transparent 72%);
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          animation: splashHalo 4s ease-in-out infinite;
          pointer-events: none;
        }
        .splash-screen.perf-low .splash-halo { display: none; }

        /* ── Arabesque ── */
        .splash-arabesque {
          position: absolute;
          bottom: 12%;
          left: 0; right: 0;
          text-align: center;
          font-size: 0.85rem;
          letter-spacing: 6px;
          color: rgba(212,175,55,0.08);
          white-space: nowrap;
          overflow: hidden;
          pointer-events: none;
          animation: arFlow 20s linear infinite;
          user-select: none;
        }
        .splash-screen.perf-low .splash-arabesque { display: none; }

        /* ── Content ── */
        .splash-content {
          text-align: center;
          position: relative;
          z-index: 1;
          animation: splashIn 1s cubic-bezier(0.22,1,0.36,1);
        }
        .splash-screen.perf-low .splash-content { animation: none; }

        .splash-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.4rem;
          animation: logoPulse 3s ease-in-out infinite;
          filter: drop-shadow(0 6px 24px rgba(212,175,55,0.3));
        }
        .splash-screen.perf-low .splash-logo-wrap { animation: none; filter: none; }
        .splash-logo { width: min(200px, 54vw); height: auto; object-fit: contain; }

        .splash-title {
          font-family: 'Scheherazade New', 'Amiri', serif;
          font-size: clamp(2.4rem, 8vw, 3.4rem);
          color: #fff;
          margin: 0 0 0.25rem;
          letter-spacing: 4px;
          text-shadow: 0 2px 16px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.12);
        }
        .splash-subtitle {
          font-family: 'Amiri Quran', serif;
          font-size: clamp(1.2rem, 4vw, 1.6rem);
          color: rgba(240,234,214,0.88);
          margin: 0 0 1.6rem;
          letter-spacing: 2px;
        }

        /* ── Verset tournant ── */
        .splash-verse-wrap {
          min-height: 72px;
          margin: 0 auto 1.8rem;
          max-width: 360px;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .splash-verse-wrap.verse-in  { opacity: 1; transform: translateY(0); }
        .splash-verse-wrap.verse-out { opacity: 0; transform: translateY(-8px); }
        .splash-verse {
          font-family: 'Amiri Quran', serif;
          font-size: clamp(0.9rem, 2.8vw, 1.05rem);
          color: rgba(212,175,55,0.82);
          margin: 0 0 0.3rem;
          line-height: 1.9;
          direction: rtl;
        }
        .splash-verse-ref {
          font-family: 'Amiri', serif;
          font-size: 0.75rem;
          color: rgba(245,215,133,0.82);
          margin: 0;
          letter-spacing: 1px;
        }

        /* ── Barre de chargement ── */
        .splash-loader {
          width: min(240px, 60vw);
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          margin: 0 auto 0.45rem;
          overflow: hidden;
          position: relative;
        }
        .splash-loader-bar {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #8B6914, #D4AF37, #F5D785, #D4AF37, #8B6914);
          background-size: 300% 100%;
          border-radius: 99px;
          transform-origin: left center;
          animation: loadBar 3s cubic-bezier(0.4,0,0.6,1) forwards,
                     shimmerBar 1.8s linear infinite;
        }
        .splash-screen.perf-low .splash-loader-bar {
          animation: loadBar 3s linear forwards;
        }
        .splash-ornament {
          color: rgba(212,175,55,0.25);
          font-size: 0.65rem;
          letter-spacing: 8px;
          margin: 0 auto 0.4rem;
        }
        .splash-loading-text {
          font-family: 'Amiri Quran', serif;
          font-size: 0.78rem;
          color: rgba(245,215,133,0.78);
          margin: 0;
          letter-spacing: 3px;
          animation: blink 2s ease-in-out infinite;
        }

        /* ─ Keyframes ─ */
        @keyframes splashIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes logoPulse {
          0%,100% { opacity: 1;   transform: scale(1);    }
          50%     { opacity: 0.8; transform: scale(1.03); }
        }
        @keyframes splashHalo {
          0%,100% { transform: translate(-50%,-50%) scale(1);    opacity: 1;   }
          50%     { transform: translate(-50%,-50%) scale(1.08); opacity: 0.7; }
        }
        @keyframes arFlow {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes loadBar {
          0%   { transform: scaleX(0);    transform-origin: left; }
          15%  { transform: scaleX(0.18); transform-origin: left; }
          40%  { transform: scaleX(0.45); transform-origin: left; }
          70%  { transform: scaleX(0.72); transform-origin: left; }
          90%  { transform: scaleX(0.90); transform-origin: left; }
          100% { transform: scaleX(1);    transform-origin: left; }
        }
        @keyframes shimmerBar {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes blink {
          0%,100% { opacity: 0.35; }
          50%     { opacity: 0.7;  }
        }

        /* ── Skip button ── */
        .splash-skip {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          min-height: 44px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.92);
          padding: 0.65rem 1.2rem;
          border-radius: 99px;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInUp 0.4s ease;
          font-family: 'Cairo', sans-serif;
          z-index: 10;
        }
        .splash-skip:hover {
          background: rgba(255, 255, 255, 0.22);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.48);
        }
        .splash-skip:focus-visible {
          outline: 3px solid #f5d785;
          outline-offset: 3px;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-content,
          .splash-logo-wrap,
          .splash-halo,
          .splash-arabesque,
          .splash-loader-bar,
          .splash-loading-text,
          .splash-skip {
            animation: none !important;
            transition: none !important;
          }
          .splash-screen {
            transition: opacity 0.01s linear !important;
          }
          .splash-verse-wrap {
            transition: none !important;
            transform: none !important;
          }
        }
        @media (max-width: 640px) {
          .splash-content {
            width: min(88vw, 340px);
          }
          .splash-logo-wrap {
            margin-bottom: 0.85rem;
          }
          .splash-logo {
            width: min(132px, 36vw);
          }
          .splash-title {
            font-size: clamp(2rem, 11vw, 2.55rem);
            letter-spacing: 2px;
          }
          .splash-subtitle {
            margin-bottom: 1rem;
          }
          .splash-verse-wrap {
            min-height: 64px;
            margin-bottom: 1.1rem;
          }
          .splash-skip {
            right: max(0.8rem, env(safe-area-inset-right));
            bottom: max(0.8rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
