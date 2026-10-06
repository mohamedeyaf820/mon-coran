/** Full-surah sources without verified timing cannot identify or seek verses. */
export function getSurahStreamProgressForAyah() { return null; }
export function resolveSurahStreamAyah(_ayahs, streamItem) {
  return { ...streamItem, ayah: null, numberInSurah: null, text: "", estimatedTiming: false };
}
