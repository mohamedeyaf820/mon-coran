import { loadAudioUrl, isTrustedAudioUrl } from "./audioTrackLoader.js";
/**
 * Audio service – manages Quran playback, playlists and resilient fallbacks.
 * Wraps HTML5 Audio API with retry logic, preloading, and timeout handling.
 */

import { recordPerformanceMetric } from "./performanceMetrics.js";
import { getAdaptiveAudioPreloadCount } from "../utils/networkPolicy.js";
import {
  getSurahStreamProgressForAyah,
  resolveSurahStreamAyah,
} from "../utils/surahStreamSync.js";


function devLog(method, ...args) {
  if (import.meta.env?.DEV && typeof console !== "undefined") {
    console[method]?.(...args);
  }
}

import {
  isSurahStreamCdn,
  normalizePlaylistAyahs,
  buildAudioUrl,
  buildAudioUrlCandidates,
  withQuranComPrimary,
  buildPlaylistSignature,
  buildLatencyKey,
} from "./audioPlaylistManager.js";

class AudioService {
  static isSurahStreamCdn(cdnType = "islamic") {
    return isSurahStreamCdn(cdnType);
  }

  static normalizePlaylistAyahs(ayahs, cdnType = "islamic") {
    return normalizePlaylistAyahs(ayahs, cdnType);
  }

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "metadata"; // Keep startup light while enabling faster first play
    this.audio.playsInline = true;
    if (typeof this.audio.setAttribute === "function") {
      this.audio.setAttribute("playsinline", "");
      this.audio.setAttribute("webkit-playsinline", "");
    }
    // NOTE: Do NOT set crossOrigin — EveryAyah.com and some CDNs
    // don't support CORS, which causes audio to fail silently.
    this.currentAyah = null;
    this.playlist = []; // array of { surah, ayah, url }
    this._playlistSourceAyahs = [];
    this.playlistIndex = -1;
    this.isPlaying = false;
    this._loadTimeout = null;
    this._cancelPendingLoad = null;
    this._preloadAudio = null; // For preloading next track
    this._preloadPool = []; // [{ url, audio }]
    this._maxPreloadPool = getAdaptiveAudioPreloadCount();
    this._loadRequestId = 0; // Used to ignore stale retry attempts
    this._playbackRequestId = 0;
    this._reciterSwitchRequestId = 0;
    this._reciterSwitchQueue = Promise.resolve();
    this._currentReciterCdn = "";
    this._currentCdnType = "islamic";
    this._activeReciterKey = "islamic:";
    this._playlistSignature = "";
    this._playlistIndexByAyahKey = new Map();
    this._pendingSurahStreamAyah = null;
    this._playRequestedAt = 0;
    this._hasCapturedLatency = false;
    this._reciterLatencyByKey = Object.create(null);
    this._latencyListeners = [];
    this._oneShotMode = false;

    // Surah/playlist repeat
    // 1 => no repeat, N => replay full playlist N times, 0 => infinite.
    this.surahRepeatCount = 1;
    this.surahCurrentCycle = 1;

    // A-B Repeat
    this.abRepeatStart = -1;
    this.abRepeatEnd = -1;

    // Tartil progressive mode (auto-speed based on ayah complexity)
    this.tartilMode = false;


    // Callbacks
    this.onPlay = null;
    this.onPause = null;
    this.onAyahChange = null;
    this.onEnd = null;
    this.onTimeUpdate = null;
    this.onError = null;
    this.onNetworkState = null;

    // Extra listeners used by the player UI and verse synchronization.
    this._playListeners = [];
    this._timeUpdateListeners = [];
    this._endListeners = [];
    this._pauseListeners = [];
    this._ayahChangeListeners = [];
    this._rafId = null; // RAF guard — caps UI updates at display refresh rate

