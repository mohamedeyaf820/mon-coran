/**
 * idleUtils.js – Shared idle-scheduling utilities.
 *
 * Provides a cross-browser `requestIdleCallback` wrapper so that non-critical
 * work can be deferred until the browser is idle, improving TTI and LCP.
 */

/**
 * Run `callback` during the next idle period (or after `timeout` ms, whichever
 * comes first).  Returns a cancellation function.
 *
 * @param {IdleRequestCallback} callback
 * @param {number} [timeout=240]  - Maximum delay before forcing execution (ms)
 * @returns {() => void}           - Cancel the scheduled call
 */
export function runWhenIdle(callback, timeout = 240) {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(idleId);
  }

  // Safari / older browsers fallback
  const timeoutId = window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    timeout,
  );

  return () => window.clearTimeout(timeoutId);
}
