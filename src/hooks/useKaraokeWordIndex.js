import { useEffect, useMemo, useRef, useState } from "react";
import { useKaraoke } from "./useKaraoke";
import audioService from "../services/audioService";

/**
 * Index of the word being recited in the current ayah.
 *
 * Exact word timings from the audio source win; otherwise the position is
 * estimated from playback progress weighted by word length, with the
 * calibration lag. Shared by the plain karaoke renderer and the Tajweed
 * renderer so both follow the recitation the same way.
 */
export function buildWordWeights(words) {
  if (words.length === 0) return [];
  const raw = words.map((word, index) => {
    const base = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, "");
    let weight = Math.max(1, base.length);
    weight += (word.match(/[\u0627\u0648\u064a\u0670\u0649]/g) || []).length * 0.8;
    if (/[\u0627\u0648\u064a][\u0621\u0623\u0625\u0624\u0626]/.test(word)) weight += 1;
    weight += (word.match(/\u0651/g) || []).length * 0.5;
    if (/[\u064B\u064C\u064D]/.test(word)) weight += 0.4;
    if (/\u0627\u0644\u0644\u0647/.test(word)) weight += 0.8;
    if (index === 0) weight += 0.3;
    if (index === words.length - 1) weight += 0.5;
    return weight;
  });
  const total = raw.reduce((sum, value) => sum + value, 0);
  let cumulative = 0;
  return raw.map((value) => {
    cumulative += value / total;
    return cumulative;
  });
}

export default function useKaraokeWordIndex({
  enabled = true,
  text,
  isFirstAyah,
  calibration,
  recitableWords,
}) {
  const lastIdxRef = useRef(0);
  const [exactWordIdx, setExactWordIdx] = useState(-1);
  const wordWeights = useMemo(() => buildWordWeights(recitableWords), [recitableWords]);
  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: recitableWords.length,
    calibration,
  });
  const lagWords = useMemo(() => {
    if (!calibration) return 0;
    return recitableWords.length >= 24
      ? Number(calibration.lagWordsLong ?? 0)
      : Number(calibration.lagWordsBase ?? 0);
  }, [calibration, recitableWords.length]);

  useEffect(() => {
    lastIdxRef.current = 0;
    setExactWordIdx(-1);
  }, [text]);

  useEffect(() => {
    lastIdxRef.current = 0;
  }, [seekCount]);

  useEffect(() => {
    if (!enabled) return undefined;
    const updateFromSegments = (timeSec = audioService.currentTime || 0) => {
      const segments = Array.isArray(audioService.currentAyah?.segments)
        ? audioService.currentAyah.segments
        : [];
      if (segments.length === 0) {
        setExactWordIdx(-1);
        return;
      }
      const timeMs = timeSec * 1000;
      let nextIndex = -1;
      for (const segment of segments) {
        const index = Number.isFinite(segment.wordIndex)
          ? segment.wordIndex
          : Math.max(0, Number(segment.wordPosition || 1) - 1);
        if (timeMs >= segment.startMs && timeMs <= segment.endMs) {
          nextIndex = index;
          break;
        }
        if (timeMs > segment.endMs) nextIndex = index;
      }
      setExactWordIdx(nextIndex);
    };
    updateFromSegments();
    return audioService.addTimeUpdateListener(updateFromSegments);
  }, [enabled, text]);

  return useMemo(() => {
    if (!enabled) return -1;
    if (exactWordIdx >= 0) {
      return Math.min(recitableWords.length - 1, exactWordIdx);
    }
    let idx = 0;
    for (let i = 0; i < wordWeights.length; i += 1) {
      if (progress < wordWeights[i]) {
        idx = i;
        break;
      }
      idx = i;
    }
    const adjustedIdx = Math.max(0, idx - Math.max(0, lagWords));
    const finalIdx = Math.max(lastIdxRef.current, adjustedIdx);
    lastIdxRef.current = finalIdx;
    return finalIdx;
  }, [enabled, exactWordIdx, progress, wordWeights, lagWords, recitableWords.length]);
}
