/**
 * Remap tests for the Warsh-adapted French translation (« Le Saint Coran »,
 * Dr Nabil Redouane, Al-Montada Al-Islami 2017, imported from quranpedia.net
 * book 1949 in Hafs numbering).
 *
 * These lock what scripts/build-warsh-translation.mjs is allowed to produce:
 * 6214 Warsh verses spread over 114 offline files, each one carrying the text
 * of the Hafs verses it actually recites (see src/data/warshHafsNumbering.js),
 * with the publisher's apparatus kept out of the reading line and a pinned
 * SHA-256 for every file the loader may cache.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import fr from "../src/i18n/fr.js";
import en from "../src/i18n/en.js";
import ar from "../src/i18n/ar.js";
import SURAHS from "../src/data/surahs.js";
import {
  WARSH_TRANSLATION_EDITION_ID,
  WARSH_TRANSLATION_EDITION_ID_EN,
  getWarshTranslationEdition,
  getWarshTranslationSurah,
  isWarshTranslationEdition,
} from "../src/services/warshTranslationService.js";
import {
  getTranslationKeyForAyah,
  getWarshTranslationKeyForAyah,
  isWarshNumberedAyah,
} from "../src/components/QuranDisplay/displayHelpers.js";
import { getWarshSurahAyahCount, hafsNumbersForAyah } from "../src/constants/warshSource.js";

const ASSET_DIR = "../public/data/warsh-translation-fr/";
const fileFor = (surah) => `${String(surah).padStart(3, "0")}.json`;

const readSource = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const readJson = (relativeUrl) =>
  JSON.parse(fs.readFileSync(new URL(relativeUrl, import.meta.url), "utf8"));

const readBytes = (relativeUrl) => fs.readFileSync(new URL(relativeUrl, import.meta.url));

const readSurahDoc = (surah) => readJson(`${ASSET_DIR}${fileFor(surah)}`);

const INDEX = readJson(`${ASSET_DIR}index.json`);
const docs = new Map();
for (let surah = 1; surah <= 114; surah += 1) docs.set(surah, readSurahDoc(surah));

const FIXTURE = readJson("./fixtures/montada-hafs-source-sample.json");
const hafsSource = (surah, ayah) => {
  const raw = FIXTURE.ayahs[`${surah}:${ayah}`];
  assert.ok(typeof raw === "string" && raw, `fixture is missing hafs ${surah}:${ayah}`);
  return raw;
};

/* ── 1. The vendored asset set ──────────────────────────────────────────── */

const EXPECTED_FILES = ["index.json", ...SURAHS.map((surah) => fileFor(surah.n))].sort();

test("the edition is served from 114 local surah files plus one index", () => {
  const onDisk = fs
    .readdirSync(new URL(ASSET_DIR, import.meta.url))
    .filter((name) => !name.startsWith("."))
    .sort();
  assert.deepEqual(onDisk, EXPECTED_FILES, "no file may be fetched at runtime");
  assert.equal(EXPECTED_FILES.length, 115);
});

test("every surah file covers its Warsh verses densely, in Warsh numbering", () => {
  for (const [surah, doc] of docs) {
    const expected = getWarshSurahAyahCount(surah);
    assert.equal(doc.schema, INDEX.schema, `surah ${surah} schema tag`);
    assert.equal(doc.edition, WARSH_TRANSLATION_EDITION_ID, `surah ${surah} edition`);
    assert.equal(doc.surah_number, surah);
    assert.equal(doc.number_of_ayahs, expected, `surah ${surah} declared count`);
    assert.equal(doc.ayahs.length, expected, `surah ${surah} verse count`);
    doc.ayahs.forEach((entry, index) => {
      assert.equal(entry.ayah_number, index + 1, `warsh ${surah}:${index + 1} dense numbering`);
      assert.ok(
        Array.isArray(entry.hafs_numbers) && entry.hafs_numbers.length,
        `warsh ${surah}:${index + 1} provenance`,
      );
    });
  }
});

