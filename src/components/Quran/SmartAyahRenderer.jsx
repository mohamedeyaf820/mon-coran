import React, { useMemo } from "react";
import { stripBasmala } from "../../utils/quranUtils";
import { withWordCountCalibrationBump } from "../../utils/karaokeUtils";
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

const ARABIC_INDIC_DIGITS = [
  "\u0660",
  "\u0661",
  "\u0662",
  "\u0663",
  "\u0664",
  "\u0665",
  "\u0666",
  "\u0667",
  "\u0668",
  "\u0669",
];
const NATIVE_AYAH_MARKER_RE = /[\u06DD\u06DE]/u;

function toArabicIndicNumber(value) {
  return String(value ?? "")
    .split("")
    .map((digit) => ARABIC_INDIC_DIGITS[Number.parseInt(digit, 10)] ?? digit)
    .join("");
}

function withNativeHafsAyahMarker(text, ayahNumber, riwaya) {
  const value = String(text || "").trim();
  if (!value || riwaya !== "hafs" || NATIVE_AYAH_MARKER_RE.test(value)) {
    return value;
  }
  return `${value} \u06DD${toArabicIndicNumber(ayahNumber)}`;
}

function SmartAyahRendererComponent({
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
  const baseCleanText = useMemo(
    () => stripBasmala(ayah.text, surahNum, ayah.numberInSurah).trim(),
    [ayah.numberInSurah, ayah.text, surahNum],
  );
  const cleanFallbackText = useMemo(
    () =>
      withNativeHafsAyahMarker(
        baseCleanText,
        ayah.numberInSurah,
        effectiveRiwaya,
      ),
    [ayah.numberInSurah, baseCleanText, effectiveRiwaya],
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
    return withNativeHafsAyahMarker(value, ayah.numberInSurah, effectiveRiwaya);
  }, [
    ayah.numberInSurah,
    ayah.quranCom?.textTajweed,
    ayah.words,
    effectiveRiwaya,
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
      <span className="warsh-missing-text inline-block rounded-[5px] border border-dashed border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.08)] px-[0.4rem] py-[0.15rem] font-[var(--font-ui)] text-[0.5em] text-[#c0392b]">
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
    prev.riwaya === next.riwaya
  );
}

export default React.memo(
  SmartAyahRendererComponent,
  areSmartAyahRendererEqual,
);
