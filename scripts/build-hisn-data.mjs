/**
 * Builds public/data/hisn/hisn.json: Hisn al-Muslim (« La Citadelle du
 * musulman », Sa'id ibn 'Ali al-Qahtani) as structured, sourced data.
 *
 * What comes from where
 *  - Arabic text, chapter titles, repetition counts, item order:
 *    https://www.hisnmuslim.com/api (the book's own site, public API).
 *  - Quran references: each ﴿ … ﴾ quotation (or an item that is Quran from end
 *    to end) is located in the Hafs text of AlQuran.cloud ("quran-simple-clean").
 *  - Hadith references: the Arabic wording of each supplication is searched in
 *    the Arabic text of Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i and Ibn
 *    Majah (fawazahmed0/hadith-api, Unlicense, numbering of sunnah.com), with
 *    the gradings that dataset carries for the four Sunan.
 *
 * The hadith references are FOUND, not copied from the book: the book's own
 * citations are not in the public data. A reference therefore says "this
 * wording is in hadith N", and its `m` records how close the match is:
 *    "exact"    the whole wording appears verbatim in the hadith;
 *    "fuzzy"    >= 80 % of its word triples appear in the hadith (one small
 *               variant word, "wa" or "fa", is enough to break an exact match);
 *    "partial"  composite supplication, >= 75 % of its words found sentence by
 *               sentence in the hadith;
 *    "fragment" only the longest distinctive sentence (>= 4 words, found in at
 *               most 8 hadiths) of a composite supplication is in the hadith.
 * An item with no match keeps no hadith reference rather than a guessed one.
 *
 * Translations are NOT produced here: they are written by hand in
 * public/data/hisn/{fr,en}.json, keyed on the item ids of this file.
 *
 * Usage:
 *   node scripts/build-hisn-data.mjs
 *   node scripts/build-hisn-data.mjs --refresh          (ignore the download cache)
 *   node scripts/build-hisn-data.mjs --cache some/dir   (default: OS temp dir)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag, fallback) {
  const at = process.argv.indexOf(flag);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
}
const CACHE_DIR = path.resolve(argValue("--cache", path.join(os.tmpdir(), "mushafplus-hisn-cache")));
const OUT_FILE = path.resolve(ROOT, argValue("--out", "public/data/hisn/hisn.json"));
const REFRESH = process.argv.includes("--refresh");

const HISN_API = "https://www.hisnmuslim.com/api";
const HADITH_API = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const QURAN_URL = "https://api.alquran.cloud/v1/quran/quran-simple-clean";

/** key, edition, display name; the order is the tie-break order of references. */
const COLLECTIONS = [
  { key: "bukhari", edition: "ara-bukhari", sahihayn: true },
  { key: "muslim", edition: "ara-muslim", sahihayn: true },
  { key: "abudawud", edition: "ara-abudawud" },
  { key: "tirmidhi", edition: "ara-tirmidhi" },
  { key: "nasai", edition: "ara-nasai" },
  { key: "ibnmajah", edition: "ara-ibnmajah" },
];
const PRIORITY = Object.fromEntries(COLLECTIONS.map((c, i) => [c.key, i]));

// ─── Download with a local cache ────────────────────────────────────────────

async function download(name, url) {
  const file = path.join(CACHE_DIR, name);
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
      return text;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  throw new Error(`Cannot download ${url}: ${lastError?.message || lastError}`);
}

/** hisnmuslim.com files start with a BOM and carry raw line breaks inside strings. */
function flatten(text) {
  let flat = "";
  for (const char of text.replace(/^\uFEFF/, "")) flat += char.charCodeAt(0) < 32 ? " " : char;
  return flat;
}

/** One chapter file has an unterminated title key: read only the items array. */
function parseItems(text) {
  const flat = flatten(text);
  return JSON.parse(flat.slice(flat.indexOf("["), flat.lastIndexOf("]") + 1));
}