    // Wire up native events (store bound refs for cleanup)
    this._boundEnded = () => this._handleEnded();
    this._boundTimeUpdate = () => {
      // Native timeupdate continues while animation frames are suspended.
      // Synchronization and lock-screen subscribers must not depend on RAF.
        this._syncSurahStreamAyah(
          this.audio.currentTime,
          this.audio.duration,
        );
        this.onTimeUpdate?.(this.audio.currentTime, this.audio.duration);
        this._captureLatencySample(this.audio.currentTime);
        for (const fn of this._timeUpdateListeners) {
          fn(this.audio.currentTime, this.audio.duration);
        }
    };
    this._boundError = (e) => {
      // Ignore errors from clearing src
      if (!this.audio.src || this.audio.src === window.location.href) return;
      if (this._cancelPendingLoad) return; // The loader owns retries/fallbacks.
      devLog("error", "Audio error:", e);
      this.onError?.(e);
    };
    this.audio.addEventListener("ended", this._boundEnded);
    this.audio.addEventListener("timeupdate", this._boundTimeUpdate);
    this.audio.addEventListener("error", this._boundError);
    this._boundWaiting = () => this.onNetworkState?.("buffering");
    this._boundStalled = () => this.onNetworkState?.("stalled");
    this._boundCanPlay = () => this.onNetworkState?.("ready");
    this._boundPlaying = () => {
      this.onNetworkState?.("playing");
      if (!this.isPlaying) {
        this.isPlaying = true;
        this._notifyPlay(this.currentAyah);
      }
    };
    this._boundPause = () => {
      if (this.audio.ended || this._cancelPendingLoad || !this.isPlaying) return;
      this.isPlaying = false;
      this._notifyPause(this.currentAyah);
    };
    this.audio.addEventListener("waiting", this._boundWaiting);
    this.audio.addEventListener("stalled", this._boundStalled);
    this.audio.addEventListener("canplay", this._boundCanPlay);
    this.audio.addEventListener("playing", this._boundPlaying);
    this.audio.addEventListener("pause", this._boundPause);

