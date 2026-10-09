/**
 * Builds the offline Warsh-adapted French translation assets.
 *
 * Source: « Le Saint Coran », translation of the meanings by Dr Nabil Redouane,
 * Al-Montada Al-Islami 2017, published as translation book 1949 on
 * quranpedia.net (the provider declares free live in-app use). The import is
 * keyed on Hafs ayah numbering (6236 verses); this script re-keys it on the
 * Warsh Madinah numbering the reader sees (6214 verses) through the canonical
 * mapping in src/data/warshHafsNumbering.js, so the French line under a Warsh
 * ayah always translates exactly the Arabic words above it.
 *
 * Join rules, per Warsh ayah:
 *  - one Warsh ayah reciting several Hafs verses (Warsh 2:1 = Hafs 1+2) gets
 *    those verses' text joined with a single space;
 *  - several Warsh ayahs reciting one Hafs verse (Warsh 1:6 and 1:7 = Hafs 7)
 *    cannot split a French sentence without guessing, so both carry the full
 *    Hafs verse text. This is what the app already shows for Hafs-keyed
 *    editions in Warsh mode, and it never attaches another verse's text;
 *  - the Hafs basmala of Al-Fatiha (Hafs 1:1) stays out of the numbered
 *    verses: it is ornamental in the Warsh mushaf, exactly as in
 *    public/data and warsh_text/001.json.
 *
 * The translator's apparatus (footnotes) is kept in the assets as
 * `footnotes` so the vendored edition stays complete, and stripped from the
 * displayed `text` together with the source's own verse-number prefixes and
 * inline markup, which would otherwise leak `[91]` markers and `<strong>`
 * tags into the reading view.
 *
 * Nothing is fetched at runtime: the generated JSON is committed under
 * public/data/warsh-translation-fr/ and read by src/services/warshTranslationService.js.
 *
 * Usage:
 *   node scripts/build-warsh-translation.mjs
 *   node scripts/build-warsh-translation.mjs --input scratch/montada/1949.json
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import SURAHS from "../src/data/surahs.js";
import {
  getWarshSurahAyahCount,
  hafsNumbersForAyah,
} from "../src/constants/warshSource.js";

const EDITIONS = {
  fr: {
    sourceUrl: "https://quranpedia.net/translation-books/1949.json",
    editionId: "fr.montada-warsh",
    editionName: "Le Saint Coran — Warsh (Montada 2017)",
    schema: "mushafplus-warsh-translation-fr-v1",
    language: "fr",
    output: path.join("public", "data", "warsh-translation-fr"),
    attribution:
      "« Le Saint Coran » — traduction des sens par Dr Nabil Redouane, Al-Montada Al-Islami 2017, d'après le jeu de données publié sur quranpedia.net (book 1949). Numérotation adaptative Warsh (Madinah) par MushafPlus.",
    translator: "Dr Nabil Redouane (نبيل رضوان)",
    publisher: "Al-Montada Al-Islami — المنتدى الإسلامي",
    year: 2017,
  },
  en: {
    sourceUrl: "https://quranpedia.net/translation-books/13604.json",
    editionId: "en.pickthall-warsh",
    editionName: "The Holy Qur'an — Warsh (Pickthall)",
    schema: "mushafplus-warsh-translation-en-v1",
    language: "en",
    output: path.join("public", "data", "warsh-translation-en"),
    attribution:
      "The Holy Qur'an: translation and commentary by Muhammad Marmaduke Pickthall (1930, public domain), d'après le jeu de données publié sur quranpedia.net (book 13604). Warsh (Madinah) adaptive numbering by MushafPlus.",
    translator: "Muhammad Marmaduke Pickthall",
    publisher: "Public domain",
    year: 1930,
  },
};

let SOURCE_URL = EDITIONS.fr.sourceUrl;
let EDITION_ID = EDITIONS.fr.editionId;
let EDITION_NAME = EDITIONS.fr.editionName;
let ATTRIBUTION = EDITIONS.fr.attribution;
let SCHEMA = EDITIONS.fr.schema;
let EDITION_LANGUAGE = "fr";
let EDITION_TRANSLATOR = EDITIONS.fr.translator;
let EDITION_PUBLISHER = EDITIONS.fr.publisher;
let EDITION_YEAR = EDITIONS.fr.year;
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// `____________________` between two <br /> separates the translated verse from
// the translator's notes. Tolerant to a missing break on either side.
const APPARATUS_RE = /(?:\s*<br\s*\/?>)?\s*\n?\s*_{8,}\s*(?:<br\s*\/?>)?\s*/i;
const NOTE_RE = /\[(\d{1,4})\]([\s\S]*?)(?=\[\d{1,4}\]|$)/g;

