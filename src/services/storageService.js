/**
 * Storage service – IndexedDB (via idb) for large data, localStorage for preferences.
 * Stores: notes, bookmarks, reading-position, cached text, settings.
 */

import { dbGet, dbSet, dbDelete, dbGetAll } from "./dbService";

/* ═══════════════════════════════════════════ */
/*  NOTES                                     */
/* ═══════════════════════════════════════════ */

export async function saveNote(surah, ayah, text) {
  const id = `${surah}:${ayah}`;
  await dbSet("notes", { id, surah, ayah, text, updatedAt: Date.now() });
}

export async function getNote(surah, ayah) {
  return dbGet("notes", `${surah}:${ayah}`);
}

export async function deleteNote(surah, ayah) {
  return dbDelete("notes", `${surah}:${ayah}`);
}

export async function getAllNotes() {
  return dbGetAll("notes");
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
  return !!val;
}

export async function getAllBookmarks() {
  return dbGetAll("bookmarks");
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
  "quran-night",
];
const LEGACY_THEME_MAP = {
  "premium-beige": "sepia",
  ocean: "quran-night",
  "night-blue": "quran-night",
  forest: "dark",
  oled: "dark",
};
const VALID_RIWAYAS = ["hafs", "warsh"];
const VALID_DISPLAY_MODES = ["surah", "page", "juz"];
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
  return ["dark", "quran-night"].includes(normalized) ? normalized : "dark";
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      syncOffsetsMs: {
        ...DEFAULT_SETTINGS.syncOffsetsMs,
        ...(parsed?.syncOffsetsMs || {}),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// Sanitize et valide les settings avant sauvegarde
function sanitizeSettings(settings) {
  const safeInput = settings && typeof settings === "object" ? settings : {};
  const safeSyncOffsets =
    safeInput.syncOffsetsMs &&
    typeof safeInput.syncOffsetsMs === "object" &&
    !Array.isArray(safeInput.syncOffsetsMs)
      ? safeInput.syncOffsetsMs
      : {};

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
    autoNightMode: Boolean(safeInput.autoNightMode),
    nightStart: /^\d{2}:\d{2}$/.test(safeInput.nightStart)
      ? safeInput.nightStart
      : "20:00",
    nightEnd: /^\d{2}:\d{2}$/.test(safeInput.nightEnd)
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
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
