/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";

/**
 * Very simple, predictable karaoke model:
 *
 * - Progress = (currentTime + offsetSec) / duration
 * - Clamped between 0 and 1
 * - No complex dynamic lag, no basmala magic, no adaptive smoothing
 *
 * The goal is to:
 *   1. Be easy to reason about
 *   2. Make it trivial to tune per-reciter / per-ayah offsets from the UI/state
 *   3. Avoid jumps backwards
 *
 * Recommended usage from the caller:
 *   useKaraoke({
 *     isFirstAyah,
 *     wordCount,
 *     calibration: {
 *       offsetSec: -0.4,        // start a bit earlier (negative = earlier)
 *       smoothing: 0.35,        // 0 = raw, >0 = smoothed
 *       minLagSec: 0.0,         // small positive if you want text slightly behind
 *       maxLagSec: 0.3,         // cap how far behind it can be
 *     }
 *   });
 */

export function useKaraoke({ isFirstAyah, wordCount, calibration }) {
  const [progress,  setProgress]  = useState(0);
  const [seekCount, setSeekCount] = useState(0);
  const rafRef      = useRef(null);
  const smoothedRef = useRef(0);
  const lastTimeRef = useRef(-1); // -1 = not yet initialised

  // offsetSec négatif = highlight légèrement en retard sur l'audio (sécurité)
  // offsetSec positif = highlight en avance (trop tôt)
  const offsetSec = calibration?.offsetSec ?? -0.10;
  // smoothing élevé (0.6+) = très réactif / snappy ; bas = lent, fluide
  const smoothing  = calibration?.smoothing  ?? 0.55;

  useEffect(() => {
    // Reset on every calibration / ayah change
    smoothedRef.current = 0;
    lastTimeRef.current = -1;
    let running = true;

    const tick = () => {
      if (!running) return;

      const dur = audioService.duration  || 0;
      const t   = audioService.currentTime || 0;

      if (dur > 0) {
        const prevT = lastTimeRef.current;

        // Détection de saut (seek ou retour arrière)
        if (prevT >= 0) {
          const delta = t - prevT;
          const bigJump      = Math.abs(delta) > 1.5;
          const backwardSeek = delta < -0.25;

          if (bigJump || backwardSeek) {
            // Snap immédiat sans smoothing
            const snapped = Math.max(0, Math.min(1, (t + offsetSec) / dur));
            smoothedRef.current = snapped;
            if (backwardSeek || bigJump) {
              setSeekCount(c => c + 1);
            }
          }
        }

        // Progression lissée — alpha élevé = très réactif
        const rawProgress = Math.max(0, Math.min(1, (t + offsetSec) / dur));
        const prev  = smoothedRef.current;
        // Alpha clamped : 0.45–0.95 pour rester toujours réactif
        const alpha = Math.min(0.95, Math.max(0.45, smoothing));
        let   next  = prev + (rawProgress - prev) * alpha;

        // Monotone : on n'autorise le retour arrière que si un seek a été détecté
        if (next < prev - 0.005) next = prev;

        smoothedRef.current = next;
        setProgress(next);
      }

      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetSec, smoothing, isFirstAyah, wordCount]);

  return { progress, seekCount };
}

/**
 * Helper to build a simple calibration profile.
 * You can adjust these per-reciter / per-riwaya in one place.
 */
export function buildKaraokeCalibration({ reciterId, riwaya, isFirstAyah, wordCount }) {
  let offsetSec    = riwaya === "warsh" ? -0.32 : -0.28;
  let smoothing    = 0.12;
  let lagWordsBase = 0;
  let lagWordsLong = 0;
  // First ayah sometimes has a longer intro (basmala) -> tiny extra lag
  if (isFirstAyah) {
    offsetSec -= 0.06;
  }
  return { offsetSec, smoothing, lagWordsBase, lagWordsLong };
}