function parseArgs(argv) {
  const args = { input: null, output: null, edition: "fr" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") args.input = argv[++i];
    else if (argv[i] === "--out") args.output = argv[++i];
    else if (argv[i] === "--edition") args.edition = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  const preset = EDITIONS[args.edition];
  if (!preset) throw new Error(`Unknown edition: ${args.edition} (fr|en)`);
  SOURCE_URL = preset.sourceUrl;
  EDITION_ID = preset.editionId;
  EDITION_NAME = preset.editionName;
  ATTRIBUTION = preset.attribution;
  SCHEMA = preset.schema;
  EDITION_LANGUAGE = preset.language;
  EDITION_TRANSLATOR = preset.translator;
  EDITION_PUBLISHER = preset.publisher;
  EDITION_YEAR = preset.year;
  args.output ??= preset.output;
  return args;
}

async function loadImport(inputPath) {
  let text;
  if (inputPath) {
    text = fs.readFileSync(path.resolve(REPO_ROOT, inputPath), "utf8");
  } else {
    const response = await fetch(SOURCE_URL, { redirect: "follow" });
    if (!response.ok) throw new Error(`Import fetch failed: ${response.status}`);
    text = await response.text();
  }
  const payload = JSON.parse(text);
  if (!Array.isArray(payload?.ayahs) || payload.ayahs.length === 0) {
    throw new Error("Import schema: { ayahs: [] } expected");
  }
  return { payload, bytes: Buffer.from(text, "utf8") };
}

/**
 * Markup and source numbering are publishing artifacts, not translation text:
 * the reader gets the verse number from the mushaf marker, and the note
 * references from the `footnotes` field.
 */
function toDisplayText(chunk) {
  return String(chunk)
    .replace(/<[^>]*>/g, "")
    .replace(/\[\d{1,4}\]/g, "")
    .replace(/^\s*\d{1,4}\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toPlainText(chunk) {
  return String(chunk)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toFootnotes(apparatus) {
  const notes = [];
  const plain = String(apparatus).replace(/<br\s*\/?>/gi, "\n");
  for (const match of plain.matchAll(NOTE_RE)) {
    const text = toPlainText(match[2]);
    if (text) notes.push({ ref: Number(match[1]), text });
  }
  return notes;
}

function parseEntry(raw) {
  const source = String(raw?.translated_text ?? "");
  const split = APPARATUS_RE.exec(source);
  if (!split) return { text: toDisplayText(source), footnotes: [] };
  return {
    text: toDisplayText(source.slice(0, split.index)),
    footnotes: toFootnotes(source.slice(split.index + split[0].length)),
  };
}

function indexHafsAyahs(ayahs) {
  const bySurah = new Map();
  for (const row of ayahs) {
    const surah = Number(row?.surah_number);
    const ayah = Number(row?.ayah_number);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || ayah < 1) continue;
    if (!bySurah.has(surah)) bySurah.set(surah, new Map());
    const inner = bySurah.get(surah);
    if (inner.has(ayah)) throw new Error(`Duplicate import verse ${surah}:${ayah}`);
    inner.set(ayah, parseEntry(row));
  }
  return bySurah;
}

function buildSurah(surah, hafsIndex) {
  const hafsTotal = Number(SURAHS[surah - 1]?.ayahs) || 0;
  const verses = hafsIndex.get(surah);
  if (!verses || verses.size !== hafsTotal) {
    throw new Error(`Import covers ${verses?.size ?? 0} of ${hafsTotal} Hafs verses for surah ${surah}`);
  }
  const expected = getWarshSurahAyahCount(surah);
  if (!expected) throw new Error(`No Warsh verse total for surah ${surah}`);

  const ayahs = [];
  for (let warsh = 1; warsh <= expected; warsh += 1) {
    const hafsNumbers = hafsNumbersForAyah({ surahNumber: surah, ayah: warsh }, "warsh");
    if (!hafsNumbers?.length) {
      throw new Error(`Warsh ${surah}:${warsh} has no Hafs counterpart in the mapping`);
    }
    const parts = [];
    const footnotes = [];
    for (const hafs of hafsNumbers) {
      const entry = verses.get(hafs);
      if (!entry?.text) throw new Error(`Missing translation for Hafs ${surah}:${hafs}`);
      parts.push(entry.text);
      for (const note of entry.footnotes) {
        if (!footnotes.some((item) => item.ref === note.ref)) footnotes.push(note);
      }
    }
    ayahs.push({
      ayah_number: warsh,
      hafs_numbers: hafsNumbers,
      text: parts.join(" "),
      ...(footnotes.length ? { footnotes } : {}),
    });
  }

  if (ayahs.length !== expected || ayahs.some((item) => !item.text)) {
    throw new Error(`Generated surah ${surah} failed its completeness check`);
  }
  return {
    schema: SCHEMA,
    edition: EDITION_ID,
    surah_number: surah,
    number_of_ayahs: expected,
    ayahs,
  };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function serialize(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

const args = parseArgs(process.argv.slice(2));
const { payload: imported, bytes: importedBytes } = await loadImport(args.input);
const hafsIndex = indexHafsAyahs(imported.ayahs);
const outputDir = path.resolve(REPO_ROOT, args.output);
fs.mkdirSync(outputDir, { recursive: true });

const files = {};
let totalAyahs = 0;
let mergedAyahs = 0;
let footnotedAyahs = 0;

for (let surah = 1; surah <= 114; surah += 1) {
  const document = buildSurah(surah, hafsIndex);
  const name = `${String(surah).padStart(3, "0")}.json`;
  const bytes = Buffer.from(serialize(document), "utf8");
  fs.writeFileSync(path.join(outputDir, name), bytes);
  files[name] = {
    surah,
    ayahs: document.number_of_ayahs,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  totalAyahs += document.number_of_ayahs;
  mergedAyahs += document.ayahs.filter((item) => item.hafs_numbers.length > 1).length;
  footnotedAyahs += document.ayahs.filter((item) => item.footnotes?.length).length;
}

if (totalAyahs !== 6214) {
  throw new Error(`Warsh totals must sum to 6214, got ${totalAyahs}`);
}

const index = {
  schema: SCHEMA,
  edition: {
    id: EDITION_ID,
    name: EDITION_NAME,
    language: EDITION_LANGUAGE,
    direction: "ltr",
    riwaya: "warsh",
    offline: true,
  },
  attribution: ATTRIBUTION,
  source: {
    provider: "quranpedia.net",
    bookId: imported.id,
    bookName: imported.name,
    shortName: imported.short_name,
    url: SOURCE_URL,
    translator: EDITION_TRANSLATOR,
    publisher: EDITION_PUBLISHER,
    year: EDITION_YEAR,
    numbering: "hafs",
    hafsTotalAyahs: imported.ayahs.length,
    sha256: sha256(importedBytes),
  },
  numberingAdaptation: {
    mapping: "src/data/warshHafsNumbering.js",
    warshTotalAyahs: totalAyahs,
    mergedAyahs,
    footnotedAyahs,
    splitRule: "Warsh verses sharing one Hafs verse carry its full text",
    textRules: [
      "Source verse-number prefixes, inline markup and note references stripped from text",
      "Translator notes kept in footnotes",
      "Al-Fatiha basmala stays ornamental: Hafs 1:1 is not a numbered Warsh verse",
    ],
  },
  generatedAt: new Date().toISOString(),
  files,
};

fs.writeFileSync(path.join(outputDir, "index.json"), serialize(index));

const sizeKb = (bytes) => (bytes / 1024).toFixed(0);
const totalBytes =
  Object.values(files).reduce((sum, item) => sum + item.bytes, 0) +
  fs.statSync(path.join(outputDir, "index.json")).size;

console.log(
  `Warsh ${EDITION_LANGUAGE} translation: ${totalAyahs} ayahs in 114 files ` +
    `(${mergedAyahs} merged, ${footnotedAyahs} with notes), ${sizeKb(totalBytes)} kB -> ${args.output}`,
);
