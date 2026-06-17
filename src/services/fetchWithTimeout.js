function combineSignals(...signals) {
  const controller = new AbortController();
  signals.forEach((s) => s?.addEventListener('abort', () => controller.abort(), { once: true }));
  return controller.signal;
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal ? combineSignals(options.signal, controller.signal) : controller.signal;
  try {
    const res = await fetch(url, { ...options, signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error(`Request timed out (${timeoutMs}ms)`);
    throw err;
  }
}
