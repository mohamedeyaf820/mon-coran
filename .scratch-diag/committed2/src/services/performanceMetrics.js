// Privacy-first observability: only bounded aggregates are kept on-device.
// Nothing in this module performs a network request or stores user content.
const STORAGE_KEY = "mp_performance_metrics_v1";
const MAX_METRICS = 40;
const METRIC_NAME_RE = /^[a-z][a-z0-9_.-]{1,63}$/;

let initialized = false;
let observers = [];
let lcpValue = 0;
let clsValue = 0;
let inpValue = 0;
let flushed = { lcp: null, cls: null, inp: null };

function readReport() {
  if (typeof localStorage === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeReport(report) {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    return true;
  } catch {
    return false;
  }
}

export function recordPerformanceMetric(name, rawValue) {
  const metricName = String(name || "").toLowerCase();
  const value = Number(rawValue);
  if (!METRIC_NAME_RE.test(metricName) || !Number.isFinite(value)) return null;

  const safeValue = Math.round(Math.max(0, Math.min(value, 600_000)) * 100) / 100;
  const report = readReport();
  const previous = report[metricName];
  const count = Math.min(
    Number(previous?.count || 0) + 1,
    Number.MAX_SAFE_INTEGER,
  );
  const total = Math.min(
    Number(previous?.total || 0) + safeValue,
    Number.MAX_SAFE_INTEGER,
  );
  report[metricName] = {
    count,
    min: previous ? Math.min(previous.min, safeValue) : safeValue,
    max: previous ? Math.max(previous.max, safeValue) : safeValue,
    average: Math.round((total / count) * 100) / 100,
    total,
    last: safeValue,
    updatedAt: Date.now(),
  };

  const entries = Object.entries(report)
    .sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0))
    .slice(0, MAX_METRICS);
  writeReport(Object.fromEntries(entries));

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mushafplus-performance-metric", {
        detail: { name: metricName, value: safeValue },
      }),
    );
  }
  return safeValue;
}

export function startPerformanceTimer(name) {
  const start =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  let finished = false;
  return () => {
    if (finished) return null;
    finished = true;
    const end =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    return recordPerformanceMetric(name, end - start);
  };
}

function flushVitals() {
  if (lcpValue > 0 && flushed.lcp !== lcpValue) {
    recordPerformanceMetric("lcp_ms", lcpValue);
    flushed.lcp = lcpValue;
  }
  if (flushed.cls !== clsValue) {
    recordPerformanceMetric("cls_score", clsValue);
    flushed.cls = clsValue;
  }
  if (inpValue > 0 && flushed.inp !== inpValue) {
    recordPerformanceMetric("inp_ms", inpValue);
    flushed.inp = inpValue;
  }
}

function observe(type, callback, options = {}) {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true, ...options });
    observers.push(observer);
  } catch {
    // Unsupported performance entry types are optional.
  }
}

function captureNavigationMetrics() {
  const navigation = performance?.getEntriesByType?.("navigation")?.[0];
  if (!navigation) return;
  recordPerformanceMetric(
    "ttfb_ms",
    navigation.responseStart - navigation.requestStart,
  );
  recordPerformanceMetric("dom_interactive_ms", navigation.domInteractive);
  recordPerformanceMetric("page_load_ms", navigation.loadEventEnd);
}

export function initPerformanceMetrics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  observe("largest-contentful-paint", (entries) => {
    const last = entries.at(-1);
    if (last) lcpValue = last.startTime;
  });
  observe("layout-shift", (entries) => {
    for (const entry of entries) {
      if (!entry.hadRecentInput) clsValue += entry.value || 0;
    }
  });
  observe(
    "event",
    (entries) => {
      for (const entry of entries) {
        if (entry.interactionId && entry.duration > inpValue) {
          inpValue = entry.duration;
        }
      }
    },
    { durationThreshold: 40 },
  );

  window.addEventListener(
    "load",
    () => window.setTimeout(captureNavigationMetrics, 0),
    { once: true },
  );
  window.addEventListener("pagehide", flushVitals);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushVitals();
  });
}

export function getPerformanceReport() {
  return readReport();
}

export function clearPerformanceReport() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function destroyPerformanceMetricsForTests() {
  observers.forEach((observer) => observer.disconnect?.());
  observers = [];
  initialized = false;
  lcpValue = 0;
  clsValue = 0;
  inpValue = 0;
  flushed = { lcp: null, cls: null, inp: null };
}