test("Al-Baqara holds 285 Warsh verses and the whole mushaf 6214", () => {
  assert.equal(docs.get(2).ayahs.length, 285);
  assert.equal(
    [...docs.values()].reduce((sum, doc) => sum + doc.ayahs.length, 0),
    6214,
  );
  assert.equal(
    SURAHS.reduce((sum, surah) => sum + getWarshSurahAyahCount(surah.n), 0),
    6214,
    "the mapping itself still adds up to 6214",
  );
});

/* ── 2. Riwaya alignment: text follows the mapping, not the number ──────── */

test("each verse carries the Hafs numbers the app's mapping assigns to it", () => {
  for (const [surah, doc] of docs) {
    for (const entry of doc.ayahs) {
      assert.deepEqual(
        entry.hafs_numbers,
        hafsNumbersForAyah({ surah: { number: surah }, numberInSurah: entry.ayah_number }, "warsh"),
        `warsh ${surah}:${entry.ayah_number}`,
      );
    }
  }
});

test("every Hafs verse of a surah is recited by exactly one Warsh verse", () => {
  for (const { n: surah, ayahs: hafsTotal } of SURAHS) {
    const used = new Set(docs.get(surah).ayahs.flatMap((entry) => entry.hafs_numbers));
    // Al-Fatiha: the basmala is ornamental in the Warsh mushaf, so Hafs 1:1 is
    // deliberately recited by no numbered Warsh verse.
    const first = surah === 1 ? 2 : 1;
    assert.equal(used.size, hafsTotal - first + 1, `surah ${surah} distinct Hafs verses`);
    for (let number = first; number <= hafsTotal; number += 1) {
      assert.ok(used.has(number), `surah ${surah}: hafs ${number} must appear`);
    }
    assert.equal(used.has(1), surah !== 1, "only the Fatiha basmala stays unnumbered");
  }
});

test("Warsh 1:1 is the Fatiha verse the Madinah mushaf numbers first", () => {
  const [first] = docs.get(1).ayahs;
  assert.deepEqual(first.hafs_numbers, [2]);
  assert.equal(first.text, "Louange à Allah, Seigneur de l’Univers.");
  assert.equal(
    docs.get(1).ayahs.some((entry) => entry.text.includes("Au nom d’Allah")),
    false,
    "the basmala must not leak into a numbered verse",
  );
  // Al-Baqara opens with a merge, so the offset shifts: warsh 2:2 recites hafs 3.
  assert.deepEqual(docs.get(2).ayahs[0].hafs_numbers, [1, 2]);
  assert.deepEqual(docs.get(2).ayahs[1].hafs_numbers, [3]);
});

/* A merged verse is the two Hafs verses it recites, joined by one space. The
   fixture refs below are markup- and note-free in the import, so the only
   normalisation their display text went through is the verse-number prefix. */

const PREFIX = /^\d{1,4}\.\s+/;
// The import sets French punctuation with no-break spaces; the build flattens
// them. Nothing else is collapsed, so the join below still proves that merged
// verses are glued by exactly one space.
const cleanSource = (raw) => raw.replace(PREFIX, "").replace(/\u00a0/g, " ");
const MERGED_PAIRS = [
  { warsh: [3, 1], hafs: [[3, 1], [3, 2]] },
  { warsh: [7, 1], hafs: [[7, 1], [7, 2]] },
  { warsh: [11, 54], hafs: [[11, 54], [11, 55]] },
];

