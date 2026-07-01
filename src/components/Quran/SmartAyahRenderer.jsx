import React, { useMemo } from "react";
import { shallowEqual, useAppSelector } from "../../context/AppContext";
import { stripBasmala } from "../../utils/quranUtils";
import { withWordCountCalibrationBump } from "../../utils/karaokeUtils";
import { appendNativeAyahMarker } from "../../data/fonts";
import { AyahTextRenderer } from "./AyahTextRenderer";
import KaraokeWarshText from "./KaraokeWarshText";

const DEFAULT_HAFS_CALIBRATION = {
  offsetSec: 0.15,
  smoothing: 0.9,
  lagWordsBase: 0,
  lagWordsLong: 0,
  driftPerProgress: 0.03,
  speedSensitivity: 0.06,
};

function SmartAyahRendererComponent({
  ayah,
  showTajwid,
  isPlaying,
  surahNum,
  calibration,
  riwaya,
  appendNativeMarker = true,
}) {
  const fontFamily = useAppSelector((state) => state.fontFamily, shallowEqual);
  const isFirstAyah =
    ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;
  const effectiveRiwaya = ayah.warshWords ? "warsh" : riwaya || "hafs";
  const baseCleanText = useMemo(
    () => stripBasmala(ayah.text, surahNum, ayah.numberInSurah).trim(),
    [ayah.numberInSurah, ayah.text, surahNum],
  );
  const cleanFallbackText = useMemo(
    () =>
      appendNativeMarker
        ? appendNativeAyahMarker(
            baseCleanText,
            ayah.numberInSurah,
            fontFamily,
            effectiveRiwaya,
          )
        : baseCleanText,
    [appendNativeMarker, ayah.numberInSurah, baseCleanText, effectiveRiwaya, fontFamily],
  );

  const wordCount = baseCleanText.split(/\s+/).filter(Boolean).length;
  const tajweedText = useMemo(() => {
    if (effectiveRiwaya !== "hafs") return null;
    const value =
      ayah.quranCom?.textTajweed ||
      ayah.words
        ?.map((word) => word.textTajweed || word.textUthmani || word.text)
        .filter(Boolean)
        .join(" ");
    return appendNativeMarker
      ? appendNativeAyahMarker(
          value,
          ayah.numberInSurah,
          fontFamily,
          effectiveRiwaya,
        )
      : String(value || "").trim();
  }, [
    appendNativeMarker,
    ayah.numberInSurah,
    ayah.quranCom?.textTajweed,
    ayah.words,
    effectiveRiwaya,
    fontFamily,
  ]);
  const effectiveCalibration = withWordCountCalibrationBump(
    calibration || DEFAULT_HAFS_CALIBRATION,
    wordCount,
  );

  if (ayah.warshWords?.length) {
    if (isPlaying) {
      return (
        <KaraokeWarshText
          words={ayah.warshWords}
          isFirstAyah={isFirstAyah}
          calibration={effectiveCalibration}
          tajweedColors={null}
          fallbackText={cleanFallbackText}
          ayahNumber={ayah.numberInSurah}
        />
      );
    }

    return (
      <AyahTextRenderer
        text={cleanFallbackText}
        tajweedText={tajweedText}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        isFirstAyah={isFirstAyah}
        calibration={effectiveCalibration}
        riwaya={effectiveRiwaya}
        tajweedColors={null}
      />
    );
  }

  if (ayah.requestedRiwaya === "warsh") {
    return (
      <span className="warsh-missing-text inline-block rounded-[5px] border border-dashed border-[rgba(var(--error-rgb,192,57,43),0.3)] bg-[rgba(var(--error-rgb,192,57,43),0.08)] px-[0.4rem] py-[0.15rem] font-[var(--font-ui)] text-[0.5em] text-[var(--error,#c0392b)]">
        Warsh text unavailable for this ayah
      </span>
    );
  }

  return (
    <AyahTextRenderer
      text={cleanFallbackText}
      tajweedText={tajweedText}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={effectiveCalibration}
      riwaya={effectiveRiwaya}
      tajweedColors={null}
    />
  );
}

function areSmartAyahRendererEqual(prev, next) {
  return (
    prev.ayah === next.ayah &&
    prev.showTajwid === next.showTajwid &&
    prev.isPlaying === next.isPlaying &&
    prev.surahNum === next.surahNum &&
    prev.calibration === next.calibration &&
    prev.riwaya === next.riwaya &&
    prev.appendNativeMarker === next.appendNativeMarker
  );
}

export default React.memo(
  SmartAyahRendererComponent,
  areSmartAyahRendererEqual,
);
