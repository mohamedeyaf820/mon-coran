/**
 * Storage service – IndexedDB (via idb) for large data, localStorage for preferences.
 * Stores: notes, bookmarks, reading-position, cached text, settings.
 */

import { dbGet, dbSet, dbDelete, dbGetAll } from "./dbService";
import {
  encryptData,
  decryptDataWithMeta,
  isEncryptionUnlocked,
} from "./cryptoUtil";
import {
  bookmarkRecordSchema,
  noteRecordSchema,
} from "./storageValidation";

function parseRecordOrNull(schema, value) {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

/* ═══════════════════════════════════════════ */
/*  NOTES                                     */
/* ═══════════════════════════════════════════ */

export async function saveNote(surah, ayah, text) {
  const id = `${surah}:${ayah}`;
  await dbSet("notes", { id, surah, ayah, text, updatedAt: Date.now() });
}

export async function getNote(surah, ayah) {
  const raw = await dbGet("notes", `${surah}:${ayah}`);
  return parseRecordOrNull(noteRecordSchema, raw);
}

export async function deleteNote(surah, ayah) {
  return dbDelete("notes", `${surah}:${ayah}`);
}

export async function getAllNotes() {
  const raw = await dbGetAll("notes");
  return (Array.isArray(raw) ? raw : [])
    .map((entry) => parseRecordOrNull(noteRecordSchema, entry))
    .filter(Boolean);
}

/* ═══════════════════════════════════════════ */
/*  BOOKMARKS                                 */
/* ═══════════════════════════════════════════ */

export async function addBookmark(surah, ayah, label = "") {
  const id = `${surah}:${ayah}`;
  await dbSet("bookmarks", { id, surah, ayah, label, createdAt: Date.now() });
}

export async function removeBookmark(surah, ayah) {
  return dbDelete("bookmarks", `${surah}:${ayah}`);
}

export async function isBookmarked(surah, ayah) {
  const val = await dbGet("bookmarks", `${surah}:${ayah}`);
  return !!parseRecordOrNull(bookmarkRecordSchema, val);
}

export async function getAllBookmarks() {
  const raw = await dbGetAll("bookmarks");
  return (Array.isArray(raw) ? raw : [])
    .map((entry) => parseRecordOrNull(bookmarkRecordSchema, entry))
    .filter(Boolean);
}

/* ═══════════════════════════════════════════ */
/*  SETTINGS (localStorage – small & sync)    */
/* ═══════════════════════════════════════════ */

const SETTINGS_KEY = "mushaf-plus-settings";

// Valeurs valides pour validation
const VALID_LANGS = ["fr", "en"];
const VALID_TRANSLATION_LANGS = ["fr", "en", "es", "de", "tr", "ur"];
const VALID_WORD_TRANSLATION_LANGS = ["fr", "en"];
const VALID_THEMES = [
  "light",
  "sepia",
  "dark",
];
const LEGACY_THEME_MAP = {
  "premium-beige": "sepia",
  ocean: "dark",
  "night-blue": "dark",
  "quran-night": "dark",
  forest: "dark",
  oled: "dark",
};
const VALID_RIWAYAS = ["hafs", "warsh"];
const VALID_DISPLAY_MODES = ["surah", "page", "juz"];
const VALID_AUDIO_PLAYER_SKINS = ["orbit", "classic"];
const VALID_FONTS = [
  // Polices officielles mushaf (priorité)
  "mushaf-1441h",
  "mushaf-tajweed",
  "uthmanic-digital",
  "uthmanic-bold",
  "qalam-madinah",
  "qalam-hanafi",
  "uthman-taha",
  // Polices Naskh académiques
  "scheherazade-new",
  "amiri-quran",
  "amiri",
  "noto-naskh",
  "noto-naskh-arabic",
  "lateef",
  // Polices display
  "markazi-text",
  "el-messiri",
  "kfgqpc-uthman-taha-naskh",
  "reem-kufi",
  "aref-ruqaa",
  "cairo",
  "harmattan",
  "mada",
  "tajawal",
  "lemonada",
  "jomhuria",
  "rakkas",
  "marhey",
  "mirza",
  // legacy fallbacks kept for migration
  "scheherazade",
  "me-quran",
];

function sanitizeFavoriteReciters(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input)]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim().slice(0, 80))
    .slice(0, 24);
}

function sanitizeSyncOffsetsMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input)
    .filter(([key]) => typeof key === "string" && key.length > 0 && key.length <= 120)
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
      typeof value.lastError === "string" ? value.lastError.trim().slice(0, 160) : "";

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
  fontSize: 42,
  quranFontSize: 42,
  fontFamily: "scheherazade-new",
  translationLang: "fr",
  wordTranslationLang: "fr",
  showTranslation: true,
  showTajwid: true,
  displayMode: "surah", // 'surah' | 'page' | 'juz'
  mushafLayout: "list", // 'list' | 'mushaf'
  audioSpeed: 1,
  volume: 1,
  continuousPlay: true,
  warshStrictMode: true,
  syncOffsetsMs: {},
  favoriteReciters: [],
  autoSelectFastestReciter: true,
  reciterLatencyByKey: {},
  reciterAvailabilityById: {},
  autoNightMode: false,
  nightStart: "20:00",
  nightEnd: "06:00",
  nightTheme: "dark",
  dayTheme: "light",
  wirdGoalType: "pages",
  wirdGoalAmount: 5,
  showHome: true,
  showDuas: false,
  focusReading: false,
  playerMinimized: false,
  audioPlayerSkin: "orbit",
  lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
};

function normalizeTheme(theme, fallback = "light") {
  if (VALID_THEMES.includes(theme)) return theme;
  if (typeof theme === "string" && LEGACY_THEME_MAP[theme]) {
    return LEGACY_THEME_MAP[theme];
  }
  return fallback;
}

function normalizeDayTheme(theme) {
  const normalized = normalizeTheme(theme, "light");
  return ["light", "sepia"].includes(normalized) ? normalized : "light";
}

function normalizeNightTheme(theme) {
  const normalized = normalizeTheme(theme, "dark");
  return normalized === "dark" ? normalized : "dark";
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const { data: decrypted, usedLegacy } = decryptDataWithMeta(raw);
    const parsed = decrypted || JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    const normalized = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      syncOffsetsMs: sanitizeSyncOffsetsMap(parsed?.syncOffsetsMs),
      favoriteReciters: sanitizeFavoriteReciters(parsed?.favoriteReciters),
      autoSelectFastestReciter:
        parsed?.autoSelectFastestReciter !== undefined
          ? Boolean(parsed.autoSelectFastestReciter)
          : DEFAULT_SETTINGS.autoSelectFastestReciter,
      reciterLatencyByKey: sanitizeLatencyMap(parsed?.reciterLatencyByKey),
      reciterAvailabilityById: sanitizeReciterAvailabilityMap(
        parsed?.reciterAvailabilityById,
      ),
      audioPlayerSkin: sanitizeAudioPlayerSkin(parsed?.audioPlayerSkin),
    };

    if (usedLegacy && isEncryptionUnlocked()) {
      saveSettings(normalized);
    }

    return normalized;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// Sanitize et valide les settings avant sauvegarde
function sanitizeSettings(settings) {
  const safeInput = settings && typeof settings === "object" ? settings : {};
  const safeSyncOffsets =
    sanitizeSyncOffsetsMap(safeInput.syncOffsetsMs);

  return {
    lang: VALID_LANGS.includes(safeInput.lang) ? safeInput.lang : "fr",
    theme: normalizeTheme(safeInput.theme, "light"),
    riwaya: VALID_RIWAYAS.includes(safeInput.riwaya)
      ? safeInput.riwaya
      : "hafs",
    reciter:
      typeof safeInput.reciter === "string"
        ? safeInput.reciter.slice(0, 50)
        : "ar.alafasy",
    quranFontSize: Math.max(
      32,
      Math.min(64, Number(safeInput.quranFontSize ?? safeInput.fontSize) || 42),
    ),
    fontSize: Math.max(
      32,
      Math.min(64, Number(safeInput.quranFontSize ?? safeInput.fontSize) || 42),
    ),
    fontFamily: VALID_FONTS.includes(safeInput.fontFamily)
      ? safeInput.fontFamily
      : "scheherazade-new",
    translationLang: VALID_TRANSLATION_LANGS.includes(safeInput.translationLang)
      ? safeInput.translationLang
      : "fr",
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
        : true,
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
      surah: Math.max(
        1,
        Math.min(114, Number(safeInput.lastPosition?.surah) || 1),
      ),
      ayah: Math.max(
        1,
        Math.min(286, Number(safeInput.lastPosition?.ayah) || 1),
      ),
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
  } catch {
    // Storage might be unavailable (private mode/quota exceeded)
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
