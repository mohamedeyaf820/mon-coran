/**
 * Locks the offline Latin transliteration edition: the 114 vendored files and
 * their pinned digests, the Quran.com word-by-word join rules that decide what
 * may reach the reading line, the loader's checksum gate, and the riwaya policy
 * that keeps a Hafs-derived pronunciation out of the Warsh reading view.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import SURAHS from "../src/data/surahs.js";
import { CONTENT_ATTRIBUTIONS } from "../src/data/contentAttributions.js";
import {
  clearTransliterationCache,
  getTransliterationAttribution,
  getTransliterationSurah,
  getTransliterationText,
  requestTransliterationSurah,
  subscribeTransliteration,
} from "../src/services/transliterationService.js";
import {
  getTransliterationSurah as loadedAgain,
  default as serviceDefaultExport,
} from "../src/services/transliterationService.js";

const ASSET_DIR = "../public/data/transliteration-en/";
const SCHEMA = "mushafplus-transliteration-en-hafs-v1";
const fileFor = (surah) => `${String(surah).padStart(3, "0")}.json`;

const readBytes = (relativeUrl) => fs.readFileSync(new URL(relativeUrl, import.meta.url));
const readJson = (relativeUrl) => JSON.parse(readBytes(relativeUrl).toString("utf8"));
const readSource = (relativePath) =>
  readBytes(`../${relativePath}`).toString("utf8").replace(/\r\n/g, "\n");

const INDEX = readJson(`${ASSET_DIR}index.json`);
const docs = new Map();
for (let surah = 1; surah <= 114; surah += 1) {
  docs.set(surah, readJson(`${ASSET_DIR}${fileFor(surah)}`));
}

const digestOf = (relativeUrl) => createHash("sha256").update(readBytes(relativeUrl)).digest("hex");

/* ── 1. The vendored asset set ──────────────────────────────────────────── */

test("the edition is served from 114 local surah files plus one index", () => {
  const onDisk = fs
    .readdirSync(new URL(ASSET_DIR, import.meta.url))
    .filter((name) => !name.startsWith("."))
    .sort();
  const expected = ["index.json", ...SURAHS.map((surah) => fileFor(surah.n))].sort();
  assert.deepEqual(onDisk, expected, "no file may be fetched at runtime");
  assert.equal(expected.length, 115);
});

test("every surah file covers its Hafs verses densely, in Hafs numbering", () => {
  for (const [surah, doc] of docs) {
    const expected = Number(SURAHS[surah - 1].ayahs);
    assert.equal(doc.schema, SCHEMA, `surah ${surah} schema tag`);
    assert.equal(doc.edition, "en.qurancom-wordbyword", `surah ${surah} edition`);
    assert.equal(doc.surah_number, surah);
    assert.equal(doc.number_of_ayahs, expected, `surah ${surah} declared count`);
    assert.equal(doc.ayahs.length, expected, `surah ${surah} verse count`);
    doc.ayahs.forEach((entry, index) => {
      assert.equal(entry.ayah_number, index + 1, `hafs ${surah}:${index + 1} dense numbering`);
      assert.ok(
        typeof entry.text === "string" && entry.text.trim(),
        `hafs ${surah}:${index + 1} non-empty`,
      );
    });
  }
});

test("the mushaf adds up to 6236 Hafs verses", () => {
  assert.equal(
    [...docs.values()].reduce((sum, doc) => sum + doc.ayahs.length, 0),
    6236,
  );
  assert.equal(SURAHS.reduce((sum, surah) => sum + surah.ayahs, 0), 6236);
});

/* ── 2. Reading text quality ────────────────────────────────────────────── */

const LATIN_ONLY = /^[\x20-\x7E\u00B0-\u02FF\u1E00-\u1EFF]+$/;

test("the reading line is latin text only, free of markup and numbering", () => {
  for (const [surah, doc] of docs) {
    for (const entry of doc.ayahs) {
      const label = `hafs ${surah}:${entry.ayah_number}`;
      assert.doesNotMatch(entry.text, /[\u0600-\u06FF\u0750-\u077F]/, `${label} carries no arabic`);
      assert.doesNotMatch(entry.text, /<[^>]*>/, `${label} free of markup`);
      assert.doesNotMatch(entry.text, /\[\d{1,4}\]/, `${label} free of note markers`);
      assert.doesNotMatch(entry.text, /^\s*\d{1,4}[.:/]/, `${label} free of verse numbering`);
      assert.doesNotMatch(entry.text, /\s{2,}/, `${label} single-spaced`);
      assert.equal(entry.text, entry.text.trim(), `${label} trimmed`);
      assert.ok(LATIN_ONLY.test(entry.text), `${label} latin script only: ${entry.text}`);
    }
  }
});

