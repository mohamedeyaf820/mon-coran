/**
 * The two Quranic collections of the invocations page: the forty « Rabbana »
 * supplications (generated from the Quran text by scripts/build-rabbana-data.mjs)
 * and the end-of-recitation (khatm) page, which points at supplications that live
 * elsewhere in the app and must keep resolving.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import QURAN_DUAS from "../src/data/duas.js";
import RABBANA_DUAS from "../src/data/rabbanaDuas.js";
import { KHATM_HISN_ITEM_IDS, KHATM_IRHAMNI, KHATM_LINKS, KHATM_QURAN_IDS } from "../src/data/khatmDuas.js";
import { getSurahAyahCount } from "../src/data/surahs.js";
import { parseDuasRoute } from "../src/components/duas/duasRoute.js";
import { parseRoutePath } from "../src/hooks/useUrlSync.js";

const hisn = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../public/data/hisn/hisn.json", import.meta.url)), "utf8"));
const strip = (text) => text.replace(new RegExp("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]", "g"), "").replace(/[ٱأإآ]/g, "ا");

test("there are forty Rabbana supplications, numbered in Quran order, with unique ids", () => {
  assert.equal(RABBANA_DUAS.length, 40);
  assert.deepEqual(RABBANA_DUAS.map((dua) => dua.n), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.equal(new Set(RABBANA_DUAS.map((dua) => dua.id)).size, 40);
  let previous = [0, 0];
  for (const dua of RABBANA_DUAS) {
    assert.ok(dua.surah > previous[0] || (dua.surah === previous[0] && dua.ayah >= previous[1]), `${dua.id} is in Quran order`);
    previous = [dua.surah, dua.ayah];
  }
});

test("each supplication names a real verse and carries Quran Arabic, a French and an English line", () => {
  for (const dua of RABBANA_DUAS) {
    assert.ok(dua.ayah >= 1 && dua.ayah <= getSurahAyahCount(dua.surah), `${dua.id} verse exists`);
    assert.ok(dua.arabic.trim().split(" ").length >= 3, `${dua.id} has Arabic text`);
    assert.ok(dua.fr.trim() && dua.en.trim(), `${dua.id} is translated`);
    assert.ok(!dua.fr.includes("'") && !dua.en.includes("'"), `${dua.id} uses typographic apostrophes`);
    // One of the forms of « Rabbana » opens it; 5:114 opens with « Allahumma, Rabbana ».
    const first = strip(dua.arabic.split(" ")[0]);
    assert.ok(/^(?:ر+بنا|رب|الله)/.test(first), `${dua.id} starts with ${first}`);
    assert.ok(!/[A-Za-z0-9]/.test(dua.arabic), `${dua.id} Arabic is plain Quran text`);
  }
  const three = RABBANA_DUAS.filter((dua) => dua.surah === 2 && dua.ayah === 286);
  assert.deepEqual(three.map((dua) => dua.part), ["1/3", "2/3", "3/3"], "2:286 counts for three");
});

test("the Rabbana text is the Quran text: known supplications match the app's hand-written ones", () => {
  const known = new Map(QURAN_DUAS.map((dua) => [`${dua.surah}:${dua.ayah}`, strip(dua.arabic).replace(/\s+/g, " ")]));
  let compared = 0;
  for (const dua of RABBANA_DUAS) {
    const handWritten = known.get(`${dua.surah}:${dua.ayah}`);
    if (!handWritten || dua.part) continue;
    // Spelling of the pause signs and small letters differs between sources: compare the consonant skeleton.
    const letters = (text) => text.replace(/[^ء-ي]/g, "").replace(/[اويى]/g, "");
    const a = letters(strip(dua.arabic));
    const b = letters(handWritten);
    if (a.length > 10 && b.length > 10 && (a.includes(b) || b.includes(a))) compared += 1;
  }
  assert.ok(compared >= 10, `at least ten Rabbana entries agree with the app's earlier text (${compared})`);
});

test("the khatm page only points at supplications that exist", () => {
  const ids = new Set(QURAN_DUAS.map((dua) => dua.id));
  for (const id of KHATM_QURAN_IDS) assert.ok(ids.has(id), `Quran supplication ${id}`);
  const hisnIds = new Set(hisn.chapters.flatMap((chapter) => chapter.items.map((item) => item.id)));
  for (const id of KHATM_HISN_ITEM_IDS) assert.ok(hisnIds.has(id), `Hisn item ${id}`);
  assert.ok(KHATM_IRHAMNI.arabic.includes("ارْحَمْنِي بِالْقُرْآنِ") && KHATM_IRHAMNI.fr && KHATM_IRHAMNI.en);
  for (const link of Object.values(KHATM_LINKS)) assert.match(link, /^https:\/\//);
});

test("the collections have their own addresses", () => {
  assert.deepEqual(parseDuasRoute("/rabbana"), { view: "rabbana" });
  assert.deepEqual(parseDuasRoute("/khatm"), { view: "khatm" });
  assert.equal(parseRoutePath("/duas/rabbana").duasRoute, "/rabbana");
  assert.equal(parseRoutePath("/duas/khatm/").duasRoute, "/khatm");
  assert.equal(parseRoutePath("/duas/rabbana/1").routeNotFound, true);
});
