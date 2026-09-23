/**
 * Tracks the user's Quran reading progress in localStorage.
 * Stores the maximum ayah number read per surah.
 * Total Quran ayahs: 6236.
 */
import SURAHS from '../data/surahs';
import {
  readLocalStorageWithSchema,
  readProgressSchema,
  writeLocalStorageJson,
} from "./storageValidation";

const KEY = 'mushafplus_read_progress';
const TOTAL_AYAHS = 6236;

/** Mark an ayah as read (updates max per surah if new ayah is higher). */
export function markRead(surah, ayah) {
  const p = readLocalStorageWithSchema(KEY, readProgressSchema, {});
  if ((ayah | 0) > (p[surah] || 0)) {
    p[surah] = ayah | 0;
    writeLocalStorageJson(KEY, p);
  }
}

/** Get raw progress map: { [surahNum]: maxAyahRead } */
export function getReadProgress() {
  return readLocalStorageWithSchema(KEY, readProgressSchema, {});
}

/** Compute reading stats from stored progress. */
export function getReadStats() {
  const p = getReadProgress();
  let totalRead = 0;
  let completedSurahs = 0;
  SURAHS.forEach(s => {
    const max = Math.min(p[s.n] || 0, s.ayahs);
    totalRead += max;
    if (max >= s.ayahs) completedSurahs++;
  });
  return {
    totalRead,
    total: TOTAL_AYAHS,
    percentage: Math.min(100, Math.floor(totalRead / TOTAL_AYAHS * 100)),
    completedSurahs,
  };
}

/** Reset all reading progress. */
export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
