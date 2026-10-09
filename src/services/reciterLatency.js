/**
 * Per-reciter start-latency store for the audio service.
 *
 * Measures how long a reciter's CDN takes to produce audible output, keeps an
 * exponential moving average per reciter key, and derives the karaoke timing
 * bias. All functions operate on the AudioService instance's own fields
 * (`_reciterLatencyByKey`, `_latencyListeners`, `_playRequestedAt`, …) so the
 * service keeps a single source of truth for the measurements.
 */

import { recordPerformanceMetric } from "./performanceMetrics.js";

function devLog(method, ...args) {
  if (import.meta.env?.DEV && typeof console !== "undefined") {
    console[method]?.(...args);
  }
}

/** One sample per verse, once playback has actually produced output. */
export function captureLatencySample(svc, currentTime = 0) {
  if (svc._hasCapturedLatency) return;
  if (!svc._playRequestedAt) return;
  if (!Number.isFinite(currentTime) || currentTime < 0.05) return;

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsedSec = (now - svc._playRequestedAt) / 1000;
  const latencySec = elapsedSec - currentTime;
  if (!Number.isFinite(latencySec) || latencySec < -0.2 || latencySec > 1.0) {
    return;
  }

  const key = svc._activeReciterKey || "everyayah:";
  const prev = svc._reciterLatencyByKey[key];
  const next =
    Number.isFinite(prev) ? prev * 0.75 + latencySec * 0.25 : latencySec;
  svc._reciterLatencyByKey[key] = Number(next.toFixed(4));
  recordPerformanceMetric("audio_start_ms", Math.max(0, latencySec * 1000));
  notifyLatencyListeners(svc);
  svc._hasCapturedLatency = true;
}

export function notifyLatencyListeners(svc) {
  const snapshot = getLatencySnapshot(svc);
  for (const fn of svc._latencyListeners) {
    try {
      fn(snapshot);
    } catch (error) {
      devLog("warn", "Latency listener error:", error);
    }
  }
}

/**
 * Runtime timing hint for karaoke.
 * Positive values add lead to compensate rendering/audio pipeline lag.
 */
export function getReciterTimingBiasSec(svc) {
  const key = svc._activeReciterKey || "everyayah:";
  const measured = svc._reciterLatencyByKey[key];
  const measuredBias = Number.isFinite(measured) ? measured * 0.52 : 0;
  const cdnBias =
    svc._currentCdnType === "everyayah"
      ? 0.025
      : svc._currentCdnType === "mp3quran-surah"
        ? 0.04
        : 0;
  return Math.max(-0.04, Math.min(0.16, measuredBias + cdnBias));
}

export function setLatencySnapshot(svc, snapshot = {}) {
  const safeEntries = Object.entries(snapshot).filter(([key, value]) => {
    return (
      typeof key === "string" &&
      key.length <= 120 &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5
    );
  });
  svc._reciterLatencyByKey = Object.fromEntries(
    safeEntries.map(([key, value]) => [key, Number(Number(value).toFixed(4))]),
  );
}

export function getLatencySnapshot(svc) {
  return { ...svc._reciterLatencyByKey };
}

export function getLatencyForKey(svc, key) {
  const value = svc._reciterLatencyByKey?.[key];
  return Number.isFinite(value) ? value : null;
}
