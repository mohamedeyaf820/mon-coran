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
    if (timedOut) throw new Error(`Request timed out (${timeoutMs}ms)`);
    throw error;
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', onAbort);
  }
}
