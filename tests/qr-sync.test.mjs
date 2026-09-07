import test from "node:test";
import assert from "node:assert/strict";

import {
  toBase64Url,
  fromBase64Url,
  generateQrSvg,
  encodeSyncToken,
  decodeSyncToken,
  buildSyncUrl,
  applySyncPayload,
} from "../src/services/qrSyncService.js";
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
  };
}

test("qrSync: base64url encodes and decodes Unicode text accurately", () => {
  const original = JSON.stringify({
    textFr: "Sourate Al-Baqarah (verset 255 - Âyat al-Kursî)",
    textAr: "﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ﴾",
    emoji: "📖✨",
  });

  const encoded = toBase64Url(original);
  assert.equal(typeof encoded, "string");
  assert.ok(!encoded.includes("+"));
  assert.ok(!encoded.includes("/"));
  assert.ok(!encoded.includes("="));

  const decoded = fromBase64Url(encoded);
  assert.equal(decoded, original);
});

test("qrSync: generates clean scalable SVG QR code markup", () => {
  const svg = generateQrSvg("https://mushafplus.app/#sync=test1234", {
    errorCorrectionLevel: "M",
    cellMargin: 2,
  });

  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("viewBox="));
  assert.ok(svg.includes("<path"));
  assert.ok(svg.endsWith("</svg>"));
});

test("qrSync: encodeSyncToken and decodeSyncToken round-trip payload safely", () => {
  const payload = {
    app: "MushafPlus",
    v: 1,
    t: 1726000000000,
    pos: { s: 2, a: 255, p: 42, j: 3 },
    rw: "warsh",
    th: "sepia",
    rc: "ar.alafasy",
    fs: 28,
    dm: "page",
    bm: [{ s: 2, a: 255, l: "Ayat Al-Kursi", t: 1726000000000 }],
    nt: [{ s: 2, a: 255, t: "Méditation sur ce verset", u: 1726000000000 }],
  };

  const token = encodeSyncToken(payload);
  assert.ok(token.length > 50);

  // Direct token decode
  const restoredFromToken = decodeSyncToken(token);
  assert.deepEqual(restoredFromToken, payload);

  // Full URL decode with #sync=
  const fullUrl = buildSyncUrl(token);
  const restoredFromUrl = decodeSyncToken(fullUrl);
  assert.deepEqual(restoredFromUrl, payload);
});

test("qrSync: decodeSyncToken rejects corrupted or unauthorized payloads", () => {
  assert.throws(() => decodeSyncToken(""), /Token must be a non-empty string/);
  assert.throws(() => decodeSyncToken("invalid-base64-!@#$"), /Invalid base64 string/);

  // Valid base64 but not MushafPlus
  const fakeToken = toBase64Url(JSON.stringify({ app: "OtherApp", data: 123 }));
  assert.throws(
    () => decodeSyncToken(fakeToken),
    /Unsupported or unrecognized MushafPlus sync data/,
  );
});

test("qrSync: applySyncPayload restores position and settings", async () => {
  globalThis.localStorage = createMockStorage();
  saveSettings({
    lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
    riwaya: "hafs",
    theme: "light",
  });

  const payload = {
    app: "MushafPlus",
    v: 1,
    t: Date.now(),
    pos: { s: 18, a: 10, p: 294, j: 15 },
    rw: "warsh",
    th: "sepia",
    rc: "ar.alafasy",
    fs: 26,
    dm: "surah",
    bm: [],
    nt: [],
  };

  const result = await applySyncPayload(payload);
  assert.equal(result.riwaya, "warsh");
  assert.equal(result.position.surah, 18);
  assert.equal(result.position.ayah, 10);
  assert.equal(result.position.page, 294);

  const updatedSettings = getSettings();
  assert.equal(updatedSettings.riwaya, "warsh");
  assert.equal(updatedSettings.theme, "sepia");
  assert.equal(updatedSettings.lastPosition.surah, 18);
});
