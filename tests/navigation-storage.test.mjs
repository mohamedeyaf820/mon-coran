import test from "node:test";
import assert from "node:assert/strict";

import { parseInitialRoute } from "../src/hooks/useUrlSync.js";
import {
  appendNativeAyahMarker,
  getAyahTextForFont,
  getFontOptionsForRiwaya,
  getNativeAyahMarker,
  getQuranWordTextForFont,
  normalizeFontId,
} from "../src/data/fonts.js";
import { getSettings, saveSettings } from "../src/services/storageService.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    dump() {
      return new Map(map);
    },
  };
}

function setPathname(pathname) {
  globalThis.window = {
    location: { pathname },
  };
}

test("navigation: parses reading, duas and legal routes safely", () => {
  setPathname("/surah/2/255");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "surah",
    currentSurah: 2,
    currentAyah: 255,
    routeNotFound: false,
  });

  setPathname("/page/604");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "page",
    currentPage: 604,
    routeNotFound: false,
  });

  setPathname("/juz/30");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "juz",
    currentJuz: 30,
    routeNotFound: false,
  });

  setPathname("/duas");
  assert.deepEqual(parseInitialRoute(), { showHome: false, showDuas: true });

  setPathname("/privacy");
  assert.deepEqual(parseInitialRoute(), {
    legalPage: "privacy",
    showHome: false,
    showDuas: false,
  });
});

test("navigation: rejects invalid route numbers", () => {
  for (const pathname of [
    "/surah/999/999",
    "/surah/2/999",
    "/surah/1/999",
    "/page/0",
    "/juz/-2",
  ]) {
    setPathname(pathname);
    assert.equal(parseInitialRoute().routeNotFound, true, pathname);
  }
});

test("navigation: rejects partial route matches", () => {
  setPathname("/page/12abc");
  assert.equal(parseInitialRoute().routeNotFound, true);

  setPathname("/surah/2/3/extra");
  assert.equal(parseInitialRoute().routeNotFound, true);
});

test("storage: settings round-trip encrypted and sanitized", () => {
  globalThis.localStorage = createMockStorage();

  saveSettings({
    lang: "fr",
    theme: "dark",
    skipSplashAnimation: true,
    riwaya: "warsh",
    reciter: "ar.alafasy",
    quranFontSize: 200,
    volume: 2,
    lastPosition: { surah: 9, ayah: 999, page: 900, juz: 99 },
  });

  const raw = localStorage.getItem("mushaf-plus-settings");
  assert.equal(typeof raw, "string");
  assert.equal(raw.trim().startsWith("{"), false);

  const settings = getSettings();
  assert.equal(settings.lang, "fr");
  assert.equal(settings.theme, "dark");
  assert.equal(settings.skipSplashAnimation, true);
  assert.equal(settings.riwaya, "warsh");
  assert.equal(settings.quranFontSize, 96);
  assert.equal(settings.volume, 1);
  assert.deepEqual(settings.lastPosition, {
    surah: 9,
    ayah: 129,
    page: 604,
    juz: 30,
  });
});

test("storage: pinned ayahs clamp by exact surah ayah count", () => {
  globalThis.localStorage = createMockStorage();

  saveSettings({
    pinnedAyahs: [
      { surah: 1, ayah: 999, text: "x" },
      { surah: 9, ayah: 999, text: "y" },
    ],
  });

  const settings = getSettings();
  assert.deepEqual(
    settings.pinnedAyahs.map(({ surah, ayah }) => ({ surah, ayah })),
    [
      { surah: 1, ayah: 7 },
      { surah: 9, ayah: 129 },
    ],
  );
});

test("storage: preserves per-riwaya Quran font choices", () => {
  globalThis.localStorage = createMockStorage();

  saveSettings({
    riwaya: "warsh",
    fontFamily: "kfgqpc-warsh",
    fontFamilyByRiwaya: {
      hafs: "qpc-indopak",
      warsh: "kfgqpc-warsh",
    },
  });

  const settings = getSettings();
  assert.equal(settings.fontFamily, "kfgqpc-warsh");
  assert.deepEqual(settings.fontFamilyByRiwaya, {
    hafs: "qpc-indopak",
    warsh: "kfgqpc-warsh",
  });
});

