/**
 * Warsh-adapted translation service, currently two editions:
 * - fr.montada-warsh: « Le Saint Coran », Dr Nabil Redouane, Al-Montada
 *   Al-Islami 2017;
 * - en.pickthall-warsh: « The Holy Qur'an », M. M. Pickthall (1930, public
 *   domain), QuranPedia book 13604.
 *
 * Each edition is vendored as static JSON under public/data/warsh-translation-{fr,en}/
 * and re-keyed on the Warsh Madinah numbering by scripts/build-warsh-translation.mjs
 * (6214 Warsh verses against 6236 Hafs verses). Nothing is fetched from a third
 * party at runtime: the reader gets the translation offline, and the same file
 * carries the Hafs numbers each Warsh verse recites for provenance.
 *
 * Integrity: each edition's index.json pins the SHA-256 of every per-surah file.
 * Payloads are digested before they are cached in IndexedDB, and a cached record
 * is dropped when its digest no longer matches the pinned one, so a corrupted or
 * build-stale offline copy can never be presented as the translation.
 */

import { dbDelete, dbGet, dbSet } from "./dbService.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";
import { getWarshSurahAyahCount } from "../constants/warshSource.js";
import SURAHS from "../data/surahs.js";
import { JUZ_DATA } from "../data/juz.js";

const IDB_STORE = "cache";
const ASSET_TIMEOUT_MS = 8000;

export const WARSH_TRANSLATION_EDITION_ID = "fr.montada-warsh";
export const WARSH_TRANSLATION_EDITION_ID_EN = "en.pickthall-warsh";

/** Mirrors the EDITIONS presets in scripts/build-warsh-translation.mjs. */
const WARSH_EDITIONS = {
  [WARSH_TRANSLATION_EDITION_ID]: {
    dir: "warsh-translation-fr",
    schema: "mushafplus-warsh-translation-fr-v1",
    language: "fr",
    source: "montada-warsh",
    fallbackName: "Le Saint Coran — Warsh (Montada 2017)",
  },
  [WARSH_TRANSLATION_EDITION_ID_EN]: {
    dir: "warsh-translation-en",
    schema: "mushafplus-warsh-translation-en-v1",
    language: "en",
    source: "pickthall-warsh",
    fallbackName: "The Holy Qur'an — Warsh (Pickthall)",
  },
};

export const WARSH_TRANSLATION_EDITION_IDS = Object.keys(WARSH_EDITIONS);

function editionConfig(editionId) {
  const config = WARSH_EDITIONS[editionId || WARSH_TRANSLATION_EDITION_ID];
  if (!config) throw new Error(`Unknown Warsh translation edition: ${editionId}`);
  return config;
}

const logError = import.meta.env?.DEV ? console.error : () => {};

const cachedSurahs = new Map();
const pendingSurahs = new Map();
const indexPromises = new Map();

function assetUrl(config, name) {
  const baseUrl = import.meta.env?.BASE_URL || "/";
  return `${baseUrl}data/${config.dir}/${name}?v=${config.schema}`;
}

function padded(surahNumber) {
  return String(surahNumber).padStart(3, "0");
}

/** True when a translation choice is served from the vendored Warsh assets. */
export function isWarshTranslationEdition(id) {
  return WARSH_TRANSLATION_EDITION_IDS.includes(id);
}

/**
 * Hex SHA-256, or null when WebCrypto is unavailable (insecure context). A null
 * digest means "unverifiable": the payload may serve this session but is never
 * persisted as the reader's offline translation.
 */
