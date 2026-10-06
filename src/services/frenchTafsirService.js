/**
 * French tafsir service.
 *
 * Serves "Al-Mukhtasar fi at-Tafsir" (French abridged explanation, Tafsir Center
 * for Quranic Studies) from the QuranEnc.com API, key `french_mokhtasar`, keyed on
 * the Hafs verse numbering the tafsir surface already uses. One request fetches a
 * whole surah; the validated result is kept in IndexedDB so a surah that has been
 * read once opens again offline. A surah that was never opened needs a connection.
 *
 * The text is shown as QuranEnc delivers it (its terms forbid modification), minus
 * the markdown artifacts removed by toDisplayText. QuranEnc's response carries no
 * version field: EDITION_VERSION is the version its edition page showed when this
 * integration was last checked, and must be bumped deliberately.
 *
 * This is a commentary, not Quran text, so it carries attribution and an in-app
 * error-report affordance (getFrenchTafsirAttribution + the sidebar link) instead
 * of the verse-integrity machinery the Quran-text editions require. A surah that
 * is short of verses or has an empty one is refused rather than shown half-read.
 */

import { dbDelete, dbGet, dbSet } from "./dbService.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";
import SURAHS from "../data/surahs.js";

export const FRENCH_TAFSIR_EDITION_ID = "fr-mokhtasar";
const SOURCE_OWNER = "quranenc.com";
const SOURCE_KEY = "french_mokhtasar";
const EDITION_VERSION = "1.0.0";
const PUBLISHER = "Tafsir Center for Quranic Studies";
const API_BASE = `https://${SOURCE_OWNER}/api/v1/translation/sura/${SOURCE_KEY}`;
const SOURCE_URL = `https://${SOURCE_OWNER}/en/browse/${SOURCE_KEY}`;
const ATTRIBUTION = `« Al-Mukhtasar fi at-Tafsir » — explication abrégée du Coran, Centre Tafsir pour les études coraniques (${PUBLISHER}). Traduction française, texte de QuranEnc.com, version ${EDITION_VERSION}.`;

const SCHEMA = "mushafplus-tafsir-fr-quranenc-v1";
const IDB_STORE = "cache";
const REQUEST_TIMEOUT_MS = 15000;
// A cached surah is trusted for two weeks, then refreshed from the API. If the
// refresh fails (offline, API down) the older copy is still served: an outdated
// commentary beats none, and the next successful read replaces it.
const CACHE_FRESH_MS = 14 * 24 * 60 * 60 * 1000;

const SURAH_COUNT = 114;

// Keys written by the earlier release that vendored this corpus as static files.
const LEGACY_DIR = "tafsir-fr-mokhtasar";
const LEGACY_PURGE_FLAG = "mushafplus:tafsir-fr:legacy-purged:v1";

function surahKey(surah) {
  return `tafsir-fr-quranenc-s-${surah}`;
}

/**
 * Strips the source's markdown artifacts without touching the French prose: the
 * backtick that precedes transliterated terms and a leading "- " list marker.
 * Consecutive spaces collapse; the string is trimmed. Newlines are kept (the
 * panel renders with white-space: pre-wrap).
 */