async function mapLimit(values, limit, task) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await task(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

// ─── Arabic normalisation ───────────────────────────────────────────────────

const DIACRITICS = new RegExp(
  "[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]",
  "g",
);

/** Letters only: no vowel signs, one alef, one ya, one ha, no hamza seats. */
export function norm(text) {
  return String(text || "")
    .replace(DIACRITICS, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^ء-ي\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Consonant skeleton for Quran matching: the same word is spelled differently
 * between the book and the Quran text (السموات / السماوات, يؤوده / يئوده), so the
 * weak letters are dropped on both sides and whole words are compared.
 */
export const skeleton = (text) => norm(text).replace(/[اويى]/g, "").replace(/\s+/g, " ").trim();
const pad = (text) => ` ${text} `;
const wordCount = (text) => (text ? text.split(" ").length : 0);

// ─── Quran index ────────────────────────────────────────────────────────────

const MIN_AYAH_WORDS = 3; // shorter ayahs (Alif Lam Mim, Ya Sin) cannot identify a quotation
const MIN_AYAH_CHARS = 8;
const BASMALA = norm("بسم الله الرحمن الرحيم");

function buildQuranIndex(json) {
  const index = [];
  for (const surah of json.data.surahs) {
    for (const ayah of surah.ayahs) {
      let text = norm(ayah.text);
      // This edition prefixes the basmala to the first ayah of every surah but Al-Fatiha.
      if (surah.number !== 1 && ayah.numberInSurah === 1 && text.startsWith(`${BASMALA} `)) {
        text = text.slice(BASMALA.length + 1);
      }
      const k = skeleton(text);
      index.push({ surah: surah.number, ayah: ayah.numberInSurah, k, p: pad(k), words: wordCount(k) });
    }
  }
  return index;
}

function createQuranFinder(quran) {
  const fullAyahs = (padded) =>
    quran.filter((v) => v.words >= MIN_AYAH_WORDS && v.k.length >= MIN_AYAH_CHARS && padded.includes(v.p));

  /** Drop an ayah whose words sit inside another matched ayah (3:2 inside 2:255). */
  const dropSubsumed = (found) =>
    found.filter((v) => !found.some((o) => o !== v && o.p.length > v.p.length && o.p.includes(v.p)));

  /** One range per surah: the short ayahs between two matches (112:2) belong to the quotation. */
  const surahRanges = (found) => {
    const bySurah = new Map();
    for (const f of found) {
      const range = bySurah.get(f.surah);
      if (!range) bySurah.set(f.surah, [f.surah, f.ayah, f.ayah]);
      else {
        range[1] = Math.min(range[1], f.ayah);
        range[2] = Math.max(range[2], f.ayah);
      }
    }
    return [...bySurah.values()].sort((a, b) => a[0] - b[0]);
  };

  const dedupe = (ranges) => {
    const seen = new Set();
    return ranges.filter((r) => {
      const key = r.join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    /** Quotations the book itself marks with ﴿ ﴾. */
    fromBlocks(arabic) {
      const blocks = [...String(arabic).matchAll(/﴿([^﴾]+)﴾/gu)].map((m) => m[1]);
      const ranges = [];
      for (const block of blocks) {
        const k = skeleton(block);
        const padded = pad(k);
        let found = fullAyahs(padded);
        if (!found.length && wordCount(k) >= 3) found = quran.filter((v) => v.p.includes(padded));
        found = dropSubsumed(found);
        // A quotation may start inside the previous ayah (43:13 ends with "subhana lladhi sakhkhara lana hadha").
        if (found.length) {
          const first = found[0];
          const prefix = padded.slice(0, padded.indexOf(first.p)).trim();
          const previous = quran[quran.indexOf(first) - 1];
          if (wordCount(prefix) >= 3 && previous?.surah === first.surah && previous.k.endsWith(prefix)) {
            found = [previous, ...found];
          }
        }
        // The last ayah can be split by a stray space ("wa n-nas") and miss the whole-word match.
        if (found.length) {
          const last = found[found.length - 1];
          const next = quran[quran.indexOf(last) + 1];
          const tail = padded.slice(padded.lastIndexOf(last.p) + last.p.length).trim();
          if (next?.surah === last.surah && tail && tail.replace(/ /g, "") === next.k.replace(/ /g, "")) {
            found = [...found, next];
          }
        }
        ranges.push(...surahRanges(found));
      }
      return dedupe(ranges);
    },
    /** Items that are Quran from end to end without ﴿ ﴾. Generic formulas ("la ilaha illa Llah") match nothing. */
    wholeItem(arabic) {
      const k = skeleton(String(arabic).replace(/\[[^\]]*\]/gu, " "));
      const words = wordCount(k);
      if (words < 4) return [];
      const padded = pad(k);
      const found = dropSubsumed(fullAyahs(padded));
      if (found.length) {
        const covered = found.reduce((sum, v) => sum + v.words, 0);
        return covered / words >= 0.9 ? dedupe(surahRanges(found)) : [];
      }
      const inside = quran.filter((v) => v.p.includes(padded));
      return inside.length === 1 && k.length >= 10 ? dedupe(surahRanges(inside)) : [];
    },
  };
}

// ─── Hadith index ───────────────────────────────────────────────────────────

/** sunnah.com numbers Muslim by Abd al-Baqi with a letter ("713a"); the dataset writes "713.01". */
function referenceNumber(collection, hadith) {
  if (collection.key !== "muslim") return String(hadith.hadithnumber ?? "");
  const raw = String(hadith.arabicnumber ?? "").trim();
  const sub = /^(\d+)\.(\d{2})$/.exec(raw);
  if (sub) {
    const letter = Number(sub[2]);
    return letter >= 1 && letter <= 26 ? `${sub[1]}${String.fromCharCode(96 + letter)}` : raw;
  }
  return raw;
}

const WEAK = /da.?if|mawdu|munkar|shadh|batil/i;

function pickGrade(hadith) {
  const grades = Array.isArray(hadith.grades) ? hadith.grades : [];
  if (!grades.length) return null;
  const preferred = ["Al-Albani", "Shuaib Al Arnaut", "Zubair Ali Zai", "Muhammad Muhyi Al-Din Abdul Hamid"];
  for (const name of preferred) {
    const found = grades.find((g) => g.name === name && g.grade);
    if (found) return { by: found.name, grade: found.grade };
  }
  const first = grades.find((g) => g.grade);
  return first ? { by: first.name, grade: first.grade } : null;
}

function buildHadithIndex(editions) {
  const corpus = [];
  for (const { collection, json } of editions) {
    for (const hadith of json.hadiths) {
      const number = referenceNumber(collection, hadith);
      if (!number || number === "undefined" || number === "null") continue;
      const text = norm(hadith.text);
      const grade = pickGrade(hadith);
      corpus.push({
        key: collection.key,
        number,
        text,
        len: wordCount(text),
        grade,
        weak: (hadith.grades || []).some((g) => WEAK.test(g.grade || "")),
      });
    }
  }
  const trigrams = new Map();
  corpus.forEach((entry, i) => {
    const words = entry.text.split(" ");
    const seen = new Set();
    for (let k = 0; k + 2 < words.length; k += 1) {
      const gram = `${words[k]} ${words[k + 1]} ${words[k + 2]}`;
      if (seen.has(gram)) continue;
      seen.add(gram);
      let list = trigrams.get(gram);
      if (!list) trigrams.set(gram, (list = []));
      list.push(i);
    }
  });
  return { corpus, trigrams };
}

function createHadithFinder({ corpus, trigrams }) {
  const bucket = (score) => Math.round(score * 20) / 20;
  // Same quality of match: the Sahihayn first (the book cites them most), then the hadith that is
  // mostly the supplication itself (shortest), never a graded-weak narration while another exists.
  const rank = (a, b) =>
    Number(a.entry.weak) - Number(b.entry.weak) ||
    bucket(b.score) - bucket(a.score) ||
    PRIORITY[a.entry.key] - PRIORITY[b.entry.key] ||
    a.entry.len - b.entry.len;

  /** Sentence-level search shared by the "partial" and "fragment" modes. */
  const sentencesOf = (arabic, minWords) =>
    String(arabic)
      .split(/[.،؛:()[\]﴿﴾*!؟?]/u)
      .map(norm)
      .filter((s) => wordCount(s) >= minWords);

  return function find(arabic) {
    const text = norm(arabic);
    const words = text.split(" ");
    if (words.length < 3) return [];

    const seen = new Set();
    const hits = [];
    const add = (entry, score, mode) => {
      if (seen.has(entry)) return;
      seen.add(entry);
      hits.push({ entry, score, mode });
    };

    for (const entry of corpus) if (entry.text.includes(text)) add(entry, 1, "exact");

    // Tolerant: one variant word ("wa", "fa") breaks an exact match but not 80 % of the word triples.
    if (words.length >= 8) {
      const grams = [...new Set(words.slice(0, -2).map((_, k) => `${words[k]} ${words[k + 1]} ${words[k + 2]}`))];
      const count = new Map();
      for (const gram of grams) for (const i of trigrams.get(gram) || []) count.set(i, (count.get(i) || 0) + 1);
      for (const [i, c] of count) if (c / grams.length >= 0.8) add(corpus[i], c / grams.length, "fuzzy");
    }

    if (!hits.length) {
      // Composite supplication: 75 % of its words found sentence by sentence in one hadith.
      const sentences = sentencesOf(arabic, 3);
      const total = sentences.reduce((sum, s) => sum + wordCount(s), 0);
      if (sentences.length >= 2 && total >= 8) {
        for (const entry of corpus) {
          let got = 0;
          let longest = 0;
          for (const s of sentences) {
            if (entry.text.includes(s)) {
              got += wordCount(s);
              longest = Math.max(longest, wordCount(s));
            }
          }
          if (got / total >= 0.75 && longest >= 6) add(entry, got / total, "partial");
        }
      }
    }

    if (!hits.length) {
      // Fragment: the longest sentence (>= 4 words) that only a few hadiths contain. A formula found in
      // many hadiths ("la hawla wa la quwwata illa billah") identifies nothing and is skipped.
      const sentences = sentencesOf(arabic, 4).sort((x, y) => wordCount(y) - wordCount(x));
      for (const sentence of sentences) {
        const found = corpus.filter((entry) => entry.text.includes(sentence));
        if (found.length >= 1 && found.length <= 8) {
          for (const entry of found) add(entry, 0.5, "fragment");
          break;
        }
      }
    }

    hits.sort(rank);
    return hits;
  };
}

// ─── Assemble ───────────────────────────────────────────────────────────────

/** Drop one pair of parentheses that wraps the whole text (and only when its first "(" closes at the very end). */
function unwrapParentheses(text) {
  let current = text.trim();
  // "( … )." and "( … )،": the closing mark after the parenthesis belongs to the book's layout.
  if (current.startsWith("(")) current = current.replace(/\)\s*[.،]$/u, ")");
  while (current.startsWith("(") && current.endsWith(")")) {
    let depth = 0;
    let closesAtEnd = true;
    for (let i = 0; i < current.length; i += 1) {
      if (current[i] === "(") depth += 1;
      else if (current[i] === ")") {
        depth -= 1;
        if (depth === 0 && i < current.length - 1) {
          closesAtEnd = false;
          break;
        }
      }
    }
    if (!closesAtEnd) break;
    current = current.slice(1, -1).trim();
  }
  return current;
}

/** The book wraps quoted wording in (( )) or ( ); the app shows plain text. */
function cleanArabic(text) {
  const plain = String(text)
    .replace(/\(\(|\)\)/g, " ")
    .replace(/\s+([،.؛:!؟])/g, "$1")
    .replace(/\(\s*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return unwrapParentheses(plain);
}

function toReference(hit) {
  const { entry } = hit;
  const ref = { c: entry.key, n: entry.number, m: hit.mode };
  // Bukhari and Muslim need no grading; the Sunan carry the grade the dataset records.
  if (entry.grade && PRIORITY[entry.key] >= 2) {
    ref.g = entry.grade.grade;
    ref.b = entry.grade.by;
  }
  return ref;
}

async function main() {
  console.log(`[hisn] cache: ${CACHE_DIR}`);

  const listText = await download("husn_ar.json", `${HISN_API}/ar/husn_ar.json`);
  const list = Object.values(JSON.parse(flatten(listText)))[0];
  if (!Array.isArray(list) || list.length < 100) throw new Error("Unexpected Hisn chapter list");

  const chapterTexts = await mapLimit(list, 8, (chapter) =>
    download(`ar/${chapter.ID}.json`, `${HISN_API}/ar/${chapter.ID}.json`),
  );

  const editions = [];
  for (const collection of COLLECTIONS) {
    const text = await download(`hadith/${collection.edition}.json`, `${HADITH_API}/${collection.edition}.min.json`);
    editions.push({ collection, json: JSON.parse(text) });
  }
  const quranJson = JSON.parse(await download("quran-simple-clean.json", QURAN_URL));

  const quran = createQuranFinder(buildQuranIndex(quranJson));
  const hadith = createHadithFinder(buildHadithIndex(editions));

  const stats = { chapters: 0, items: 0, quran: 0, hadith: 0, exact: 0, fuzzy: 0, partial: 0, fragment: 0, noReference: 0 };
  const chapters = list.map((chapter, c) => {
    const items = parseItems(chapterTexts[c]).map((raw) => {
      const arabic = cleanArabic(raw.ARABIC_TEXT);
      let q = quran.fromBlocks(raw.ARABIC_TEXT);
      if (!q.length) q = quran.wholeItem(raw.ARABIC_TEXT);

      // What is left once the quoted verses and their basmala are removed: the supplication itself, if any.
      const withoutQuran = String(raw.ARABIC_TEXT).replace(/﴿[^﴾]*﴾/gu, " ");
      const remainder = norm(withoutQuran).split(BASMALA).join(" ").replace(/\s+/g, " ").trim();
      const remainderWords = wordCount(remainder);
      const kind = q.length && remainderWords < 4 ? "quran" : q.length ? "mixed" : "dua";

      const item = { id: raw.ID, ar: arabic, n: Math.max(1, Number(raw.REPEAT) || 1), k: kind };
      if (q.length) item.q = q;

      // A pure Quran item is referenced by its ayahs; a mixed one only when its non-Quran part is long enough to identify.
      const searchable = kind === "dua" ? raw.ARABIC_TEXT : kind === "mixed" && remainderWords >= 8 ? withoutQuran : null;
      if (searchable) {
        const top = hadith(searchable).slice(0, 2);
        if (top.length) {
          item.h = top.map(toReference);
          stats.hadith += 1;
          stats[top[0].mode] += 1;
        }
      }
      stats.items += 1;
      if (q.length) stats.quran += 1;
      if (!q.length && !item.h) stats.noReference += 1;
      return item;
    });
    stats.chapters += 1;
    return { id: chapter.ID, ar: cleanArabic(chapter.TITLE), items };
  });

  // Hard checks: a silent drop of chapters or text would ship as "complete".
  if (chapters.length !== list.length) throw new Error("Chapter count changed while building");
  for (const chapter of chapters) {
    if (!chapter.ar || chapter.items.length === 0) throw new Error(`Empty chapter ${chapter.id}`);
    for (const item of chapter.items) if (!item.ar) throw new Error(`Empty item ${item.id}`);
  }
  const ids = chapters.flatMap((c) => c.items.map((i) => i.id));
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate item ids");

  const output = {
    schema: "mushafplus-hisn-v1",
    book: "Hisn al-Muslim (Sa'id ibn 'Ali al-Qahtani)",
    sources: {
      text: "hisnmuslim.com API",
      hadith: "fawazahmed0/hadith-api (Unlicense), numbering of sunnah.com",
      quran: "AlQuran.cloud quran-simple-clean (Hafs)",
    },
    stats,
    chapters,
  };

  // One item per line: readable diffs when the data is rebuilt.
  const lines = ["{"];
  for (const key of ["schema", "book", "sources", "stats"]) lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(output[key])},`);
  lines.push('  "chapters": [');
  chapters.forEach((chapter, i) => {
    lines.push(`    {"id": ${chapter.id}, "ar": ${JSON.stringify(chapter.ar)}, "items": [`);
    chapter.items.forEach((item, j) => lines.push(`      ${JSON.stringify(item)}${j < chapter.items.length - 1 ? "," : ""}`));
    lines.push(`    ]}${i < chapters.length - 1 ? "," : ""}`);
  });
  lines.push("  ]", "}", "");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, lines.join("\n"));

  console.log(`[hisn] wrote ${path.relative(ROOT, OUT_FILE)} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KiB)`);
  console.log(
    `[hisn] chapters ${stats.chapters}, items ${stats.items}; Quran refs ${stats.quran}; hadith refs ${stats.hadith}` +
      ` (best match: exact ${stats.exact}, fuzzy ${stats.fuzzy}, partial ${stats.partial}, fragment ${stats.fragment});` +
      ` items without any reference ${stats.noReference}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[hisn] ${error.message}`);
    process.exit(1);
  });
}
