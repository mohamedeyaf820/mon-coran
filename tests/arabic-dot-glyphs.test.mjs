/**
 * The KFGQPC Hafs face draws a large black dot in a dotted circle for these signs
 * (found by rendering every Arabic mark in the shipped font): the honorific signs
 * U+0610-061A, U+0658-065D, U+065F, and U+06DF, U+06E3, U+06EB. The reader maps the
 * ones it can (U+06DF, U+06EB); the invocations and the share card must show no
 * Arabic text that still contains one after that mapping.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import QURAN_DUAS from "../src/data/duas.js";
import RABBANA_DUAS from "../src/data/rabbanaDuas.js";
import { KHATM_IRHAMNI } from "../src/data/khatmDuas.js";
import { cleanDuaArabic } from "../src/utils/arabicDuaText.js";
import { applyFontSigns } from "../src/utils/quranUtils.js";

const DOT_SIGNS = new RegExp("[\u0610-\u061A\u0658-\u065D\u065F\u06DF\u06E3\u06EB]", "u");

const hisn = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../public/data/hisn/hisn.json", import.meta.url)), "utf8"));

test("Hafs: no invocation shows a sign the Quran face paints as a black dot", () => {
  const texts = [
    ...QURAN_DUAS.map((dua) => [dua.id, dua.arabic]),
    ...RABBANA_DUAS.map((dua) => [dua.id, dua.arabic]),
    ["khatm", KHATM_IRHAMNI.arabic],
    ...hisn.chapters.flatMap((chapter) => chapter.items.map((item) => [`hisn-${item.id}`, cleanDuaArabic(item.ar)])),
  ];
  assert.ok(texts.length > 300);
  for (const [id, text] of texts) {
    assert.doesNotMatch(applyFontSigns(text, "qpc-hafs"), DOT_SIGNS, id);
  }
});

test("the rounded zero of a silent letter becomes the QPC sukun, as in the reader", () => {
  const rabbana = RABBANA_DUAS.filter((dua) => dua.arabic.includes("\u06DF"));
  assert.ok(rabbana.length > 0, "the Rabbana data does contain U+06DF");
  for (const dua of rabbana) assert.ok(!applyFontSigns(dua.arabic, "qpc-hafs").includes("\u06DF"), dua.id);
});