async function sha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || !bytes) return null;
  try {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function fetchAssetBytes(config, name) {
  const response = await fetchWithTimeout(assetUrl(config, name), { cache: "force-cache" }, ASSET_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Warsh translation asset ${name}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchAssetJson(config, name) {
  const bytes = await fetchAssetBytes(config, name);
  return { bytes, json: JSON.parse(new TextDecoder().decode(bytes)) };
}

function isValidIndex(config, index) {
  return (
    index?.schema === config.schema &&
    index?.edition?.language === config.language &&
    Object.keys(index?.files || {}).length === 114
  );
}

function indexKey(config) {
  return `${config.dir}-index-v1`;
}

function surahKeyPrefix(config) {
  return `${config.dir}-s-`;
}

/** index.json for one edition, in memory then IndexedDB then the local asset. */
async function loadIndex(editionId) {
  const config = editionConfig(editionId);
  if (!indexPromises.has(config.dir)) {
    indexPromises.set(
      config.dir,
      (async () => {
        try {
          const cached = await dbGet(IDB_STORE, indexKey(config));
          if (isValidIndex(config, cached?.data)) return cached.data;
        } catch {
          // Fall through to the asset.
        }
        const { json } = await fetchAssetJson(config, "index.json");
        if (!isValidIndex(config, json)) throw new Error("Invalid Warsh translation index");
        dbSet(IDB_STORE, { key: indexKey(config), data: json, version: config.schema }).catch(() => {});
        return json;
      })().catch((error) => {
        indexPromises.delete(config.dir);
        throw error;
      }),
    );
  }
  return indexPromises.get(config.dir);
}

/**
 * Exact completeness, not a percentage: a Warsh translation surah must cover
 * verses 1..getWarshSurahAyahCount(surah) with a non-empty text and the Hafs
 * numbers it recites, or it is refused instead of shown.
 */
function validateTranslationRecords(records, surahNumber) {
  if (!Array.isArray(records) || records.length === 0) return false;
  const expected = getWarshSurahAyahCount(surahNumber);
  if (!expected) return false;
  if (records.length !== expected) return false;

  let previous = 0;
  for (const record of records) {
    const ayahNumber = Number(record?.ayahNumber);
    if (!Number.isInteger(ayahNumber) || ayahNumber !== previous + 1) return false;
    if (typeof record.text !== "string" || !record.text.trim()) return false;
    if (!Array.isArray(record.hafsNumbers) || !record.hafsNumbers.length) return false;
    previous = ayahNumber;
  }
  return previous === expected;
}

function toRecords(rawAyahs, surahNumber) {
  const seen = new Set();
  return (Array.isArray(rawAyahs) ? rawAyahs : [])
    .map((raw) => {
      const ayahNumber = Number(raw?.ayah_number ?? raw?.ayahNumber);
      const text = typeof raw?.text === "string" ? raw.text.replace(/\s+/g, " ").trim() : "";
      const hafsNumbers = (Array.isArray(raw?.hafs_numbers) ? raw.hafs_numbers : [])
        .map(Number)
        .filter((number) => Number.isInteger(number) && number > 0);
      if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || !text || !hafsNumbers.length) return null;
      if (seen.has(ayahNumber)) return null;
      seen.add(ayahNumber);
      return {
        surahNumber,
        ayahNumber,
        hafsNumbers,
        text,
        footnotes: Array.isArray(raw?.footnotes) ? raw.footnotes : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ayahNumber - b.ayahNumber);
}

/**
 * Normalized Warsh-adapted translation records for one surah, in Warsh
 * numbering (1..surah total): memory cache, then IndexedDB, then the vendored
 * asset, each step gated by the pinned digest and the completeness check.
 */
export async function getWarshTranslationSurah(surahNumber, editionId) {
  const surah = Number(surahNumber);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new Error(`Invalid surah for the Warsh translation: ${surahNumber}`);
  }
  const config = editionConfig(editionId);
  const cacheKey = `${config.dir}:${surah}`;
  if (cachedSurahs.has(cacheKey)) return cachedSurahs.get(cacheKey);
  if (pendingSurahs.has(cacheKey)) return pendingSurahs.get(cacheKey);

  const promise = (async () => {
    const name = `${padded(surah)}.json`;
    const idbKey = `${surahKeyPrefix(config)}${surah}`;
    const index = await loadIndex(editionId);
    const pinned = index.files[name];
    if (!pinned?.sha256) throw new Error(`No pinned digest for ${name}`);

    try {
      const cached = await dbGet(IDB_STORE, idbKey);
      const records = cached?.data?.records;
      if (cached?.sha256 === pinned.sha256 && validateTranslationRecords(records, surah)) {
        cachedSurahs.set(cacheKey, records);
        return records;
      }
      if (cached) {
        await dbDelete(IDB_STORE, idbKey).catch(() => {});
      }
    } catch {
      // A read failure only costs a re-fetch of a local asset.
    }

    const { bytes, json } = await fetchAssetJson(config, name);
    const digest = await sha256Hex(bytes);
    if (digest && digest !== pinned.sha256) {
      logError(`[WarshTranslation] Digest mismatch for ${name}: ${digest}`);
      throw new Error(`Warsh translation checksum mismatch for ${name}`);
    }
    const records = toRecords(json?.ayahs, surah);
    if (!validateTranslationRecords(records, surah)) {
      throw new Error(`Incomplete Warsh translation for surah ${surah}`);
    }

    cachedSurahs.set(cacheKey, records);
    if (digest === pinned.sha256) {
      dbSet(IDB_STORE, {
        key: idbKey,
        data: { records },
        sha256: digest,
        version: config.schema,
      }).catch(() => {});
    }
    return records;
  })().finally(() => {
    pendingSurahs.delete(cacheKey);
  });

  pendingSurahs.set(cacheKey, promise);
  return promise;
}

/** Surahs a juz spans, from the local juz table (a juz crosses surah edges). */
function surahsForJuz(juzNumber) {
  const juz = Number(juzNumber);
  const index = JUZ_DATA.findIndex((entry) => entry.juz === juz);
  if (index < 0) return [];
  const start = JUZ_DATA[index].start;
  const next = JUZ_DATA[index + 1]?.start || null;
  const lastSurah = next ? (next.a > 1 ? next.s : next.s - 1) : 114;
  const surahs = [];
  for (let s = start.s; s <= lastSurah; s += 1) surahs.push(s);
  return surahs;
}

/** Surahs printed on one Madinah mushaf page (several can share a page). */
function surahsForPage(pageNumber) {
  const page = Number(pageNumber);
  if (!Number.isInteger(page) || page < 1 || page > 604) return [];
  const starting = SURAHS.filter((surah) => surah.page === page).map((surah) => surah.n);
  const containing = SURAHS.filter((surah) => surah.page < page).pop()?.n;
  const surahs = containing ? [containing, ...starting] : starting;
  return [...new Set(surahs)].sort((a, b) => a - b);
}

function surahsForScope(scopeType, scopeValue) {
  if (scopeType === "surah") {
    const surah = Number(scopeValue);
    return Number.isInteger(surah) && surah >= 1 && surah <= 114 ? [surah] : [];
  }
  if (scopeType === "juz") return surahsForJuz(scopeValue);
  if (scopeType === "page") return surahsForPage(scopeValue);
  return [];
}

/**
 * One AlQuran-Cloud-shaped edition document for a surah/juz/page scope, so the
 * existing translation pipeline keeps its contract. Ayahs stay in Warsh
 * numbering: consumers attach them through `riwaya: "warsh"` (see
 * src/components/QuranDisplay/displayHelpers.js), never on a Hafs number.
 */
export async function getWarshTranslationEdition(scopeType, scopeValue, editionId) {
  const config = editionConfig(editionId);
  const id = editionId || WARSH_TRANSLATION_EDITION_ID;
  const surahs = surahsForScope(scopeType, scopeValue);
  if (!surahs.length) return null;
  const index = await loadIndex(id);
  const groups = await Promise.all(surahs.map((surah) => getWarshTranslationSurah(surah, id)));
  const ayahs = groups.flat().map((record) => ({
    surah: { number: record.surahNumber },
    numberInSurah: record.ayahNumber,
    warshNumber: record.ayahNumber,
    hafsNumbers: record.hafsNumbers,
    text: record.text,
    footnotes: record.footnotes,
  }));

  return {
    numberOfAyahs: ayahs.length,
    edition: {
      identifier: id,
      name: index?.edition?.name || config.fallbackName,
      language: config.language,
      direction: "ltr",
      riwaya: "warsh",
    },
    ayahs,
    riwaya: "warsh",
    source: config.source,
    isOffline: true,
  };
}

/** Attribution line for legal and about surfaces. */
export async function getWarshTranslationAttribution(editionId) {
  const id = editionId || WARSH_TRANSLATION_EDITION_ID;
  const index = await loadIndex(id);
  return {
    editionId: id,
    name: index?.edition?.name,
    attribution: index?.attribution,
    source: index?.source,
  };
}

export async function clearWarshTranslationCache() {
  cachedSurahs.clear();
  pendingSurahs.clear();
  indexPromises.clear();
  const keys = [];
  for (const config of Object.values(WARSH_EDITIONS)) {
    keys.push(indexKey(config));
    for (let surah = 1; surah <= 114; surah += 1) keys.push(`${surahKeyPrefix(config)}${surah}`);
  }
  await Promise.all(keys.map((key) => dbDelete(IDB_STORE, key).catch(() => {})));
  return true;
}

export default {
  WARSH_TRANSLATION_EDITION_ID,
  WARSH_TRANSLATION_EDITION_ID_EN,
  WARSH_TRANSLATION_EDITION_IDS,
  isWarshTranslationEdition,
  getWarshTranslationSurah,
  getWarshTranslationEdition,
  getWarshTranslationAttribution,
  clearWarshTranslationCache,
};