    // Android PWA playback: when the screen locks Chrome may suspend the page
    // and reject the current play promise. Keep the user's intent and resume
    // as soon as the page is visible again instead of silently stopping.
    this._boundVisibilityChange = () => {
      if (!document.hidden && this.isPlaying && this.audio?.paused) {
        this.resume().catch(() => {});
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this._boundVisibilityChange);
    }
  }

  /* ── Build Audio URL ───────────────────────── */

  /**
   * Build a playable audio URL.
   */
  static buildUrl(reciterCdn, ayah, cdnType = "islamic") {
    return buildAudioUrl(reciterCdn, ayah, cdnType);
  }

  static buildUrlCandidates(reciterCdn, ayah, cdnType = "islamic") {
    return buildAudioUrlCandidates(reciterCdn, ayah, cdnType);
  }

  static withQuranComPrimary(candidates, timing) {
    return withQuranComPrimary(candidates, timing);
  }

  static buildPlaylistSignature(ayahs, reciterCdn, cdnType = "islamic") {
    return buildPlaylistSignature(ayahs, reciterCdn, cdnType);
  }

  static buildLatencyKey(reciterCdn, cdnType = "islamic") {
    return buildLatencyKey(reciterCdn, cdnType);
  }

  /* ── Playlist Management ───────────────────── */

  loadPlaylist(ayahs, reciterCdn, cdnType = "islamic") {
    this._playlistSourceAyahs = Array.isArray(ayahs)
      ? ayahs.map((ayah) => ({ ...ayah }))
      : [];
    const preparedAyahs = AudioService.normalizePlaylistAyahs(ayahs, cdnType);
    const nextSignature = AudioService.buildPlaylistSignature(
      preparedAyahs,
      reciterCdn,
      cdnType,
    );
    if (nextSignature === this._playlistSignature && this.playlist.length > 0) {
      let hasTextUpdates = false;
      let hasTimingUpdates = false;
      this.playlist = this.playlist.map((item, index) => {
        const nextText = preparedAyahs?.[index]?.text;
        const nextTiming = preparedAyahs?.[index]?.quranComAudioTiming || null;
        let nextItem = item;
        if (nextText && nextText !== item.text) {
          hasTextUpdates = true;
          nextItem = { ...nextItem, text: nextText };
        }
        if (nextTiming && nextTiming !== item.quranComAudioTiming) {
          const nextUrls = AudioService.withQuranComPrimary(item.urls || [item.url], nextTiming);
          hasTimingUpdates = true;
          nextItem = {
            ...nextItem,
            quranComAudioTiming: nextTiming,
            urls: nextUrls,
            url: nextUrls[0] || item.url,
            segments: Array.isArray(nextTiming.segments) ? nextTiming.segments : item.segments,
          };
        }
        return nextItem;
      });

      if ((hasTextUpdates || hasTimingUpdates) && this.playlistIndex >= 0) {
        this.currentAyah = this.playlist[this.playlistIndex] || this.currentAyah;
      }
      return;
    }

    // New playlist loaded: restart cycle tracking.
    this.surahCurrentCycle = 1;

    const previousCurrent = this.currentAyah;
    const wasPlaying = this.isPlaying;
    const previousSrc = this.audio.src;
    this._playlistSignature = nextSignature;
    this._currentReciterCdn = reciterCdn || "";
    this._currentCdnType = cdnType || "islamic";
    this._activeReciterKey = AudioService.buildLatencyKey(
      this._currentReciterCdn,
      this._currentCdnType,
    );

    this.playlist = preparedAyahs.map((a) => {
      const timing = a.quranComAudioTiming || null;
      const urlCandidates = AudioService.withQuranComPrimary(
        AudioService.buildUrlCandidates(
        reciterCdn,
        {
          surah: a.surah || a.surahNumber,
          numberInSurah: a.ayah || a.numberInSurah,
          number: a.number,
        },
        cdnType,
        ),
        timing,
      );
      return {
        surah: a.surah || a.surahNumber,
        ayah: AudioService.isSurahStreamCdn(cdnType)
          ? null
          : a.ayah || a.numberInSurah,
        globalNumber: a.number,
        urls: urlCandidates,
        url: urlCandidates[0],
        text: a.text,
        quranComAudioTiming: timing,
        segments: Array.isArray(timing?.segments)
          ? timing.segments
          : [],
      };
    });
    this._playlistIndexByAyahKey = new Map();
    this.playlist.forEach((item, index) => {
      const ayahKey = `${item.surah}:${item.ayah ?? "surah"}`;
      if (!this._playlistIndexByAyahKey.has(ayahKey)) {
        this._playlistIndexByAyahKey.set(ayahKey, index);
      }
    });

    // Preserve current position if the same ayah still exists in the new playlist
    const preservedIndex = previousCurrent
      ? this.playlist.findIndex(
          (p) =>
            p.surah === previousCurrent.surah &&
            (AudioService.isSurahStreamCdn(cdnType)
              ? true
              : p.ayah === previousCurrent.ayah),
        )
      : -1;

    this.playlistIndex = preservedIndex >= 0 ? preservedIndex : -1;
    if (preservedIndex >= 0) {
      this.currentAyah = this.playlist[preservedIndex];
    }

    // Keep reading pages quiet: preloading begins once playback starts.
    if (wasPlaying && this.playlist.length > 0) {
      const preloadIndex = preservedIndex >= 0 ? preservedIndex : 0;
      this._preloadAhead(preloadIndex, 3);
    }

    // If we were playing and the reciter/URL changed for the current ayah,
    // stop the stale audio and immediately restart with the new reciter's URL.
    if (wasPlaying && preservedIndex >= 0) {
      const newUrl = this.playlist[preservedIndex].url;
      if (previousSrc && previousSrc !== newUrl) {
        const savedTime = this.audio.currentTime;
        this._loadAndPlay(preservedIndex)
          .then(() => {
            // Seek back to the same position if it's meaningful and valid
            if (
              savedTime > 0 &&
              isFinite(this.audio.duration) &&
              savedTime < this.audio.duration
            ) {
              this.audio.currentTime = savedTime;
            }
          })
          .catch(() => {});
      }
    } else if (!wasPlaying && preservedIndex >= 0) {
      // Not playing but a current ayah is loaded — update currentAyah reference
      // so the next play() call uses the new reciter's URL immediately.
      this.currentAyah = this.playlist[preservedIndex];
      // Also clear the stale audio src so resume() doesn't replay the old URL.
      if (previousSrc && previousSrc !== this.playlist[preservedIndex].url) {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
      }
    }
  }

  /**
   * Instantly switch the active reciter for the current playlist while preserving
   * current ayah and playback position when possible.
   */
  switchReciter(reciterCdn, cdnType = "islamic") {
    const requestId = ++this._reciterSwitchRequestId;
    const runSwitch = async () => {
      // Collapse queued intermediate selections: only the latest request should
      // touch the shared playlist after the active switch completes.
      if (requestId !== this._reciterSwitchRequestId) return false;
      const switched = await this._switchReciterNow(reciterCdn, cdnType);
      return requestId === this._reciterSwitchRequestId ? switched : false;
    };

    const queuedSwitch = this._reciterSwitchQueue.then(runSwitch, runSwitch);
    // Keep the queue usable after a CDN failure while returning the real
    // rejection to the caller that initiated this switch.
    this._reciterSwitchQueue = queuedSwitch.catch(() => false);
    return queuedSwitch;
  }

  async _switchReciterNow(reciterCdn, cdnType = "islamic") {
    if (!reciterCdn) {
      return false;
    }
    // Selecting a voice before a playlist exists is still a valid UI action;
    // the next playlist load will use the reciter stored in app state.
    if (!Array.isArray(this.playlist) || this.playlist.length === 0) return true;

    const snapshotAyah = this.currentAyah;
    const snapshotTime = this.currentTime || 0;
    const wasPlaying = this.isPlaying;
    const previousCdnType = this._currentCdnType;

    const sourceAyahs =
      Array.isArray(this._playlistSourceAyahs) && this._playlistSourceAyahs.length > 0
        ? this._playlistSourceAyahs.map((ayah) => ({
            ...ayah,
            // Quran.com timing URLs belong to the previously selected reciter.
            // Reusing them here can briefly (or permanently, when the next
            // reciter has no timing mapping) keep playing the old voice.
            quranComAudioTiming: null,
          }))
        : this.playlist.map((item) => ({
            surah: item.surah,
            ayah: item.ayah,
            number: item.globalNumber,
            text: item.text,
            quranComAudioTiming: null,
          }));

    this.loadPlaylist(sourceAyahs, reciterCdn, cdnType);

    if (!snapshotAyah) {
      if (wasPlaying) {
        await this.play();
      }
      return true;
    }

    const targetIndex = this.playlist.findIndex(
      (item) => item.surah === snapshotAyah.surah && item.ayah === snapshotAyah.ayah,
    );
    const fallbackSurahIndex =
      targetIndex >= 0 || !AudioService.isSurahStreamCdn(cdnType)
        ? targetIndex
        : this.playlist.findIndex((item) => item.surah === snapshotAyah.surah);
    const resolvedTargetIndex = fallbackSurahIndex;
    if (resolvedTargetIndex < 0) {
      if (wasPlaying) {
        await this.play();
      }
      return true;
    }

    this.playlistIndex = resolvedTargetIndex;
    this.currentAyah = this.playlist[resolvedTargetIndex];

    if (!wasPlaying) return true;

    await this._loadAndPlay(resolvedTargetIndex, { throwOnError: true });
    if (
      !AudioService.isSurahStreamCdn(previousCdnType) &&
      !AudioService.isSurahStreamCdn(cdnType) &&
      snapshotTime > 0 &&
      Number.isFinite(this.audio.duration) &&
      snapshotTime < this.audio.duration - 0.2
    ) {
      this.audio.currentTime = snapshotTime;
    }
    return true;
  }

  /* ── Playback Controls ─────────────────────── */

  async play() {
    if (this.playlist.length === 0) return;

    if (this.playlistIndex < 0) {
      this.playlistIndex = 0;
    }

    await this._loadAndPlay(this.playlistIndex);
  }

  pause() {
    this._playbackRequestId++;
    this._cancelPendingLoad?.();
    this.isPlaying = false;
    this.audio.pause();
    this._notifyPause(this.currentAyah);
  }

  resume() {
    this._preparePlaybackSession();
    if (!this.audio.src || this.audio.src === window.location.href) return this.play();
    const requestId = ++this._playbackRequestId;
    if (this.audio.src && this.audio.src !== window.location.href) {
      return this.audio.play()
        .then(() => {
          if (requestId !== this._playbackRequestId) return;
          this.isPlaying = true;
          this._notifyPlay(
            this.currentAyah || this.playlist[this.playlistIndex],
          );
        })
        .catch((err) => {
          if (requestId !== this._playbackRequestId) return;
          this.isPlaying = false;
          this._notifyPause(this.currentAyah);
          if (err?.name !== "NotAllowedError") {
            this.isPlaying = false;
            this.onError?.(err);
          }
        });
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else if (
      this.audio.src &&
      this.audio.src !== window.location.href &&
      this.audio.paused
    ) {
      this.resume();
    } else {
      this.play();
    }
  }

  stop() {
    const wasPlaying = this.isPlaying;
    this._playbackRequestId++;
    this.isPlaying = false;
    this._cancelPendingLoad?.();
    this._loadRequestId++;
    this._clearLoadTimeout();
    if (this.memTimer) {
      clearTimeout(this.memTimer);
      this.memTimer = null;
    }
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.removeAttribute("src");
    this.audio.load(); // Reset without triggering error
    for (const pre of this._preloadPool) {
      pre.audio?.removeAttribute("src");
      pre.audio?.load();
    }
    this._preloadPool = [];
    this.isPlaying = false;
    this.playlist = [];
    this.playlistIndex = -1;
    this._playlistSignature = "";
    this._playlistIndexByAyahKey.clear();
    this._playlistSourceAyahs = [];
    this._pendingSurahStreamAyah = null;
    this.memCurrentRepeat = 0;
    this.surahCurrentCycle = 1;
    if (wasPlaying) this._notifyPause(this.currentAyah);
    this.onEnd?.();
  }

  next() {
    if (this.playlistIndex < this.playlist.length - 1) {
      this._loadAndPlay(this.playlistIndex + 1);
    } else {
      const repeatInfinitely = this.surahRepeatCount === 0;
      const hasMoreCycles = repeatInfinitely || this.surahCurrentCycle < this.surahRepeatCount;
      if (this.playlist.length > 0 && hasMoreCycles) {
        if (!repeatInfinitely) this.surahCurrentCycle += 1;
        this._loadAndPlay(0);
      } else {
        this.surahCurrentCycle = 1;
        this.stop();
      }
    }
  }

  prev() {
    if (this.playlistIndex > 0) {
      this._loadAndPlay(this.playlistIndex - 1);
    } else if (this.playlist.length > 0) {
      this._loadAndPlay(0);
    }
  }

  /**
   * Durations (seconds) of the playlist items when the audio source provides
   * them (Quran.com timings). Unknown items are null.
   */
  getPlaylistDurations() {
    return this.playlist.map((item) => {
      const seconds = Number(item?.quranComAudioTiming?.durationSec);
      return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
    });
  }

  /**
   * Jump to a playlist item and continue at an offset inside it (seconds).
   */
  async playIndexAt(index, offsetSec = 0) {
    if (index < 0 || index >= this.playlist.length) return;
    await this._loadAndPlay(index);
    if (offsetSec > 0) this.seek(offsetSec);
  }

  /**
   * Jump to a specific ayah in the playlist
   */
  playAyah(surah, ayah) {
    let idx = this._playlistIndexByAyahKey.get(`${surah}:${ayah}`) ?? -1;
    if (idx < 0 && AudioService.isSurahStreamCdn(this._currentCdnType)) {
      idx = this._playlistIndexByAyahKey.get(`${surah}:surah`) ?? -1;
      if (idx >= 0) {
        this._pendingSurahStreamAyah = {
          surah: Number(surah),
          ayah: Number(ayah),
        };
      }
    }
    if (idx >= 0) {
      this._loadAndPlay(idx);
    }
  }

  /**
   * Play a single ayah by URL (one-shot) with retry
   */
  async playSingle(url, meta = {}) {
    try {
      this._oneShotMode = true;
      this.onNetworkState?.("loading");
      await this._loadUrlWithRetry(url);
      if (this.audio.paused) {
        this.isPlaying = false;
        this.onNetworkState?.("error");
        return false;
      }
      this.isPlaying = true;
      this.onNetworkState?.("playing");
      this._notifyPlay({ url, ...meta });
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return false;
      this.onNetworkState?.("error");
      this.onError?.(err);
      return false;
    }
  }

  /* ── Speed ─────────────────────────────────── */

  setSpeed(rate) {
    this.audio.playbackRate = rate;
  }

  /* ── Volume ────────────────────────────────── */

  setVolume(vol) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume() {
    return this.audio.volume;
  }

  /* ── Seek ──────────────────────────────────── */

  seek(time) {
    if (this.audio.duration) {
      this.audio.currentTime = time;
    }
  }

  seekPercent(pct) {
    if (this.audio.duration) {
      this.audio.currentTime = this.audio.duration * pct;
    }
  }

  /* ── Playlist repeat ───────────────────────── */

  setSurahRepeatCount(count = 1) {
    const parsed = Number(count);
    if (!Number.isFinite(parsed)) {
      this.surahRepeatCount = 1;
      return;
    }

    const intValue = Math.floor(parsed);
    // 0 => infinite, otherwise clamp to a sane max.
    if (intValue <= 0) {
      this.surahRepeatCount = 0;
      return;
    }

    this.surahRepeatCount = Math.max(1, Math.min(999, intValue));
  }

  /* ── Internal: Load with retry + timeout ───── */

  _clearLoadTimeout() {
    if (this._loadTimeout) {
      clearTimeout(this._loadTimeout);
      this._loadTimeout = null;
    }
  }

  _captureLatencySample(currentTime = 0) {
    if (this._hasCapturedLatency) return;
    if (!this._playRequestedAt) return;
    if (!Number.isFinite(currentTime) || currentTime < 0.05) return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsedSec = (now - this._playRequestedAt) / 1000;
    const latencySec = elapsedSec - currentTime;
    if (!Number.isFinite(latencySec) || latencySec < -0.2 || latencySec > 1.0) {
      return;
    }

    const key = this._activeReciterKey || "islamic:";
    const prev = this._reciterLatencyByKey[key];
    const next =
      Number.isFinite(prev) ? prev * 0.75 + latencySec * 0.25 : latencySec;
    this._reciterLatencyByKey[key] = Number(next.toFixed(4));
    recordPerformanceMetric("audio_start_ms", Math.max(0, latencySec * 1000));
    this._notifyLatencyListeners();
    this._hasCapturedLatency = true;
  }

  _notifyLatencyListeners() {
    const snapshot = this.getLatencySnapshot();
    for (const fn of this._latencyListeners) {
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
  getReciterTimingBiasSec() {
    const key = this._activeReciterKey || "islamic:";
    const measured = this._reciterLatencyByKey[key];
    const measuredBias = Number.isFinite(measured) ? measured * 0.52 : 0;
    const cdnBias =
      this._currentCdnType === "everyayah"
        ? 0.025
        : this._currentCdnType === "mp3quran-surah"
          ? 0.04
          : 0;
    return Math.max(-0.04, Math.min(0.16, measuredBias + cdnBias));
  }

  /**
   * Load a URL into the audio element and start playing.
   * Waits for 'canplay' before calling play(). Retries on failure.
   */
  _loadUrlWithRetry(url, retries) {
    return loadAudioUrl(this, url, retries);
  }

  /**
   * Preload the next track in background using a separate Audio element.
   */
  _preloadTrack(url) {
    if (!url) return;
    if (!isTrustedAudioUrl(url)) return;
    if (this._preloadPool.some((p) => p.url === url)) return;

    try {
      const preloadAudio = new Audio();
      preloadAudio.preload = "auto";
      preloadAudio.src = url;
      preloadAudio.load();

      this._preloadAudio = preloadAudio;
      this._preloadPool.push({ url, audio: preloadAudio });

      while (this._preloadPool.length > this._maxPreloadPool) {
        const oldest = this._preloadPool.shift();
        if (oldest?.audio) {
          oldest.audio.removeAttribute("src");
          oldest.audio.load();
        }
      }
    } catch {
      // Preload is best-effort
    }
  }

  _preloadAhead(startIndex, count = 2) {
    if (!Array.isArray(this.playlist) || this.playlist.length === 0) return;
    const adaptiveCount = Math.min(count, getAdaptiveAudioPreloadCount());
    this._maxPreloadPool = adaptiveCount;
    if (adaptiveCount === 0) {
      for (const item of this._preloadPool) {
        item.audio?.removeAttribute("src");
        item.audio?.load?.();
      }
      this._preloadPool = [];
      this._preloadAudio = null;
      return;
    }
    for (let i = 0; i < adaptiveCount; i++) {
      const idx = startIndex + i;
      if (idx >= 0 && idx < this.playlist.length) {
        this._preloadTrack(this.playlist[idx].url);
      }
    }
  }

  loadAndPlay(index) { return this._loadAndPlay(index); }

  // Resolve the next reading scope without waiting for a React render. A pause,
  // stop, reciter switch or explicit playlist change cancels the pending handoff.
  async continuePlaylist(loadNext, reciterCdn, cdnType = "islamic") {
    const requestId = ++this._playbackRequestId;
    const reciterRequestId = this._reciterSwitchRequestId;
    const previousSignature = this._playlistSignature;
    const ayahs = await loadNext();
    if (requestId !== this._playbackRequestId || reciterRequestId !== this._reciterSwitchRequestId || this._playlistSignature !== previousSignature) return false;
    if (!ayahs?.length) return false;
    this.loadPlaylist(ayahs, reciterCdn, cdnType);
    const signature = this._playlistSignature;
    const playback = this.play();
    const playbackRequestId = this._playbackRequestId;
    await playback;
    return playbackRequestId === this._playbackRequestId &&
      reciterRequestId === this._reciterSwitchRequestId &&
      signature === this._playlistSignature && this.isPlaying;
  }

  async _loadAndPlay(index, { throwOnError = false } = {}) {
    if (index < 0 || index >= this.playlist.length) return;
    const playbackRequestId = ++this._playbackRequestId;
    this._preparePlaybackSession();

    this.playlistIndex = index;
    const item = this.playlist[index];
    this.currentAyah = item;
    this.memCurrentRepeat = 0;

    // Apply tartil progressive speed
    if (this.tartilMode) {
      const speed = this._tartilSpeed(item);
      if (speed) this.audio.playbackRate = speed;
    }

    this._playRequestedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    this._hasCapturedLatency = false;

    try {
      this.onNetworkState?.("loading");
      const candidateUrls = Array.isArray(item.urls) && item.urls.length > 0 ? item.urls : [item.url];
      let loadedUrl = null;
      let lastErr = null;
      for (const urlCandidate of candidateUrls) {
        try {
          await this._loadUrlWithRetry(urlCandidate);
          if (playbackRequestId !== this._playbackRequestId) return;
          loadedUrl = urlCandidate;
          break;
        } catch (err) {
          if (err?.name === "AbortError" || err?.name === "NotAllowedError") throw err;
          lastErr = err;
        }
      }
      if (!loadedUrl) {
        throw lastErr || new Error("Audio load failed for all URL candidates");
      }
      item.url = loadedUrl;
      let activeItem = item;
      if (AudioService.isSurahStreamCdn(this._currentCdnType)) {
        const pending =
          this._pendingSurahStreamAyah?.surah === Number(item.surah)
            ? this._pendingSurahStreamAyah
            : null;
        if (
          pending &&
          Number.isFinite(this.audio.duration) &&
          this.audio.duration > 0
        ) {
          const progress = getSurahStreamProgressForAyah(
            this._playlistSourceAyahs,
            item.surah,
            pending.ayah,
          );
          this.audio.currentTime = progress * this.audio.duration;
        }
        activeItem = resolveSurahStreamAyah(
          this._playlistSourceAyahs,
          item,
          this.audio.currentTime,
          this.audio.duration,
          pending?.ayah,
        );
        this._pendingSurahStreamAyah = null;
      }
      this.currentAyah = activeItem;
      this.isPlaying = true;
      this.onNetworkState?.("playing");
      this._notifyPlay(activeItem);
      this._emitAyahChange(activeItem);

      // Preload next tracks (3 ahead for smoother continuous playback)
      this._preloadAhead(index + 1, 3);
    } catch (err) {
      if (playbackRequestId !== this._playbackRequestId) return;
      if (err?.name === "AbortError") return;
      if (err?.name === "NotAllowedError") {
        this.isPlaying = false;
        this.onNetworkState?.("paused");
        this._notifyPause(this.currentAyah);
        return;
      }
      devLog("error", "Audio play error:", err);
      this.onNetworkState?.("error");
      this.onError?.(err);
      // Keep current ayah on error (don't skip ahead and desync highlighting)
      this.isPlaying = false;
      if (throwOnError) {
        throw err;
      }
    }
  }

  _handleEnded() {
    if (this.playlist.length === 0) return;
    if (this._oneShotMode) {
      this._oneShotMode = false;
      this.isPlaying = false;
      this.onEnd?.();
      for (const fn of this._endListeners) fn();
      return;
    }

    // A-B Repeat: if we've reached end point B, loop back to A
    if (this.abRepeatStart >= 0 && this.abRepeatEnd >= 0) {
      if (this.playlistIndex >= this.abRepeatEnd) {
        this._loadAndPlay(this.abRepeatStart);
        return;
      }
    }

    // Normal mode: advance playlist
    if (this.playlistIndex < this.playlist.length - 1) {
      this._loadAndPlay(this.playlistIndex + 1);
    } else {
      const repeatInfinitely = this.surahRepeatCount === 0;
      const hasMoreCycles =
        repeatInfinitely || this.surahCurrentCycle < this.surahRepeatCount;

      if (this.playlist.length > 0 && hasMoreCycles) {
        if (!repeatInfinitely) {
          this.surahCurrentCycle += 1;
        }
        this._loadAndPlay(0);
        return;
      }

      this.surahCurrentCycle = 1;
      this.isPlaying = false;
      this.onEnd?.();
      for (const fn of this._endListeners) fn();
    }
  }

  /* ── Getters ───────────────────────────────── */

  get currentTime() {
    return this.audio?.currentTime ?? 0;
  }
  get duration() {
    return this.audio?.duration || 0;
  }
  get playbackRate() {
    return this.audio?.playbackRate || 1;
  }
  get progress() {
    return this.duration ? this.currentTime / this.duration : 0;
  }
  get currentIndex() {
    return this.playlistIndex;
  }
  get totalInPlaylist() {
    return this.playlist.length;
  }

  _notifyPlay(item) {
    this.onPlay?.(item);
    for (const fn of this._playListeners) {
      try {
        fn(item);
      } catch (error) {
        devLog("warn", "Play listener error:", error);
      }
    }
  }

  _emitAyahChange(item) {
    this.onAyahChange?.(item);
    for (const fn of this._ayahChangeListeners) {
      try {
        fn(item);
      } catch (error) {
        devLog("warn", "Ayah change listener error:", error);
      }
    }
  }

  _syncSurahStreamAyah(currentTime, duration) {
    if (
      !this.isPlaying ||
      !AudioService.isSurahStreamCdn(this._currentCdnType) ||
      this.playlistIndex < 0
    ) {
      return;
    }
    const streamItem = this.playlist[this.playlistIndex];
    const activeItem = resolveSurahStreamAyah(
      this._playlistSourceAyahs,
      streamItem,
      currentTime,
      duration,
    );
    if (
      !activeItem?.ayah ||
      (this.currentAyah?.surah === activeItem.surah &&
        this.currentAyah?.ayah === activeItem.ayah)
    ) {
      return;
    }
    this.currentAyah = activeItem;
    this._emitAyahChange(activeItem);
  }

  _notifyPause(item) {
    this.onPause?.();
    for (const fn of this._pauseListeners) {
      try {
        fn(item);
      } catch (error) {
        devLog("warn", "Pause listener error:", error);
      }
    }
  }

  /** Subscribe to playback-start events without replacing the main UI callback. */
  addPlayListener(fn) {
    this._playListeners.push(fn);
    return () => {
      const i = this._playListeners.indexOf(fn);
      if (i !== -1) this._playListeners.splice(i, 1);
    };
  }

  /** Subscribe an extra time-update listener. Returns unsubscribe fn. */
  addTimeUpdateListener(fn) {
    this._timeUpdateListeners.push(fn);
    return () => {
      const i = this._timeUpdateListeners.indexOf(fn);
      if (i !== -1) this._timeUpdateListeners.splice(i, 1);
    };
  }

  /** Subscribe to playlist-end events. Returns unsubscribe fn. */
  addEndListener(fn) {
    this._endListeners.push(fn);
    return () => {
      const i = this._endListeners.indexOf(fn);
      if (i !== -1) this._endListeners.splice(i, 1);
    };
  }

  /** Subscribe to pause events without replacing the main UI callback. */
  addPauseListener(fn) {
    this._pauseListeners.push(fn);
    return () => {
      const i = this._pauseListeners.indexOf(fn);
      if (i !== -1) this._pauseListeners.splice(i, 1);
    };
  }

  /** Subscribe to ayah-change events. Returns unsubscribe fn. */
  addAyahChangeListener(fn) {
    this._ayahChangeListeners.push(fn);
    return () => {
      const i = this._ayahChangeListeners.indexOf(fn);
      if (i !== -1) this._ayahChangeListeners.splice(i, 1);
    };
  }

  subscribeLatency(fn) {
    if (typeof fn !== "function") return () => {};
    this._latencyListeners.push(fn);
    return () => {
      const i = this._latencyListeners.indexOf(fn);
      if (i !== -1) this._latencyListeners.splice(i, 1);
    };
  }

  setLatencySnapshot(snapshot = {}) {
    const safeEntries = Object.entries(snapshot).filter(([key, value]) => {
      return (
        typeof key === "string" &&
        key.length <= 120 &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 5
      );
    });
    this._reciterLatencyByKey = Object.fromEntries(
      safeEntries.map(([key, value]) => [key, Number(Number(value).toFixed(4))]),
    );
  }

  getLatencySnapshot() {
    return { ...this._reciterLatencyByKey };
  }

  getLatencyForKey(key) {
    const value = this._reciterLatencyByKey?.[key];
    return Number.isFinite(value) ? value : null;
  }

  /* ── A-B Repeat ─────────────────────────────────────────────── */
  setAbRepeat(startIdx, endIdx) {
    const s = Number(startIdx);
    const e = Number(endIdx);
    this.abRepeatStart = Number.isInteger(s) && s >= 0 ? s : -1;
    this.abRepeatEnd = Number.isInteger(e) && e >= 0 ? e : -1;
  }
  getAbRepeat() {
    return {
      start: this.abRepeatStart,
      end: this.abRepeatEnd,
      active:
        this.abRepeatStart >= 0 &&
        this.abRepeatEnd >= 0 &&
        this.abRepeatEnd >= this.abRepeatStart,
    };
  }
  clearAbRepeat() {
    this.abRepeatStart = -1;
    this.abRepeatEnd = -1;
  }

  /* ── Tartil Progressive ──────────────────────────────────────── */
  setTartilMode(enabled, userSpeed = 1) {
    this.tartilMode = enabled;
    if (!enabled && this.audio) this.audio.playbackRate = userSpeed;
  }
  _tartilSpeed(item) {
    if (!item) return null;
    const len = (item.text || "").length;
    if (len < 30) return 0.9;
    if (len < 60) return 0.78;
    if (len < 100) return 0.7;
    return 0.65;
  }

  _preparePlaybackSession() {
    try {
      if (typeof navigator !== "undefined" && navigator.audioSession) {
        navigator.audioSession.type = "playback";
      }
    } catch { /* Optional browser capability. Native audio remains usable. */ }
  }

  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._clearLoadTimeout();
    this.stop();

    if (this._preloadAudio) {
      this._preloadAudio.removeAttribute("src");
      this._preloadAudio = null;
    }
    this._preloadPool = [];
    if (this.audio) {
      this.audio.removeEventListener("ended", this._boundEnded);
      this.audio.removeEventListener("timeupdate", this._boundTimeUpdate);
      this.audio.removeEventListener("error", this._boundError);
      this.audio.removeEventListener("waiting", this._boundWaiting);
      this.audio.removeEventListener("stalled", this._boundStalled);
      this.audio.removeEventListener("canplay", this._boundCanPlay);
      this.audio.removeEventListener("playing", this._boundPlaying);
      this.audio.removeEventListener("pause", this._boundPause);
      this.audio.removeAttribute("src");
      this.audio = null;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this._boundVisibilityChange);
    }
  }
}

// Singleton
const audioService = new AudioService();
export { AudioService };
export default audioService;
