/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";

/**
 * Karaoke model — word-by-word highlighting synchronized with audio.
 *
 * Key improvements:
 * - RAF loop parks automatically when audio is paused (no ghost highlights)
 * - Seeks snap instantly without waiting for the smoothing ramp
 * - Progress resets cleanly on ayah change
 * - isPlaying-aware: if audio stops, progress freezes
 */

export function useKaraoke({ isFirstAyah, wordCount, calibration }) {
  const [progress, setProgress] = useState(0);
  const [seekCount, setSeekCount] = useState(0);
  const rafRef = useRef(null);
  const smoothedRef = useRef(0);
  const lastTimeRef = useRef(-1);

  // offsetSec négatif = highlight légèrement APRÈS l'audio (sécurité)
  // offsetSec positif = highlight légèrement EN AVANCE
  const offsetSec = calibration?.offsetSec ?? -0.1;
  // smoothing élevé (0.7+) = très réactif / snappy
  const smoothing = calibration?.smoothing ?? 0.65;

  useEffect(() => {
    // Reset on every calibration / ayah change
    smoothedRef.current = 0;
    lastTimeRef.current = -1;
    setProgress(0);
    let running = true;

    const tick = () => {
      if (!running) return;

      // ── Park the loop when audio is paused / stopped ──
      if (!audioService.isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dur = audioService.duration || 0;
      const t = audioService.currentTime || 0;

      if (dur > 0) {
        const prevT = lastTimeRef.current;

        // Detect seek (backward jump or large forward skip)
        if (prevT >= 0) {
          const delta = t - prevT;
          const bigJump = Math.abs(delta) > 1.5;
          const backwardSeek = delta < -0.25;

          if (bigJump || backwardSeek) {
            // Snap immediately — bypass smoothing
            const snapped = Math.max(0, Math.min(1, (t + offsetSec) / dur));
            smoothedRef.current = snapped;
            setSeekCount((c) => c + 1);
            // Reset lastIdx in the consumer via seekCount
          }
        }

        // Smoothed progress — alpha clamped to [0.82, 0.94] for stable yet responsive tracking.
        // Narrower range vs. old [0.80, 0.96] reduces overshoot on fast reciters while keeping
        // enough smoothing for slow/tartil reciters to avoid jitter.
        const rawProgress = Math.max(0, Math.min(1, (t + offsetSec) / dur));
        const prev = smoothedRef.current;
        const alpha = Math.min(0.94, Math.max(0.82, smoothing));
        let next = prev + (rawProgress - prev) * alpha;

        // Monotone guard: no backward drift without an explicit seek
        if (next < prev - 0.003) next = prev;

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
 * Helper to build a calibration profile for a given reciter/riwaya.
 *
 * This is the FALLBACK path used by SmartAyahRenderer when no calibration prop
 * is passed down from QuranDisplay (e.g. edge cases or future render paths).
 * The primary path goes through karaokeUtils.getKaraokeCalibration().
 *
 * Per-reciter fine-tuning:
 *   offsetSec > 0  → highlight appears BEFORE the word is spoken (anticipatory)
 *   offsetSec < 0  → highlight appears slightly AFTER (reactive/conservative)
 *
 * CDN groups:
 *   islamic.network  → generally faster buffering, lower base offset (~0.12–0.18 s)
 *   everyayah.com    → higher first-packet delay, base offset bumped ~+0.03 s (~0.15–0.17 s)
 *
 * Style groups:
 *   murattal  → moderate lead (0.12–0.18 s)
 *   tartil    → slightly more lead, words are longer (0.20–0.22 s)
 *   mujawwad  → maximum lead, very drawn-out syllables (0.28–0.32 s)
 */
export function buildKaraokeCalibration({
  reciterId,
  riwaya,
  isFirstAyah,
  wordCount,
}) {
  // ── Per-reciter offset table ───────────────────────────────────────────────
  // Values are (offsetSec, smoothing) pairs.
  // islamic.network CDN reciters — faster CDN, tighter offsets
  const RECITER_OFFSETS = {
    // ── islamic.network ────────────────────────────────────────────────────
    "ar.alafasy": { offsetSec: 0.14, smoothing: 0.9 },
    "ar.abdulbasitmurattal": { offsetSec: 0.14, smoothing: 0.86 },
    "ar.abdulbasitmujawwad": { offsetSec: 0.32, smoothing: 0.83 }, // very slow mujawwad
    "ar.husary": { offsetSec: 0.12, smoothing: 0.88 },
    "ar.minshawi": { offsetSec: 0.14, smoothing: 0.86 },
    "ar.minshawimujawwad": { offsetSec: 0.3, smoothing: 0.83 }, // mujawwad — large lead
    "ar.saoodshuraym": { offsetSec: 0.14, smoothing: 0.88 },
    "ar.abdurrahmaansudais": { offsetSec: 0.14, smoothing: 0.89 },
    // ── everyayah.com (+~0.03 s for CDN first-packet latency) ──────────────
    abdullaah_matrood: { offsetSec: 0.17, smoothing: 0.88 },
    abdullaah_basfar: { offsetSec: 0.17, smoothing: 0.88 },
    abdulsamad: { offsetSec: 0.17, smoothing: 0.86 },
    "ar.maaboralmeem": { offsetSec: 0.17, smoothing: 0.87 },
    ahmed_ajmy: { offsetSec: 0.17, smoothing: 0.88 },
    maher_almuaiqly: { offsetSec: 0.17, smoothing: 0.9 },
    abdulbari_thubayti: { offsetSec: 0.17, smoothing: 0.87 },
    ali_jabir: { offsetSec: 0.17, smoothing: 0.87 },
    hudhaify: { offsetSec: 0.17, smoothing: 0.87 },
    muhammad_ayyoub: { offsetSec: 0.17, smoothing: 0.88 },
    muhammad_tablawi: { offsetSec: 0.24, smoothing: 0.84 }, // notably slow, near-tartil
    hani_rifai: { offsetSec: 0.17, smoothing: 0.88 },
    fares_abbad: { offsetSec: 0.17, smoothing: 0.87 },
    yasser_dossari_hafs: { offsetSec: 0.17, smoothing: 0.9 },
    nasser_alqatami: { offsetSec: 0.17, smoothing: 0.9 },
    // ── Warsh reciters (everyayah.com CDN) ─────────────────────────────────
    warsh_abdulbasit: { offsetSec: 0.2, smoothing: 0.88 },
    warsh_ibrahim_aldosari: { offsetSec: 0.2, smoothing: 0.88 },
    warsh_yassin: { offsetSec: 0.22, smoothing: 0.9 },
  };

  const defaultOffset = riwaya === "warsh" ? 0.2 : 0.15;
  const defaultSmoothing = 0.88;

  const found = reciterId ? RECITER_OFFSETS[reciterId] : null;
  let offsetSec = found?.offsetSec ?? defaultOffset;
  let smoothing = found?.smoothing ?? defaultSmoothing;

  // Longer ayahs (>10 words) benefit from a tiny extra lead: the proportional
  // timing model accumulates small errors over many words, so a 20 ms cushion
  // keeps the highlight from drifting behind on dense verses.
  if (wordCount && wordCount > 10) {
    offsetSec = Number((offsetSec + 0.02).toFixed(3));
  }

  return { offsetSec, smoothing, lagWordsBase: 0, lagWordsLong: 0 };
}