test("a merged Warsh verse is the single-space join of its two Hafs sources", () => {
  for (const { warsh, hafs } of MERGED_PAIRS) {
    const expected = hafs
      .map(([surah, ayah]) => {
        const raw = hafsSource(surah, ayah);
        assert.ok(!/<[^>]*>|\[\d{1,4}\]|_{8,}/.test(raw), `fixture ${surah}:${ayah} stays plain here`);
        assert.match(raw, PREFIX, `fixture ${surah}:${ayah} carries its verse number`);
        return cleanSource(raw);
      })
      .join(" ");
    const entry = docs.get(warsh[0]).ayahs[warsh[1] - 1];
    assert.deepEqual(
      entry.hafs_numbers,
      hafs.map(([, ayah]) => ayah).sort((a, b) => a - b),
      `warsh ${warsh.join(":")} provenance`,
    );
    assert.equal(entry.text, expected, `warsh ${warsh.join(":")}`);
  }
  // Ar-Rum opens with a three-way merge.
  assert.deepEqual(docs.get(30).ayahs[0].hafs_numbers, [1, 2, 3]);
  assert.equal(
    [...docs.values()].flatMap((doc) => doc.ayahs).filter((entry) => entry.hafs_numbers.length > 1).length,
    INDEX.numberingAdaptation.mergedAyahs,
    "merged verses",
  );
});

/* ── 3. Reading text vs publisher's apparatus ───────────────────────────── */