test("storage: migrates removed local-only Warsh font aliases", () => {
  globalThis.localStorage = createMockStorage();

  saveSettings({
    riwaya: "warsh",
    fontFamily: "aal-maghribi-warsh",
    fontFamilyByRiwaya: {
      hafs: "qpc-nastaleeq",
      warsh: "aal-maghribi-warsh",
    },
  });

  const settings = getSettings();
  assert.equal(settings.fontFamily, "kfgqpc-warsh");
  assert.deepEqual(settings.fontFamilyByRiwaya, {
    hafs: "qpc-indopak",
    warsh: "kfgqpc-warsh",
  });
});

test("fonts: exposes riwaya-safe native ayah markers", () => {
  assert.deepEqual(
    getFontOptionsForRiwaya("hafs").map((font) => font.id),
    [
      "qpc-hafs",
      "qpc-indopak",
      "scheherazade-new",
      "amiri-quran",
      "noto-naskh-arabic",
    ],
  );
  assert.deepEqual(
    getFontOptionsForRiwaya("warsh").map((font) => font.id),
    ["qpc-warsh", "kfgqpc-warsh", "scheherazade-new-warsh"],
  );

  assert.equal(getNativeAyahMarker(1, "qpc-hafs", "hafs"), "\u0661");
  assert.equal(getNativeAyahMarker(10, "qpc-hafs", "hafs"), "\u0661\u0660");
  assert.equal(getNativeAyahMarker(100, "qpc-hafs", "hafs"), "\u0661\u0660\u0660");
  assert.equal(getNativeAyahMarker(1, "qpc-indopak", "hafs"), "\u06dd\u06f1");
  assert.equal(getNativeAyahMarker(1, "qpc-warsh", "warsh"), "\u0661");
  assert.equal(getNativeAyahMarker(1, "kfgqpc-warsh", "warsh"), "\u0661");
  assert.equal(getNativeAyahMarker(10, "kfgqpc-warsh", "warsh"), "\u0661\u0660");
  assert.equal(getNativeAyahMarker(100, "kfgqpc-warsh", "warsh"), "\u0661\u0660\u0660");
  assert.equal(getNativeAyahMarker(1, "scheherazade-new", "hafs"), "\u06dd\u0661");
  assert.equal(getNativeAyahMarker(1, "scheherazade-new-warsh", "warsh"), "\u06dd\u0661");
  assert.equal(normalizeFontId("scheherazade-new", "warsh"), "scheherazade-new-warsh");
  assert.equal(normalizeFontId("amiri-quran", "warsh"), "qpc-warsh");
});

test("fonts: appends native ayah markers without duplicates", () => {
  assert.equal(
    appendNativeAyahMarker("\u0627\u0644\u062d\u0645\u062f", 7, "qpc-hafs", "hafs"),
    "\u0627\u0644\u062d\u0645\u062f \u0667",
  );
  assert.equal(
    appendNativeAyahMarker("\u0627\u0644\u062d\u0645\u062f \u06dd\u0667", 7, "qpc-hafs", "hafs"),
    "\u0627\u0644\u062d\u0645\u062f \u0667",
  );
  assert.equal(
    appendNativeAyahMarker("\u0627\u0644\u062d\u0645\u062f \u0667", 7, "qpc-indopak", "hafs"),
    "\u0627\u0644\u062d\u0645\u062f \u06dd\u06f7",
  );
});

test("fonts: strips source markers before a separate ayah marker is rendered", () => {
  assert.equal(
    appendNativeAyahMarker("\u0627\u0644\u062d\u0645\u062f \u0667", 7, "qpc-hafs", "hafs", false),
    "\u0627\u0644\u062d\u0645\u062f",
  );
  assert.equal(
    appendNativeAyahMarker("\u0627\u0644\u062d\u0645\u062f \u06dd\u06f7", 7, "qpc-indopak", "hafs", false),
    "\u0627\u0644\u062d\u0645\u062f",
  );
});

test("fonts: selects Quran.com text compatible with the active Hafs font", () => {
  const ayah = {
    text: "fallback",
    quranCom: {
      textQpcHafs: "qpc hafs",
      textIndopak: "indopak",
      textUthmani: "uthmani",
    },
  };
  const word = {
    text: "fallback word",
    textQpcHafs: "qpc word",
    textIndopak: "indopak word",
    textUthmani: "uthmani word",
  };

  assert.equal(getAyahTextForFont(ayah, "qpc-hafs", "hafs"), "qpc hafs");
  assert.equal(getAyahTextForFont(ayah, "qpc-indopak", "hafs"), "indopak");
  assert.equal(getAyahTextForFont(ayah, "amiri-quran", "hafs"), "uthmani");
  assert.equal(getQuranWordTextForFont(word, "qpc-indopak", "hafs"), "indopak word");
});
