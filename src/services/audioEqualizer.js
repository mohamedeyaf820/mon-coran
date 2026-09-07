/**
 * Web Audio API Equalizer manager for AudioService.
 * Lazy initialisation upon first user activation to preserve resources.
 */

const EQ_PRESETS = {
  flat: { bass: 0, mid: 0, treble: 0 },
  bass: { bass: 8, mid: 0, treble: -2 },
  treble: { bass: -2, mid: 0, treble: 6 },
  near: { bass: 2, mid: 5, treble: 2 },
  hall: { bass: -3, mid: -2, treble: 3 },
  vocals: { bass: -4, mid: 7, treble: 3 },
};

export class AudioEqualizer {
  constructor() {
    this.audioCtx = null;
    this.isConnected = false;
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
    this.currentPreset = "flat";
  }

  preparePlaybackSession() {
    try {
      if (typeof navigator !== "undefined" && navigator.audioSession) {
        navigator.audioSession.type = "playback";
      }
      if (this.audioCtx?.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      /* Optional on browsers without Audio Session support. */
    }
  }

  ensureAudioContext(audioElement) {
    if (this.isConnected || !audioElement || typeof window === "undefined") return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.audioCtx = new AC();
      const src = this.audioCtx.createMediaElementSource(audioElement);

      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 200;

      this.midFilter = this.audioCtx.createBiquadFilter();
      this.midFilter.type = "peaking";
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1.5;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = "highshelf";
      this.trebleFilter.frequency.value = 3500;

      src.connect(this.bassFilter);
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.audioCtx.destination);

      this.isConnected = true;
      this.applyGains();
    } catch (e) {
      if (import.meta.env?.DEV && typeof console !== "undefined") {
        console.warn?.("EQ init failed:", e);
      }
    }
  }

  applyGains() {
    const p = EQ_PRESETS[this.currentPreset] || EQ_PRESETS.flat;
    if (this.bassFilter) this.bassFilter.gain.value = p.bass;
    if (this.midFilter) this.midFilter.gain.value = p.mid;
    if (this.trebleFilter) this.trebleFilter.gain.value = p.treble;
  }

  applyPreset(preset, audioElement) {
    this.currentPreset = preset;
    if (preset === "flat" && !this.isConnected) return;
    this.ensureAudioContext(audioElement);
    if (this.isConnected) this.applyGains();
  }

  destroy() {
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    this.audioCtx = null;
    this.isConnected = false;
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
  }
}
