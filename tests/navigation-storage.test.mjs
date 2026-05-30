import test from "node:test";
import assert from "node:assert/strict";

import { parseInitialRoute } from "../src/hooks/useUrlSync.js";
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

test("navigation: parses surah, page, juz and duas routes safely", () => {
  setPathname("/surah/2/255");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "surah",
    currentSurah: 2,
    currentAyah: 255,
  });

  setPathname("/page/604");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "page",
    currentPage: 604,
  });

  setPathname("/juz/30");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "juz",
    currentJuz: 30,
  });

  setPathname("/duas");
  assert.deepEqual(parseInitialRoute(), { showHome: false, showDuas: true });
});

test("navigation: clamps invalid route numbers", () => {
  setPathname("/surah/999/999");
  assert.deepEqual(parseInitialRoute(), {
    showHome: false,
    showDuas: false,
    displayMode: "surah",
    currentSurah: 114,
    currentAyah: 286,
  });

  setPathname("/page/0");
  assert.equal(parseInitialRoute().currentPage, 1);

  setPathname("/juz/-2");
  assert.deepEqual(parseInitialRoute(), { showHome: true, showDuas: false });
});

test("storage: settings round-trip encrypted and sanitized", () => {
  globalThis.localStorage = createMockStorage();

  saveSettings({
    lang: "fr",
    theme: "dark",
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
  assert.equal(settings.riwaya, "warsh");
  assert.equal(settings.quranFontSize, 96);
  assert.equal(settings.volume, 1);
  assert.deepEqual(settings.lastPosition, {
    surah: 9,
    ayah: 286,
    page: 604,
    juz: 30,
  });
});
