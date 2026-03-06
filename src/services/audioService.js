/**
 * Audio service – manages playback, word-by-word, memorization.
 * Wraps HTML5 Audio API with retry logic, preloading, and timeout handling.
 */

const AUDIO_LOAD_TIMEOUT = 12000; // 12s max to start loading
const MAX_RETRIES = 2;
const RETRY_DELAY = 800; // ms

class AudioService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata'; // Keep startup light while enabling faster first play
    // NOTE: Do NOT set crossOrigin — EveryAyah.com and some CDNs
    // don't support CORS, which causes audio to fail silently.
    this.currentAyah = null;
    this.playlist = [];       // array of { surah, ayah, url }
    this.playlistIndex = -1;
    this.isPlaying = false;
    this._loadTimeout = null;
    this._preloadAudio = null; // For preloading next track
    this._preloadPool = []; // [{ url, audio }]
    this._maxPreloadPool = 2;
    this._loadRequestId = 0; // Used to ignore stale retry attempts

    // Memorization mode
    this.memMode = false;
    this.memRepeatCount = 3;
    this.memCurrentRepeat = 0;
    this.memPauseDuration = 2000; // ms between repeats
    this.memTimer = null;

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
      // Notify extra listeners
      for (const fn of this._timeUpdateListeners) {
        fn(this.audio.currentTime, this.audio.duration);
      }
    };
    this._boundError = (e) => {
      // Ignore errors from clearing src
      if (!this.audio.src || this.audio.src === window.location.href) return;
      console.error('Audio error:', e);
      this.onError?.(e);
    };
    this.audio.addEventListener('ended', this._boundEnded);
    this.audio.addEventListener('timeupdate', this._boundTimeUpdate);
    this.audio.addEventListener('error', this._boundError);
    this._boundWaiting = () => this.onNetworkState?.('buffering');
    this._boundStalled = () => this.onNetworkState?.('stalled');
    this._boundCanPlay = () => this.onNetworkState?.('ready');
    this._boundPlaying = () => this.onNetworkState?.('playing');
    this.audio.addEventListener('waiting', this._boundWaiting);
    this.audio.addEventListener('stalled', this._boundStalled);
    this.audio.addEventListener('canplay', this._boundCanPlay);
    this.audio.addEventListener('playing', this._boundPlaying);
  }

  /* ── Build Audio URL ───────────────────────── */

  /**
   * Build a playable audio URL.
   */
  static buildUrl(reciterCdn, ayah, cdnType = 'islamic') {
    if (cdnType === 'everyayah') {
      const surah = typeof ayah === 'object' ? ayah.surah : 1;
      const num   = typeof ayah === 'object' ? (ayah.numberInSurah || ayah.ayah || 1) : ayah;
      const s = String(surah).padStart(3, '0');
      const a = String(num).padStart(3, '0');
      return `https://everyayah.com/data/${reciterCdn}/${s}${a}.mp3`;
    }
    // Islamic Network: global ayah number
    const globalNum = typeof ayah === 'object' ? ayah.number : ayah;
    return `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalNum}.mp3`;
  }

  /* ── Playlist Management ───────────────────── */

  loadPlaylist(ayahs, reciterCdn, cdnType = 'islamic') {
    const previousCurrent = this.currentAyah;

    this.playlist = ayahs.map(a => ({
      surah: a.surah || a.surahNumber,
      ayah: a.ayah || a.numberInSurah,
      globalNumber: a.number,
      url: AudioService.buildUrl(reciterCdn, {
        surah: a.surah || a.surahNumber,
        numberInSurah: a.ayah || a.numberInSurah,
        number: a.number,
      }, cdnType),
      text: a.text,
    }));

    // Preserve current position if the same ayah still exists in the new playlist
    const preservedIndex = previousCurrent
      ? this.playlist.findIndex(
          (p) =>
            p.surah === previousCurrent.surah &&
            p.ayah === previousCurrent.ayah,
        )
      : -1;

    this.playlistIndex = preservedIndex >= 0 ? preservedIndex : -1;
    if (preservedIndex >= 0) {
      this.currentAyah = this.playlist[preservedIndex];
    }

    // Preload first relevant track immediately
    if (this.playlist.length > 0) {
      const preloadIndex = preservedIndex >= 0 ? preservedIndex : 0;
      this._preloadAhead(preloadIndex, 2);
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
      this.audio.play().catch(() => {});
      this.isPlaying = true;
      this.onPlay?.(this.playlist[this.playlistIndex]);
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else if (this.audio.src && this.audio.src !== window.location.href && this.audio.paused) {
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
    this.audio.removeAttribute('src');
    this.audio.load(); // Reset without triggering error
    for (const pre of this._preloadPool) {
      pre.audio?.removeAttribute('src');
      pre.audio?.load();
    }
    this._preloadPool = [];
    this.isPlaying = false;
    this.playlistIndex = -1;
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
    const idx = this.playlist.findIndex(
      p => p.surah === surah && p.ayah === ayah
    );
    if (idx >= 0) {
      this._loadAndPlay(idx);
    }
  }

  /**
   * Play a single ayah by URL (one-shot) with retry
   */
  async playSingle(url, meta = {}) {
    try {
      this.onNetworkState?.('loading');
      await this._loadUrlWithRetry(url);
      this.isPlaying = true;
      this.onNetworkState?.('playing');
      this.onPlay?.({ url, ...meta });
    } catch (err) {
      this.onNetworkState?.('error');
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

  /**
   * Load a URL into the audio element and start playing.
   * Waits for 'canplay' before calling play(). Retries on failure.
   */
  _loadUrlWithRetry(url, retries = MAX_RETRIES) {
    return new Promise((resolve, reject) => {
      const requestId = ++this._loadRequestId;
      this._clearLoadTimeout();

      if (this.audio.src === url && this.audio.readyState >= 2) {
        this.audio
          .play()
          .then(() => resolve())
          .catch((e) => {
            if (e?.name === 'NotAllowedError') resolve();
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
              if (e.name === 'NotAllowedError') {
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
            console.warn(`Audio load error, retrying... (${retriesLeft} left)`);
            setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY);
          } else {
            finishReject(new Error('Audio load failed after retries'));
          }
        };

        cleanup = () => {
          this.audio.removeEventListener('canplay', onCanPlay);
          this.audio.removeEventListener('error', onError);
          cleanup = () => {};
        };

        // Set timeout for loading
        this._loadTimeout = setTimeout(() => {
          cleanup();
          if (retriesLeft > 0) {
            console.warn(`Audio load timeout, retrying... (${retriesLeft} left)`);
            attempt(retriesLeft - 1);
          } else {
            finishReject(new Error('Audio load timeout'));
          }
        }, AUDIO_LOAD_TIMEOUT);

        this.audio.addEventListener('canplay', onCanPlay, { once: true });
        this.audio.addEventListener('error', onError, { once: true });
        this.audio.preload = 'auto';
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
    if (this._preloadPool.some((p) => p.url === url)) return;

    try {
      const preloadAudio = new Audio();
      preloadAudio.preload = 'auto';
      preloadAudio.src = url;
      preloadAudio.load();

      this._preloadAudio = preloadAudio;
      this._preloadPool.push({ url, audio: preloadAudio });

      while (this._preloadPool.length > this._maxPreloadPool) {
        const oldest = this._preloadPool.shift();
        if (oldest?.audio) {
          oldest.audio.removeAttribute('src');
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

  async _loadAndPlay(index) {
    if (index < 0 || index >= this.playlist.length) return;

    this.playlistIndex = index;
    const item = this.playlist[index];
    this.currentAyah = item;
    this.memCurrentRepeat = 0;

    try {
      this.onNetworkState?.('loading');
      await this._loadUrlWithRetry(item.url);
      this.isPlaying = true;
      this.onNetworkState?.('playing');
      this.onPlay?.(item);
      this.onAyahChange?.(item);
      for (const fn of this._ayahChangeListeners) fn(item);

      // Preload next tracks
      this._preloadAhead(index + 1, 2);
    } catch (err) {
      console.error('Audio play error:', err);
      this.onNetworkState?.('error');
      this.onError?.(err);
      // Keep current ayah on error (don't skip ahead and desync highlighting)
      this.isPlaying = false;
    }
  }

  _handleEnded() {
    // Memorization mode: repeat current ayah
    if (this.memMode) {
      this.memCurrentRepeat++;
      if (this.memCurrentRepeat < this.memRepeatCount) {
        this.memTimer = setTimeout(() => {
          this.memTimer = null;
          if (this.audio && this.audio.src && this.audio.src !== window.location.href) {
            this.audio.currentTime = 0;
            this.audio.play().catch(() => {});
          }
        }, this.memPauseDuration);
        return;
      }
      // Done repeating, move to next
      this.memCurrentRepeat = 0;
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

  get currentTime() { return this.audio.currentTime; }
  get duration() { return this.audio.duration || 0; }
  get progress() { return this.duration ? this.currentTime / this.duration : 0; }
  get currentIndex() { return this.playlistIndex; }
  get totalInPlaylist() { return this.playlist.length; }

  /** Subscribe an extra time-update listener. Returns unsubscribe fn. */
  addTimeUpdateListener(fn) {
    this._timeUpdateListeners.push(fn);
    return () => {
      this._timeUpdateListeners = this._timeUpdateListeners.filter(f => f !== fn);
    };
  }

  /** Subscribe to playlist-end events. Returns unsubscribe fn. */
  addEndListener(fn) {
    this._endListeners.push(fn);
    return () => {
      this._endListeners = this._endListeners.filter(f => f !== fn);
    };
  }

  /** Subscribe to ayah-change events. Returns unsubscribe fn. */
  addAyahChangeListener(fn) {
    this._ayahChangeListeners.push(fn);
    return () => {
      this._ayahChangeListeners = this._ayahChangeListeners.filter(f => f !== fn);
    };
  }

  destroy() {
    this._clearLoadTimeout();
    this.stop();
    if (this._preloadAudio) {
      this._preloadAudio.removeAttribute('src');
      this._preloadAudio = null;
    }
    this._preloadPool = [];
    if (this.audio) {
      this.audio.removeEventListener('ended', this._boundEnded);
      this.audio.removeEventListener('timeupdate', this._boundTimeUpdate);
      this.audio.removeEventListener('error', this._boundError);
      this.audio.removeEventListener('waiting', this._boundWaiting);
      this.audio.removeEventListener('stalled', this._boundStalled);
      this.audio.removeEventListener('canplay', this._boundCanPlay);
      this.audio.removeEventListener('playing', this._boundPlaying);
      this.audio.removeAttribute('src');
      this.audio = null;
    }
  }
}

// Singleton
const audioService = new AudioService();
export { AudioService };
export default audioService;
