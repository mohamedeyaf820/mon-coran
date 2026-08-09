/* mon-coran/src/hooks/useKaraoke.js */

import { useState, useEffect, useRef } from "react";
import audioService from "../services/audioService";
import { createPausableAnimationLoop } from "../utils/pausableAnimationLoop";

/**
 * Karaoke model — verse text highlighting synchronized with audio.
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
    let frameLoop = null;

    const tick = () => {
      if (!running) return;

      // ── Park the loop when audio is paused / stopped ──
      if (!audioService.isPlaying) {
        frameLoop?.stop();
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
    };

    frameLoop = createPausableAnimationLoop(tick);
    const startLoop = () => frameLoop.start();
    const stopLoop = () => frameLoop.stop();
    const unsubscribePlay = audioService.addPlayListener(startLoop);
    const unsubscribePause = audioService.addPauseListener(stopLoop);
    const unsubscribeEnd = audioService.addEndListener(stopLoop);

    if (audioService.isPlaying) startLoop();

    return () => {
      running = false;
      unsubscribePlay();
      unsubscribePause();
      unsubscribeEnd();
      frameLoop.stop();
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
