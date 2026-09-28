/**
 * French tafsir service.
 *
 * Serves "Al-Mukhtasar fi at-Tafsir" (French abridged explanation), vendored as
 * static, digest-pinned JSON under public/data/tafsir-fr-mokhtasar/ by
 * scripts/build-french-tafsir.mjs and keyed on the Hafs verse numbering the tafsir
 * surface already uses. Nothing is fetched from a third party at runtime: the
 * reader gets the commentary offline from the local asset, and the same build pins
 * the SHA-256 of every surah file so a corrupted or build-stale offline copy is
 * dropped rather than presented.
 *
 * This is a commentary, not Quran text, so it carries attribution and an in-app
 * error-report affordance (getFrenchTafsirAttribution + the sidebar link) instead
 * of the verse-integrity machinery the Quran-text editions require.
 */

import { dbDelete, dbGet, dbSet } from "./dbService.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";
import SURAHS from "../data/surahs.js";

export const FRENCH_TAFSIR_EDITION_ID = "fr-mokhtasar";
const DIR = "tafsir-fr-mokhtasar";
const SCHEMA = "mushafplus-tafsir-fr-v1";
const IDB_STORE = "cache";
const ASSET_TIMEOUT_MS = 8000;

const SURAH_COUNT = 114;

function padded(surahNumber) {
  return String(surahNumber).padStart(3, "0");
}

function assetUrl(name) {
  const baseUrl = import.meta.env?.BASE_URL || "/";
  return `${baseUrl}data/${DIR}/${name}?v=${SCHEMA}`;
}

function indexKey() {
  return `${DIR}-index-v1`;
}

function surahKey(surah) {
  return `${DIR}-s-${surah}`;
}

const logError = import.meta.env?.DEV ? console.error : () => {};

async function sha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || !bytes) return null;
  try {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function fetchAsset(name) {
  const response = await fetchWithTimeout(assetUrl(name), { cache: "force-cache" }, ASSET_TIMEOUT_MS);
  if (!response.ok) throw new Error(`French tafsir asset ${name}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, json: JSON.parse(new TextDecoder().decode(bytes)) };
}

function isValidIndex(index) {
  return (
    index?.schema === SCHEMA &&
    index?.edition?.language === "fr" &&
    Object.keys(index?.files || {}).length === SURAH_COUNT
  );
}

const indexPromise = { current: null };

async function loadIndex() {
  if (!indexPromise.current) {
    indexPromise.current = (async () => {
      try {
        const cached = await dbGet(IDB_STORE, indexKey());
        if (isValidIndex(cached?.data)) return cached.data;
      } catch {
        // Fall through to the local asset.
      }
      const { json } = await fetchAsset("index.json");
      if (!isValidIndex(json)) throw new Error("Invalid French tafsir index");
      dbSet(IDB_STORE, { key: indexKey(), data: json, version: SCHEMA }).catch(() => {});
      return json;
    })().catch((error) => {
      indexPromise.current = null;
      throw error;
    });
  }
  return indexPromise.current;
}

function expectedAyahCount(surah) {
  return Number(SURAHS[surah - 1]?.ayahs) || 0;
}

/**
 * Completeness gate, lighter than the Quran-text editions: the surah file must
 * cover verses 1..Hafs-total with a non-empty French string, or it is refused and
 * the reader falls back to another source rather than seeing a half corpus.
 */
function isValidSurahDoc(json, surah) {
  if (json?.schema !== SCHEMA || Number(json?.surah_number) !== surah) return false;
  const ayahs = json?.ayahs;
  const expected = expectedAyahCount(surah);
  if (!expected || !Array.isArray(ayahs) || ayahs.length !== expected) return false;
  if (Number(json?.number_of_ayahs) !== expected) return false;
  for (let i = 0; i < ayahs.length; i += 1) {
    const entry = ayahs[i];
    if (Number(entry?.ayah_number) !== i + 1) return false;
    if (typeof entry?.text !== "string" || !entry.text.trim()) return false;
  }
  return true;
}

// Least-recently-used memory cache of whole-surah commentary maps. One entry is a
// surah's ayah->text map; the longest surah (2: 286 verses, ~90 kB of text) is the
// worst case. Six entries hold under ~0.5 MB, and a normal reading session touches
// one or two surahs. Keys are the surah number, so a miss costs one IndexedDB read
// of the already-vendored text, never a third-party fetch.
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

async function loadSurahMap(surah) {
  const warm = recall(surah);
  if (warm) return warm;
  if (pendingSurahs.has(surah)) return pendingSurahs.get(surah);

  const promise = (async () => {
    const name = `${padded(surah)}.json`;
    const key = surahKey(surah);
    const index = await loadIndex();
    const pinned = index.files[name];
    if (!pinned?.sha256) throw new Error(`No pinned digest for ${name}`);

    try {
      const cached = await dbGet(IDB_STORE, key);
      if (cached?.sha256 === pinned.sha256 && cached?.data?.byAyah) {
        const storedEntries = cached.data.byAyah;
        const byAyah =
          storedEntries instanceof Map ? storedEntries : new Map(storedEntries);
        return remember(surah, byAyah);
      }
      if (cached) await dbDelete(IDB_STORE, key).catch(() => {});
    } catch {
      // A read failure only costs a re-fetch of a local asset.
    }

    const { bytes, json } = await fetchAsset(name);
    const digest = await sha256Hex(bytes);
    if (digest && digest !== pinned.sha256) {
      logError(`[FrenchTafsir] Digest mismatch for ${name}`);
      throw new Error(`French tafsir checksum mismatch for ${name}`);
    }
    if (!isValidSurahDoc(json, surah)) {
      throw new Error(`Incomplete French tafsir for surah ${surah}`);
    }
    const byAyah = new Map(json.ayahs.map((entry) => [Number(entry.ayah_number), entry.text]));
    remember(surah, byAyah);
    if (digest === pinned.sha256) {
      dbSet(IDB_STORE, { key, data: { byAyah: [...byAyah] }, sha256: digest, version: SCHEMA }).catch(
        () => {},
      );
    }
    return byAyah;
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
  const text = byAyah.get(ayahNumber);
  if (!text) return null;
  return { text, language: "fr", tafsirId: FRENCH_TAFSIR_EDITION_ID };
}

/** Attribution + provenance for the reading surface and the report link. */
export async function getFrenchTafsirAttribution() {
  try {
    const index = await loadIndex();
    return {
      editionId: FRENCH_TAFSIR_EDITION_ID,
      name: index?.edition?.name || "Al-Mukhtasar fi at-Tafsir",
      attribution: index?.attribution,
      source: index?.source,
      sourceUrl: index?.source?.url,
    };
  } catch {
    return { editionId: FRENCH_TAFSIR_EDITION_ID, name: "Al-Mukhtasar fi at-Tafsir" };
  }
}

export async function clearFrenchTafsirCache() {
  cachedSurahs.clear();
  pendingSurahs.clear();
  indexPromise.current = null;
  const keys = [indexKey()];
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