export function toDisplayText(raw) {
  return String(raw ?? "")
    .replace(/`/g, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function expectedAyahCount(surah) {
  return Number(SURAHS[surah - 1]?.ayahs) || 0;
}

/**
 * Turns one QuranEnc surah payload into an ayah -> text map, or throws. The surah
 * must cover verses 1..Hafs-total exactly once with a non-empty French string.
 */
function parseSurahPayload(json, surah) {
  const rows = json?.result;
  const expected = expectedAyahCount(surah);
  if (!expected || !Array.isArray(rows) || rows.length !== expected) {
    throw new Error(`Incomplete French tafsir for surah ${surah}`);
  }
  const byAyah = new Map();
  for (const row of rows) {
    const ayah = Number(row?.aya);
    if (
      Number(row?.sura) !== surah ||
      !Number.isInteger(ayah) ||
      ayah < 1 ||
      ayah > expected ||
      byAyah.has(ayah) ||
      typeof row?.translation !== "string" ||
      !row.translation.trim()
    ) {
      throw new Error(`Invalid French tafsir row in surah ${surah}`);
    }
    byAyah.set(ayah, row.translation);
  }
  return byAyah;
}

// Least-recently-used memory cache of whole-surah commentary maps. One entry is a
// surah's ayah->text map; the longest surah (2: 286 verses, ~90 kB of text) is the
// worst case. Six entries hold under ~0.5 MB, and a normal reading session touches
// one or two surahs. A miss costs one IndexedDB read, or one API request when the
// surah was never stored.
const CACHED_SURAH_MAX = 6;
const cachedSurahs = new Map();
const pendingSurahs = new Map();

function recall(surah) {
  if (!cachedSurahs.has(surah)) return null;
  const value = cachedSurahs.get(surah);
  cachedSurahs.delete(surah);
  cachedSurahs.set(surah, value);
  return value;
}

function remember(surah, value) {
  if (cachedSurahs.has(surah)) cachedSurahs.delete(surah);
  cachedSurahs.set(surah, value);
  while (cachedSurahs.size > CACHED_SURAH_MAX) {
    cachedSurahs.delete(cachedSurahs.keys().next().value);
  }
  return value;
}

/** Reads a stored surah. `stale` is true once it is older than CACHE_FRESH_MS. */
async function readStoredSurah(surah) {
  try {
    const stored = await dbGet(IDB_STORE, surahKey(surah));
    if (stored?.version !== SCHEMA || !Array.isArray(stored?.data?.byAyah)) return null;
    const byAyah = new Map(stored.data.byAyah);
    if (byAyah.size !== expectedAyahCount(surah)) return null;
    const age = Date.now() - (Number(stored.savedAt) || 0);
    return { byAyah, stale: !(age >= 0 && age < CACHE_FRESH_MS) };
  } catch {
    return null;
  }
}

// The request is shared by every caller waiting on the same surah, so a single
// caller's AbortSignal must not cancel it: callers re-check their own signal once
// the surah has loaded.
async function fetchSurah(surah) {
  const response = await fetchWithTimeout(
    `${API_BASE}/${surah}`,
    { headers: { Accept: "application/json" } },
    REQUEST_TIMEOUT_MS,
  );
  if (!response.ok) throw new Error(`French tafsir API: ${response.status}`);
  const byAyah = parseSurahPayload(await response.json(), surah);
  dbSet(IDB_STORE, {
    key: surahKey(surah),
    data: { byAyah: [...byAyah] },
    version: SCHEMA,
    savedAt: Date.now(),
  }).catch(() => {});
  return byAyah;
}

let legacyPurgeStarted = false;

/** Deletes the copies stored by the release that shipped this corpus as files. */
function purgeLegacyStorage() {
  if (legacyPurgeStarted) return;
  legacyPurgeStarted = true;
  try {
    if (globalThis.localStorage?.getItem(LEGACY_PURGE_FLAG)) return;
  } catch {
    // Without localStorage the purge simply runs again next session.
  }
  const keys = [`${LEGACY_DIR}-index-v1`];
  for (let surah = 1; surah <= SURAH_COUNT; surah += 1) keys.push(`${LEGACY_DIR}-s-${surah}`);
  Promise.all(keys.map((key) => dbDelete(IDB_STORE, key).catch(() => {})))
    .then(() => {
      try {
        globalThis.localStorage?.setItem(LEGACY_PURGE_FLAG, "1");
      } catch {
        // Best effort.
      }
    })
    .catch(() => {});
}

async function loadSurahMap(surah) {
  const warm = recall(surah);
  if (warm) return warm;
  if (pendingSurahs.has(surah)) return pendingSurahs.get(surah);

  const promise = (async () => {
    purgeLegacyStorage();
    const stored = await readStoredSurah(surah);
    if (stored && !stored.stale) return remember(surah, stored.byAyah);
    try {
      return remember(surah, await fetchSurah(surah));
    } catch (error) {
      if (stored) return remember(surah, stored.byAyah);
      throw error;
    }
  })().finally(() => {
    pendingSurahs.delete(surah);
  });

  pendingSurahs.set(surah, promise);
  return promise;
}

/**
 * One verse's French commentary, or null when the verse has no text. Never throws
 * for a missing verse: an empty surah simply falls back at the caller. Transport
 * and integrity failures reject so the caller can fall back to another source.
 */
export async function getFrenchTafsirVerse({ surah, ayah, signal } = {}) {
  const surahNumber = Number(surah);
  const ayahNumber = Number(ayah);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > SURAH_COUNT) {
    throw new Error(`Invalid surah for the French tafsir: ${surah}`);
  }
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
    throw new Error(`Invalid ayah for the French tafsir: ${ayah}`);
  }
  if (signal?.aborted) throw signal.reason || new DOMException("aborted", "AbortError");

  const byAyah = await loadSurahMap(surahNumber);
  if (signal?.aborted) throw signal.reason || new DOMException("aborted", "AbortError");
  const text = toDisplayText(byAyah.get(ayahNumber));
  if (!text) return null;
  return { text, language: "fr", tafsirId: FRENCH_TAFSIR_EDITION_ID };
}

/** Attribution + provenance for the reading surface and the report link. */
export async function getFrenchTafsirAttribution() {
  return {
    editionId: FRENCH_TAFSIR_EDITION_ID,
    name: "Al-Mukhtasar fi at-Tafsir",
    attribution: ATTRIBUTION,
    source: {
      owner: SOURCE_OWNER,
      slug: SOURCE_KEY,
      version: EDITION_VERSION,
      publisher: PUBLISHER,
      url: SOURCE_URL,
    },
    sourceUrl: SOURCE_URL,
  };
}

export async function clearFrenchTafsirCache() {
  cachedSurahs.clear();
  pendingSurahs.clear();
  const keys = [];
  for (let surah = 1; surah <= SURAH_COUNT; surah += 1) keys.push(surahKey(surah));
  await Promise.all(keys.map((key) => dbDelete(IDB_STORE, key).catch(() => {})));
  return true;
}

export function isFrenchTafsirEdition(id) {
  return id === FRENCH_TAFSIR_EDITION_ID;
}

export default {
  FRENCH_TAFSIR_EDITION_ID,
  isFrenchTafsirEdition,
  getFrenchTafsirVerse,
  getFrenchTafsirAttribution,
  clearFrenchTafsirCache,
};
