import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModernHomeModel,
  filterHomeSurahs,
} from "../src/modern/home/homeModel.js";

const surahs = [
  { n: 1, ar: "الفاتحة", en: "Al-Fatiha", fr: "L'Ouverture", ayahs: 7, type: "Meccan" },
  { n: 2, ar: "البقرة", en: "Al-Baqara", fr: "La Vache", ayahs: 286, type: "Medinan" },
  { n: 36, ar: "يس", en: "Ya-Sin", fr: "Ya-Sin", ayahs: 83, type: "Meccan" },
];

test("builds a safe resume destination from saved settings", () => {
  const model = buildModernHomeModel({
    settings: { lastPosition: { surah: 2, ayah: 255 }, riwaya: "hafs" },
    recentVisits: [],
    stats: { totalRead: 255, total: 6236, percentage: 4, completedSurahs: 1 },
    surahs,
  });

  assert.equal(model.resume.surah.n, 2);
  assert.equal(model.resume.ayah, 255);
  assert.equal(model.resume.href, "/surah/2/255");
  assert.equal(model.resume.progress, 89);
  assert.equal(model.riwaya, "HAFS");
});

test("falls back to the opening surah when saved data is invalid", () => {
  const model = buildModernHomeModel({
    settings: { lastPosition: { surah: 999, ayah: -4 } },
    recentVisits: [],
    stats: {},
    surahs,
  });

  assert.equal(model.resume.surah.n, 1);
  assert.equal(model.resume.ayah, 1);
  assert.equal(model.stats.percentage, 0);
});

test("sanitizes and deduplicates recent visits", () => {
  const model = buildModernHomeModel({
    settings: {},
    recentVisits: [
      { surah: 36, ayah: 10, ts: 30 },
      { surah: 2, ayah: 20, ts: 20 },
      { surah: 36, ayah: 3, ts: 10 },
      { surah: 999, ayah: 1, ts: 50 },
    ],
    stats: {},
    surahs,
  });

  assert.deepEqual(model.recents.map((item) => item.surah.n), [36, 2]);
  assert.equal(model.recents[0].href, "/surah/36/10");
});

test("filters surahs by number, latin name, translation or Arabic", () => {
  assert.deepEqual(filterHomeSurahs(surahs, "36").map((item) => item.n), [36]);
  assert.deepEqual(filterHomeSurahs(surahs, "vache").map((item) => item.n), [2]);
  assert.deepEqual(filterHomeSurahs(surahs, "baqara").map((item) => item.n), [2]);
  assert.deepEqual(filterHomeSurahs(surahs, "الفاتحة").map((item) => item.n), [1]);
  assert.equal(filterHomeSurahs(surahs, "absent").length, 0);
});
