import test from "node:test";
import assert from "node:assert/strict";
import { getSettings, saveSettings } from "../src/services/storageService.js";
import { decryptDataWithMeta } from "../src/services/cryptoUtil.js";
test("legacy fontSize migrates once and canonical quranFontSize takes precedence", () => {
  const values = new Map();
  globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) };
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ fontSize: 38, audioPlayerSkin: "classic" }));
  assert.equal(getSettings().quranFontSize, 38);
  const stored = decryptDataWithMeta(localStorage.getItem("mushaf-plus-settings")).data;
  assert.equal(stored.quranFontSize, 38);
  assert.equal(stored.fontSize, undefined);
  assert.equal(stored.audioPlayerSkin, undefined);
  saveSettings({ quranFontSize: 30, fontSize: 48 });
  assert.equal(getSettings().quranFontSize, 30);
});
