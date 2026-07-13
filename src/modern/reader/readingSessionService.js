import { logSession } from "../../services/historyService";
import { markRead } from "../../services/readingProgressService";
import { logWirdProgress } from "../../services/wirdService";
import { buildReadingInterval } from "./readingSessionModel";

const START_KEY = "mon-coran-reading-start";

export function getReadingStart() {
  try { return JSON.parse(localStorage.getItem(START_KEY) || "null"); } catch { return null; }
}

export function setReadingStart(verse) {
  const start = { surah: Number(verse.surahNumber || verse.surah), ayah: Number(verse.ayahNumber || verse.ayah) };
  localStorage.setItem(START_KEY, JSON.stringify(start));
  return start;
}

export function clearReadingStart() { localStorage.removeItem(START_KEY); }

export async function completeReadingAt(verse, start = getReadingStart()) {
  const end = { surah: Number(verse.surahNumber || verse.surah), ayah: Number(verse.ayahNumber || verse.ayah) };
  const interval = buildReadingInterval(start, end);
  if (!interval) return null;
  markRead(interval.surah, interval.toAyah);
  await Promise.all([
    logWirdProgress({ surah: interval.surah, fromAyah: interval.fromAyah, toAyah: interval.toAyah, pagesCount: 0 }),
    logSession({ surah: interval.surah, ayahFrom: interval.fromAyah, ayahTo: interval.toAyah, page: verse.page || null, durationMs: 0 }),
  ]);
  clearReadingStart();
  return interval;
}
