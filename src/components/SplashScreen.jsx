import React, { useEffect, useState } from "react";
import PlatformLogo from "./PlatformLogo";

/* 8 particules dorées flottantes générées statiquement */
const PARTICLES = [
  { size: 3, top: "15%", left: "12%", dur: 6, del: 0 },
  { size: 2, top: "22%", left: "82%", dur: 8, del: 0.8 },
  { size: 4, top: "70%", left: "8%", dur: 7, del: 1.4 },
  { size: 2, top: "80%", left: "88%", dur: 9, del: 0.3 },
  { size: 3, top: "45%", left: "92%", dur: 6, del: 2 },
  { size: 2, top: "60%", left: "5%", dur: 10, del: 1 },
  { size: 3, top: "10%", left: "55%", dur: 7, del: 1.7 },
  { size: 2, top: "88%", left: "45%", dur: 8, del: 0.5 },
];

/* Versets qui défilent pendant le chargement */
const VERSES = [
  {
    ar: "﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾",
    ref: "الحجر — 9",
  },
  { ar: "﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ ﴾", ref: "القمر — 17" },
  {
    ar: "﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾",
    ref: "الإسراء — 9",
  },
  { ar: "﴿ فَاقْرَءُوا مَا تَيَسَّرَ مِنَ الْقُرْآنِ ﴾", ref: "المزمل — 20" },
  { ar: "﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾", ref: "المزمل — 4" },
  {
    ar: "﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾",
    ref: "البخاري",
  },
];

export default function SplashScreen({
  onDone,
  onPrefetch,
  lowPerfMode = false,
}) {
  const [fadeOut, setFadeOut] = useState(false);
  const [verseIndex, setVerseIndex] = useState(0);
  const [verseVisible, setVerseVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (lowPerfMode) return;
    const t = setTimeout(() => setShowSkip(true), 800);
    return () => clearTimeout(t);
  }, [lowPerfMode]);

  useEffect(() => {
    if (onPrefetch) onPrefetch();

    if (lowPerfMode) {
      const t1 = setTimeout(() => setFadeOut(true), 300);
      const t2 = setTimeout(() => onDone(), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // Rotation des versets toutes les ~1.4 s
    const verseTick = setInterval(() => {
      setVerseVisible(false);
      setTimeout(() => {
        setVerseIndex((i) => (i + 1) % VERSES.length);
        setVerseVisible(true);
      }, 350);
    }, 1600);

    // Fade-out à 3 s, fin à 3.6 s
    const t1 = setTimeout(() => setFadeOut(true), 3000);
    const t2 = setTimeout(() => onDone(), 3600);

    return () => {
      clearInterval(verseTick);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, onPrefetch, lowPerfMode]);

  const v = VERSES[verseIndex];

  return (
    <div
      className={`splash-screen ${fadeOut ? "fade-out" : ""} ${lowPerfMode ? "perf-low" : ""}`}
    >
      {showSkip && !fadeOut && (
        <button
          className="splash-skip"
          onClick={() => {
            setShowSkip(false);
            setFadeOut(true);
            setTimeout(onDone, 600);
          }}
        >
          Skip ›
        </button>
      )}
      {/* Halo doré central */}
      <div className="splash-halo" aria-hidden="true" />

      {/* Étoiles / particules flottantes */}
      {!lowPerfMode &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="splash-particle"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.del}s`,
            }}
          />
        ))}

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
        <h1 className="splash-title">MushafPlus</h1>
        <p className="splash-subtitle">القرآن الكريم</p>

        {/* Verset tournant */}
        <div
          className={`splash-verse-wrap ${verseVisible ? "verse-in" : "verse-out"}`}
        >
          <p className="splash-verse">{v.ar}</p>
          <p className="splash-verse-ref">{v.ref}</p>
        </div>

        {/* Barre de progression */}
        <div
          className="splash-loader"
          role="progressbar"
          aria-label="Chargement"
        >
          <div className="splash-loader-bar" />
        </div>
        <div className="splash-ornament" aria-hidden="true">
          ✦ ✦ ✦
        </div>
        <p className="splash-loading-text">بِسْمِ اللَّهِ</p>
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
          transition: opacity 0.7s cubic-bezier(0.4,0,0.2,1);
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

        /* ── Particules ── */
        .splash-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(212,175,55,0.55);
          box-shadow: 0 0 6px rgba(212,175,55,0.4);
          animation: floatParticle var(--dur, 7s) ease-in-out infinite;
          animation-delay: var(--del, 0s);
          pointer-events: none;
        }

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
          color: rgba(212,175,55,0.45);
          margin: 0;
          letter-spacing: 1px;
        }

        /* ── Barre de chargement ── */
        .splash-loader {
          width: min(240px, 60vw);
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          margin: 0 auto 0.9rem;
          overflow: hidden;
          position: relative;
        }
        .splash-loader-bar {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #8B6914, #D4AF37, #F5D785, #D4AF37, #8B6914);
          background-size: 300% 100%;
          border-radius: 99px;
          animation: loadBar 3s cubic-bezier(0.4,0,0.6,1) forwards,
                     shimmerBar 1.8s linear infinite;
        }
        .splash-screen.perf-low .splash-loader-bar {
          animation: loadBar 0.35s linear forwards;
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
          color: rgba(212,175,55,0.35);
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
          0%,100% { filter: drop-shadow(0 6px 24px rgba(212,175,55,0.28)); transform: scale(1);    }
          50%     { filter: drop-shadow(0 8px 32px rgba(212,175,55,0.45)); transform: scale(1.03); }
        }
        @keyframes splashHalo {
          0%,100% { transform: translate(-50%,-50%) scale(1);    opacity: 1;   }
          50%     { transform: translate(-50%,-50%) scale(1.08); opacity: 0.7; }
        }
        @keyframes floatParticle {
          0%,100% { transform: translateY(0); opacity: 0.6; }
          50%     { transform: translateY(-18px); opacity: 1; }
        }
        @keyframes arFlow {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes loadBar {
          0%   { width: 0%;    }
          15%  { width: 18%;   }
          40%  { width: 45%;   }
          70%  { width: 72%;   }
          90%  { width: 90%;   }
          100% { width: 100%;  }
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
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.5);
          padding: 0.4rem 1rem;
          border-radius: 99px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInUp 0.4s ease;
          font-family: 'Cairo', sans-serif;
          z-index: 10;
        }
        .splash-skip:hover {
          background: rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.8);
          border-color: rgba(255, 255, 255, 0.22);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