test("a verse is the space-joined stream of its word transliterations", () => {
  // The rule is documented in the build script and evidenced here by the lines
  // it produced: a verse's text is exactly its word tokens glued by one space,
  // with the end-of-ayah token (no transliteration) contributing nothing.
  const script = readSource("scripts/build-transliteration.mjs");
  assert.match(
    script,
    /map\(\(word\) => String\(word\?\.transliteration\?\.text \?\? ""\)\.trim\(\)\)[\s\S]{0,80}\.filter\(Boolean\)[\s\S]{0,40}\.join\(" "\)/,
    "the build joins the word tokens with one space",
  );
  const JOINED = [
    { key: "1:1", words: ["bis'mi", "l-lahi", "l-raḥmāni", "l-raḥīmi"] },
    { key: "2:2", words: ["dhālika", "l-kitābu", "lā", "rayba", "fīhi", "hudan", "lil'muttaqīna"] },
    { key: "27:1", words: ["tta-seen", "til'ka", "āyātu", "l-qur'āni", "wakitābin", "mubīnin"] },
    { key: "2:1", words: ["alif-lam-meem"] },
  ];
  for (const { key, words } of JOINED) {
    const [surah, ayah] = key.split(":").map(Number);
    assert.equal(docs.get(surah).ayahs[ayah - 1].text, words.join(" "), key);
  }
  // Nothing in a line may be an ayah marker: the mushaf supplies the number.
  for (const [surah, doc] of docs) {
    for (const entry of doc.ayahs) {
      assert.doesNotMatch(entry.text, /[\u06DD\u066A-\u066B]/, `hafs ${surah}:${entry.ayah_number}`);
    }
  }
});

test("the basmala belongs to Al-Fatiha's numbered verses, not to a surah opening", () => {
  // Al-Fatiha counts the basmala as verse 1 in the Hafs numbering, so it is the
  // only surah whose first line reads "bis'mi l-lahi…".
  assert.match(docs.get(1).ayahs[0].text, /^bis'mi l-lahi/);
  for (const surah of [2, 27, 55]) {
    assert.doesNotMatch(
      docs.get(surah).ayahs[0].text,
      /bis'mi l-lahi/i,
      `surah ${surah} must not open with the basmala`,
    );
  }
});

test("the recitation letters stay readable on the sampled verses", () => {
  assert.equal(docs.get(1).ayahs[0].text, "bis'mi l-lahi l-raḥmāni l-raḥīmi");
  assert.equal(docs.get(1).ayahs[6].text, "ṣirāṭa alladhīna anʿamta ʿalayhim ghayri l-maghḍūbi ʿalayhim walā l-ḍālīna");
  assert.equal(docs.get(2).ayahs[0].text, "alif-lam-meem");
  assert.equal(docs.get(2).ayahs[1].text, "dhālika l-kitābu lā rayba fīhi hudan lil'muttaqīna");
  assert.equal(docs.get(27).ayahs[0].text, "tta-seen til'ka āyātu l-qur'āni wakitābin mubīnin");
  assert.equal(docs.get(112).ayahs[0].text, "qul huwa l-lahu aḥadun");
  assert.match(docs.get(2).ayahs[254].text, /^al-lahu lā ilāha illā huwa/);
});

/* ── 3. Pinned integrity metadata ───────────────────────────────────────── */

test("index.json pins the SHA-256 of the files actually shipped", () => {
  assert.equal(INDEX.schema, SCHEMA);
  assert.equal(INDEX.edition.id, "en.qurancom-wordbyword");
  assert.equal(INDEX.edition.language, "en");
  assert.equal(INDEX.edition.direction, "ltr");
  assert.equal(INDEX.edition.riwaya, "hafs");
  assert.equal(INDEX.edition.offline, true);
  assert.equal(INDEX.source.provider, "quran.com");
  assert.equal(INDEX.source.numbering, "hafs");
  assert.equal(INDEX.source.hafsTotalAyahs, 6236);
  assert.match(INDEX.attribution, /quran\.com/);
  assert.equal(Object.keys(INDEX.files).length, 114);
  assert.ok(!Number.isNaN(Date.parse(INDEX.generatedAt)));

  for (let surah = 1; surah <= 114; surah += 1) {
    const name = fileFor(surah);
    const pinned = INDEX.files[name];
    assert.equal(pinned.surah, surah, name);
    assert.equal(pinned.ayahs, docs.get(surah).ayahs.length, name);
    assert.equal(pinned.bytes, readBytes(`${ASSET_DIR}${name}`).length, name);
    assert.equal(pinned.sha256, digestOf(`${ASSET_DIR}${name}`), `${name} digest must match its bytes`);
  }
});

test("the edition is registered in the legal attribution ledger", () => {
  const entry = CONTENT_ATTRIBUTIONS.find((item) => item.id === "transliteration-en");
  assert.ok(entry, "the transliteration source must be attributed");
  assert.match(entry.name, /quran\.com/i);
  assert.match(entry.usage, /6236/);
  assert.match(entry.usage, /warsh/i, "the warsh exclusion must be stated");
});

/* ── 4. The offline loader ──────────────────────────────────────────────── */

const requested = [];
const realFetch = globalThis.fetch;
const LOCAL_ASSET =
  /^\/data\/transliteration-en\/(\d{3}\.json|index\.json)\?v=mushafplus-transliteration-en-hafs-v1$/;

function installOfflineFetch(tamperedFile) {
  globalThis.fetch = async (url) => {
    const match = LOCAL_ASSET.exec(String(url));
    if (!match) throw new Error(`the loader asked for a non-local resource: ${url}`);
    requested.push(String(url));
    const bytes = readBytes(`${ASSET_DIR}${match[1]}`);
    // Trailing whitespace keeps the JSON parseable but breaks the digest.
    const payload =
      match[1] === tamperedFile ? Uint8Array.from([...bytes, 0x20]) : Uint8Array.from(bytes);
    const buffer = payload.buffer;
    const text = new TextDecoder().decode(payload);
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => buffer,
      json: async () => JSON.parse(text),
      text: async () => text,
    };
  };
}

