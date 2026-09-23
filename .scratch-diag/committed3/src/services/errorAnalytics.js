const KEY = 'mp_error_log';
const MAX = 50;

function getLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function logError(error, context) {
  const entry = {
    ts: new Date().toISOString(),
    type: typeof error === 'object' && error !== null ? String(error.name || 'Error') : 'Error',
    msg: error?.message || String(error),
    stack: error?.stack?.split('\n').slice(0, 2).map(l => l.replace(/\(.*?\)/g, '(…)')).join(' | '),
    context: context || '',
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
