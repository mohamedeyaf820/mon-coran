import { WARSH_TAJWID_RULE_IDS } from "../src/data/warshTajwidSigns.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { WARSH_TAJWID_SOURCE } from "../src/data/warshTajwidSigns.js";
import { comparableArabicText } from "../src/utils/quranUtils.js";
import {
  getWarshTajwidSource,
  getWarshTajweedAnnotations,
  getWarshTajwidSourceStatus,
  warshDisplayWords,
} from "../src/services/warshTajweedService.js";

test("Warsh names the adopted source it paints from, and its digest", () => {
  const status = getWarshTajwidSourceStatus();
  assert.equal(status.riwaya, "warsh");
  assert.equal(status.status, "warsh-dabt");
  assert.equal(status.validationStatus, "DABT_OF_PINNED_EDITION");
  assert.equal(status.annotationAvailable, true);
  assert.equal(status.sourceId, WARSH_TAJWID_SOURCE.id);
  assert.equal(status.sourceCommit, WARSH_TAJWID_SOURCE.commit);
  assert.equal(status.sourceSha256, WARSH_TAJWID_SOURCE.sha256);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.coverage), true);
  assert.equal(status.candidateSourceId, "qud-quranic-phonemizer");
});

test("the Warsh-specific rule families stay declared as pending, never painted", () => {
  const status = getWarshTajwidSourceStatus();
  for (const family of ["imala", "taqlil", "naql", "ibdal", "ra-tafkhim-tarqiq"]) {
    assert.ok(status.pendingRuleFamilies.includes(family), `${family} must stay pending`);
  }
  assert.equal(status.pendingRuleFamilies, WARSH_TAJWID_SOURCE.unpaintedRuleFamilies);
  assert.deepEqual(
    WARSH_TAJWID_RULE_IDS.slice().sort(),
    [...status.coverage.ruleIds].sort(),
  );
});

test("Warsh never requests, reads or paints an experimental annotation", async () => {
  const previousFetch = globalThis.fetch;
  const previousIndexedDB = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  let networkRequests = 0;
  let cacheReads = 0;
  globalThis.fetch = async () => {
    networkRequests += 1;
    throw new Error("Warsh painting reads the pinned edition, never the network");
  };
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: { open() { cacheReads += 1; throw new Error("Experimental cache is untrusted"); } },
  });

  try {
    const entries = [{ surah: 112, ayah: 1, displayWords: ["قُلْ", "هُوَ", "ٱللَّهُ", "أَحَدٌ"] }];
    const before = structuredClone(entries);
    const annotations = await getWarshTajweedAnnotations(entries);
    assert.equal(networkRequests, 0);
    assert.equal(cacheReads, 0);
    assert.deepEqual(entries, before, "Source text and coordinates must stay untouched");
    // 112:1 in this edition carries no sign of the adopted source.
    assert.equal(annotations.size, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousIndexedDB) Object.defineProperty(globalThis, "indexedDB", previousIndexedDB);
    else delete globalThis.indexedDB;
  }
});

test("A self-declared verified response and Hafs markup never authorize Warsh painting", async () => {
  const input = [{
    surah: 2,
    ayah: 2,
    hafsNumber: 3,
    displayWords: ["يُومِنُونَ"],
    verified: true,
    sourceManifest: { riwaya: "warsh", verified: true, version: "1" },
    annotations: ["<tajweed class=ikhfa>يُومِنُونَ</tajweed>"],
  }];
  const before = structuredClone(input);
  // The words carry no sign of the adopted source, so nothing is painted, and
  // the transport markup is never parsed as a Warsh rule.
  assert.equal((await getWarshTajweedAnnotations(input)).size, 0);
  assert.deepEqual(input, before);
});

test("the Warsh source paints the printed words and changes none of them", () => {
  // 1:2 read from the pinned corpus itself, so the example cannot be a typo.
  // In the Warsh count 1:1 is الْحَمْدُ لِلَّهِ, so the article words are 1:2.
  const row = JSON.parse(readFileSync(new URL("../public/data/warsh-page-source.json", import.meta.url), "utf8"))
    .find((entry) => entry.sura_no === 1 && entry.aya_no === 2);
  const words = warshDisplayWords({ numberInSurah: 2, text: row.aya_text });
  assert.ok(words.length >= 2);
  const ayah = { numberInSurah: 2, text: row.aya_text };
  const source = getWarshTajwidSource(ayah);
  assert.equal(source.original, words.join(" "));
  assert.deepEqual(source.words.map((word) => word.text), words);
  assert.equal(source.words[0].ranges.some((range) => range.ruleId === "ham-wasl"), true);
  // No annotation markup: the Warsh path never carries one.
  assert.equal(source.annotation, null);
  assert.equal(source.words.every((word) => !/<tajweed/i.test(word.text)), true);
  assert.equal(source.wordAudioIsAligned, false);
  // Same letters as the pinned verse, in the same order: the painting adds
  // ranges, never characters. The verse may add the marker token after them.
  const letters = (value) => comparableArabicText(value).replace(/\s+/gu, "");
  assert.ok(letters(row.aya_text).startsWith(letters(source.original)));
});

test("The Warsh page never crosses the Hafs annotation boundary", () => {
  const renderer = readFileSync(new URL("../src/components/QuranDisplay/WarshPageRenderer.jsx", import.meta.url), "utf8");
  assert.match(renderer, /riwaya:\s*["']warsh["']/u);
  assert.doesNotMatch(renderer, /riwaya:\s*["']hafs["']/u);
  assert.match(renderer, /getWarshTajwidSource/u);
  assert.match(renderer, /getAnnotatedWords:\s*\(\)\s*=>\s*\[\]/u);
});
