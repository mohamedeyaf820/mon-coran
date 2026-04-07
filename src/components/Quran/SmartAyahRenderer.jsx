import React, { useMemo } from "react";
import { stripBasmala } from "../../utils/quranUtils";
import { withWordCountCalibrationBump } from "../../utils/karaokeUtils";
import { AyahTextRenderer } from "./AyahTextRenderer";
import KaraokeWarshText from "./KaraokeWarshText";
import WarshWordText from "./WarshWordText";

const DEFAULT_HAFS_CALIBRATION = {
  offsetSec: 0.15,
  smoothing: 0.9,
  lagWordsBase: 0,
  lagWordsLong: 0,
  driftPerProgress: 0.03,
  speedSensitivity: 0.06,
};

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
  const cleanHafsText = useMemo(
    () =>
      ayah.hafsText
        ? stripBasmala(ayah.hafsText, surahNum, ayah.numberInSurah)
        : null,
    [ayah.hafsText, ayah.numberInSurah, surahNum],
  );
  const cleanFallbackText = useMemo(
    () => stripBasmala(ayah.text, surahNum, ayah.numberInSurah),
    [ayah.numberInSurah, ayah.text, surahNum],
  );

  if (ayah.warshWords?.length) {
    return isPlaying ? (
      <KaraokeWarshText
        words={ayah.warshWords}
        hafsText={cleanHafsText}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
        tajweedColors={null}
        fallbackText={cleanHafsText}
      />
    ) : (
      <WarshWordText
        words={ayah.warshWords}
        tajweedColors={null}
        fallbackText={cleanHafsText || ayah.hafsText || null}
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

  const wordCount = cleanFallbackText.split(/\s+/).filter(Boolean).length;
  return (
    <AyahTextRenderer
      text={cleanFallbackText}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={withWordCountCalibrationBump(
        calibration || DEFAULT_HAFS_CALIBRATION,
        wordCount,
      )}
      riwaya={effectiveRiwaya}
      tajweedColors={null}
    />
  );
});

export default SmartAyahRenderer;
