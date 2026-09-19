import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  HAFS_BASMALA,
  WARSH_BASMALA,
  getBasmalaText,
} from "../src/data/basmala.js";

test("each riwaya gets its own canonical basmala spelling", () => {
  assert.equal(getBasmalaText("hafs"), HAFS_BASMALA);
  assert.equal(getBasmalaText("warsh"), WARSH_BASMALA);
  assert.equal(getBasmalaText(undefined), HAFS_BASMALA);
  assert.notEqual(HAFS_BASMALA, WARSH_BASMALA);
});

test("Hafs basmala uses alif-wasl, Warsh basmala uses the Warsh wasla marks", () => {
  assert.equal(HAFS_BASMALA.includes("\u0671"), true);
  assert.equal(WARSH_BASMALA.includes("\u0671"), false);
  assert.equal(WARSH_BASMALA.includes("\u0627\u0650\u06ec"), true);
});

test("the Warsh basmala stays verbatim from the project Warsh source", () => {
  // Code points extracted from warshService.js (the project Warsh source).
  // Compared numerically because hand-retyped combining-mark order drifts.
  const canonical = [
    0x628, 0x650, 0x633, 0x652, 0x645, 0x650, 0x20,
    0x627, 0x650, 0x6ec, 0x644, 0x644, 0x651, 0x64e, 0x647, 0x650, 0x20,
    0x627, 0x650, 0x6ec, 0x644, 0x631, 0x651, 0x64e, 0x62d, 0x652, 0x645, 0x64e, 0x670, 0x646, 0x650, 0x20,
    0x627, 0x650, 0x6ec, 0x644, 0x631, 0x651, 0x64e, 0x62d, 0x650, 0x64a, 0x645, 0x650,
  ];
  assert.deepEqual(Array.from(WARSH_BASMALA, (c) => c.codePointAt(0)), canonical);
});

test("mushaf page and continuous reader resolve basmala through the riwaya", () => {
  const page = readFileSync(
    new URL("../src/components/QuranDisplay/QuranMushafPage.jsx", import.meta.url),
    "utf8"
  );
  const bismillah = readFileSync(
    new URL("../src/components/Quran/Bismillah.jsx", import.meta.url),
    "utf8"
  );
  assert.equal(/BASMALA_TEXT/.test(page), false);
  assert.match(page, /\{getBasmalaText\(riwaya\)\}/);
  assert.match(bismillah, /\{getBasmalaText\(riwaya\)\}/);
});