// Mirrors the cleaning rules documented in index.json, applied to the import.
function displayText(raw) {
  return String(raw)
    .split(/_{8,}/)[0]
    .replace(/<[^>]*>/g, "")
    .replace(/\[\d{1,4}\]/g, "")
    .replace(/^\s*\d{1,4}\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

test("markup, note markers and verse numbering never reach the reading line", () => {
  for (const [surah, doc] of docs) {
    for (const entry of doc.ayahs) {
      const label = `warsh ${surah}:${entry.ayah_number}`;
      assert.ok(typeof entry.text === "string" && entry.text.trim(), `${label} non-empty`);
      assert.equal(entry.text, entry.text.trim(), `${label} trimmed`);
      assert.doesNotMatch(entry.text, /<[^>]*>/, `${label} free of markup`);
      assert.doesNotMatch(entry.text, /\[\d{1,4}\]/, `${label} free of note markers`);
      assert.doesNotMatch(entry.text, /^\s*\d{1,4}\./, `${label} free of verse numbering`);
      assert.doesNotMatch(entry.text, /_{4,}/, `${label} free of the apparatus rule`);
      assert.doesNotMatch(entry.text, /\s{2,}/, `${label} single-spaced`);
      assert.doesNotMatch(entry.text, /\u00a0/, `${label} spaces normalised`);
    }
  }
});

test("tags and translator notes are stripped out of the text, notes kept aside", () => {
  // Ya-Sin 1: the source wraps half the verse in <span> and numbers it.
  assert.match(hafsSource(36, 1), /<span[^>]*>/);
  assert.equal(docs.get(36).ayahs[0].text, "Yâ-Sîn. Par le Coran éminemment structuré.");
  // Al-Fatiha 3: an inline [3] marker, then the note behind the rule.
  const fatihaThird = docs.get(1).ayahs[2];
  assert.equal(fatihaThird.text, "Souverain du Jour de la Rétribution.");
  assert.equal(fatihaThird.text, displayText(hafsSource(1, 4)));
  assert.equal(fatihaThird.footnotes.length, 1);
  assert.equal(fatihaThird.footnotes[0].ref, 3);
  assert.doesNotMatch(fatihaThird.footnotes[0].text, /<[^>]*>|^\s*\d{1,4}\.\s/);
  assert.ok(fatihaThird.footnotes[0].text.includes("Hafç"));
});

test("a split Hafs verse repeats its text on each Warsh verse covering it", () => {
  const [sixth, seventh] = docs.get(1).ayahs.slice(5, 7);
  assert.deepEqual(sixth.hafs_numbers, [7]);
  assert.deepEqual(seventh.hafs_numbers, [7]);
  assert.equal(sixth.text, seventh.text);
  assert.equal(sixth.text, displayText(hafsSource(1, 7)));
  // Ayat al-Kursi: Warsh 2:253 and 2:254 both recite hafs 255.
  const [twoFiftyThree, twoFiftyFour] = docs.get(2).ayahs.slice(252, 254);
  assert.deepEqual(twoFiftyThree.hafs_numbers, [255]);
  assert.deepEqual(twoFiftyFour.hafs_numbers, [255]);
  assert.equal(twoFiftyThree.text, twoFiftyFour.text);
});

/* ── 4. Pinned integrity metadata ───────────────────────────────────────── */

const digestOf = (relativeUrl) => createHash("sha256").update(readBytes(relativeUrl)).digest("hex");

test("index.json pins the SHA-256 of the files actually shipped", () => {
  assert.equal(INDEX.schema, "mushafplus-warsh-translation-fr-v1");
  assert.equal(INDEX.edition.id, WARSH_TRANSLATION_EDITION_ID);
  assert.equal(INDEX.edition.name, "Le Saint Coran — Warsh (Montada 2017)");
  assert.equal(INDEX.edition.language, "fr");
  assert.equal(INDEX.edition.direction, "ltr");
  assert.equal(INDEX.edition.riwaya, "warsh");
  assert.equal(INDEX.edition.offline, true);
  assert.match(INDEX.attribution, /Nabil Redouane/);
  assert.match(INDEX.attribution, /Montada/);
  assert.equal(INDEX.source.provider, "quranpedia.net");
  assert.equal(INDEX.source.bookId, 1949);
  assert.equal(INDEX.source.numbering, "hafs");
  assert.equal(INDEX.source.hafsTotalAyahs, 6236);
  assert.match(INDEX.source.sha256, /^[0-9a-f]{64}$/);
  assert.equal(INDEX.numberingAdaptation.warshTotalAyahs, 6214);
  assert.equal(INDEX.numberingAdaptation.mapping, "src/data/warshHafsNumbering.js");
  assert.match(INDEX.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.ok(!Number.isNaN(Date.parse(INDEX.generatedAt)));
  assert.equal(Object.keys(INDEX.files).length, 114);

  let footnoted = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const name = `${ASSET_DIR}${fileFor(surah)}`;
    const pinned = INDEX.files[fileFor(surah)];
    assert.equal(pinned.surah, surah, name);
    assert.equal(pinned.ayahs, docs.get(surah).ayahs.length, name);
    assert.equal(pinned.bytes, readBytes(name).length, name);
    assert.equal(pinned.sha256, digestOf(name), `${name} digest must match its bytes`);
    footnoted += docs.get(surah).ayahs.filter((entry) => entry.footnotes?.length).length;
  }
  assert.equal(INDEX.numberingAdaptation.footnotedAyahs, footnoted);
});

/* ── 5. The offline loader ──────────────────────────────────────────────── */

const requested = [];
const realFetch = globalThis.fetch;
const LOCAL_ASSET =
  /^\/data\/warsh-translation-fr\/(\d{3}\.json|index\.json)\?v=mushafplus-warsh-translation-fr-v1$/;

function installOfflineFetch(tamperedFile) {
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    const match = LOCAL_ASSET.exec(String(url));
    if (!match) throw new Error(`the loader asked for a non-local resource: ${url}`);
    const bytes = readBytes(`${ASSET_DIR}${match[1]}`);
    // Trailing whitespace keeps the JSON parseable but breaks the digest.
    const payload = match[1] === tamperedFile ? Uint8Array.from([...bytes, 0x20]) : bytes;
    const buffer = Uint8Array.from(payload).buffer;
    return { ok: true, status: 200, arrayBuffer: async () => buffer };
  };
}

test.before(() => installOfflineFetch());
test.after(() => {
  globalThis.fetch = realFetch;
});

test("the loader reads surahs offline and keeps them in Warsh numbering", async () => {
  const records = await getWarshTranslationSurah(2);
  assert.equal(records.length, 285);
  assert.equal(records[0].ayahNumber, 1);
  assert.deepEqual(records[0].hafsNumbers, [1, 2]);
  assert.equal(records[0].text, docs.get(2).ayahs[0].text);
  assert.equal(records[252].ayahNumber, 253);
  assert.deepEqual(records[253].hafsNumbers, [255]);
  assert.equal(await getWarshTranslationSurah(2), records, "a surah is parsed once per session");
  assert.ok(requested.length > 0, "the assets were read through fetch");
  for (const url of requested) assert.ok(LOCAL_ASSET.test(url), `offline-only request: ${url}`);
});

test("the edition document is stamped warsh and keyed per surah", async () => {
  const edition = await getWarshTranslationEdition("surah", 1);
  assert.equal(edition.riwaya, "warsh");
  assert.equal(edition.edition.identifier, WARSH_TRANSLATION_EDITION_ID);
  assert.equal(edition.edition.riwaya, "warsh");
  assert.equal(edition.edition.language, "fr");
  assert.equal(edition.edition.direction, "ltr");
  assert.equal(edition.numberOfAyahs, 7);
  assert.equal(edition.isOffline, true);
  assert.deepEqual(edition.ayahs[0].hafsNumbers, [2]);
  assert.equal(edition.ayahs[0].numberInSurah, 1);
  assert.equal(isWarshNumberedAyah({ requestedRiwaya: "warsh" }), true);
  assert.equal(isWarshNumberedAyah({ hafsNumbers: [1, 2] }), true);
  assert.equal(isWarshNumberedAyah({ numberInSurah: 3 }), false);
  // A Warsh edition never shares a translation key with a Hafs one.
  assert.equal(getWarshTranslationKeyForAyah(1, 1), "warsh:1:1");
  assert.notEqual(getTranslationKeyForAyah(1, 1), getWarshTranslationKeyForAyah(1, 1));
  // Scopes resolve through the local surah/juz/page tables.
  assert.equal((await getWarshTranslationEdition("page", 1)).numberOfAyahs, 7);
  const sharedPage = await getWarshTranslationEdition("page", 587);
  const sharedSurahs = [...new Set(sharedPage.ayahs.map((ayah) => ayah.surah.number))];
  assert.deepEqual(
    sharedSurahs,
    [81, 82, 83],
    "a page carries the surah it ends plus every surah starting on it",
  );
  assert.equal(
    sharedPage.numberOfAyahs,
    sharedSurahs.reduce((sum, surah) => sum + getWarshSurahAyahCount(surah), 0),
  );
  assert.equal((await getWarshTranslationEdition("juz", 1)).numberOfAyahs, 292);
  assert.equal(await getWarshTranslationEdition("surah", 999), null);
});

test("a payload whose digest no longer matches the pinned one is refused", async () => {
  installOfflineFetch(fileFor(47));
  await assert.rejects(getWarshTranslationSurah(47), /checksum mismatch/i);
  installOfflineFetch();
});

test("only Warsh edition ids resolve through the local service", () => {
  assert.equal(isWarshTranslationEdition(WARSH_TRANSLATION_EDITION_ID), true);
  assert.equal(isWarshTranslationEdition(WARSH_TRANSLATION_EDITION_ID_EN), true);
  assert.equal(isWarshTranslationEdition("fr"), false);
  assert.equal(isWarshTranslationEdition("en"), false);
});

/* ── 6. Pipeline and copy wiring ────────────────────────────────────────── */

test("the translation chooser advertises the edition as a Warsh option", () => {
  const source = readSource("src/services/quranAPI.js");
  const start = source.indexOf("export const TRANSLATION_CHOICES");
  assert.ok(start > 0, "TRANSLATION_CHOICES found");
  const choices = source.slice(start, source.indexOf("];", start));
  assert.ok(choices.length > 40, "TRANSLATION_CHOICES extracted");
  assert.match(choices, /WARSH_TRANSLATION_EDITION_ID/);
  assert.match(choices, /riwaya:\s*["']warsh["']/);
  assert.match(choices, /labelKey:\s*["']settings\.translationWarshLabel["']/);
});

test("fetchTranslations routes the local edition and keeps remote ones remote", () => {
  const source = readSource("src/services/quranAPI.js");
  const start = source.indexOf("async function fetchTranslations(");
  assert.ok(start > 0, "fetchTranslations found");
  const body = source.slice(start, source.indexOf("\n}", start));
  assert.match(body, /isWarshTranslationEdition/);
  assert.match(body, /getWarshTranslationEdition/);
  assert.match(body, /fetchRemoteTranslations/);
  assert.match(body, /AbortError/, "an aborted page load must not be swallowed");
});

test("the selection survives a reload and every locale names the edition", () => {
  const storage = readSource("src/services/storageService.js");
  assert.match(storage, /VALID_TRANSLATION_LANGS\s*=\s*\[[^\]]*WARSH_TRANSLATION_EDITION_ID/s);
  for (const [locale, dictionary] of [["fr", fr], ["en", en], ["ar", ar]]) {
    for (const key of ["translationWarshLabel", "translationWarshEdition", "translationWarshHint"]) {
      assert.ok(dictionary.settings?.[key], `${locale} settings.${key}`);
    }
    assert.match(dictionary.settings.translationWarshLabel, /Warsh|ورش/);
  }
});

test("the attribution register declares the translation and its rights", () => {
  const register = readSource("src/data/contentAttributions.js");
  const start = register.indexOf('id: "montada-warsh-fr"');
  assert.ok(start > 0, "the edition is registered");
  const entry = register.slice(start, register.indexOf("},", start));
  assert.match(entry, /category:\s*"translation"/);
  assert.match(entry, /Nabil Redouane/);
  assert.match(entry, /Al-Montada Al-Islami/);
  assert.match(entry, /quranpedia\.net\/translation-books\/1949/);
  assert.match(entry, /guilde|libre/i, "the supplier's live-use permission is recorded");
});

/* ── 7. The English Warsh edition (Pickthall, quranpedia.net book 13604) ── */

const ASSET_DIR_EN = "../public/data/warsh-translation-en/";
const INDEX_EN = readJson(`${ASSET_DIR_EN}index.json`);
const docsEn = new Map();
for (let surah = 1; surah <= 114; surah += 1) {
  docsEn.set(surah, readJson(`${ASSET_DIR_EN}${fileFor(surah)}`));
}

test("the English edition is served from 114 local surah files plus one index", () => {
  const onDisk = fs
    .readdirSync(new URL(ASSET_DIR_EN, import.meta.url))
    .filter((name) => !name.startsWith("."))
    .sort();
  assert.deepEqual(onDisk, EXPECTED_FILES, "no file may be fetched at runtime");
});

test("every English surah recites exactly the Warsh verses the French edition recites", () => {
  for (const [surah, docEn] of docsEn) {
    const docFr = docs.get(surah);
    const expected = getWarshSurahAyahCount(surah);
    assert.equal(docEn.schema, INDEX_EN.schema, `surah ${surah} schema tag`);
    assert.equal(docEn.edition, WARSH_TRANSLATION_EDITION_ID_EN, `surah ${surah} edition`);
    assert.equal(docEn.surah_number, surah);
    assert.equal(docEn.number_of_ayahs, expected, `surah ${surah} declared count`);
    assert.equal(docEn.ayahs.length, expected, `surah ${surah} verse count`);
    docEn.ayahs.forEach((entry, index) => {
      assert.equal(entry.ayah_number, index + 1, `warsh ${surah}:${index + 1} dense numbering`);
      assert.deepEqual(
        entry.hafs_numbers,
        docFr.ayahs[index].hafs_numbers,
        `warsh ${surah}:${index + 1} shares the mapping provenance`,
      );
    });
  }
  assert.equal(
    [...docsEn.values()].reduce((sum, doc) => sum + doc.ayahs.length, 0),
    6214,
  );
});

test("English reading lines stay free of markup, note markers and numbering", () => {
  for (const [surah, doc] of docsEn) {
    for (const entry of doc.ayahs) {
      const label = `warsh ${surah}:${entry.ayah_number}`;
      assert.ok(typeof entry.text === "string" && entry.text.trim(), `${label} non-empty`);
      assert.doesNotMatch(entry.text, /<[^>]*>/, `${label} free of markup`);
      assert.doesNotMatch(entry.text, /^\[\d{1,4}\]|_{4,}/, `${label} free of the apparatus`);
      assert.doesNotMatch(entry.text, /^\s*\d{1,4}\.\s/, `${label} free of verse numbering`);
      assert.doesNotMatch(entry.text, /\s{2,}|\u00a0/, `${label} single-spaced`);
    }
  }
  // The basmala stays ornamental and the text really is English.
  assert.equal(docsEn.get(1).ayahs[0].text, "Praise be to Allah, Lord of the Worlds,");
  assert.equal(
    docsEn.get(1).ayahs.some((entry) => /in the name of allah/i.test(entry.text)),
    false,
    "the basmala must not leak into a numbered verse",
  );
  // Ayat al-Kursi: Warsh 2:253 and 2:254 both recite hafs 255.
  const [twoFiftyThree, twoFiftyFour] = docsEn.get(2).ayahs.slice(252, 254);
  assert.deepEqual(twoFiftyThree.hafs_numbers, [255]);
  assert.deepEqual(twoFiftyFour.hafs_numbers, [255]);
  assert.equal(twoFiftyThree.text, twoFiftyFour.text);
  assert.equal(
    [...docsEn.values()].flatMap((doc) => doc.ayahs).filter((entry) => entry.hafs_numbers.length > 1).length,
    INDEX_EN.numberingAdaptation.mergedAyahs,
    "merged verses",
  );
});

test("the English index.json pins the SHA-256 of the files actually shipped", () => {
  assert.equal(INDEX_EN.schema, "mushafplus-warsh-translation-en-v1");
  assert.equal(INDEX_EN.edition.id, WARSH_TRANSLATION_EDITION_ID_EN);
  assert.equal(INDEX_EN.edition.name, "The Holy Qur'an — Warsh (Pickthall)");
  assert.equal(INDEX_EN.edition.language, "en");
  assert.equal(INDEX_EN.edition.riwaya, "warsh");
  assert.equal(INDEX_EN.edition.offline, true);
  assert.match(INDEX_EN.attribution, /Pickthall/i);
  assert.equal(INDEX_EN.source.provider, "quranpedia.net");
  assert.equal(INDEX_EN.source.bookId, 13604);
  assert.equal(INDEX_EN.source.numbering, "hafs");
  assert.equal(INDEX_EN.source.hafsTotalAyahs, 6236);
  assert.match(INDEX_EN.source.sha256, /^[0-9a-f]{64}$/);
  assert.equal(INDEX_EN.numberingAdaptation.warshTotalAyahs, 6214);
  assert.equal(Object.keys(INDEX_EN.files).length, 114);
  for (let surah = 1; surah <= 114; surah += 1) {
    const name = `${ASSET_DIR_EN}${fileFor(surah)}`;
    const pinned = INDEX_EN.files[fileFor(surah)];
    assert.equal(pinned.surah, surah, name);
    assert.equal(pinned.ayahs, docsEn.get(surah).ayahs.length, name);
    assert.equal(pinned.bytes, readBytes(name).length, name);
    assert.equal(pinned.sha256, digestOf(name), `${name} digest must match its bytes`);
  }
});

test("the English chooser, storage token, locale labels and attribution are wired", () => {
  const source = readSource("src/services/quranAPI.js");
  const start = source.indexOf("export const TRANSLATION_CHOICES");
  const choices = source.slice(start, source.indexOf("];", start));
  assert.match(choices, /WARSH_TRANSLATION_EDITION_ID_EN/);
  assert.match(choices, /labelKey:\s*["']settings\.translationWarshLabelEn["']/);
  assert.match(
    source,
    /localLangs\.map\(\(editionId\)\s*=>\s*getWarshTranslationEdition\(scope\.type,\s*scope\.value,\s*editionId\)\)/,
    "fetchTranslations passes the selected edition id through",
  );
  const storage = readSource("src/services/storageService.js");
  assert.match(
    storage,
    /VALID_TRANSLATION_LANGS\s*=\s*\[[^\]]*WARSH_TRANSLATION_EDITION_ID_EN/s,
  );
  for (const [locale, dictionary] of [["fr", fr], ["en", en], ["ar", ar]]) {
    assert.ok(dictionary.settings?.translationWarshLabelEn, `${locale} translationWarshLabelEn`);
    assert.match(dictionary.settings.translationWarshLabelEn, /Warsh|ورش/);
  }
  const register = readSource("src/data/contentAttributions.js");
  const entryStart = register.indexOf('id: "pickthall-warsh-en"');
  assert.ok(entryStart > 0, "the English edition is registered");
  const entry = register.slice(entryStart, register.indexOf("},", entryStart));
  assert.match(entry, /category:\s*"translation"/);
  assert.match(entry, /Pickthall/);
  assert.match(entry, /quranpedia\.net\/translation-books\/13604/);
});

test("the loader serves the English edition offline under its own cache keys", async () => {
  const enRequested = [];
  const LOCAL_ASSET_EN =
    /^\/data\/warsh-translation-en\/(\d{3}\.json|index\.json)\?v=mushafplus-warsh-translation-en-v1$/;
  const frFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const match = LOCAL_ASSET_EN.exec(String(url));
    if (!match) {
      assert.ok(LOCAL_ASSET.test(String(url)), `unexpected request: ${url}`);
      return frFetch(url);
    }
    enRequested.push(String(url));
    const buffer = Uint8Array.from(readBytes(`${ASSET_DIR_EN}${match[1]}`)).buffer;
    return { ok: true, status: 200, arrayBuffer: async () => buffer };
  };
  try {
    const records = await getWarshTranslationSurah(2, WARSH_TRANSLATION_EDITION_ID_EN);
    assert.equal(records.length, 285);
    assert.equal(records[252].text, docsEn.get(2).ayahs[252].text);
    assert.equal(
      await getWarshTranslationSurah(2, WARSH_TRANSLATION_EDITION_ID_EN),
      records,
      "a surah is parsed once per session per edition",
    );
    // The two editions never share a memory cache entry.
    const frRecords = await getWarshTranslationSurah(2);
    assert.notEqual(frRecords, records);
    assert.equal(frRecords[252].text, docs.get(2).ayahs[252].text);

    const edition = await getWarshTranslationEdition("surah", 1, WARSH_TRANSLATION_EDITION_ID_EN);
    assert.equal(edition.edition.identifier, WARSH_TRANSLATION_EDITION_ID_EN);
    assert.equal(edition.edition.language, "en");
    assert.equal(edition.edition.riwaya, "warsh");
    assert.equal(edition.source, "pickthall-warsh");
    assert.equal(edition.numberOfAyahs, 7);
    assert.equal(edition.isOffline, true);
    assert.deepEqual(edition.ayahs[0].hafsNumbers, [2]);
    assert.equal(edition.ayahs[0].text, "Praise be to Allah, Lord of the Worlds,");
    assert.ok(enRequested.length > 0, "the English assets were read through fetch");
  } finally {
    globalThis.fetch = frFetch;
  }
});
