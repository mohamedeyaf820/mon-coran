import {
  buildSearchCandidates,
  inferSearchMode,
  sanitizeSearchQuery,
} from "../utils/searchIntelligence.js";

let worker = null;
let nextRequestId = 0;
const pending = new Map();

function prepareSynchronously(rawQuery, preferredMode) {
  const sanitized = sanitizeSearchQuery(rawQuery);
  const effectiveMode = inferSearchMode(sanitized, preferredMode);
  return {
    sanitized,
    effectiveMode,
    candidates: buildSearchCandidates(sanitized, effectiveMode),
  };
}

function resolvePendingWithFallback() {
  for (const [id, request] of pending) {
    pending.delete(id);
    clearTimeout(request.timeoutId);
    request.resolve(prepareSynchronously(request.rawQuery, request.preferredMode));
  }
}

function getWorker() {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    worker = new Worker(new URL("../workers/searchQuery.worker.js", import.meta.url), {
      type: "module",
      name: "mushafplus-search",
    });
    worker.addEventListener("message", (event) => {
      const request = pending.get(event.data?.id);
      if (!request) return;
      pending.delete(event.data.id);
      clearTimeout(request.timeoutId);
      request.resolve(event.data);
    });
    worker.addEventListener("error", () => {
      worker?.terminate();
      worker = null;
      resolvePendingWithFallback();
    });
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

export function prepareSearchQuery(rawQuery, preferredMode = "arabic") {
  const activeWorker = getWorker();
  if (!activeWorker) {
    return Promise.resolve(prepareSynchronously(rawQuery, preferredMode));
  }

  const id = ++nextRequestId;
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);
      request.resolve(prepareSynchronously(rawQuery, preferredMode));
    }, 1500);
    pending.set(id, { resolve, rawQuery, preferredMode, timeoutId });
    try {
      activeWorker.postMessage({ id, rawQuery, preferredMode });
    } catch {
      clearTimeout(timeoutId);
      pending.delete(id);
      resolve(prepareSynchronously(rawQuery, preferredMode));
    }
  });
}

export function terminateSearchWorker() {
  worker?.terminate();
  worker = null;
  resolvePendingWithFallback();
}
