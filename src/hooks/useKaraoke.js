/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";
import { getKaraokeCalibration } from "../utils/karaokeUtils";

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
  const driftPerProgress = calibration?.driftPerProgress ?? 0.03;
  const speedSensitivity = calibration?.speedSensitivity ?? 0.06;
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
        const normalized = Math.max(0, Math.min(1, t / dur));
        const rate = Math.max(0.5, Math.min(2, audioService.playbackRate || 1));
        const runtimeReciterBias =
          typeof audioService.getReciterTimingBiasSec === "function"
            ? audioService.getReciterTimingBiasSec()
            : 0;
        const secondsPerWord =
          wordCount > 0 && dur > 0 ? dur / Math.max(1, wordCount) : 0;
        const tempoBias =
          secondsPerWord > 0
            ? Math.max(-0.04, Math.min(0.12, (secondsPerWord - 0.55) * 0.2))
            : 0;
        const adaptiveOffset =
          offsetSec +
          runtimeReciterBias +
          tempoBias +
          normalized * driftPerProgress +
          (1 - rate) * speedSensitivity;
        const rawProgress = Math.max(0, Math.min(1, (t + adaptiveOffset) / dur));
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
  }, [
    offsetSec,
    smoothing,
    driftPerProgress,
    speedSensitivity,
    isFirstAyah,
    wordCount,
  ]);

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
  void isFirstAyah;
  return getKaraokeCalibration(reciterId, riwaya, wordCount);
}
