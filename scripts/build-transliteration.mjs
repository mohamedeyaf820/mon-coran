/**
 * Builds the offline Latin transliteration assets (Hafs numbering).
 *
 * Source: Quran.com v4 word-by-word transliteration (english), the same
 * provider the app already trusts for word-by-word data and tafsirs. Each
 * verse's transliteration is the space-joined stream of its word
 * transliterations, so the text matches the mushaf word-for-word (e.g.
 * 2:252 reads "tilka ayatu l-qur'ani waKitabin mubiin" the same way the
 * Arabic does). The end-of-ayah tokens carry no transliteration and are
 * filtered out.
 *
 * The dataset is keyed on Hafs ayah numbering (6236 verses), the numbering
 * Quran.com uses. Warsh surfaces keep the rule-based approximation in
 * src/data/transliteration.js until an authoritative Warsh transliteration
 * source exists; promoting Hafs phonetics into the Warsh reading line would
 * misrepresent the recitation.
 *
 * Nothing is fetched at runtime: the generated JSON is committed under
 * public/data/transliteration-en/ and read by
 * src/services/transliterationService.js.
 *
 * Usage:
 *   node scripts/build-transliteration.mjs
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import SURAHS from "../src/data/surahs.js";

const SCHEMA = "mushafplus-transliteration-en-hafs-v1";
const EDITION_ID = "en.qurancom-wordbyword";
const EDITION_NAME = "Transliteration latine — mot à mot (Quran.com)";
const ATTRIBUTION =
  "Translittération latine anglaise mot à mot, d'après le jeu de données word-by-word de quran.com (API v4). Numérotation Hafs (6236 versets).";
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.resolve(REPO_ROOT, "public", "data", "transliteration-en");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchChapter(surah) {
  const url =
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}` +
    "?words=true&word_fields=transliteration&per_page=600";
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status} for chapter ${surah}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.verses) || payload.verses.length === 0) {
        throw new Error(`Empty verses payload for chapter ${surah}`);
      }
      if (payload.pagination?.next_page != null) {
        throw new Error(`Chapter ${surah} did not arrive in a single page`);
      }
      return payload.verses;
    } catch (error) {
      lastError = error;
      await sleep(750 * attempt);
    }
  }
  throw lastError;
}

function verseTransliteration(verse) {
  const words = Array.isArray(verse.words) ? verse.words : [];
  const tokens = words
    .map((word) => String(word?.transliteration?.text ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!tokens) throw new Error(`No transliteration tokens for ${verse.verse_key}`);
  if (ARABIC_RE.test(tokens)) throw new Error(`Arabic characters leaked into ${verse.verse_key}`);
  return tokens;
}

function buildSurah(surah, verses) {
  const expected = Number(SURAHS[surah - 1]?.ayahs) || 0;
  const byNumber = new Map();
  for (const verse of verses) {
    const match = /^(\d+):(\d+)$/.exec(String(verse?.verse_key ?? ""));
    if (!match || Number(match[1]) !== surah) {
      throw new Error(`Unexpected verse_key ${verse?.verse_key} in chapter ${surah} payload`);
    }
    const number = Number(match[2]);
    if (byNumber.has(number)) throw new Error(`Duplicate verse ${surah}:${number}`);
    byNumber.set(number, verseTransliteration(verse));
  }
  if (byNumber.size !== expected) {
    throw new Error(`Chapter ${surah}: got ${byNumber.size} of ${expected} verses`);
  }
  const ayahs = [];
  for (let number = 1; number <= expected; number += 1) {
    const text = byNumber.get(number);
    if (!text) throw new Error(`Chapter ${surah} missing verse ${number}`);
    ayahs.push({ ayah_number: number, text });
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

const files = {};
let totalAyahs = 0;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (let surah = 1; surah <= 114; surah += 1) {
  const verses = await fetchChapter(surah);
  const document = buildSurah(surah, verses);
  const name = `${String(surah).padStart(3, "0")}.json`;
  const bytes = Buffer.from(serialize(document), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, name), bytes);
  files[name] = {
    surah,
    ayahs: document.number_of_ayahs,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  totalAyahs += document.number_of_ayahs;
  process.stdout.write(`surah ${surah}: ${document.number_of_ayahs} ayahs\n`);
  await sleep(250);
}

if (totalAyahs !== 6236) {
  throw new Error(`Hafs totals must sum to 6236, got ${totalAyahs}`);
}

const index = {
  schema: SCHEMA,
  edition: {
    id: EDITION_ID,
    name: EDITION_NAME,
    language: "en",
    direction: "ltr",
    riwaya: "hafs",
    offline: true,
  },
  attribution: ATTRIBUTION,
  source: {
    provider: "quran.com",
    api: "v4 /verses/by_chapter with words=true&word_fields=transliteration",
    numbering: "hafs",
    hafsTotalAyahs: totalAyahs,
  },
  textRules: [
    "Verse text is the space-joined stream of its word transliterations",
    "End-of-ayah tokens carry no transliteration and are excluded",
    "No Arabic characters, markup or note markers may leak into text",
  ],
  generatedAt: new Date().toISOString(),
  files,
};

fs.writeFileSync(path.join(OUTPUT_DIR, "index.json"), serialize(index));

const totalBytes =
  Object.values(files).reduce((sum, item) => sum + item.bytes, 0) +
  fs.statSync(path.join(OUTPUT_DIR, "index.json")).size;

console.log(
  `Transliteration EN: ${totalAyahs} ayahs in 114 files, ${(totalBytes / 1024).toFixed(0)} kB -> public/data/transliteration-en`,
);
