/**
 * Audio service – manages playback, word-by-word, memorization.
 * Wraps HTML5 Audio API with retry logic, preloading, and timeout handling.
 */

const AUDIO_LOAD_TIMEOUT = 12000; // 12s max to start loading
const MAX_RETRIES = 2;
const RETRY_DELAY = 800; // ms
const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;

function devLog(method, ...args) {
  if (import.meta.env.DEV && typeof console !== "undefined") {
    console[method]?.(...args);
  }
}

function isTrustedAudioUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname || "/";

    if (host === "cdn.islamic.network") {
      return path.startsWith("/quran/audio/") && /\.mp3$/i.test(path);
    }
    if (host === "everyayah.com" || host === "www.everyayah.com") {
      return path.startsWith("/data/") && /\.mp3$/i.test(path);
    }
    if (host === "download.quranicaudio.com") {
      return /\.mp3$/i.test(path);
    }
    if (TRUSTED_MP3QURAN_HOST.test(host)) {
      return /\.mp3$/i.test(path);
    }

    return false;
  } catch {
    return false;
  }
}

class AudioService {
  static isSurahStreamCdn(cdnType = "islamic") {
    return cdnType === "mp3quran-surah";
  }

  static normalizePlaylistAyahs(ayahs, cdnType = "islamic") {
    if (!Array.isArray(ayahs)) return [];
    if (!AudioService.isSurahStreamCdn(cdnType)) return ayahs;

    const seenSurahs = new Set();
    return ayahs.reduce((acc, ayah) => {
      const surah = ayah?.surah || ayah?.surahNumber;
      if (!surah || seenSurahs.has(surah)) return acc;
      seenSurahs.add(surah);
      acc.push({
        ...ayah,
        surah,
        ayah: null,
        numberInSurah: null,
      });
      return acc;
    }, []);
  }

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "metadata"; // Keep startup light while enabling faster first play
    // NOTE: Do NOT set crossOrigin — EveryAyah.com and some CDNs
    // don't support CORS, which causes audio to fail silently.
    this.currentAyah = null;
    this.playlist = []; // array of { surah, ayah, url }
    this._playlistSourceAyahs = [];
    this.playlistIndex = -1;
    this.isPlaying = false;
    this._loadTimeout = null;
    this._preloadAudio = null; // For preloading next track
    this._preloadPool = []; // [{ url, audio }]
    this._maxPreloadPool = 3;
    this._loadRequestId = 0; // Used to ignore stale retry attempts
    this._currentReciterCdn = "";
    this._currentCdnType = "islamic";
    this._activeReciterKey = "islamic:";
    this._playlistSignature = "";
    this._playRequestedAt = 0;
    this._hasCapturedLatency = false;
    this._reciterLatencyByKey = Object.create(null);
    this._latencyListeners = [];

    // Memorization mode
    this.memMode = false;
    this.memRepeatCount = 3;
    this.memCurrentRepeat = 0;
    this.memPauseDuration = 2000; // ms between repeats
    this.memTimer = null;

    // A-B Repeat
    this.abRepeatStart = -1;
    this.abRepeatEnd = -1;

    // Tartil progressive mode (auto-speed based on ayah complexity)
    this.tartilMode = false;

    // Equalizer (Web Audio API, lazy init on first user activation)
    this._audioCtx = null;
    this._eqConnected = false;
    this._bassFilter = null;
    this._midFilter = null;
    this._trebleFilter = null;
    this.eqPreset = "flat";

    // Callbacks
    this.onPlay = null;
    this.onPause = null;
    this.onAyahChange = null;
    this.onEnd = null;
    this.onTimeUpdate = null;
    this.onError = null;
    this.onNetworkState = null;

    // Extra listeners (for word-by-word tracking etc.)
    this._timeUpdateListeners = [];
    this._endListeners = [];
    this._ayahChangeListeners = [];

