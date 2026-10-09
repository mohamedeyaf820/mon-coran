/**
 * Per-ayah audio files a provider does not serve.
 *
 * These are provider holes, not numbering differences: every other verse of the
 * same surah resolves, and the app's Warsh numbering is verified against the
 * pinned Warsh text (see src/constants/warshSource.js). Playback filters them
 * out of the playlist so recitation keeps flowing instead of stopping on a 404,
 * and the live audit (`npm run audit:warsh:audio`) asserts these are the only
 * holes it may report.
 *
 * Verified live 2026-09-20 against files.quranpedia.net: sets 262, 264, 265 and
 * 267 drop Al-Mulk 31, and set 266 (Rachid Belalaya) drops Al-Mulk 31 plus the
 * other Warsh-only tail verses listed below. Keyed on the displayed verse
 * number, because these sets follow riwaya numbering.
 */
const GAPS = [
  ["262", 67, 31],
  ["264", 67, 31],
  ["265", 67, 31],
  ["266", 14, 53],
  ["266", 67, 31],
  ["266", 71, 29],
  ["266", 71, 30],
  ["266", 89, 31],
  ["266", 89, 32],
  ["266", 96, 20],
  ["266", 99, 9],
  ["266", 106, 5],
  ["267", 67, 31],
];

const GAP_KEYS = new Set(GAPS.map(([cdn, surah, ayah]) => `${cdn}:${surah}:${ayah}`));

export function isAyahAudioUnavailable(cdnType, reciterCdn, surah, ayah) {
  if (cdnType !== "quranpedia") return false;
  return GAP_KEYS.has(`${reciterCdn}:${Number(surah) || 0}:${Number(ayah) || 0}`);
}

/** Drop playlist entries whose audio file the provider does not serve. */
export function filterAyahAudioGaps(ayahs, cdnType, reciterCdn) {
  if (!Array.isArray(ayahs)) return [];
  return ayahs.filter(
    (entry) =>
      !isAyahAudioUnavailable(
        cdnType,
        reciterCdn,
        entry?.surah || entry?.surahNumber,
        entry?.ayah ?? entry?.numberInSurah,
      ),
  );
}

/** Gaps declared for a reciter set, as [surah, ayah] pairs (audit + tests). */
export function listAyahAudioGaps(reciterCdn) {
  return GAPS.filter(([cdn]) => cdn === String(reciterCdn)).map(([, s, a]) => [s, a]);
}
