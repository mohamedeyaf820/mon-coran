const KEY = 'mp_error_log';
const MAX = 50;
// The log leaves the device verbatim inside the diagnostics export
// (exportService.downloadDiagnostics), so entries are capped and scrubbed of
// plaintext that must never ship: provider query strings, credentials, emails.
const MAX_MSG = 300;
const MAX_CONTEXT = 120;
const MAX_STACK = 240;

function scrub(value, limit) {
  return String(value ?? '')
    .replace(/https?:\/\/\S+/g, (url) => url.split(/[?#]/)[0])
    .replace(/\bbearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replace(/\b(authorization|token|api[_-]?key|secret|password)\b(["']?\s*[:=]\s*)\S+/gi, '$1$2[redacted]')
    .replace(/[A-Za-z0-9+/_-]{40,}={0,2}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function getLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function logError(error, context) {
  const entry = {
    ts: new Date().toISOString(),
    type: typeof error === 'object' && error !== null ? String(error.name || 'Error') : 'Error',
    msg: scrub(error?.message || String(error), MAX_MSG),
    stack: scrub(error?.stack?.split('\n').slice(0, 2).map(l => l.replace(/\(.*?\)/g, '(…)')).join(' | '), MAX_STACK),
    context: scrub(context || '', MAX_CONTEXT),
  };
  try {
    const log = getLog();
    log.unshift(entry);
    if (log.length > MAX) log.length = MAX;
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch { }
}

let _initialized = false;

export function initErrorAnalytics() {
  if (_initialized) return;
  _initialized = true;
  window.addEventListener('error', (e) => logError(e.error || new Error(e.message), 'window.error'));
  window.addEventListener('unhandledrejection', (e) => logError(e.reason, 'unhandledrejection'));
}

export function getErrorReport() { return getLog(); }