    // Wire up native events (store bound refs for cleanup)
    this._boundEnded = () => this._handleEnded();
    this._boundTimeUpdate = () => {
      this.onTimeUpdate?.(this.audio.currentTime, this.audio.duration);
      this._captureLatencySample(this.audio.currentTime);
      // Notify extra listeners
      for (const fn of this._timeUpdateListeners) {
        fn(this.audio.currentTime, this.audio.duration);
      }
    };
    this._boundError = (e) => {
      // Ignore errors from clearing src
      if (!this.audio.src || this.audio.src === window.location.href) return;
      devLog("error", "Audio error:", e);
      this.onError?.(e);
    };
    this.audio.addEventListener("ended", this._boundEnded);
    this.audio.addEventListener("timeupdate", this._boundTimeUpdate);
    this.audio.addEventListener("error", this._boundError);
    this._boundWaiting = () => this.onNetworkState?.("buffering");
    this._boundStalled = () => this.onNetworkState?.("stalled");
    this._boundCanPlay = () => this.onNetworkState?.("ready");
    this._boundPlaying = () => this.onNetworkState?.("playing");
    this.audio.addEventListener("waiting", this._boundWaiting);
    this.audio.addEventListener("stalled", this._boundStalled);
    this.audio.addEventListener("canplay", this._boundCanPlay);
    this.audio.addEventListener("playing", this._boundPlaying);
  }

  /* ── Build Audio URL ───────────────────────── */

  /**
   * Build a playable audio URL.
   */
  static buildUrl(reciterCdn, ayah, cdnType = "islamic") {
    if (AudioService.isSurahStreamCdn(cdnType)) {
      const surah = typeof ayah === "object" ? ayah.surah || ayah.surahNumber || 1 : 1;
      const s = String(surah).padStart(3, "0");
      return `${reciterCdn}${s}.mp3`;
    }
    if (cdnType === "everyayah") {
      const surah = typeof ayah === "object" ? ayah.surah : 1;
      const num =
        typeof ayah === "object" ? ayah.numberInSurah || ayah.ayah || 1 : ayah;
      const s = String(surah).padStart(3, "0");
      const a = String(num).padStart(3, "0");
      return `https://everyayah.com/data/${reciterCdn}/${s}${a}.mp3`;
    }
    // Islamic Network: global ayah number
    const globalNum = typeof ayah === "object" ? ayah.number : ayah;
    return `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalNum}.mp3`;
  }

  static buildUrlCandidates(reciterCdn, ayah, cdnType = "islamic") {
    const primary = AudioService.buildUrl(reciterCdn, ayah, cdnType);
    if (cdnType === "everyayah") {
      const mirror = primary.includes("://everyayah.com/")
        ? primary.replace("://everyayah.com/", "://www.everyayah.com/")
        : primary.replace("://www.everyayah.com/", "://everyayah.com/");
      return [...new Set([primary, mirror])];
    }
    if (!AudioService.isSurahStreamCdn(cdnType)) return [primary];

    const surah = typeof ayah === "object" ? ayah.surah || ayah.surahNumber || 1 : 1;
    const unpadded = `${reciterCdn}${Number(surah)}.mp3`;
    return [...new Set([primary, unpadded])];
  }

  static buildPlaylistSignature(ayahs, reciterCdn, cdnType = "islamic") {
    const base = `${cdnType}:${reciterCdn || ""}`;
    const preparedAyahs = AudioService.normalizePlaylistAyahs(ayahs, cdnType);
    if (!Array.isArray(preparedAyahs) || preparedAyahs.length === 0) return base;
    return `${base}|${preparedAyahs
      .map((ayah) => {
        const surah = ayah.surah || ayah.surahNumber || 0;
        const ayahNum = ayah.ayah || ayah.numberInSurah || 0;
        const globalNum = ayah.number || ayah.globalNumber || 0;
        return `${surah}:${ayahNum}:${globalNum}`;
      })
      .join("|")}`;
  }

  static buildLatencyKey(reciterCdn, cdnType = "islamic") {
    return `${cdnType || "islamic"}:${reciterCdn || ""}`;
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
      this.playlist = this.playlist.map((item, index) => {
        const nextText = preparedAyahs?.[index]?.text;
        if (nextText && nextText !== item.text) {
          hasTextUpdates = true;
          return { ...item, text: nextText };
        }
        return item;
      });

      if (hasTextUpdates && this.playlistIndex >= 0) {
        this.currentAyah = this.playlist[this.playlistIndex] || this.currentAyah;
      }
      return;
    }

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
      const urlCandidates = AudioService.buildUrlCandidates(
        reciterCdn,
        {
          surah: a.surah || a.surahNumber,
          numberInSurah: a.ayah || a.numberInSurah,
          number: a.number,
        },
        cdnType,
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
      };
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

    // Preload first relevant tracks immediately
    if (this.playlist.length > 0) {
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
  async switchReciter(reciterCdn, cdnType = "islamic") {
    if (!reciterCdn || !Array.isArray(this.playlist) || this.playlist.length === 0) {
      return;
    }

    const snapshotAyah = this.currentAyah;
    const snapshotTime = this.currentTime || 0;
    const wasPlaying = this.isPlaying;
    const previousCdnType = this._currentCdnType;

    const sourceAyahs =
      Array.isArray(this._playlistSourceAyahs) && this._playlistSourceAyahs.length > 0
        ? this._playlistSourceAyahs.map((ayah) => ({ ...ayah }))
        : this.playlist.map((item) => ({
            surah: item.surah,
            ayah: item.ayah,
            number: item.globalNumber,
            text: item.text,
          }));

    this.loadPlaylist(sourceAyahs, reciterCdn, cdnType);

    if (!snapshotAyah) {
      if (wasPlaying) {
        await this.play();
      }
      return;
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
      return;
    }

    this.playlistIndex = resolvedTargetIndex;
    this.currentAyah = this.playlist[resolvedTargetIndex];

    if (!wasPlaying) return;

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
    this.audio.pause();
    this.isPlaying = false;
    this.onPause?.();
  }

  resume() {
    if (this.audio.src && this.audio.src !== window.location.href) {
      this.audio.play().catch((err) => {
        if (err?.name !== "NotAllowedError") {
          this.isPlaying = false;
          this.onError?.(err);
        }
      });
      this.isPlaying = true;
      this.onPlay?.(this.playlist[this.playlistIndex]);
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
    this.playlistIndex = -1;
    this._playlistSignature = "";
    this._playlistSourceAyahs = [];
    this.memCurrentRepeat = 0;
    this.onEnd?.();
  }

  next() {
    if (this.playlistIndex < this.playlist.length - 1) {
      this._loadAndPlay(this.playlistIndex + 1);
    } else {
      this.stop();
    }
  }

  prev() {
    if (this.playlistIndex > 0) {
      this._loadAndPlay(this.playlistIndex - 1);
    }
  }

  /**
   * Jump to a specific ayah in the playlist
   */
  playAyah(surah, ayah) {
    let idx = this.playlist.findIndex(
      (p) => p.surah === surah && p.ayah === ayah,
    );
    if (idx < 0 && AudioService.isSurahStreamCdn(this._currentCdnType)) {
      idx = this.playlist.findIndex((p) => p.surah === surah);
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
      this.onNetworkState?.("loading");
      await this._loadUrlWithRetry(url);
      this.isPlaying = true;
      this.onNetworkState?.("playing");
      this.onPlay?.({ url, ...meta });
    } catch (err) {
      this.onNetworkState?.("error");
      this.onError?.(err);
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

  /* ── Memorization Mode ─────────────────────── */

  enableMemorization(repeatCount = 3, pauseMs = 2000) {
    this.memMode = true;
    this.memRepeatCount = repeatCount;
    this.memPauseDuration = pauseMs;
    this.memCurrentRepeat = 0;
  }

  disableMemorization() {
    this.memMode = false;
    this.memCurrentRepeat = 0;
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
  _loadUrlWithRetry(url, retries = MAX_RETRIES) {
    return new Promise((resolve, reject) => {
      if (!isTrustedAudioUrl(url)) {
        reject(new Error("Untrusted audio URL"));
        return;
      }

      const requestId = ++this._loadRequestId;
      this._clearLoadTimeout();

      if (this.audio.src === url && this.audio.readyState >= 2) {
        this.audio
          .play()
          .then(() => resolve())
          .catch((e) => {
            if (e?.name === "NotAllowedError") resolve();
            else reject(e);
          });
        return;
      }

      let settled = false;
      let cleanup = () => {};

      const finishResolve = () => {
        if (settled || requestId !== this._loadRequestId) return;
        settled = true;
        cleanup();
        this._clearLoadTimeout();
        resolve();
      };

      const finishReject = (err) => {
        if (settled || requestId !== this._loadRequestId) return;
        settled = true;
        cleanup();
        this._clearLoadTimeout();
        reject(err);
      };

      const attempt = (retriesLeft) => {
        if (settled || requestId !== this._loadRequestId) return;

        cleanup();

        const onCanPlay = () => {
          cleanup();
          this._clearLoadTimeout();
          this.audio
            .play()
            .then(() => finishResolve())
            .catch((e) => {
              // Browser may block autoplay — user gesture needed
              if (e.name === "NotAllowedError") {
                finishResolve(); // Not a real load error
              } else if (retriesLeft > 0) {
                setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY);
              } else {
                finishReject(e);
              }
            });
        };

        const onError = () => {
          cleanup();
          this._clearLoadTimeout();
          if (retriesLeft > 0) {
            devLog("warn", `Audio load error, retrying... (${retriesLeft} left)`);
            setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY);
          } else {
            finishReject(new Error("Audio load failed after retries"));
          }
        };

        cleanup = () => {
          this.audio.removeEventListener("canplay", onCanPlay);
          this.audio.removeEventListener("error", onError);
          cleanup = () => {};
        };

        // Set timeout for loading
        this._loadTimeout = setTimeout(() => {
          cleanup();
          if (retriesLeft > 0) {
            devLog(
              "warn",
              `Audio load timeout, retrying... (${retriesLeft} left)`,
            );
            attempt(retriesLeft - 1);
          } else {
            finishReject(new Error("Audio load timeout"));
          }
        }, AUDIO_LOAD_TIMEOUT);

        this.audio.addEventListener("canplay", onCanPlay, { once: true });
        this.audio.addEventListener("error", onError, { once: true });
        this.audio.preload = "auto";
        this.audio.src = url;
        this.audio.load();
      };

      attempt(retries);
    });
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
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      if (idx >= 0 && idx < this.playlist.length) {
        this._preloadTrack(this.playlist[idx].url);
      }
    }
  }

  async _loadAndPlay(index, { throwOnError = false } = {}) {
    if (index < 0 || index >= this.playlist.length) return;

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
          loadedUrl = urlCandidate;
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!loadedUrl) {
        throw lastErr || new Error("Audio load failed for all URL candidates");
      }
      item.url = loadedUrl;
      this.isPlaying = true;
      this.onNetworkState?.("playing");
      this.onPlay?.(item);
      this.onAyahChange?.(item);
      for (const fn of this._ayahChangeListeners) fn(item);

      // Preload next tracks (3 ahead for smoother continuous playback)
      this._preloadAhead(index + 1, 3);
    } catch (err) {
      console.error("Audio play error:", err);
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
    // Memorization mode: repeat current ayah
    if (this.memMode) {
      this.memCurrentRepeat++;
      if (this.memCurrentRepeat < this.memRepeatCount) {
        this.memTimer = setTimeout(() => {
          this.memTimer = null;
          if (
            this.audio &&
            this.audio.src &&
            this.audio.src !== window.location.href
          ) {
            this.audio.currentTime = 0;
            this.audio.play().catch(() => {});
          }
        }, this.memPauseDuration);
        return;
      }
      // Done repeating, move to next
      this.memCurrentRepeat = 0;
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
      this.isPlaying = false;
      this.onEnd?.();
      for (const fn of this._endListeners) fn();
    }
  }

  /* ── Getters ───────────────────────────────── */

  get currentTime() {
    return this.audio.currentTime;
  }
  get duration() {
    return this.audio.duration || 0;
  }
  get playbackRate() {
    return this.audio.playbackRate || 1;
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

  /** Subscribe an extra time-update listener. Returns unsubscribe fn. */
  addTimeUpdateListener(fn) {
    this._timeUpdateListeners.push(fn);
    return () => {
      this._timeUpdateListeners = this._timeUpdateListeners.filter(
        (f) => f !== fn,
      );
    };
  }

  /** Subscribe to playlist-end events. Returns unsubscribe fn. */
  addEndListener(fn) {
    this._endListeners.push(fn);
    return () => {
      this._endListeners = this._endListeners.filter((f) => f !== fn);
    };
  }

  /** Subscribe to ayah-change events. Returns unsubscribe fn. */
  addAyahChangeListener(fn) {
    this._ayahChangeListeners.push(fn);
    return () => {
      this._ayahChangeListeners = this._ayahChangeListeners.filter(
        (f) => f !== fn,
      );
    };
  }

  subscribeLatency(fn) {
    if (typeof fn !== "function") return () => {};
    this._latencyListeners.push(fn);
    return () => {
      this._latencyListeners = this._latencyListeners.filter((f) => f !== fn);
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
    this.abRepeatStart = startIdx >= 0 ? startIdx : -1;
    this.abRepeatEnd = endIdx >= 0 ? endIdx : -1;
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

  /* ── Equalizer (Web Audio API, lazy init) ────────────────────── */
  _ensureAudioCtx() {
    if (this._eqConnected || !this.audio) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this._audioCtx = new AC();
      const src = this._audioCtx.createMediaElementSource(this.audio);
      this._bassFilter = this._audioCtx.createBiquadFilter();
      this._bassFilter.type = "lowshelf";
      this._bassFilter.frequency.value = 200;
      this._midFilter = this._audioCtx.createBiquadFilter();
      this._midFilter.type = "peaking";
      this._midFilter.frequency.value = 1000;
      this._midFilter.Q.value = 1.5;
      this._trebleFilter = this._audioCtx.createBiquadFilter();
      this._trebleFilter.type = "highshelf";
      this._trebleFilter.frequency.value = 3500;
      src.connect(this._bassFilter);
      this._bassFilter.connect(this._midFilter);
      this._midFilter.connect(this._trebleFilter);
      this._trebleFilter.connect(this._audioCtx.destination);
      this._eqConnected = true;
      this._applyEqGains();
    } catch (e) {
      console.warn("EQ init failed:", e);
    }
  }
  _applyEqGains() {
    const P = {
      flat: { bass: 0, mid: 0, treble: 0 },
      bass: { bass: 8, mid: 0, treble: -2 },
      treble: { bass: -2, mid: 0, treble: 6 },
      near: { bass: 2, mid: 5, treble: 2 },
      hall: { bass: -3, mid: -2, treble: 3 },
      vocals: { bass: -4, mid: 7, treble: 3 },
    };
    const p = P[this.eqPreset] || P.flat;
    if (this._bassFilter) this._bassFilter.gain.value = p.bass;
    if (this._midFilter) this._midFilter.gain.value = p.mid;
    if (this._trebleFilter) this._trebleFilter.gain.value = p.treble;
  }
  applyEqPreset(preset) {
    this.eqPreset = preset;
    this._ensureAudioCtx();
    if (this._eqConnected) this._applyEqGains();
  }

  destroy() {
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
      this.audio.removeAttribute("src");
      this.audio = null;
    }
  }
}

// Singleton
const audioService = new AudioService();
export { AudioService };
export default audioService;
