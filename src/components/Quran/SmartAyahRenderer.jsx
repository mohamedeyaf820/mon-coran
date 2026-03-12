import React, { useMemo, useRef, useEffect } from "react";
import { useKaraoke, buildKaraokeCalibration } from "../../hooks/useKaraoke";
import { stripBasmala } from "../../utils/quranUtils";
import WarshWordText from "./WarshWordText";
import { AyahTextRenderer } from "./AyahTextRenderer";

/**
 * Applies the wordCount-based offset bump to a calibration object.
 * Ayahs with more than 10 words get +0.02 s of extra lead to compensate for
 * the small timing-model drift that accumulates on dense verses.
 * Returns a new object (never mutates the input).
 */
function applyWordCountBump(calibration, wordCount) {
  if (!calibration || !wordCount || wordCount <= 10) return calibration;
  return {
    ...calibration,
    offsetSec: Number(((calibration.offsetSec ?? 0.15) + 0.02).toFixed(3)),
  };
}

/**
 * KaraokeWarshText – tracks word-by-word progress for QCF4 words.
 */
export function KaraokeWarshText({
  words,
  hafsText,
  isFirstAyah,
  calibration,
  tajweedColors,
  fallbackText,
}) {
  const lastIdxRef = useRef(0);

  // Reset index when words change (new ayah)
  useEffect(() => {
    lastIdxRef.current = 0;
  }, [words]);

  const wordWeights = useMemo(() => {
    if (!words || words.length === 0) return [];
    const total = words.length;

    if (hafsText) {
      const hafsWords = hafsText.split(/\s+/).filter((w) => w.length > 0);
      const raw = [];
      for (let i = 0; i < total; i++) {
        // Proportional index: map warsh word i → hafs word proportionally
        // Fixes sync when warshWords.length ≠ hafsWords.length
        const hIdx =
          hafsWords.length <= 1
            ? 0
            : Math.round((i * (hafsWords.length - 1)) / Math.max(1, total - 1));
        const hw = hafsWords[hIdx] || "";
        const base = hw.replace(
          /[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g,
          "",
        );
        let weight = Math.max(1, base.length);
        const maddCount = (hw.match(/[اوي\u0670\u0649]/g) || []).length;
        weight += maddCount * 0.8;
        if (/[اوي][\u0621\u0623\u0625\u0624\u0626]/.test(hw)) weight += 1.0;
        const shaddaCount = (hw.match(/\u0651/g) || []).length;
        weight += shaddaCount * 0.5;
        if (/[\u064B\u064C\u064D]/.test(hw)) weight += 0.4;
        if (/الله/.test(hw)) weight += 0.8;
        if (i === 0) weight += 0.3;
        if (i === total - 1) weight += 0.5;
        raw.push(weight);
      }
      const totalWeight = raw.reduce((s, v) => s + v, 0);
      let cum = 0;
      return raw.map((w) => {
        cum += w / totalWeight;
        return cum;
      });
    }
    return Array.from({ length: total }, (_, i) => (i + 1) / total);
  }, [words, hafsText]);

  const effectiveCalibration = applyWordCountBump(
    calibration ||
      buildKaraokeCalibration({
        reciterId: undefined,
        riwaya: "warsh",
        isFirstAyah,
        wordCount: words.length,
      }),
    words.length,
  );

  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: words.length,
    calibration: effectiveCalibration,
  });

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
    // Pas de lag par mot — uniquement l'offsetSec gère la précision
    const last = lastIdxRef.current;
    const finalIdx = Math.max(last, idx);
    lastIdxRef.current = finalIdx;
    return finalIdx;
  }, [progress, wordWeights]);

  return (
    <WarshWordText
      words={words}
      highlightIdx={currentIdx >= 0 ? currentIdx : undefined}
      tajweedColors={tajweedColors}
      fallbackText={fallbackText}
    />
  );
}

/**
 * SmartAyahRenderer – orchestrates all ayah rendering paths.
 */
const SmartAyahRenderer = React.memo(function SmartAyahRenderer({
  ayah,
  showTajwid,
  isPlaying,
  surahNum,
  calibration,
  riwaya,
}) {
  const isFirstAyah =
    ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;
  const effectiveRiwaya = ayah.warshWords ? "warsh" : riwaya || "hafs";

  const tajweedColors = null;

  const cleanHafsText = useMemo(() => {
    if (!ayah.hafsText) return null;
    return stripBasmala(ayah.hafsText, surahNum, ayah.numberInSurah);
  }, [ayah.hafsText, surahNum, ayah.numberInSurah]);

  if (ayah.warshWords && ayah.warshWords.length > 0) {
    if (isPlaying) {
      return (
        <KaraokeWarshText
          words={ayah.warshWords}
          hafsText={cleanHafsText}
          isFirstAyah={isFirstAyah}
          calibration={calibration}
          tajweedColors={tajweedColors}
          fallbackText={cleanHafsText}
        />
      );
    }
    return (
      <WarshWordText
        words={ayah.warshWords}
        tajweedColors={tajweedColors}
        fallbackText={cleanHafsText || ayah.hafsText || null}
      />
    );
  }

  if (ayah.requestedRiwaya === "warsh") {
    return (
      <span className="warsh-missing-text">
        ⚠︎ Warsh text unavailable for this ayah
      </span>
    );
  }

  const text = stripBasmala(ayah.text, surahNum, ayah.numberInSurah);
  const hafsWordCount = (text || "").split(/\s+/).filter(Boolean).length;
  const hafsCalibration = applyWordCountBump(
    calibration ||
      buildKaraokeCalibration({
        reciterId: undefined,
        riwaya: effectiveRiwaya,
        isFirstAyah,
        wordCount: hafsWordCount,
      }),
    hafsWordCount,
  );

  return (
    <AyahTextRenderer
      text={text}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={hafsCalibration}
      riwaya={effectiveRiwaya}
      tajweedColors={tajweedColors}
    />
  );
});

export default SmartAyahRenderer;
