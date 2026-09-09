import React from "react";
import { useScrollContext } from "../../context/ScrollContext";
import { AyahTextRenderer } from "../Quran/AyahTextRenderer";
import KaraokeWarshText from "../Quran/KaraokeWarshText";
import { useAppSelector } from "../../context/AppContext";

const MushafPageRenderer = ({ 
  ayah,
  showTajwid,
  isPlaying,
  surahNum,
  calibration,
  riwaya,
  appendNativeMarker,
  fontFamily,
  words,
  tajweedText,
  text,
  isFirstAyah,
  onAyahClick,
}) => {
  const { scrollToElement } = useScrollContext();
  const fontFamilySelector = useAppSelector((state) => state.fontFamily);

  const handleAyahClick = (event) => {
    event.stopPropagation();
    onAyahClick?.(ayah.numberInSurah);
  };

  if (ayah.warshWords?.length) {
    if (isPlaying) {
      return (
        <KaraokeWarshText
          words={ayah.warshWords}
          isFirstAyah={isFirstAyah}
          calibration={calibration}
          tajweedColors={null}
          fallbackText={text}
          ayahNumber={ayah.numberInSurah}
          fontFamily={fontFamilySelector}
          appendNativeMarker={appendNativeMarker}
          onAyahClick={handleAyahClick}
        />
      );
    }
    return (
      <AyahTextRenderer
        text={text}
        tajweedText={tajweedText}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
        riwaya={riwaya}
        tajweedColors={null}
        words={words}
        fontFamily={fontFamilySelector}
        surahNum={surahNum}
        ayahNumber={ayah.numberInSurah}
        onAyahClick={handleAyahClick}
      />
    );
  }

  return (
    <AyahTextRenderer
      text={text}
      tajweedText={tajweedText}
      showTajwid={showTajwid}
      isPlaying={isPlaying}
      isFirstAyah={isFirstAyah}
      calibration={calibration}
      riwaya={riwaya}
      tajweedColors={null}
      words={words}
      fontFamily={fontFamilySelector}
      surahNum={surahNum}
      ayahNumber={ayah.numberInSurah}
      onAyahClick={handleAyahClick}
    />
  );
};

export default MushafPageRenderer;