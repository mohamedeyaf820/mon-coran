/**
 * A verse that cannot be fetched at its boundary (a signal drop, a tunnel) used to
 * stop the recitation until the reader pressed play again. While the reader's
 * intent is still "playing", the same verse is retried: when the network is back
 * if it was down, after a short wait (twice) otherwise. Any command of the reader
 * (pause, stop, another verse) supersedes it, and so does five minutes of waiting.
 */
const GIVE_UP_MS = 5 * 60 * 1000;
const MAX_ONLINE_RETRIES = 2;

export function cancelAutoRetry(svc) {
  svc._autoRetryCancel?.();
  svc._autoRetryCancel = null;
}

export function armAutoRetry(svc, index, position, commandId, error) {
  cancelAutoRetry(svc);
  if (typeof window === "undefined" || svc._playbackIntent !== "playing") return;
  if (error?.name === "NotAllowedError") return;
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (!offline && svc._autoRetryCount >= MAX_ONLINE_RETRIES) return;
  const armedAt = Date.now();
  const retry = () => {
    cancelAutoRetry(svc);
    if (commandId !== svc._commandId || svc._playbackIntent !== "playing" || svc.isPlaying) return;
    if (Date.now() - armedAt > GIVE_UP_MS) return;
    svc._autoRetryCount += 1;
    svc._diagnose("auto-retry");
    void svc._loadAndPlay(index, { position });
  };
  if (offline) {
    window.addEventListener("online", retry, { once: true });
    svc._autoRetryCancel = () => window.removeEventListener("online", retry);
  } else {
    const timer = window.setTimeout(retry, 1500 * (svc._autoRetryCount + 1));
    svc._autoRetryCancel = () => window.clearTimeout(timer);
  }
}
