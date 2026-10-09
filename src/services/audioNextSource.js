/**
 * Next-track lookup, made while the current verse plays.
 *
 * A locked phone may freeze the page the moment a verse ends and nothing plays.
 * If the next verse waited for a storage read before starting, it would not start
 * until the reader came back. With the lookup already made, the hand-off is a
 * source swap and a play() in the same turn. The state lives on the AudioService
 * instance (`_preparedSource`: { signature, index, urls, cached }).
 */
import { isTrustedAudioUrl } from "./audioSources.js";
import { findOfflineAudio } from "./offlineAudioStore.js";

export function candidateUrls(item) {
  return (Array.isArray(item.urls) && item.urls.length > 0 ? item.urls : [item.url]).filter(isTrustedAudioUrl);
}

/** The track `ended` moves to; mirrors handleVerseEnded in audioHandoff.js. */
export function upcomingIndex(svc, index) {
  if (svc.abRepeatStart >= 0 && svc.abRepeatEnd >= 0 && index >= svc.abRepeatEnd) return svc.abRepeatStart;
  if (index < svc.playlist.length - 1) return index + 1;
  const hasMoreCycles = svc.surahRepeatCount === 0 || svc.surahCurrentCycle < svc.surahRepeatCount;
  return svc.playlist.length > 0 && hasMoreCycles ? 0 : -1;
}

export async function prepareNextSource(svc, fromIndex) {
  const index = upcomingIndex(svc, fromIndex);
  const item = svc.playlist[index];
  if (!item) { svc._preparedSource = null; return; }
  const urls = candidateUrls(item);
  const signature = svc._playlistSignature;
  const same = svc._preparedSource;
  if (same && same.signature === signature && same.index === index &&
      urls.every((url) => same.urls.includes(url))) return;
  svc._preparedSource = null;
  const cached = await findOfflineAudio(urls);
  // Another track may have started during the lookup: keep only a current answer.
  if (svc._playlistSignature === signature && svc.playlistIndex === fromIndex) {
    svc._preparedSource = { signature, index, urls, cached };
  }
}

/**
 * The lookup made ahead of time, when it still answers for `urls`: a hit is good
 * as long as its file is one of them; a miss only if it covered them all
 * (Quran.com timings can add a candidate while a verse plays).
 */
export function takePreparedSource(svc, index, urls) {
  const prepared = svc._preparedSource;
  svc._preparedSource = null;
  if (!prepared || prepared.signature !== svc._playlistSignature || prepared.index !== index) return null;
  const answers = prepared.cached
    ? urls.includes(prepared.cached.originalUrl)
    : urls.every((url) => prepared.urls.includes(url));
  return answers ? prepared : null;
}