test.before(() => installOfflineFetch());
test.after(() => {
  globalThis.fetch = realFetch;
});

test("the loader reads a surah offline, in Hafs numbering, and parses it once", async () => {
  const map = await getTransliterationSurah(2);
  assert.equal(map.size, 286);
  assert.equal(map.get(2), docs.get(2).ayahs[1].text);
  assert.equal(await getTransliterationSurah(2), map, "a surah is parsed once per session");
  assert.ok(requested.length > 0, "the assets were read through fetch");
  for (const url of requested) assert.ok(LOCAL_ASSET.test(url), `offline-only request: ${url}`);
});

test("the synchronous read answers from memory only", async () => {
  assert.equal(getTransliterationText(114, 1), "", "an unloaded surah stays a cache miss");
  await getTransliterationSurah(114);
  assert.equal(getTransliterationText(114, 1), docs.get(114).ayahs[0].text);
  assert.equal(getTransliterationText(114, 0), "");
  assert.equal(getTransliterationText(114, 7), "");
  assert.equal(getTransliterationText(0, 1), "");
});

test("a request schedules the load and notifies subscribers when the lines land", async () => {
  let notified = 0;
  const unsubscribe = subscribeTransliteration(() => {
    notified += 1;
  });
  requestTransliterationSurah(36);
  requestTransliterationSurah(36);
  assert.equal(getTransliterationText(36, 1), "", "the fetch is deferred out of the render pass");
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(notified, 1, "one surah notifies once");
  assert.equal(getTransliterationText(36, 1), docs.get(36).ayahs[0].text);
  unsubscribe();
  requestTransliterationSurah("nope");
  requestTransliterationSurah(0);
});

test("the attribution is read from the pinned index", async () => {
  const attribution = await getTransliterationAttribution();
  assert.equal(attribution.editionId, "en.qurancom-wordbyword");
  assert.equal(attribution.source.provider, "quran.com");
  assert.match(attribution.attribution, /quran\.com/);
});

