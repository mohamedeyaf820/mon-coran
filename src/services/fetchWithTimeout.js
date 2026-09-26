export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const callerSignal = options.signal;
  if (callerSignal?.aborted) {
    throw callerSignal.reason || new DOMException('Request aborted', 'AbortError');
  }
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort(callerSignal.reason);
  callerSignal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    // If the caller aborted at the same moment the timeout fired, prefer the
    // caller's reason so components can filter on AbortError and stay silent
    // instead of surfacing a spurious timeout error during rapid navigation.
    if (callerSignal?.aborted) {
      throw callerSignal.reason || new DOMException("Request aborted", "AbortError");
    }
    if (timedOut) throw new Error(`Request timed out (${timeoutMs}ms)`);
    throw error;
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', onAbort);
  }
}
