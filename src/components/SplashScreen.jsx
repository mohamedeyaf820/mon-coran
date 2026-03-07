import React, { useEffect, useState } from 'react';
import PlatformLogo from './PlatformLogo';

export default function SplashScreen({ onDone, onPrefetch, lowPerfMode = false }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start prefetching data immediately while splash is visible
    if (onPrefetch) onPrefetch();

    // Faster splash on low-performance devices
    const fadeDelay = lowPerfMode ? 280 : 1000;
    const doneDelay = lowPerfMode ? 420 : 1500;
    const timer = setTimeout(() => setFadeOut(true), fadeDelay);
    const done = setTimeout(() => onDone(), doneDelay);
    return () => { clearTimeout(timer); clearTimeout(done); };
  }, [onDone, onPrefetch, lowPerfMode]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''} ${lowPerfMode ? 'perf-low' : ''}`}>
      <div className="splash-content">
        <PlatformLogo className="splash-logo-wrap" imgClassName="splash-logo" decorative />
        <h1 className="splash-title">MushafPlus</h1>
        <p className="splash-subtitle">القرآن الكريم</p>
        <p className="splash-verse">﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</p>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>

      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0D2818 0%, #1B3A2D 40%, #0D1B14 100%);
          transition: opacity 0.6s ease;
          overflow: hidden;
        }
        .splash-screen::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 3s ease-in-out infinite;
        }
        .splash-screen.perf-low {
          transition: opacity 0.18s linear;
          background: #10251a;
        }
        .splash-screen.perf-low::before {
          display: none;
          animation: none;
        }
        .splash-screen.fade-out { opacity: 0; pointer-events: none; }

        .splash-content {
          text-align: center;
          animation: splashIn 0.8s ease-out;
          position: relative;
          z-index: 1;
        }
        .splash-screen.perf-low .splash-content { animation: none; }
        .splash-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.2rem;
          animation: sparkle 2s ease-in-out infinite;
          filter: drop-shadow(0 8px 24px rgba(212,175,55,0.24));
        }
        .splash-logo {
          width: min(220px, 56vw);
          height: auto;
          object-fit: contain;
        }
        .splash-screen.perf-low .splash-logo-wrap {
          animation: none;
          filter: none;
        }
        .splash-title {
          font-family: 'Amiri', serif;
          font-size: 3.2rem;
          color: white;
          margin: 0 0 0.3rem;
          letter-spacing: 3px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .splash-subtitle {
          font-family: 'Amiri Quran', serif;
          font-size: 1.5rem;
          color: rgba(240,234,214,0.9);
          margin: 0 0 0.6rem;
        }
        .splash-verse {
          font-family: 'Amiri Quran', serif;
          font-size: 0.95rem;
          color: rgba(212,175,55,0.7);
          margin: 0 auto 2rem;
          max-width: 340px;
          line-height: 1.8;
        }
        .splash-loader {
          width: 200px;
          height: 3px;
          background: rgba(255,255,255,0.12);
          border-radius: 4px;
          margin: 0 auto;
          overflow: hidden;
        }
        .splash-loader-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), #F5D785);
          border-radius: 4px;
          animation: loadBar 1s ease-in-out;
        }
        .splash-screen.perf-low .splash-loader-bar {
          animation: loadBar 0.3s linear;
        }

        @keyframes splashIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes loadBar {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
