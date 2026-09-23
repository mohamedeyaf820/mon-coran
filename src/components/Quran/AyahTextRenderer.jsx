import React, { useMemo } from "react";
import useKaraokeWordIndex from "../../hooks/useKaraokeWordIndex";
import audioService from "../../services/audioService";
import { normalizeFontId } from "../../data/fonts";
import { getFontSignVariant } from "../../utils/quranUtils";
import { useAppLocale } from "../../context/AppContext";
import TajweedText, { getWaqfHelp } from "./TajweedText";
import { t } from "../../i18n";
import { playWordAudio, getWordAudioUrl } from "../../utils/wordAudio";
import { hasCoherentWordData, isAyahMarkerToken } from "../../utils/wordCoherence";

function getVerseLabel(lang, ayahNumber) {
  if (!ayahNumber) return undefined;
  const word = t("quran.verseLabel", lang);
  return `${word} ${ayahNumber}`;
}

function CanonicalQuranText({
  text,
  riwaya,
  words,
  surahNum,
  ayahNumber,
  wordAudioIsAligned,
}) {
  const { lang } = useAppLocale();
  const verseLabel = getVerseLabel(lang, ayahNumber);
  if (riwaya === "warsh") {
    // Keep the canonical word and ayah-marker layout, but let a tap reach
    // the verse action. The available word audio clips are Hafs recordings.
    const parts = String(text).split(/\s+/).filter(Boolean);
    return (
      <span className="quran-canonical-text" dir="rtl" lang="ar">
        {parts.map((word, index) => {
          const isMarker = isAyahMarkerToken(word);
          return (
            <React.Fragment key={index}>
              <span
                className={isMarker ? "native-ayah-marker" : "quran-word-item"}
                aria-label={isMarker ? verseLabel : undefined}
                title={getWaqfHelp(word, lang)}
                style={{ display: "inline" }}
              >
                {word}
              </span>
              {index < parts.length - 1 ? (isAyahMarkerToken(parts[index + 1]) ? "\u202F" : " ") : null}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  const parts = String(text).split(/\s+/).filter(Boolean);
  // `words` carries recitable words only, while `parts` also holds the ayah-end
  // marker, so the recitable count is the index that lines up with word data.
  let recitablePosition = 0;
  return (
    <span className="quran-canonical-text" dir="rtl" lang="ar">
      {parts.map((wordStr, index) => {
        const isMarker = isAyahMarkerToken(wordStr);
        if (!isMarker) recitablePosition += 1;
        const wordPos = recitablePosition;
        const canRecite =
          !isMarker && wordAudioIsAligned && Boolean(surahNum && ayahNumber);
        const audioUrl = canRecite
          ? (words?.[wordPos - 1]?.audioUrl || getWordAudioUrl(surahNum, ayahNumber, wordPos))
          : null;

        const handleClick = (e) => {
          e.stopPropagation();
          playWordAudio(audioUrl);
        };

        return (
          <React.Fragment key={index}>
            <span
              className={
                isMarker
                  ? "native-ayah-marker"
                  : canRecite
                    ? "quran-word-item cursor-pointer"
                    : "quran-word-item"
              }
              onClick={canRecite ? handleClick : undefined}
              role={canRecite ? "button" : undefined}
              tabIndex={canRecite ? 0 : undefined}
              aria-label={isMarker ? verseLabel : undefined}
              style={{ display: "inline" }}
            >
              {wordStr}
            </span>
            {index < parts.length - 1 ? (isAyahMarkerToken(parts[index + 1]) ? "\u202F" : " ") : null}
          </React.Fragment>
        );
      })}
    </span>
  );
}

/**
 * Hafs karaoke text. Native ayah markers are rendered in the flow but are not
 * counted as recitable words, so timings and highlight indexes stay aligned.
 */
export const HafsKaraokeText = React.memo(function HafsKaraokeText({
  text,
  isFirstAyah,
  calibration,
  words,
}) {
  const displayWords = useMemo(() => {
    if (!text) return [];
    return text.split(/\s+/).filter((word) => word.length > 0);
  }, [text]);
  const recitableWords = useMemo(
    () => displayWords.filter((word) => !isAyahMarkerToken(word)),
    [displayWords],
  );
  const recitableIndexByDisplayIndex = useMemo(() => {
    let nextIndex = -1;
    return displayWords.map((word) => {
      if (isAyahMarkerToken(word)) return -1;
      nextIndex += 1;
      return nextIndex;
    });
  }, [displayWords]);
  const dataWords = useMemo(
    () => words?.filter((w) => w.charType !== "end") ?? [],
    [words],
  );
  const currentIdx = useKaraokeWordIndex({
    text,
    isFirstAyah,
    calibration,
    recitableWords,
  });

  if (displayWords.length === 0) return <span>{text}</span>;

  return (
    <span className="wbw-container hafs-karaoke" dir="rtl" lang="ar">
      {displayWords.map((word, index) => {
        const isMarkerToken = isAyahMarkerToken(word);
        const recitableIndex = recitableIndexByDisplayIndex[index];
        const isRead = !isMarkerToken && recitableIndex < currentIdx;
        const isCurrent = !isMarkerToken && recitableIndex === currentIdx;

        let cls = "wbw-word";
        if (isRead) cls += " wbw-read";
        else if (isCurrent) cls += " wbw-current";
        else cls += " wbw-upcoming";
        if (isMarkerToken) cls += " wbw-marker-token native-ayah-marker";

        const wordAudioUrl = !isMarkerToken ? dataWords[recitableIndex]?.audioUrl : null;
        // While the ayah is being recited, a word click resumes the
        // recitation from that word (word timings), like a seek.
        const seekToWord = !isMarkerToken
          ? () => {
              const segments = Array.isArray(audioService.currentAyah?.segments)
                ? audioService.currentAyah.segments
                : [];
              const segment = segments.find((item) =>
                (Number.isFinite(item.wordIndex)
                  ? item.wordIndex
                  : Number(item.wordPosition || 1) - 1) === recitableIndex,
              );
              if (segment && Number.isFinite(segment.startMs)) {
                audioService.seek(segment.startMs / 1000);
                if (audioService.audio?.paused) audioService.resume?.();
                return;
              }
              if (wordAudioUrl) playWordAudio(wordAudioUrl);
            }
          : undefined;
        return (
          <React.Fragment key={index}>
            <span
              className={cls}
              onClick={seekToWord}
              role={seekToWord ? "button" : undefined}
            >
              {word}
            </span>
            {index < displayWords.length - 1 &&
              (isAyahMarkerToken(displayWords[index + 1]) ? "\u00A0" : " ")}
          </React.Fragment>
        );
      })}
    </span>
  );
});


export { HafsKaraokeText as KaraokeAyahText };

function AyahTextRendererComponent({
  text,
  tajweedText,
  showTajwid,
  isPlaying,
  isFirstAyah,
  calibration,
  riwaya,
  tajweedColors,
  words,
  fontFamily,
  surahNum,
  ayahNumber,
}) {
  const wordData = useMemo(() => ({
    clickableWords: Array.isArray(words)
      ? words.filter((word) => !word.charType || word.charType === "word")
      : [],
  }), [words]);
  const { clickableWords } = wordData;
  // A word tap recites the qurancdn clip at that word's position, so it is only
  // honest while the word data lines up with the glyphs on screen. The verse
  // text comes from the verse-level field, which on rare verses (15:7) splits
  // into a different number of words than the array: indexing it anyway reads
  // out a neighbouring word. With no array at all the standard Hafs division is
  // the intended source, and Warsh taps are already disclosed as Hafs audio, so
  // only a divergent Hafs array removes them.
  const wordAudioIsAligned = useMemo(
    () =>
      riwaya === "warsh" ||
      clickableWords.length === 0 ||
      hasCoherentWordData(clickableWords, text, fontFamily, riwaya, surahNum, ayahNumber),
    [ayahNumber, clickableWords, fontFamily, riwaya, surahNum, text],
  );

  if (!text) return null;

  if (riwaya === "hafs" && isPlaying && !(showTajwid && tajweedText)) {
    return (
      <HafsKaraokeText
        text={text}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
        words={words}
      />
    );
  }

  if (!showTajwid || !tajweedText) {
    return (
      <CanonicalQuranText
        text={text}
        riwaya={riwaya}
        words={clickableWords}
        wordAudioIsAligned={wordAudioIsAligned}
        surahNum={surahNum}
        ayahNumber={ayahNumber}
      />
    );
  }

  return (
    <TajweedText
      text={tajweedText}
      enabled
      riwaya={riwaya}
      tajweedColors={tajweedColors}
      surahNum={surahNum}
      ayahNumber={ayahNumber}
      karaoke={isPlaying ? { isFirstAyah, calibration } : null}
      signVariant={getFontSignVariant(normalizeFontId(fontFamily, riwaya))}
    />
  );
}

function areAyahTextRendererEqual(prev, next) {
  return (
    prev.text === next.text &&
    prev.tajweedText === next.tajweedText &&
    prev.showTajwid === next.showTajwid &&
    prev.isPlaying === next.isPlaying &&
    prev.isFirstAyah === next.isFirstAyah &&
    prev.calibration === next.calibration &&
    prev.riwaya === next.riwaya &&
    prev.tajweedColors === next.tajweedColors &&
    prev.words === next.words &&
    prev.fontFamily === next.fontFamily &&
    prev.surahNum === next.surahNum &&
    prev.ayahNumber === next.ayahNumber
  );
}

export const AyahTextRenderer = React.memo(
  AyahTextRendererComponent,
  areAyahTextRendererEqual,
);
