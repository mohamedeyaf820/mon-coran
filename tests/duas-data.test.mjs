import test from "node:test";
import assert from "node:assert/strict";

import QURAN_DUAS from "../src/data/duas.js";

const DAILY_SITUATIONS = [
  "hisn-wake-up",
  "hisn-toilet-enter",
  "hisn-toilet-exit",
  "hisn-wudu-before",
  "hisn-wudu-after",
  "hisn-home-exit",
  "hisn-home-exit-protection",
  "hisn-home-enter",
  "hisn-masjid-going",
  "hisn-masjid-enter",
  "hisn-masjid-exit",
  "hisn-vehicle",
  "hisn-travel",
  "hisn-travel-stopover",
  "hisn-travel-return",
  "hisn-morning",
  "hisn-evening",
  "hisn-morning-evening-protection",
  "hisn-morning-evening-contentment",
  "hisn-morning-evening-wellbeing",
  "hisn-sleep-short",
  "hisn-eating-forgot-name",
  "hisn-good-bad-news",
];

test("the offline dua library exposes one hundred uniquely identified entries", () => {
  assert.equal(QURAN_DUAS.length, 100);
  assert.equal(new Set(QURAN_DUAS.map(({ id }) => id)).size, QURAN_DUAS.length);
});

test("daily Hisn al-Muslim situations remain complete and searchable", () => {
  const byId = new Map(QURAN_DUAS.map((dua) => [dua.id, dua]));

  for (const id of DAILY_SITUATIONS) {
    const dua = byId.get(id);
    assert.ok(dua, `${id} must remain in the offline library`);
    assert.match(dua.source, /^Hisn al-Muslim/);
    assert.ok(dua.title?.fr && dua.title?.en && dua.title?.ar, `${id} must have localized titles`);
    assert.match(dua.arabic, /[\u0600-\u06ff]/u);
    assert.ok(dua.transliteration?.trim(), `${id} must have a transliteration`);
    assert.ok(dua.fr?.trim() && dua.en?.trim(), `${id} must have French and English meanings`);
    assert.doesNotMatch(dua.arabic, /[\ufffd\u25cc]/u);
  }
});

test("the travel invocation includes the complete prophetic wording", () => {
  const travel = QURAN_DUAS.find(({ id }) => id === "hisn-travel");

  assert.match(travel.arabic, /اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا/);
  assert.match(travel.arabic, /اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ/);
  assert.match(travel.source, /Muslim 1342/);
});