test("an incomplete surah is refused instead of shown, even with a matching digest", async () => {
  await clearTransliterationCache();
  const surah = 103;
  const name = fileFor(surah);
  const original = readJson(`${ASSET_DIR}${name}`);
  const truncated = { ...original, ayahs: original.ayahs.slice(0, 2) };
  const truncatedBytes = Buffer.from(`${JSON.stringify(truncated, null, 2)}\n`, "utf8");
  const doctored = {
    ...INDEX,
    files: {
      ...INDEX.files,
      [name]: {
        ...INDEX.files[name],
        ayahs: truncated.ayahs.length,
        bytes: truncatedBytes.length,
        sha256: createHash("sha256").update(truncatedBytes).digest("hex"),
      },
    },
  };
  const doctoredBytes = Buffer.from(`${JSON.stringify(doctored, null, 2)}\n`, "utf8");
  const payloads = new Map([
    [name, truncatedBytes],
    ["index.json", doctoredBytes],
  ]);
  globalThis.fetch = async (url) => {
    const match = LOCAL_ASSET.exec(String(url));
    if (!match) throw new Error(`the loader asked for a non-local resource: ${url}`);
    const bytes = payloads.get(match[1]) || readBytes(`${ASSET_DIR}${match[1]}`);
    const buffer = Uint8Array.from(bytes).buffer;
    return { ok: true, status: 200, arrayBuffer: async () => buffer };
  };
  try {
    await assert.rejects(() => getTransliterationSurah(surah), /Incomplete transliteration/);
  } finally {
    installOfflineFetch();
    await clearTransliterationCache();
  }
  assert.equal(getTransliterationText(surah, 1), "", "a refused surah renders nothing");
  const map = await getTransliterationSurah(surah);
  assert.equal(map.size, original.ayahs.length);
});

test("a tampered file fails its pinned digest and is never served", async () => {
  await clearTransliterationCache();
  installOfflineFetch(fileFor(2));
  try {
    await assert.rejects(() => getTransliterationSurah(2), /checksum mismatch/);
    assert.equal(getTransliterationText(2, 1), "", "a failed checksum leaves nothing rendered");
  } finally {
    installOfflineFetch();
    await clearTransliterationCache();
  }
  assert.equal((await getTransliterationSurah(2)).size, 286);
});

test("out-of-range surahs are rejected", async () => {
  await assert.rejects(() => getTransliterationSurah(0), /Invalid surah/);
  await assert.rejects(() => getTransliterationSurah(115), /Invalid surah/);
});

/* ── 5. Wiring and riwaya policy ────────────────────────────────────────── */

test("the reading cards take their line from the getter, not from the approximation", () => {
  const view = readSource("src/components/QuranDisplay/QCVerseByVerseView.jsx");
  assert.match(
    view,
    /getTransliterationForAyah\s*\?\s*getTransliterationForAyah\(ayah\)\s*:\s*arabicToLatin\(ayah\.text, riwaya\)/,
    "the card must prefer the pinned line and keep the approximation as fallback",
  );
  assert.match(view, /getTransliterationForAyah=\{getTransliterationForAyah\}/, "prop reaches the card");

  const display = readSource("src/components/QuranDisplay.jsx");
  assert.match(display, /useTransliterationData\(\{[\s\S]*?riwaya,[\s\S]*?showTransliteration,[\s\S]*?\}\)/);
  assert.equal(
    (display.match(/getTransliterationForAyah=\{getTransliterationForAyah\}/g) || []).length,
    3,
    "surah, page and juz modes all receive the getter",
  );
});

test("every populated surah notifies the readers, cache hit included", () => {
  const service = readSource("src/services/transliterationService.js");
  // The map is LRU-bounded, so population goes through rememberBounded() rather
  // than a bare .set(); the cap itself is asserted in the cache-stats test.
  const populateSites = service.split("rememberBounded(loadedSurahs,").slice(1);
  assert.equal(populateSites.length, 2, "one cached path and one asset path populate the map");
  for (const site of populateSites) {
    assert.match(
      site.slice(0, 400),
      /emit\(\)/,
      "a surah that lands in memory must wake the subscribers, or the reader keeps the approximation",
    );
  }
});

test("Warsh never receives a Hafs-derived transliteration", () => {
  const hook = readSource("src/components/QuranDisplay/useTransliterationData.js");
  assert.match(hook, /riwaya === "hafs"/, "the pinned dataset is gated on hafs");
  assert.match(hook, /return arabicToLatin\(ayah\.text, riwaya\)/, "the approximation stays the fallback");
});

test("the loader keeps a single entry point and default export", () => {
  assert.equal(loadedAgain, getTransliterationSurah);
  assert.equal(serviceDefaultExport.getTransliterationSurah, getTransliterationSurah);
  assert.equal(typeof serviceDefaultExport.clearTransliterationCache, "function");
});
