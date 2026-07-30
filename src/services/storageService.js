/**
 * Storage service – IndexedDB (via idb) for large data, localStorage for preferences.
 * Stores: notes, bookmarks, reading-position, cached text, settings.
 */

import {
  dbGet,
  dbSet,
  dbDelete,
  dbGetAll,
  dbReplaceStores,
} from "./dbService.js";
import {
  encryptData,
  decryptDataWithMeta,
} from "./cryptoUtil.js";
import { ACCEPTED_FONT_IDS, DEFAULT_FONT_ID, normalizeFontId } from "../data/fonts.js";
import { getSurahAyahCount } from "../data/surahs.js";
import {
  normalizeDayTheme,
  normalizeNightTheme,
  normalizeThemeId,
} from "../data/themes.js";
import { bookmarkRecordSchema, noteRecordSchema } from "./storageValidation.js";

function parseRecordOrNull(schema, value) {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

const PRIVATE_RECORD_FORMAT = "mushafplus-encrypted-record-v2";

function encodePrivateRecord(record) {
  return {
    id: record.id,
    format: PRIVATE_RECORD_FORMAT,
    payload: encryptData(record),
  };
}

function decodePrivateRecord(schema, value) {
  if (value?.format === PRIVATE_RECORD_FORMAT && typeof value.payload === "string") {
    const result = decryptDataWithMeta(value.payload);
    return {
      record: parseRecordOrNull(schema, result.data),
      needsMigration: Boolean(result.needsMigration),
    };
  }
  return {
    record: parseRecordOrNull(schema, value),
    needsMigration: Boolean(value),
  };
}

async function writePrivateRecord(storeName, schema, value) {
  const record = parseRecordOrNull(schema, value);
  if (!record) return false;
  const key = await dbSet(storeName, encodePrivateRecord(record));
  return key !== undefined;
}

async function readPrivateRecord(storeName, schema, key) {
  const raw = await dbGet(storeName, key);
  const decoded = decodePrivateRecord(schema, raw);
  if (decoded.record && decoded.needsMigration) {
    await writePrivateRecord(storeName, schema, decoded.record);
  }
  return decoded.record;
}

async function readAllPrivateRecords(storeName, schema) {
  const rawRecords = await dbGetAll(storeName);
  const decoded = (Array.isArray(rawRecords) ? rawRecords : [])
    .map((value) => decodePrivateRecord(schema, value))
    .filter(({ record }) => Boolean(record));
  await Promise.all(
    decoded
      .filter(({ needsMigration }) => needsMigration)
      .map(({ record }) => writePrivateRecord(storeName, schema, record)),
  );
  return decoded.map(({ record }) => record);
}

/* ═══════════════════════════════════════════ */
/*  NOTES                                     */
/* ═══════════════════════════════════════════ */

export async function saveNote(surah, ayah, text) {
  const id = `${surah}:${ayah}`;
  return writePrivateRecord("notes", noteRecordSchema, {
    id,
    surah,
    ayah,
    text,
    updatedAt: Date.now(),
  });
}

export async function getNote(surah, ayah) {
  return readPrivateRecord("notes", noteRecordSchema, `${surah}:${ayah}`);
}

export async function deleteNote(surah, ayah) {
  return dbDelete("notes", `${surah}:${ayah}`);
}

export async function getAllNotes() {
  return readAllPrivateRecords("notes", noteRecordSchema);
}

export async function importNoteRecord(record) {
  return writePrivateRecord("notes", noteRecordSchema, record);
}

/* ═══════════════════════════════════════════ */
/*  BOOKMARKS                                 */
/* ═══════════════════════════════════════════ */

export async function addBookmark(surah, ayah, label = "") {
  const id = `${surah}:${ayah}`;
  return writePrivateRecord("bookmarks", bookmarkRecordSchema, {
    id,
    surah,
    ayah,
    label,
    createdAt: Date.now(),
  });
}

export async function removeBookmark(surah, ayah) {
  return dbDelete("bookmarks", `${surah}:${ayah}`);
}

export async function isBookmarked(surah, ayah) {
  return Boolean(
    await readPrivateRecord("bookmarks", bookmarkRecordSchema, `${surah}:${ayah}`),
  );
}

export async function getAllBookmarks() {
  return readAllPrivateRecords("bookmarks", bookmarkRecordSchema);
}

export async function importBookmarkRecord(record) {
  return writePrivateRecord("bookmarks", bookmarkRecordSchema, record);
}

/* ═══════════════════════════════════════════ */
/*  SETTINGS (localStorage – small & sync)    */
/* ═══════════════════════════════════════════ */

const SETTINGS_KEY = "mushaf-plus-settings";

// Valeurs valides pour validation
const VALID_LANGS = ["fr", "en", "ar"];
const VALID_TRANSLATION_LANGS = ["fr", "en", "es", "de", "tr", "ur"];
const VALID_WORD_TRANSLATION_LANGS = ["fr", "en"];
const VALID_RIWAYAS = ["hafs", "warsh"];
const VALID_DISPLAY_MODES = ["surah", "page", "juz"];
const VALID_AUDIO_PLAYER_SKINS = ["orbit", "classic"];
const VALID_FONTS = ACCEPTED_FONT_IDS;

function clampSurah(value) {
  return Math.max(1, Math.min(114, Number(value) || 1));
}

function clampAyahForSurah(surahValue, ayahValue) {
  const surah = clampSurah(surahValue);
  const maxAyah = getSurahAyahCount(surah);
  return Math.max(1, Math.min(maxAyah, Number(ayahValue) || 1));
}

function sanitizeFavoriteReciters(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input)]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim().slice(0, 80))
    .slice(0, 24);
}

