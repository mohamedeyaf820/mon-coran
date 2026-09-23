import {
  buildSearchCandidates,
  inferSearchMode,
  sanitizeSearchQuery,
} from "../utils/searchIntelligence.js";

self.addEventListener("message", (event) => {
  const { id, rawQuery, preferredMode } = event.data || {};
  const sanitized = sanitizeSearchQuery(rawQuery);
  const effectiveMode = inferSearchMode(sanitized, preferredMode);
  const candidates = buildSearchCandidates(sanitized, effectiveMode);
  self.postMessage({ id, sanitized, effectiveMode, candidates });
});
