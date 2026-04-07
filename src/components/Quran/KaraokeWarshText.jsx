import React, { useEffect, useMemo, useRef } from "react";
import { useKaraoke } from "../../hooks/useKaraoke";
import { withWordCountCalibrationBump } from "../../utils/karaokeUtils";
import WarshWordText from "./WarshWordText";

const AYAH_MARKER_TOKEN_RE = /^[\u06dd\u06de\u06e9\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;
const DEFAULT_WARSH_CALIBRATION = {
  offsetSec: 0.2,
  smoothing: 0.9,
  lagWordsBase: 0,
  lagWordsLong: 0,
  driftPerProgress: 0.05,
  speedSensitivity: 0.07,
};

function isAyahMarkerToken(word) {
  const compact = String(word || "").replace(/\s+/g, "");
  return compact ? AYAH_MARKER_TOKEN_RE.test(compact) : false;
}

function buildWordWeights(words, hafsText) {
  if (!words?.length) return [];
  if (!hafsText) return Array.from({ length: words.length }, (_, index) => (index + 1) / words.length);

  const hafsWords = hafsText.split(/\s+/).filter(Boolean);
  const raw = words.map((_, index) => {
    const hafsIndex =
      hafsWords.length <= 1
        ? 0
        : Math.round((index * (hafsWords.length - 1)) / Math.max(1, words.length - 1));
    const word = hafsWords[hafsIndex] || "";
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

export default function KaraokeWarshText({
  words,
  hafsText,
  isFirstAyah,
  calibration,
  tajweedColors,
  fallbackText,
}) {
  const lastIdxRef = useRef(0);
  const effectiveCalibration = withWordCountCalibrationBump(
    calibration || DEFAULT_WARSH_CALIBRATION,
    words.length,
  );
  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: words.length,
    calibration: effectiveCalibration,
  });
  const wordWeights = useMemo(() => buildWordWeights(words, hafsText), [hafsText, words]);
  const markerFlags = useMemo(() => {
    const hafsWords = hafsText?.split(/\s+/).filter(Boolean) || [];
    return words.map((_, index) => {
      const hafsIndex =
        hafsWords.length <= 1
          ? 0
          : Math.round((index * (hafsWords.length - 1)) / Math.max(1, words.length - 1));
      return isAyahMarkerToken(hafsWords[hafsIndex] || "");
    });
  }, [hafsText, words]);
  const lagWords =
    words.length >= 24
      ? Number(effectiveCalibration.lagWordsLong ?? 0)
      : Number(effectiveCalibration.lagWordsBase ?? 0);

  useEffect(() => {
    lastIdxRef.current = 0;
  }, [seekCount, words]);

  const highlightIdx = useMemo(() => {
    let currentIndex = 0;
    wordWeights.forEach((weight, index) => {
      if (progress >= weight) currentIndex = index;
    });
    const finalIndex = Math.max(lastIdxRef.current, Math.max(0, currentIndex - lagWords));
    lastIdxRef.current = finalIndex;
    return finalIndex;
  }, [lagWords, progress, wordWeights]);

  return (
    <WarshWordText
      words={words}
      highlightIdx={highlightIdx >= 0 ? highlightIdx : undefined}
      tajweedColors={tajweedColors}
      fallbackText={fallbackText}
      markerFlags={markerFlags}
    />
  );
}