function sanitizePinnedAyahs(input) {
  if (!Array.isArray(input)) return [];

  const seen = new Set();
  return input
    .map((item) => {
      const surah = clampSurah(item?.surah);
      return {
        surah,
        ayah: clampAyahForSurah(surah, item?.ayah),
        number: Number.isFinite(Number(item?.number)) ? Number(item.number) : null,
        text:
          typeof item?.text === "string"
            ? item.text.trim().slice(0, 1200)
            : "",
        surahName:
          typeof item?.surahName === "string"
            ? item.surahName.trim().slice(0, 120)
            : "",
      };
    })
    .filter((item) => {
      const key = `${item.surah}:${item.ayah}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function sanitizeTranslationLangs(input, fallback = "fr") {
  const values = Array.isArray(input) ? input : [fallback];
  const cleaned = [...new Set(values)]
    .filter((value) => VALID_TRANSLATION_LANGS.includes(value))
    .slice(0, 3);
  return cleaned.length ? cleaned : ["fr"];
}

function sanitizeSyncOffsetsMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input)
    .filter(
      ([key]) => typeof key === "string" && key.length > 0 && key.length <= 120,
    )
    .slice(0, 240)
    .reduce((acc, [key, value]) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return acc;
      acc[key] = Math.max(-500, Math.min(500, Math.round(numeric)));
      return acc;
    }, {});
}

function isValidClockTime(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function sanitizeAudioPlayerSkin(value) {
  return VALID_AUDIO_PLAYER_SKINS.includes(value) ? value : "orbit";
}

function sanitizeLatencyMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (typeof key !== "string" || key.length > 120) return acc;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 5) {
      return acc;
    }
    acc[key] = Number(numeric.toFixed(4));
    return acc;
  }, {});
}

function sanitizeTimestamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric < 0 || numeric > 4102444800000) return 0;
  return Math.round(numeric);
}

function sanitizeReciterAvailabilityMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const entries = Object.entries(input)
    .filter(([id]) => typeof id === "string" && id.trim() && id.length <= 80)
    .slice(0, 64);

  return entries.reduce((acc, [id, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return acc;
    const failCount = Math.max(0, Math.min(16, Number(value.failCount) || 0));
    const lastFailAt = sanitizeTimestamp(value.lastFailAt);
    const lastSuccessAt = sanitizeTimestamp(value.lastSuccessAt);
    const cooldownUntil = sanitizeTimestamp(value.cooldownUntil);
    const lastError =
      typeof value.lastError === "string"
        ? value.lastError.trim().slice(0, 160)
        : "";

    if (
      failCount <= 0 &&
      lastFailAt <= 0 &&
      lastSuccessAt <= 0 &&
      cooldownUntil <= 0
    ) {
      return acc;
    }

    acc[id] = {
      failCount,
      lastFailAt,
      lastSuccessAt,
      cooldownUntil,
      lastError,
    };
    return acc;
  }, {});
}

const DEFAULT_SETTINGS = {
  lang: "fr",
  theme: "light",
  riwaya: "hafs",
  reciter: "ar.alafasy",
  fontSize: 25,
  quranFontSize: 25,
  quranTranslationFontSize: 18,
  fontFamily: DEFAULT_FONT_ID,
  fontFamilyByRiwaya: {
    hafs: DEFAULT_FONT_ID,
    warsh: "qpc-warsh",
  },
  translationLang: "fr",
  translationLangs: ["fr"],
  wordTranslationLang: "fr",
  showTranslation: true,
  showTajwid: true,
  showWordByWord: false,
  showTransliteration: true,
  showWordTranslation: true,
  translationReadingMode: false,
  pinnedAyahs: [],
  displayMode: "surah", // 'surah' | 'page' | 'juz'
  mushafLayout: "list", // 'list' | 'mushaf'
  audioSpeed: 1,
  volume: 1,
  continuousPlay: true,
  warshStrictMode: true,
  syncOffsetsMs: {},
  favoriteReciters: [],
  autoSelectFastestReciter: false,
  reciterLatencyByKey: {},
  reciterAvailabilityById: {},
  autoNightMode: false,
  nightStart: "20:00",
  nightEnd: "06:00",
  nightTheme: "dark",
  dayTheme: "light",
  usePrayerTimes: false,
  wirdGoalType: "pages",
  wirdGoalAmount: 5,
  surahRepeatCount: 1,
  showHome: true,
  showDuas: false,
  focusReading: false,
  playerMinimized: false,
  audioPlayerSkin: "orbit",
  lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
};

function cloneDefaultSettings() {
  if (typeof structuredClone === "function") {
    return structuredClone(DEFAULT_SETTINGS);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function sanitizeFontFamilyByRiwaya(input, fallbackFont, fallbackRiwaya) {
  const source = input && typeof input === "object" && !Array.isArray(input)
    ? input
    : {};
  return {
    hafs: normalizeFontId(source.hafs || (fallbackRiwaya === "hafs" ? fallbackFont : DEFAULT_SETTINGS.fontFamily), "hafs"),
    warsh: normalizeFontId(source.warsh || (fallbackRiwaya === "warsh" ? fallbackFont : DEFAULT_SETTINGS.fontFamilyByRiwaya.warsh), "warsh"),
  };
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return cloneDefaultSettings();
    const {
      data: decrypted,
      needsMigration,
      locked,
    } = decryptDataWithMeta(raw);
    if (locked) return cloneDefaultSettings();
    const parsed = decrypted ?? JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return cloneDefaultSettings();
    }
    const normalizedRiwaya = VALID_RIWAYAS.includes(parsed?.riwaya)
      ? parsed.riwaya
      : DEFAULT_SETTINGS.riwaya;
    const normalized = {
      ...cloneDefaultSettings(),
      ...parsed,
      riwaya: normalizedRiwaya,
      fontFamily: normalizeFontId(parsed?.fontFamily, normalizedRiwaya),
      fontFamilyByRiwaya: sanitizeFontFamilyByRiwaya(
        parsed?.fontFamilyByRiwaya,
        parsed?.fontFamily,
        normalizedRiwaya,
      ),
      translationLangs: sanitizeTranslationLangs(
        parsed?.translationLangs,
        parsed?.translationLang,
      ),
      quranTranslationFontSize: Math.max(
        12,
        Math.min(28, Number(parsed?.quranTranslationFontSize) || 18),
      ),
      syncOffsetsMs: sanitizeSyncOffsetsMap(parsed?.syncOffsetsMs),
      favoriteReciters: sanitizeFavoriteReciters(parsed?.favoriteReciters),
      pinnedAyahs: sanitizePinnedAyahs(parsed?.pinnedAyahs),
      autoSelectFastestReciter:
        parsed?.autoSelectFastestReciter !== undefined
          ? Boolean(parsed.autoSelectFastestReciter)
          : DEFAULT_SETTINGS.autoSelectFastestReciter,
      reciterLatencyByKey: sanitizeLatencyMap(parsed?.reciterLatencyByKey),
      reciterAvailabilityById: sanitizeReciterAvailabilityMap(
        parsed?.reciterAvailabilityById,
      ),
      audioPlayerSkin: sanitizeAudioPlayerSkin(parsed?.audioPlayerSkin),
      usePrayerTimes:
        parsed?.usePrayerTimes !== undefined
          ? Boolean(parsed.usePrayerTimes)
          : DEFAULT_SETTINGS.usePrayerTimes,
      surahRepeatCount:
        Number.isFinite(Number(parsed?.surahRepeatCount))
          ? Math.max(0, Math.min(999, Math.floor(Number(parsed.surahRepeatCount))))
          : DEFAULT_SETTINGS.surahRepeatCount,
    };

    if (needsMigration) {
      // Toujours migrer depuis la clé legacy (publique) vers la clé appareil,
      // sans attendre le déverrouillage de la passphrase utilisateur.
      saveSettings(normalized);
    }

    return normalized;
  } catch {
    return cloneDefaultSettings();
  }
}

// Sanitize et valide les settings avant sauvegarde
function sanitizeSettings(settings) {
  const safeInput = settings && typeof settings === "object" ? settings : {};
  const safeSyncOffsets = sanitizeSyncOffsetsMap(safeInput.syncOffsetsMs);
  const lastSurah = clampSurah(safeInput.lastPosition?.surah);

  return {
    lang: VALID_LANGS.includes(safeInput.lang) ? safeInput.lang : "fr",
    theme: normalizeThemeId(safeInput.theme, "light"),
    riwaya: VALID_RIWAYAS.includes(safeInput.riwaya)
      ? safeInput.riwaya
      : "hafs",
    reciter:
      typeof safeInput.reciter === "string"
        ? safeInput.reciter.slice(0, 50)
        : "ar.alafasy",
    quranFontSize: Math.max(
      12,
      Math.min(96, Number(safeInput.quranFontSize ?? safeInput.fontSize) || 25),
    ),
    fontSize: Math.max(
      12,
      Math.min(96, Number(safeInput.quranFontSize ?? safeInput.fontSize) || 25),
    ),
    quranTranslationFontSize: Math.max(
      12,
      Math.min(28, Number(safeInput.quranTranslationFontSize) || 18),
    ),
    fontFamily: normalizeFontId(
      VALID_FONTS.includes(safeInput.fontFamily)
        ? safeInput.fontFamily
        : DEFAULT_FONT_ID,
      safeInput.riwaya,
    ),
    fontFamilyByRiwaya: sanitizeFontFamilyByRiwaya(
      safeInput.fontFamilyByRiwaya,
      safeInput.fontFamily,
      safeInput.riwaya,
    ),
    translationLang: VALID_TRANSLATION_LANGS.includes(safeInput.translationLang)
      ? safeInput.translationLang
      : "fr",
    translationLangs: sanitizeTranslationLangs(
      safeInput.translationLangs,
      safeInput.translationLang,
    ),
    wordTranslationLang: VALID_WORD_TRANSLATION_LANGS.includes(
      safeInput.wordTranslationLang,
    )
      ? safeInput.wordTranslationLang
      : VALID_WORD_TRANSLATION_LANGS.includes(safeInput.translationLang)
        ? safeInput.translationLang
        : "fr",
    showTranslation: Boolean(safeInput.showTranslation),
    showTajwid: Boolean(safeInput.showTajwid),
    displayMode: VALID_DISPLAY_MODES.includes(safeInput.displayMode)
      ? safeInput.displayMode
      : "surah",
    mushafLayout: ["list", "mushaf"].includes(safeInput.mushafLayout)
      ? safeInput.mushafLayout
      : "list",
    audioSpeed: [0.5, 0.75, 1, 1.25, 1.5, 2].includes(safeInput.audioSpeed)
      ? safeInput.audioSpeed
      : 1,
    continuousPlay: Boolean(safeInput.continuousPlay),
    warshStrictMode: Boolean(safeInput.warshStrictMode),
    syncOffsetsMs: safeSyncOffsets,
    favoriteReciters: sanitizeFavoriteReciters(safeInput.favoriteReciters),
    autoSelectFastestReciter:
      safeInput.autoSelectFastestReciter !== undefined
        ? Boolean(safeInput.autoSelectFastestReciter)
        : DEFAULT_SETTINGS.autoSelectFastestReciter,
    reciterLatencyByKey: sanitizeLatencyMap(safeInput.reciterLatencyByKey),
    reciterAvailabilityById: sanitizeReciterAvailabilityMap(
      safeInput.reciterAvailabilityById,
    ),
    autoNightMode: Boolean(safeInput.autoNightMode),
    nightStart: isValidClockTime(safeInput.nightStart)
      ? safeInput.nightStart
      : "20:00",
    nightEnd: isValidClockTime(safeInput.nightEnd)
      ? safeInput.nightEnd
      : "06:00",
    nightTheme: normalizeNightTheme(safeInput.nightTheme),
    dayTheme: normalizeDayTheme(safeInput.dayTheme),
    usePrayerTimes:
      safeInput.usePrayerTimes !== undefined
        ? Boolean(safeInput.usePrayerTimes)
        : DEFAULT_SETTINGS.usePrayerTimes,
    volume:
      typeof safeInput.volume === "number"
        ? Math.max(0, Math.min(1, safeInput.volume))
        : 1,
    showWordByWord:
      safeInput.showWordByWord !== undefined
        ? Boolean(safeInput.showWordByWord)
        : false,
    showTransliteration:
      safeInput.showTransliteration !== undefined
        ? Boolean(safeInput.showTransliteration)
        : true,
    showWordTranslation:
      safeInput.showWordTranslation !== undefined
        ? Boolean(safeInput.showWordTranslation)
        : true,
    translationReadingMode:
      safeInput.translationReadingMode !== undefined
        ? Boolean(safeInput.translationReadingMode)
        : false,
    pinnedAyahs: sanitizePinnedAyahs(safeInput.pinnedAyahs),
    showHome:
      safeInput.showHome !== undefined ? Boolean(safeInput.showHome) : true,
    showDuas:
      safeInput.showDuas !== undefined ? Boolean(safeInput.showDuas) : false,
    focusReading:
      safeInput.focusReading !== undefined
        ? Boolean(safeInput.focusReading)
        : false,
    playerMinimized:
      safeInput.playerMinimized !== undefined
        ? Boolean(safeInput.playerMinimized)
        : false,
    audioPlayerSkin: sanitizeAudioPlayerSkin(safeInput.audioPlayerSkin),
    surahRepeatCount:
      Number.isFinite(Number(safeInput.surahRepeatCount))
        ? Math.max(0, Math.min(999, Math.floor(Number(safeInput.surahRepeatCount))))
        : DEFAULT_SETTINGS.surahRepeatCount,
    wirdGoalType: ["pages", "hizb", "juz"].includes(safeInput.wirdGoalType)
      ? safeInput.wirdGoalType
      : "pages",
    wirdGoalAmount: Math.max(
      1,
      Math.min(30, Number(safeInput.wirdGoalAmount) || 5),
    ),
    karaokeFollow:
      safeInput.karaokeFollow !== undefined
        ? Boolean(safeInput.karaokeFollow)
        : true,
    lastPosition: {
      surah: lastSurah,
      ayah: clampAyahForSurah(lastSurah, safeInput.lastPosition?.ayah),
      page: Math.max(
        1,
        Math.min(604, Number(safeInput.lastPosition?.page) || 1),
      ),
      juz: Math.max(1, Math.min(30, Number(safeInput.lastPosition?.juz) || 1)),
    },
  };
}

export function saveSettings(settings) {
  const safe = sanitizeSettings(settings);
  try {
    localStorage.setItem(SETTINGS_KEY, encryptData(safe));
    return true;
  } catch {
    // Never fall back to plaintext when encryption/storage is unavailable.
    return false;
  }
}

export async function readPrivateDataSnapshot() {
  return {
    settings: getSettings(),
    notes: await getAllNotes(),
    bookmarks: await getAllBookmarks(),
  };
}

export async function readRawPrivateDataSnapshot() {
  return {
    settings: localStorage.getItem(SETTINGS_KEY),
    notes: await dbGetAll("notes"),
    bookmarks: await dbGetAll("bookmarks"),
  };
}

export async function rewritePrivateDataSnapshot(snapshot) {
  if (!snapshot) {
    throw new Error("Unable to persist protected settings");
  }
  const notes = (snapshot.notes || []).map((value) => {
    const record = parseRecordOrNull(noteRecordSchema, value);
    if (!record) throw new Error("Unable to validate a protected note");
    return encodePrivateRecord(record);
  });
  const bookmarks = (snapshot.bookmarks || []).map((value) => {
    const record = parseRecordOrNull(bookmarkRecordSchema, value);
    if (!record) throw new Error("Unable to validate a protected bookmark");
    return encodePrivateRecord(record);
  });
  if (!saveSettings(snapshot.settings)) {
    throw new Error("Unable to persist protected settings");
  }
  if (!(await dbReplaceStores({ notes, bookmarks }))) {
    throw new Error("Unable to rotate private IndexedDB stores");
  }
  return true;
}

export async function restoreRawPrivateDataSnapshot(snapshot) {
  try {
    if (typeof snapshot?.settings === "string") {
      localStorage.setItem(SETTINGS_KEY, snapshot.settings);
    } else {
      localStorage.removeItem(SETTINGS_KEY);
    }
    return dbReplaceStores({
      notes: snapshot?.notes || [],
      bookmarks: snapshot?.bookmarks || [],
    });
  } catch {
    return false;
  }
}

export function updateSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}

/* ═══════════════════════════════════════════ */
/*  READING POSITION (quick access)           */
/* ═══════════════════════════════════════════ */

export function savePosition(surah, ayah, page) {
  updateSetting("lastPosition", { surah, ayah, page });
}

export function getPosition() {
  return getSettings().lastPosition;
}

function clampSyncOffset(ms) {
  const n = Number(ms) || 0;
  return Math.max(-500, Math.min(500, n));
}

export function getSyncOffsetMs(riwaya, reciterId) {
  const settings = getSettings();
  const key = `${riwaya}:${reciterId}`;
  return clampSyncOffset(settings.syncOffsetsMs?.[key] ?? 0);
}

export function setSyncOffsetMs(riwaya, reciterId, offsetMs) {
  const settings = getSettings();
  const key = `${riwaya}:${reciterId}`;
  settings.syncOffsetsMs = {
    ...(settings.syncOffsetsMs || {}),
    [key]: clampSyncOffset(offsetMs),
  };
  saveSettings(settings);
  return settings.syncOffsetsMs[key];
}
