/**
 * Parametric equalizer for the audio service (Web Audio API, lazy init).
 *
 * The three biquad filters are created on first non-flat preset and wired
 * between the media element and the destination. Flat playback deliberately
 * stays on the native media path (see applyEqPreset) so it is not subject to
 * background suspension. Functions mutate the AudioService instance's own
 * fields (`_audioCtx`, `_bassFilter`, `_midFilter`, `_trebleFilter`,
 * `_eqConnected`, `eqPreset`).
 */

import { preparePlaybackSession } from "./audioSession.js";

const EQ_PRESETS = {
  flat: { bass: 0, mid: 0, treble: 0 },
  bass: { bass: 8, mid: 0, treble: -2 },
  treble: { bass: -2, mid: 0, treble: 6 },
  near: { bass: 2, mid: 5, treble: 2 },
  hall: { bass: -3, mid: -2, treble: 3 },
  vocals: { bass: -4, mid: 7, treble: 3 },
};

function devLog(method, ...args) {
  if (import.meta.env?.DEV && typeof console !== "undefined") {
    console[method]?.(...args);
  }
}

export function ensureAudioCtx(svc) {
  if (svc._eqConnected || !svc.audio) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    svc._audioCtx = new AC();
    const src = svc._audioCtx.createMediaElementSource(svc.audio);
    svc._bassFilter = svc._audioCtx.createBiquadFilter();
    svc._bassFilter.type = "lowshelf";
    svc._bassFilter.frequency.value = 200;
    svc._midFilter = svc._audioCtx.createBiquadFilter();
    svc._midFilter.type = "peaking";
    svc._midFilter.frequency.value = 1000;
    svc._midFilter.Q.value = 1.5;
    svc._trebleFilter = svc._audioCtx.createBiquadFilter();
    svc._trebleFilter.type = "highshelf";
    svc._trebleFilter.frequency.value = 3500;
    src.connect(svc._bassFilter);
    svc._bassFilter.connect(svc._midFilter);
    svc._midFilter.connect(svc._trebleFilter);
    svc._trebleFilter.connect(svc._audioCtx.destination);
    svc._eqConnected = true;
    applyEqGains(svc);
  } catch (e) {
    devLog("warn", "EQ init failed:", e);
  }
}

export function applyEqGains(svc) {
  const p = EQ_PRESETS[svc.eqPreset] || EQ_PRESETS.flat;
  if (svc._bassFilter) svc._bassFilter.gain.value = p.bass;
  if (svc._midFilter) svc._midFilter.gain.value = p.mid;
  if (svc._trebleFilter) svc._trebleFilter.gain.value = p.treble;
}

export function applyEqPreset(svc, preset) {
  svc.eqPreset = preset;
  // Flat playback must stay on the native media path; routing it through
  // Web Audio unnecessarily makes it subject to background suspension.
  if (preset === "flat" && !svc._eqConnected) return;
  preparePlaybackSession(svc._audioCtx);
  ensureAudioCtx(svc);
  if (svc._eqConnected) applyEqGains(svc);
}
