import React, { useMemo, useRef, useEffect } from "react";
import { useKaraoke } from "../../hooks/useKaraoke";
import TajweedText from "./TajweedText";

/**
 * HafsKaraokeText – word-by-word karaoke for Hafs text.
 *
 * Improvements vs. old KaraokeAyahText:
 * • Uses the calibration passed from SmartAyahRenderer (no rebuild internally).
 * • Applies per-word tajweed colours when available.
 * • Prevents backward jumps with lastIdxRef (same as KaraokeWarshText).
 * • Ramps in lag at the beginning to avoid mis-highlighting the first word.
 */
export const HafsKaraokeText = React.memo(function HafsKaraokeText({
  text,
  isFirstAyah,
  calibration,
}) {
  const lastIdxRef = useRef(0);

  const words = useMemo(() => {
    if (!text) return [];
    return text.split(/\s+/).filter((w) => w.length > 0);
  }, [text]);

  // Reset highlighted word index when the ayah changes
  useEffect(() => {
    lastIdxRef.current = 0;
  }, [text]);

  // Proportional word weights (identical algorithm used in KaraokeWarshText)
  const wordWeights = useMemo(() => {
    if (words.length === 0) return [];
    const raw = words.map((w, idx) => {
      const base = w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, "");
      let weight = Math.max(1, base.length);
      const maddCount = (w.match(/[اوي\u0670\u0649]/g) || []).length;
      weight += maddCount * 0.8;
      if (/[اوي][\u0621\u0623\u0625\u0624\u0626]/.test(w)) weight += 1.0;
      const shaddaCount = (w.match(/\u0651/g) || []).length;
      weight += shaddaCount * 0.5;
      if (/[\u064B\u064C\u064D]/.test(w)) weight += 0.4;
      if (/الله/.test(w)) weight += 0.8;
      if (idx === 0) weight += 0.3;
      if (idx === words.length - 1) weight += 0.5;
      return weight;
    });
    const total = raw.reduce((s, v) => s + v, 0);
    let cum = 0;
    return raw.map((w) => {
      cum += w / total;
      return cum;
    });
  }, [words]);

  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: words.length,
    calibration,
  });

  const lagWords = useMemo(() => {
    if (!calibration) return 0;
    return words.length >= 24
      ? Number(calibration.lagWordsLong ?? 0)
      : Number(calibration.lagWordsBase ?? 0);
  }, [calibration, words.length]);

  // Reset highlighted word index when user seeks in audio
  useEffect(() => {
    lastIdxRef.current = 0;
  }, [seekCount]);

  const currentIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < wordWeights.length; i++) {
      if (progress < wordWeights[i]) {
        idx = i;
        break;
      }
      idx = i;
    }
    const adjustedIdx = Math.max(0, idx - Math.max(0, lagWords));
    const last = lastIdxRef.current;
    const finalIdx = Math.max(last, adjustedIdx);
    lastIdxRef.current = finalIdx;
    return finalIdx;
  }, [progress, wordWeights, lagWords]);

  if (words.length === 0) return <span>{text}</span>;

  return (
    <span className="wbw-container hafs-karaoke">
      {words.map((word, i) => {
        const isRead = i < currentIdx;
        const isCurrent = i === currentIdx;

        let cls = "wbw-word";
        if (isRead) cls += " wbw-read";
        else if (isCurrent) cls += " wbw-current";
        else cls += " wbw-upcoming";

        return (
          <React.Fragment key={i}>
            <span className={cls}>{word}</span>
            {i < words.length - 1 && " "}
          </React.Fragment>
        );
      })}
    </span>
  );
});

// Keep the old export name alive so any remaining import doesn't break
export { HafsKaraokeText as KaraokeAyahText };

/**
 * AyahTextRenderer – routes Hafs ayah rendering.
 * • isPlaying  → HafsKaraokeText (word-by-word highlight with timing calibration)
 * • !isPlaying → TajweedText     (coloured tajweed segments or plain text)
 */
export function AyahTextRenderer({
  text,
  showTajwid,
  isPlaying,
  isFirstAyah,
  calibration,
  riwaya,
  tajweedColors,
}) {
  if (!text) return null;

  if (isPlaying) {
    return (
      <HafsKaraokeText
        text={text}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
      />
    );
  }

  return (
    <TajweedText
      text={text}
      enabled={showTajwid}
      riwaya={riwaya}
      tajweedColors={tajweedColors}
    />
  );
}
