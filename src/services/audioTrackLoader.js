/** Native media loading, URL validation, cancellation and bounded retries. */
const AUDIO_LOAD_TIMEOUT = 12000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 800;
const TRUSTED_MP3QURAN_HOST = /^server\d+\.mp3quran\.net$/i;

export function isTrustedAudioUrl(url) {
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
    if (host === "audio.qurancdn.com") {
      return /\.mp3$/i.test(path);
    }
    if (host === "verses.quran.com") {
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

export function loadAudioUrl(service, url, retries = MAX_RETRIES) {
  service._cancelPendingLoad?.();
  if (!isTrustedAudioUrl(url)) return Promise.reject(new Error("Untrusted audio URL"));
  const requestId = ++service._loadRequestId;
  service._clearLoadTimeout();
  return new Promise((resolve, reject) => {
    const audio = service.audio;
    let settled = false;
    let retryTimer;
    let cleanupAttempt = () => {};
    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanupAttempt();
      clearTimeout(retryTimer);
      service._clearLoadTimeout();
      if (service._cancelPendingLoad === cancel) service._cancelPendingLoad = null;
      if (error) reject(error); else resolve();
    };
    const cancel = () => finish(new DOMException("Audio load superseded", "AbortError"));
    service._cancelPendingLoad = cancel;
    const attempt = (remaining) => {
      if (settled || requestId !== service._loadRequestId) return cancel();
      let attemptDone = false;
      const failed = (error) => {
        if (attemptDone || settled) return;
        attemptDone = true;
        cleanupAttempt();
        service._clearLoadTimeout();
        // A permission denial is a paused player, not a broken reciter/CDN.
        if (error?.name === "NotAllowedError" || error?.name === "AbortError" || remaining <= 0) {
          finish(error);
        } else {
          retryTimer = setTimeout(() => attempt(remaining - 1), RETRY_DELAY);
        }
      };
      const onError = () => failed(new Error("Audio load failed"));
      cleanupAttempt = () => audio.removeEventListener("error", onError);
      audio.addEventListener("error", onError, { once: true });
      service._loadTimeout = setTimeout(() => {
        // Background timer delivery may lag behind native media playback.
        if (!audio.paused && audio.readyState >= 2) finish();
        else failed(new Error("Audio load timeout"));
      }, AUDIO_LOAD_TIMEOUT);
      const rate = audio.playbackRate;
      if (audio.src !== url || audio.readyState < 2) {
        audio.preload = "auto";
        audio.src = url;
        audio.load();
        audio.playbackRate = rate;
      }
      // Keep the same native element and invoke play synchronously, including
      // the ended event's next track. Never wait for a render or animation frame.
      try {
        audio.play().then(() => {
          if (attemptDone) return;
          if (requestId !== service._loadRequestId) cancel(); else finish();
        }, failed);
      } catch (error) { failed(error); }
    };
    attempt(retries);
  });
}
