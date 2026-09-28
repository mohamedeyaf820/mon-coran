/**
 * Vendors the French tafsir corpus into public/data/tafsir-fr-mokhtasar/.
 *
 * Source: "French Abridged Explanation of the Quran" (Al-Mukhtasar fi at-Tafsir,
 * the Egyptian Ministry of Awqaf abridged edition), edition id 259 as mirrored by
 * the MIT-licensed spa5k/tafsir_api dataset, one JSON array per surah at
 * `tafsir/french-mokhtasar/{surah}.json`. Each entry is { text, ayah, surah } keyed
 * on the Hafs verse numbering.
 *
 * Provenance is pinned: the import is read from an exact upstream commit tag
 * (UPSTREAM_SHA), never from `main`, and every per-surah file's SHA-256 is written
 * to index.json so src/services/frenchTafsirService.js can digest-gate its offline
 * IndexedDB copy. Nothing is fetched from the third party at runtime — the reader
 * gets the tafsir offline from the vendored, digest-pinned asset.
 *
 * The upstream text carries markdown artifacts (a leading backtick on many
 * transliterated terms, ` - ` list separators) that are not part of the French
 * commentary; toDisplayText strips them so the reading surface never shows a raw
 * backtick. Prose newlines are preserved (the panel renders with white-space:
 * pre-wrap and several ayahs carry multi-sentence explanations).
 *
 * Content-license note: the code repository is MIT, but the license of the French
 * commentary itself is not stated upstream. Per the product decision this edition
 * ships WITH attribution and an in-app "report an error" affordance rather than as
 * an unattributed corpus; that provenance is recorded here and surfaced in the UI.
 *
 * Usage:
 *   node scripts/build-french-tafsir.mjs
 *   node scripts/build-french-tafsir.mjs --offline-dir scratch/french-tafsir
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import SURAHS from "../src/data/surahs.js";

const EDITION_ID = "fr-mokhtasar";
const SCHEMA = "mushafplus-tafsir-fr-v1";
const LANGUAGE = "fr";
const SOURCE_NAME = "Al-Mukhtasar fi at-Tafsir (French)";
const UPSTREAM_OWNER = "spa5k/tafsir_api";
const UPSTREAM_SLUG = "french-mokhtasar";
// Pinned upstream commit (content-addressable), not `main`: the README warns that
// a moved CDN tag can serve stale files for up to a year. Bump deliberately.
const UPSTREAM_SHA = "3bdd77606d85b9558e55282e94a6ed20b949b3e4";
const UPSTREAM_URL = `https://raw.githubusercontent.com/${UPSTREAM_OWNER}/${UPSTREAM_SHA}/tafsir/${UPSTREAM_SLUG}`;
const ATTRIBUTION =
  "« Al-Mukhtasar fi at-Tafsir » — explication abrégée du Coran, édition du Ministère égyptien des Awqaf, d'après le jeu de données « french-mokhtasar » (id 259) publié via spa5k/tafsir_api. Traduction française.";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join("public", "data", "tafsir-fr-mokhtasar");

function parseArgs(argv) {
  const args = { offlineDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--offline-dir") args.offlineDir = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

/**
 * Strips the source's markdown artifacts without touching the French prose:
 * a wrapping/leading backtick on transliterated terms, and a leading " - " list
 * marker. Consecutive spaces collapse; the string is trimmed. Newlines are kept.
 */
function toDisplayText(raw) {
  return String(raw ?? "")
    .replace(/`/g, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function padded(surahNumber) {
  return String(surahNumber).padStart(3, "0");
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function loadSurah(surah, offlineDir) {
  // Upstream (and any offline mirror) name files by the bare surah number
  // (`1.json`); only our vendored output is zero-padded to `001.json`.
  const name = offlineDir ? `${padded(surah)}.json` : `${surah}.json`;
  if (offlineDir) {
    const file = path.resolve(REPO_ROOT, offlineDir, name);
    return fs.readFileSync(file);
  }
  const response = await fetch(`${UPSTREAM_URL}/${name}`, { redirect: "follow" });
  if (!response.ok) throw new Error(`Upstream fetch failed for ${name}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function normalizeSurah(surah, bytes) {
  const rows = JSON.parse(bytes.toString("utf8"));
  if (!Array.isArray(rows)) throw new Error(`Surah ${surah}: expected an array`);
  const expected = Number(SURAHS[surah - 1]?.ayahs) || 0;
  if (!expected) throw new Error(`Surah ${surah}: no Hafs ayah total in data/surahs.js`);

  const byAyah = new Map();
  for (const row of rows) {
    const ayah = Number(row?.ayah);
    if (!Number.isInteger(ayah) || ayah < 1 || ayah > expected) {
      throw new Error(`Surah ${surah}: ayah number ${row?.ayah} out of range 1..${expected}`);
    }
    if (byAyah.has(ayah)) throw new Error(`Surah ${surah}: duplicate ayah ${ayah}`);
    byAyah.set(ayah, toDisplayText(row?.text));
  }

  const ayahs = [];
  for (let ayah = 1; ayah <= expected; ayah += 1) {
    const text = byAyah.get(ayah);
    if (!text) throw new Error(`Surah ${surah}: missing/empty commentary for ayah ${ayah}`);
    ayahs.push({ ayah_number: ayah, text });
  }
  if (ayahs.length !== expected) {
    throw new Error(`Surah ${surah}: built ${ayahs.length} of ${expected} verses`);
  }
  return { ayahs, expected };
}

async function main() {
  const { offlineDir } = parseArgs(process.argv.slice(2));
  const outAbs = path.resolve(REPO_ROOT, OUTPUT_DIR);
  fs.mkdirSync(outAbs, { recursive: true });

  const files = {};
  let totalVerses = 0;
  let totalBytes = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const rawBytes = await loadSurah(surah, offlineDir);
    const { ayahs, expected } = normalizeSurah(surah, rawBytes);
    totalVerses += ayahs.length;
    const doc = {
      schema: SCHEMA,
      edition: EDITION_ID,
      language: LANGUAGE,
      surah_number: surah,
      number_of_ayahs: expected,
      ayahs,
    };
    const payload = `${JSON.stringify(doc, null, 2)}\n`;
    const bytes = Buffer.from(payload, "utf8");
    totalBytes += bytes.length;
    const name = `${padded(surah)}.json`;
    fs.writeFileSync(path.join(outAbs, name), bytes);
    files[name] = { sha256: sha256Hex(bytes), verses: expected };
  }

  const index = {
    schema: SCHEMA,
    edition: { id: EDITION_ID, language: LANGUAGE, name: SOURCE_NAME },
    attribution: ATTRIBUTION,
    source: { owner: UPSTREAM_OWNER, slug: UPSTREAM_SLUG, sha: UPSTREAM_SHA, url: UPSTREAM_URL },
    builtAt: new Date().toISOString(),
    counts: { surahs: 114, verses: totalVerses, bytes: totalBytes },
    files,
  };
  fs.writeFileSync(
    path.join(outAbs, "index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
  );

  console.log(
    `[french-tafsir] vendored ${114} surahs / ${totalVerses} verses / ${(totalBytes / 1024).toFixed(1)} kB -> ${OUTPUT_DIR}`,
  );
}

main().catch((error) => {
  console.error(`[french-tafsir] build failed: ${error.message}`);
  process.exitCode = 1;
});
