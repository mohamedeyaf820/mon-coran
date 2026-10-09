/**
 * Which verse a whole-surah recording is reciting, and where a verse starts in it.
 *
 * A stream item carries `timeline` when the source published verse timing
 * ({ verses: [{ ayah, from, to, segments }] }, seconds in the file). Without it
 * (the legacy mp3quran streams) nothing can identify or seek a verse.
 */

const EDGE = 0.005; // seconds: a timestamp lands on the boundary, the next verse owns it

/** The timeline verse playing at `seconds`; the last one once past the end. */
export function findTimelineVerse(timeline, seconds) {
  const verses = timeline?.verses;
  if (!Array.isArray(verses) || verses.length === 0) return null;
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  let low = 0;
  let high = verses.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (verses[middle].from <= t + EDGE) low = middle;
    else high = middle - 1;
  }
  return verses[low];
}

/** Where a verse starts in the recording, or null when it is not on the timeline. */
export function getSurahStreamSeekSeconds(streamItem, ayah) {
  const verse = streamItem?.timeline?.verses?.find((entry) => entry.ayah === Number(ayah));
  return verse ? verse.from : null;
}

/** Fraction of the file where a verse starts: only untimed sources have none. */
export function getSurahStreamProgressForAyah() { return null; }

export function resolveSurahStreamAyah(sourceAyahs, streamItem, currentTime, _duration, pendingAyah) {
  const verse = streamItem?.timeline
    ? pendingAyah
      ? streamItem.timeline.verses.find((entry) => entry.ayah === Number(pendingAyah)) ?? null
      : findTimelineVerse(streamItem.timeline, currentTime)
    : null;
  if (!verse) {
    return { ...streamItem, ayah: null, numberInSurah: null, text: "", estimatedTiming: false };
  }
  const source = Array.isArray(sourceAyahs)
    ? sourceAyahs.find(
        (entry) =>
          (entry.surah || entry.surahNumber) === streamItem.surah &&
          Number(entry.numberInSurah ?? entry.ayah) === verse.ayah,
      )
    : null;
  return {
    ...streamItem,
    ayah: verse.ayah,
    numberInSurah: verse.ayah,
    hafsNumber: verse.ayah,
    globalNumber: source?.number ?? streamItem.globalNumber,
    text: source?.text ?? "",
    segments: verse.segments,
    quranComAudioTiming: { segments: verse.segments, durationSec: verse.to - verse.from },
    verseWindow: { from: verse.from, to: verse.to },
    estimatedTiming: false,
  };
}
