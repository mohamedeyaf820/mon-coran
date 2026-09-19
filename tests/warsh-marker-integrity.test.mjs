import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  appendNativeAyahMarker,
  legacyWarshMarkerGlyph,
  stripEmbeddedAyahMarkers,
} from "../src/data/fonts.js";
import { normalizeQuranGlyphText } from "../src/utils/quranUtils.js";

const legacyAyahs = JSON.parse(
  readFileSync(new URL("./fixtures/warsh-legacy-ayahs.json", import.meta.url), "utf8")
);
const newSourceAyahs = JSON.parse(
  readFileSync(new URL("./fixtures/warsh-new-sample-ayahs.json", import.meta.url), "utf8")
);

const base = (body) => normalizeQuranGlyphText(body).trim();

test("legacy Warsh corpus: stripping the marker never removes a Quran letter", () => {
  assert.ok(legacyAyahs.length > 6000, "fixture must cover the whole legacy corpus");
  for (const [surah, ayah, body] of legacyAyahs) {
    const marker = legacyWarshMarkerGlyph(ayah);
    assert.ok(marker, `surah ${surah}:${ayah} has no legacy marker glyph`);
    const stripped = stripEmbeddedAyahMarkers(`${body}\u00a0${marker}`, { ayahNumber: ayah });
    assert.equal(stripped, base(body), `surah ${surah}:${ayah} lost Quran text`);
  }
});

test("legacy Warsh corpus: markers attach in every whitespace form", () => {
  for (const [surah, ayah, body] of legacyAyahs.slice(0, 400)) {
    const marker = legacyWarshMarkerGlyph(ayah);
    for (const payload of [`${body}${marker}`, `${body} ${marker}`, `${body}\u00a0${marker}`]) {
      assert.equal(
        stripEmbeddedAyahMarkers(payload, { ayahNumber: ayah }),
        base(body),
        `surah ${surah}:${ayah} payload ${JSON.stringify(payload.slice(-6))}`
      );
    }
  }
});

test("presentation forms are content unless they are the proven ayah number", () => {
  const [surah, ayah, body] = legacyAyahs.find(([, a]) => a === 1) || [1, 1, "بِسْمِ ٱللَّهِ"];
  const wrongGlyph = String.fromCodePoint(0xfc00 + 5);
  assert.notEqual(wrongGlyph, legacyWarshMarkerGlyph(ayah));
  assert.equal(
    stripEmbeddedAyahMarkers(`${body} ${wrongGlyph}`, { ayahNumber: ayah }),
    `${base(body)} ${wrongGlyph}`
  );
  assert.equal(
    stripEmbeddedAyahMarkers(`${body} ${legacyWarshMarkerGlyph(ayah)}`, { ayahNumber: ayah }),
    base(body)
  );
});

test("without ayah-number evidence no presentation form is stripped", () => {
  const sacredLigature = "\ufc58";
  const text = `رَبِّ ${sacredLigature}`;
  assert.equal(stripEmbeddedAyahMarkers(text), text);
  assert.equal(stripEmbeddedAyahMarkers(text, {}), text);
});

test("digit and bracketed marker forms still collapse", () => {
  const verse = "اَ۫لْحَيُّ اُ۫لْقَيُّومُ";
  for (const payload of [
    `${verse} ۝١`,
    `${verse} ۝١ ۝١`,
    `${verse} ١`,
    `${verse} ۱`,
    `${verse} ﴿١﴾`,
    `${verse} ۝\u200f`,
    `${verse} ۝`,
  ]) {
    assert.equal(stripEmbeddedAyahMarkers(payload, { ayahNumber: 2 }), base(verse), payload);
  }
});

test("waqf and recitation signs survive marker stripping", () => {
  const signed = "قُولُوا۟ ٱللَّهَۖ نَعْبُدُۚ وَمَا۟";
  assert.equal(stripEmbeddedAyahMarkers(signed, { ayahNumber: 3 }), base(signed));
});

test("append then strip round-trips for Warsh ayahs", () => {
  for (const [, ayah, body] of legacyAyahs.slice(0, 300)) {
    const appended = appendNativeAyahMarker(body, ayah, "qpc-warsh", "warsh");
    assert.equal(stripEmbeddedAyahMarkers(appended, { ayahNumber: ayah }), base(body));
  }
});

test("the new Unicode Warsh source carries no presentation forms to strip", () => {
  assert.ok(newSourceAyahs.length > 400);
  for (const [surah, ayah, body] of newSourceAyahs) {
    assert.equal(/[\ufc00-\ufdff]/u.test(body), false, `${surah}:${ayah}`);
    assert.equal(
      stripEmbeddedAyahMarkers(body, { ayahNumber: ayah }),
      base(body),
      `${surah}:${ayah} new-source text changed`
    );
  }
});
