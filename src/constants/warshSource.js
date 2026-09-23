/**
 * Warsh (Nafi') text source: pinned provenance, integrity digest, and the
 * per-surah Warsh numbering facts every Warsh consumer shares.
 *
 * Provenance of the two remote datasets
 * - Displayed Warsh Unicode text: `Yousr-Allah-Allouani/warsh-quran-audio`,
 *   `warsh_text/NNN.json` (one file per surah, `ayah_number` + `text`),
 *   6214 ayahs in Warsh Madinah numbering.
 *   Pinned to commit 72644e3d52428095d8832d3dbc42d581209647ce.
 * - Legacy fallback dataset: `aziz011133/quran_warsh`, `warshData_v2-1.json`
 *   (6214 rows, same numbering; also the dataset the Warsh page/juz view and
 *   the derived Warsh-Hafs mapping in src/data/warshHafsNumbering.js come
 *   from). Pinned to commit 31d4c18a8cf4afa081e113ffd377bb23372f6e26.
 *   The exact verified bytes ship as public/data/warsh-page-source.json for
 *   fast same-origin page reading and first-install offline access.
 *
 * Why pinned: these URLs decide which Quran text a reader sees. A `main` /
 * `refs/heads/main` raw URL silently serves whatever the branch head holds on
 * the day the request is made, so an upstream force-push or new commit could
 * change the riwaya under an already released build (and poison the IndexedDB
 * copy for months). Commit SHAs are immutable, so a text change can only reach
 * users through a reviewed release. `raw.githubusercontent.com` accepts the
 * `<owner>/<repo>/<sha>/<path>` form; the `/refs/commits/<sha>/` form is not
 * served by the raw host and returns 404.
 *
 * Refresh procedure (deliberate, reviewed change, never automatic):
 * 1. `curl https://api.github.com/repos/<owner>/<repo>/commits/main` for the new SHA.
 * 2. Update the SHA constants below and re-fetch every payload they point at.
 * 3. Recompute the legacy digest: `sha256sum warshData_v2-1.json`.
 * 4. Run `npm run test:security`, `npm run audit:warsh:tajweed` and
 *    `npm run audit:warsh:audio` before shipping.
 */

import SURAHS from "../data/surahs.js";
import {
  hafsToWarshNumbers,
  hasWarshHafsMapping,
  warshToHafsNumbers,
} from "../data/warshHafsNumbering.js";

const WARSH_TEXT_COMMIT = "72644e3d52428095d8832d3dbc42d581209647ce";
const WARSH_LEGACY_COMMIT = "31d4c18a8cf4afa081e113ffd377bb23372f6e26";

/**
 * Base URL for Warsh Unicode text data.
 * Files are organized by surah number: 001.json, 002.json, etc.
 */
export const WARSH_DATA_BASE_URL =
  `https://raw.githubusercontent.com/Yousr-Allah-Allouani/warsh-quran-audio/${WARSH_TEXT_COMMIT}/warsh_text/`;

export const WARSH_LEGACY_JSON_URL =
  `https://raw.githubusercontent.com/aziz011133/quran_warsh/${WARSH_LEGACY_COMMIT}/warshData_v2-1.json`;
export const WARSH_LOCAL_JSON_URL = "/data/warsh-page-source.json";

// A few source ayahs span a printed page boundary. The page reader shows each
// complete ayah once, on the page where it begins.
export function getWarshPageStart(rawPage) {
  const match = String(rawPage ?? "").match(/^(\d{1,3})(?:-(\d{1,3}))?$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  return start >= 1 && end <= 604 && end - start <= 1 && end >= start
    ? start
    : null;
}

/**
 * SHA-256 of the exact bytes served at WARSH_LEGACY_JSON_URL above.
 * warshService verifies it on the fetched buffer before anything is written to
 * IndexedDB, so a tampered or truncated mirror can never become the reader's
 * offline Quran text.
 */
export const WARSH_LEGACY_JSON_SHA256 =
  "c6017e688cc599d88f6fdb1a19cafc9c51d024b3530955f1a878f17d26b9bcbc";

const warshAyahCounts = new Map();

/**
 * Number of numbered ayahs the Warsh Madinah mushaf carries in one surah
 * (285 in Al-Baqara, 122 in Al-Ma'ida, ...). Derived synchronously from the
 * canonical Warsh-Hafs mapping: the mapping tiles each surah contiguously, so
 * the highest Warsh number its Hafs verses resolve to is the surah's Warsh
 * total. 6214 across the Quran.
 *
 * Validated against both Warsh datasets at the pinned commits: per-surah totals
 * match the 6214 rows of warshData_v2-1.json and the 114 warsh_text/NNN.json
 * files exactly (see tests/warsh-riwaya-integrity.test.mjs).
 *
 * Returns 0 when the surah is unknown or its mapping is flagged unreliable, so
 * callers never guess a Quranic verse count.
 */
export function getWarshSurahAyahCount(surahNumber) {
  const surah = Number(surahNumber);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return 0;
  if (warshAyahCounts.has(surah)) return warshAyahCounts.get(surah);

  let count = 0;
  if (hasWarshHafsMapping(surah)) {
    const hafsTotal = Number(SURAHS[surah - 1]?.ayahs) || 0;
    for (let hafs = 1; hafs <= hafsTotal; hafs += 1) {
      const warshNumbers = hafsToWarshNumbers(surah, hafs);
      if (warshNumbers?.length) count = Math.max(count, Math.max(...warshNumbers));
    }
  }

  warshAyahCounts.set(surah, count);
  return count;
}

/**
 * Verse total as the riwaya being read counts it. Warsh splits verses Hafs
 * joins, so 18 surahs have more Warsh verses than Hafs ones; a reading surface
 * that quotes the wrong total contradicts the verses on screen.
 */
export function getSurahVerseCountByRiwaya(surahNumber, riwaya = "hafs") {
  const hafsTotal = Number(SURAHS[Number(surahNumber) - 1]?.ayahs) || 0;
  if (riwaya !== "warsh") return hafsTotal;
  return getWarshSurahAyahCount(surahNumber) || hafsTotal;
}

/**
 * Hafs (quran.com) verse numbers recited by one displayed ayah.
 *
 * Hafs ayahs keep their own number. Warsh ayahs must be translated through
 * src/data/warshHafsNumbering.js first: the two riwayat number the Quran
 * differently (6214 vs 6236 ayahs, 50 surahs split differently), so joining
 * Hafs-keyed data (audio, translation, tafsir, word-by-word) on a raw Warsh
 * `numberInSurah` silently attaches the neighbouring verse.
 *
 * Returns null when the ayah cannot be placed: unknown surah, unreliable
 * mapping, a Warsh number past the surah's last ayah, or the ornamental
 * Al-Fatiha basmala (which has no numbered Warsh counterpart). Callers then
 * disable the Hafs enrichment for that verse instead of misaligning it.
 */
export function hafsNumbersForAyah(ayah, riwaya = "hafs") {
  const surah = Number(ayah?.surah?.number ?? ayah?.surahNumber ?? ayah?.surah);
  const numberInSurah = Number(ayah?.numberInSurah ?? ayah?.ayah);
  if (!Number.isInteger(surah) || !Number.isInteger(numberInSurah) || numberInSurah < 1) {
    return null;
  }
  if (riwaya !== "warsh") return [numberInSurah];
  return warshToHafsNumbers(surah, numberInSurah) ?? null;
}
