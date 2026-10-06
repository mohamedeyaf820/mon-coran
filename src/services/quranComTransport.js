/**
 * HTTP transport of the Quran.com client: deadlines, the two cache layers
 * (memory, IndexedDB), request sharing and bounded concurrency. Verse shapes and
 * endpoints stay in quranComAPI.js.
 */
import { shouldAvoidBackgroundWork } from "../utils/networkPolicy.js";
import { dbGet, dbPruneByPrefix, dbSet } from "./dbService.js";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// Budget to receive the response headers: a server that does not answer in this
// time is considered down and the caller falls back to another source.
const FETCH_TIMEOUT = 4000;
// Budget for the body once the headers arrived. A long surah is several hundred
// kilobytes of compressed JSON per page, which on a congested link takes longer
// than the header budget: aborting a healthy transfer threw the work away and
// sent the reader to a degraded fallback text. A link the app already classes as
// constrained (2G/3G, data saver) keeps the short cap on purpose, so those
// readers still get the small fallback text quickly.
const BODY_TIMEOUT = 30000;

/**
 * Called once the headers arrived. Returns the deadline now in force: the body
 * budget, or the unchanged header deadline on a constrained link.
 */
function extendForBody(timed) {
  if (shouldAvoidBackgroundWork()) return FETCH_TIMEOUT;
  timed.rearm(BODY_TIMEOUT);
  return BODY_TIMEOUT;
}
const IDB_STORE = "cache";
const IDB_PREFIX = "qcom-api:";

const memCache = new Map();
const MEM_CACHE_MAX_SIZE = 240;
const inflight = new Map();

function setMemoryCache(key, value) {
  if (memCache.has(key)) memCache.delete(key);
  memCache.set(key, value);
  while (memCache.size > MEM_CACHE_MAX_SIZE) {
    memCache.delete(memCache.keys().next().value);
  }
}

function getMemoryCache(key) {
  if (!memCache.has(key)) return undefined;
  const value = memCache.get(key);
  memCache.delete(key);
  memCache.set(key, value);
  return value;
}

async function persistCache(key, data) {
  try {
    const savedKey = await dbSet(IDB_STORE, { key, data, ts: Date.now() });
    if (savedKey === undefined) return false;
    void dbPruneByPrefix(IDB_STORE, IDB_PREFIX, {
      maxEntries: 360,
      maxAgeMs: CACHE_TTL,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function createTimedSignal(signal, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timeoutId = globalThis.setTimeout(abort, timeoutMs);

  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    /** Replace the pending deadline, e.g. once the response headers arrived. */
    rearm(nextTimeoutMs) {
      globalThis.clearTimeout(timeoutId);
      timeoutId = globalThis.setTimeout(abort, nextTimeoutMs);
    },
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener?.("abort", abort);
    },
  };
}

function waitForSharedRequest(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("Request aborted", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException("Request aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
}

// One background refresh per key at a time: N callers hitting the same
// expired entry must not fire N identical network requests.
const _backgroundRefreshInFlight = new Set();

function refreshInBackground(url, cacheKey) {
  if (_backgroundRefreshInFlight.has(cacheKey)) return;
  _backgroundRefreshInFlight.add(cacheKey);
  const timed = createTimedSignal(null, FETCH_TIMEOUT);
  fetch(url, {
    signal: timed.signal,
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      extendForBody(timed);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Background fetch failed ${response.status}`);
    })
    .then((json) => {
      if (json && typeof json === "object") {
        setMemoryCache(cacheKey, json);
        void persistCache(cacheKey, json);
      }
    })
    .catch(()=>{})
    .finally(() => {
      _backgroundRefreshInFlight.delete(cacheKey);
      timed.cleanup();
    });
}

export async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

export async function fetchJson(url, signal) {
  if (signal?.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }

  const cacheKey = IDB_PREFIX + url;

  const memoryHit = getMemoryCache(cacheKey);
  if (memoryHit !== undefined) return memoryHit;

  try {
    const cached = await dbGet(IDB_STORE, cacheKey);
    if (cached?.data && cached?.ts) {
      setMemoryCache(cacheKey, cached.data);
      const isFresh = Date.now() - cached.ts < CACHE_TTL;
      if (isFresh) {
        return cached.data;
      } else {
        refreshInBackground(url, cacheKey);
        return cached.data;
      }
    }
  } catch {
    // Network fetch below remains the source of truth.
  }

  if (signal?.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }

  const existing = inflight.get(cacheKey);
  if (existing) return waitForSharedRequest(existing.promise, signal);

  const entry = {
    promise: null,
  };

  entry.promise = (async () => {
    const timed = createTimedSignal(null);
    let timeoutMs = FETCH_TIMEOUT;
    try {
      const response = await fetch(url, {
        signal: timed.signal,
        headers: { Accept: "application/json" },
      });
      timeoutMs = extendForBody(timed);

      if (!response.ok) {
        throw new Error(`Quran.com API error ${response.status}: ${url}`);
      }

      const json = await response.json();
      if (!json || typeof json !== "object") {
        throw new Error("Malformed Quran.com API response");
      }

      setMemoryCache(cacheKey, json);
      // The visible Quran text is only considered loaded once its durable
      // offline copy has settled. This also prevents an immediate reload from
      // cancelling the IndexedDB transaction.
      await persistCache(cacheKey, json);
      return json;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(`Quran.com API request timed out after ${timeoutMs}ms: ${url}`);
      }
      throw error;
    } finally {
      timed.cleanup();
      if (inflight.get(cacheKey) === entry) {
        inflight.delete(cacheKey);
      }
    }
  })();

  inflight.set(cacheKey, entry);
  return waitForSharedRequest(entry.promise, signal);
}
