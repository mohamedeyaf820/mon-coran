export function getTranslationKeyForAyah(surahNumber, ayahNumber) {
  if (!surahNumber || !ayahNumber) return null;
  return `surah:${surahNumber}:${ayahNumber}`;
}

/**
 * Key for an edition published in Warsh Madinah numbering. Warsh and Hafs
 * share their numbers up to the first divergence (6214 verses against 6236),
 * so a Warsh edition must never land in the Hafs namespace: `warsh:2:1` is
 * Al-Baqara's first Warsh verse, which recites Hafs 1 and 2 together.
 */
export function getWarshTranslationKeyForAyah(surahNumber, ayahNumber) {
  if (!surahNumber || !ayahNumber) return null;
  return `warsh:${surahNumber}:${ayahNumber}`;
}

/** True when an ayah object is numbered the way the Warsh mushaf numbers it. */
export function isWarshNumberedAyah(ayah) {
  return (
    ayah?.requestedRiwaya === "warsh" || Array.isArray(ayah?.hafsNumbers)
  );
}

/**
 * The Hafs numbers a displayed ayah occupies — the coordinate every
 * Hafs-keyed consumer (tafsir, bookmarks, notes, deep links) must use.
 * Returns null when the verse cannot be placed, so callers never silently
 * attach a neighbouring verse's data.
 */
export function getWarshHafsMapping(ayah, riwaya) {
  if (riwaya === "warsh" && isWarshNumberedAyah(ayah)) {
    return Array.isArray(ayah.hafsNumbers) && ayah.hafsNumbers.length
      ? ayah.hafsNumbers
      : null;
  }
  const numberInSurah = Number(ayah?.numberInSurah ?? ayah?.ayah);
  return Number.isInteger(numberInSurah) && numberInSurah > 0
    ? [numberInSurah]
    : null;
}

