import React, { useMemo, useSyncExternalStore } from "react";
import { subscribeWarshArchive, getWarshArchiveSnapshot } from "../../utils/warshArchiveRules";
import { shallowEqual, useAppSelector } from "../../context/AppContext";
import { stripBasmala } from "../../utils/quranUtils";
import { getHafsTajwidSource } from "../../utils/hafsTajwidSource";
import { getWarshTajwidAnnotatedSource } from "../../services/warshTajweedService";
import { withWordCountCalibrationBump } from "../../utils/karaokeUtils";
import {
  appendNativeAyahMarker,
  getAyahTextForFont,
} from "../../data/fonts";
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
  const archive = useSyncExternalStore(subscribeWarshArchive, getWarshArchiveSnapshot, getWarshArchiveSnapshot);
  const isFirstAyah =
    ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;
  const effectiveRiwaya = ayah.warshWords ? "warsh" : riwaya || "hafs";
  const fontCompatibleText = useMemo(
    () => getAyahTextForFont(ayah, fontFamily, effectiveRiwaya),
    [ayah, effectiveRiwaya, fontFamily],
  );
  const hafsSource = useMemo(
    () => effectiveRiwaya === "hafs" ? getHafsTajwidSource(ayah, fontFamily, surahNum) : null,
    [ayah, effectiveRiwaya, fontFamily, surahNum],
  );

  const baseCleanText = useMemo(
    () =>
      hafsSource?.original ?? stripBasmala(
        fontCompatibleText,
        surahNum,
        ayah.numberInSurah,
      ).trim(),
    [ayah.numberInSurah, fontCompatibleText, surahNum, hafsSource],
  );
  const cleanFallbackText = useMemo(
    () =>
      appendNativeAyahMarker(
        baseCleanText,
        ayah.numberInSurah,
        fontFamily,
        effectiveRiwaya,
        appendNativeMarker,
      ),
    [appendNativeMarker, ayah.numberInSurah, baseCleanText, effectiveRiwaya, fontFamily],
  );

  // Warsh paints from the Dabt of the same printed text this renderer draws, so
  // the verse-by-verse reading carries the same ranges as the mushaf sheet.
  const warshSource = useMemo(
    () => effectiveRiwaya === "warsh" ? getWarshTajwidAnnotatedSource(baseCleanText) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the archive is an external store read through module state: its snapshot is the invalidation signal
    [baseCleanText, effectiveRiwaya, archive],
  );
  const tajwidSource = effectiveRiwaya === "warsh" ? warshSource : hafsSource;

  const wordCount = baseCleanText.split(/\s+/).filter(Boolean).length;
  // The immutable shared source carries rule ranges. Presentation markers are
  // appended to the canonical display text only, never to provider markup.
  const tajweedText = effectiveRiwaya === "warsh"
    ? cleanFallbackText : hafsSource?.annotation || baseCleanText;
  const effectiveCalibration = withWordCountCalibrationBump(
    calibration || DEFAULT_HAFS_CALIBRATION,
    wordCount,
  );

  if (ayah.warshWords?.length) {
    if (isPlaying) {
      return (
        <KaraokeWarshText
          words={baseCleanText.split(/\s+/u).filter(Boolean)}
          isFirstAyah={isFirstAyah}
          calibration={effectiveCalibration}
          showTajwid={showTajwid}
          fallbackText={cleanFallbackText}
          ayahNumber={ayah.numberInSurah}
          fontFamily={fontFamily}
          appendNativeMarker={appendNativeMarker}
        />
      );
    }

    return (
      <AyahTextRenderer
        text={cleanFallbackText}
        tajweedText={tajweedText}
        tajwidSource={tajwidSource}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        isFirstAyah={isFirstAyah}
        calibration={effectiveCalibration}
        riwaya={effectiveRiwaya}
        tajweedColors={null}
        words={ayah.words}
        fontFamily={fontFamily}
        surahNum={surahNum}
        ayahNumber={ayah.numberInSurah}
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
      tajwidSource={tajwidSource}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={effectiveCalibration}
      riwaya={effectiveRiwaya}
      tajweedColors={null}
      words={ayah.words}
      fontFamily={fontFamily}
      surahNum={surahNum}
      ayahNumber={ayah.numberInSurah}
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
