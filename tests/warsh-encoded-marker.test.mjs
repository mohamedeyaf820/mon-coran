import test from "node:test";
import assert from "node:assert/strict";
import { stripWarshEncodedAyahMarker } from "../src/utils/warshAyahMarker.js";
import { getAyahTextForFont, appendNativeAyahMarker } from "../src/data/fonts.js";
import { isNonVerseQuranSign } from "../src/utils/quranUtils.js";

test("hizb, sajda and waqf remain annotations, including at the verse boundary", () => {
  for (const sign of ['۞', '۩', 'ۖ']) {
    assert.equal(isNonVerseQuranSign(sign), true);
    assert.ok(appendNativeAyahMarker(`نَصٌّ ${sign}`, 1, 'kfgqpc-warsh', 'warsh').includes(sign));
  }
  assert.equal(isNonVerseQuranSign('۝١'), false);
  assert.equal(isNonVerseQuranSign('١٦'), false);
});

test("Warsh font rosettes are decoded only at the matching verse boundary", () => {
  for (let number = 1; number <= 286; number++) {
    const marker = String.fromCodePoint(0xfc00 + number - 1);
    const text = `نَصٌّۖ ${marker}`;
    assert.equal(stripWarshEncodedAyahMarker(text, number), "نَصٌّۖ");
    assert.equal(stripWarshEncodedAyahMarker(`${marker} نَصٌّ`, number), `${marker} نَصٌّ`);
    assert.equal(stripWarshEncodedAyahMarker(`نَصٌّ${marker}`, number), `نَصٌّ${marker}`);
    assert.equal(stripWarshEncodedAyahMarker(text, number + 1), text);
  }
});

test("Warsh rendering replaces an encoded marker without changing raw data or waqf", () => {
  const ayah = Object.freeze({ numberInSurah: 1, text: "نَصٌّۖ ﰀ" });
  const rendered = getAyahTextForFont(ayah, "kfgqpc-warsh", "warsh");
  assert.equal(appendNativeAyahMarker(rendered, 1, "kfgqpc-warsh", "warsh"), "نَصٌّۖ\u202f١");
  assert.equal(ayah.text, "نَصٌّۖ ﰀ");
  assert.equal(stripWarshEncodedAyahMarker("نَصٌّ۩۞ﷲۖ", 1), "نَصٌّ۩۞ﷲۖ");
});
