/**
 * Whole-surah playback with verse timing, kept out of AudioService.
 *
 * A voice published both as verse files and as one recording per surah can play
 * a complete surah as that single recording: no source swap at each verse
 * boundary, so nothing for a locked phone to freeze on. The service then holds
 * one item per surah, `timeline` says where each verse sits in its file, and the
 * current verse is read off the playback position (utils/surahStreamSync.js).
 * Everything that needs one item per verse (A-B loop, tartil speeds, a page or a
 * range, Warsh numbering) keeps playing verse files. All functions take the
 * service, like audioHandoff.js and audioNextSource.js.
 */

import { getSurahAyahCount } from "../data/surahs.js";
import { getSurahTwinRecitationId } from "./surahAudioSources.js";
import { SURAH_TIMED_CDN } from "./audioUrlBuilder.js";

/**
 * The Quran.com chapter-reciter id to play this list with as one recording, or
 * null to play verse files. Complete surahs only, Hafs only, online only (the
 * timing is fetched, and downloaded audio is verse files).
 */
export function surahTwinFor(svc, ayahs, reciterCdn, cdnType, mode) {
  if ((mode ?? svc.playbackMode) === "verse") return null;
  if (svc.tartilMode || (svc.abRepeatStart >= 0 && svc.abRepeatEnd >= 0)) return null;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
  const recitationId = getSurahTwinRecitationId(reciterCdn, cdnType);
  if (!recitationId || !Array.isArray(ayahs) || ayahs.length === 0) return null;

  let surah = null;
  let last = 0;
  const closed = new Set();
  const complete = () =>
    surah !== null &&
    last === getSurahAyahCount(surah) &&
    !svc._timedFailures.has(`${recitationId}:${surah}`);
  for (const ayah of ayahs) {
    if (ayah?.riwaya === "warsh") return null;
    const current = Number(ayah?.surah || ayah?.surahNumber);
    const number = Number(ayah?.numberInSurah ?? ayah?.ayah);
    if (!current || !number) return null;
    if (current !== surah) {
      if (surah !== null && !complete()) return null;
      if (closed.has(current)) return null;
      if (surah !== null) closed.add(surah);
      surah = current;
      last = 0;
    }
    if (number !== last + 1) return null;
    last = number;
  }
  return complete() ? recitationId : null;
}

/** Fetch where each verse sits in the surah's recording; false when it cannot be trusted. */
export async function ensureTimeline(svc, item) {
  if (item.timeline) return true;
  const recitationId = svc._timedOrigin?.recitationId;
  if (!recitationId) return false;
  try {
    // Loaded on first use: the timing client (and its cache) stays out of the boot graph.
    const { getChapterAudioTimeline } = await import("./quranComAudioTimingService.js");
    const timeline = await getChapterAudioTimeline(recitationId, item.surah, getSurahAyahCount(item.surah));
    item.timeline = timeline;
    item.urls = [timeline.url];
    item.url = timeline.url;
    return true;
  } catch (err) {
    svc._timedFailures.add(`${recitationId}:${item.surah}`);
    svc._diagnose("timeline-failed", err);
    return false;
  }
}

/** No usable timeline: play the same verse from its own files instead. */
export function fallBackToVerseFiles(svc, item) {
  const origin = svc._timedOrigin;
  if (!origin) return;
  const pending = svc._pendingSurahStreamAyah?.surah === Number(item.surah) ? svc._pendingSurahStreamAyah : null;
  const ayah = Number(pending?.ayah || (svc.currentAyah?.surah === item.surah ? svc.currentAyah.ayah : 0)) || 1;
  svc._pendingSurahStreamAyah = null;
  svc.loadPlaylist(svc._playlistSourceAyahs, origin.cdn, origin.cdnType, { autoRestart: false, mode: "verse" });
  const index = svc.playlist.findIndex((entry) => entry.surah === item.surah && entry.ayah === ayah);
  void svc._loadAndPlay(index >= 0 ? index : 0);
}

/** Next/previous verse inside a whole-surah recording: a seek, not a new source. */
export function seekTimedVerse(svc, direction) {
  if (svc._currentCdnType !== SURAH_TIMED_CDN || svc._oneShotMode) return false;
  const verses = svc.playlist[svc.playlistIndex]?.timeline?.verses;
  const ayah = svc.currentAyah?.ayah;
  if (!verses || !ayah) return false;
  const position = verses.findIndex((verse) => verse.ayah === ayah);
  const target = verses[position + direction];
  if (position < 0 || !target) return false;
  svc.audio.currentTime = target.from;
  svc._emitTimeUpdate();
  return true;
}

/** Time inside the verse being recited, whichever way it is played. */
export function verseClock(svc) {
  const window = svc.currentAyah?.verseWindow;
  if (svc._currentCdnType === SURAH_TIMED_CDN && window) {
    return {
      time: Math.max(0, svc.currentTime - window.from),
      duration: Math.max(0, window.to - window.from),
    };
  }
  return { time: svc.currentTime, duration: svc.duration };
}
